#!/usr/bin/env python3
import os
import json
import time
import threading

try:
    from adafruit_servokit import ServoKit
    PCA_ATIVO = True
except ImportError:
    PCA_ATIVO = False


class ControladorOlhos:
    def __init__(self, arquivo_config=None):
        if arquivo_config is None:
            # Tenta achar o json no mesmo diretório deste script
            arquivo_config = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config_olhos.json")
            
        self.arquivo_config = arquivo_config
        self.config = None
        self.kit = None
        
        # Estado atual (porcentagens 0-100) para suavização
        self.estado = {
            "olho_direito":  {"h": 50.0, "v": 50.0, "pc": 0.0, "pb": 0.0, "boca": 0.0, "sb": 50.0},
            "olho_esquerdo": {"h": 50.0, "v": 50.0, "pc": 0.0, "pb": 0.0, "sb": 50.0}
        }
        
        self._carregar_configuracao()
        self._iniciar_hardware()

    def _carregar_configuracao(self):
        try:
            with open(self.arquivo_config, 'r') as f:
                self.config = json.load(f)
            print(f"OlhosTirilo: Configuração carregada com sucesso de {self.arquivo_config}")
        except Exception as e:
            print(f"OlhosTirilo ERRO: Arquivo de configuração não encontrado ou inválido: {e}")
            self.config = None

    def _iniciar_hardware(self):
        if PCA_ATIVO:
            try:
                self.kit = ServoKit(channels=16)
                print("OlhosTirilo: Hardware PCA9685 inicializado.")
            except Exception as e:
                print(f"OlhosTirilo ERRO ao iniciar PCA9685: {e}")
                self.kit = None
        else:
            print("OlhosTirilo (SIMULAÇÃO): 'adafruit_servokit' não encontrado.")

    def mover_servo_bruto(self, porta, angulo):
        if angulo < 0: angulo = 0
        if angulo > 180: angulo = 180
        if self.kit:
            try:
                self.kit.servo[porta].angle = angulo
            except: pass

    def _calcular_angulo(self, valor_min, valor_max, percentual, invertido=False):
        pct = max(0.0, min(100.0, float(percentual))) / 100.0
        if invertido:
            # 100% = MAX (Fechado p Cima)
            return valor_min + (valor_max - valor_min) * pct
        else:
            # 100% = MIN (Fechado p Baixo)
            return valor_max - (valor_max - valor_min) * pct

    # --- MOVIMENTOS INSTANTÂNEOS ---

    def fechar_palpebra(self, olho, pc, pb=None):
        if not self.config: return
        # Se passar apenas um valor, move ambas pálpebras
        if pb is None: pb = pc
        
        self.estado[olho]["pc"] = pc
        self.estado[olho]["pb"] = pb
        
        cfg_cima = self.config[olho]["palpebra_cima"]
        cfg_baixo = self.config[olho]["palpebra_baixo"]
        
        ang_cima = self._calcular_angulo(cfg_cima["min"], cfg_cima["max"], pc, invertido=True)
        ang_baixo = self._calcular_angulo(cfg_baixo["min"], cfg_baixo["max"], pb, invertido=False)
        
        self.mover_servo_bruto(cfg_cima["porta"], ang_cima)
        self.mover_servo_bruto(cfg_baixo["porta"], ang_baixo)

    def virar_olho(self, olho, horizontal_pct, vertical_pct):
        if not self.config: return
        self.estado[olho]["h"] = horizontal_pct
        self.estado[olho]["v"] = vertical_pct
        cfg_horiz = self.config[olho]["horizontal"]
        cfg_vert = self.config[olho]["vertical"]
        
        ang_horiz = self._calcular_angulo(cfg_horiz["min"], cfg_horiz["max"], horizontal_pct, invertido=True)
        ang_vert = self._calcular_angulo(cfg_vert["min"], cfg_vert["max"], vertical_pct, invertido=True)
        
        self.mover_servo_bruto(cfg_horiz["porta"], ang_horiz)
        self.mover_servo_bruto(cfg_vert["porta"], ang_vert)

    def olhar_para(self, horizontal_pct, vertical_pct):
        """Move ambos os olhos instantaneamente (ideal para rastreamento de vídeo)."""
        self.virar_olho("olho_direito", horizontal_pct, vertical_pct)
        self.virar_olho("olho_esquerdo", horizontal_pct, vertical_pct)

    def mover_boca(self, percentual_abertura):
        if not self.config: return
        self.estado["olho_direito"]["boca"] = percentual_abertura
        
        cfg_dir = self.config.get("olho_direito", {})
        if "boca" in cfg_dir:
            cfg_boca = cfg_dir["boca"]
            # 0% = fechada (angulo MAX), 100% = aberta (angulo MIN) -> invertido=False
            ang_boca = self._calcular_angulo(cfg_boca["min"], cfg_boca["max"], percentual_abertura, invertido=False)
            self.mover_servo_bruto(cfg_boca["porta"], ang_boca)

    def mover_sobrancelha(self, olho, percentual):
        """0% = franzida/baixa, 50% = neutra, 100% = levantada/surpresa."""
        if not self.config: return
        percentual = max(0.0, min(100.0, float(percentual)))
        self.estado[olho]["sb"] = percentual
        cfg = self.config.get(olho, {})
        if "sobrancelha" in cfg:
            c = cfg["sobrancelha"]
            ang = self._calcular_angulo(c["min"], c["max"], percentual, invertido=False)
            self.mover_servo_bruto(c["porta"], ang)

    def mover_sobrancelhas(self, percentual_dir, percentual_esq=None):
        """Move ambas as sobrancelhas. Se esq=None usa o mesmo valor."""
        if percentual_esq is None:
            percentual_esq = percentual_dir
        self.mover_sobrancelha("olho_direito", percentual_dir)
        self.mover_sobrancelha("olho_esquerdo", percentual_esq)

    # --- MOVIMENTOS SUAVES (INTERPOLAÇÃO) ---

    def mover_suave(self, olho, h_alvo=None, v_alvo=None, p_alvo=None, pc_alvo=None, pb_alvo=None, sb_alvo=None, duracao=0.5):
        passos = int(duracao * 20)
        if passos < 1: passos = 1
        intervalo = duracao / passos
        
        h_ini = self.estado[olho]["h"]
        v_ini = self.estado[olho]["v"]
        pc_ini = self.estado[olho]["pc"]
        pb_ini = self.estado[olho]["pb"]
        sb_ini = self.estado[olho]["sb"]

        h_alvo = h_ini if h_alvo is None else h_alvo
        v_alvo = v_ini if v_alvo is None else v_alvo
        sb_alvo = sb_ini if sb_alvo is None else sb_alvo

        # Lógica de prioridade para as pálpebras
        if pc_alvo is None: pc_alvo = p_alvo if p_alvo is not None else pc_ini
        if pb_alvo is None: pb_alvo = p_alvo if p_alvo is not None else pb_ini

        for i in range(1, passos + 1):
            pct_progresso = i / passos
            h_curr  = h_ini  + (h_alvo  - h_ini)  * pct_progresso
            v_curr  = v_ini  + (v_alvo  - v_ini)  * pct_progresso
            pc_curr = pc_ini + (pc_alvo - pc_ini) * pct_progresso
            pb_curr = pb_ini + (pb_alvo - pb_ini) * pct_progresso
            sb_curr = sb_ini + (sb_alvo - sb_ini) * pct_progresso

            self.virar_olho(olho, h_curr, v_curr)
            self.fechar_palpebra(olho, pc_curr, pb_curr)
            self.mover_sobrancelha(olho, sb_curr)
            time.sleep(intervalo)

    def mover_suave_ambos(self, h_alvo=None, v_alvo=None, p_alvo=None, pc_alvo=None, pb_alvo=None, sb_alvo=None, duracao=0.5):
        def t_dir(): self.mover_suave("olho_direito", h_alvo, v_alvo, p_alvo, pc_alvo, pb_alvo, sb_alvo, duracao)
        def t_esq(): self.mover_suave("olho_esquerdo", h_alvo, v_alvo, p_alvo, pc_alvo, pb_alvo, sb_alvo, duracao)
        th1 = threading.Thread(target=t_dir)
        th2 = threading.Thread(target=t_esq)
        th1.start(); th2.start()
        th1.join(); th2.join()

    def mover_suave_boca(self, alvo, duracao=0.5):
        passos = int(duracao * 30)
        if passos < 1: passos = 1
        intervalo = duracao / passos
        
        b_ini = self.estado["olho_direito"].get("boca", 0.0)
        
        for i in range(1, passos + 1):
            pct_progresso = i / passos
            b_curr = b_ini + (alvo - b_ini) * pct_progresso
            self.mover_boca(b_curr)
            time.sleep(intervalo)

    # --- EXPRESSÕES ---

    def olhar_neutro(self, suave=True):
        if suave: self.mover_suave_ambos(50, 50, 20, sb_alvo=50, duracao=0.4)
        else:
            self.virar_olho("olho_direito", 50, 50); self.virar_olho("olho_esquerdo", 50, 50)
            self.fechar_palpebra("olho_direito", 20); self.fechar_palpebra("olho_esquerdo", 20)
            self.mover_sobrancelhas(50)

    def abrir_olhos(self):
        self.mover_suave_ambos(50, 50, 0, sb_alvo=50, duracao=0.3)

    def fechar_olhos(self, suave=True):
        if suave: self.mover_suave_ambos(p_alvo=100, duracao=0.6)
        else:
            self.fechar_palpebra("olho_direito", 100); self.fechar_palpebra("olho_esquerdo", 100)

    def surpresa(self):
        # Pálpebras abertas + sobrancelhas bem levantadas
        self.mover_suave_ambos(p_alvo=0, sb_alvo=100, duracao=0.2)

    def olhar_triste(self):
        # Sobrancelhas levemente franzidas e baixas
        self.mover_suave_ambos(50, 20, 70, sb_alvo=20, duracao=0.8)

    def olhar_feliz(self):
        # Sobrancelhas levantadas, expressão aberta
        self.mover_suave_ambos(50, 80, 40, sb_alvo=75, duracao=0.6)

    def olhar_bravo(self):
        # Sobrancelhas totalmente franzidas, olhos semicerrados
        self.mover_suave_ambos(50, 50, 60, sb_alvo=5, duracao=0.5)

    def olhar_cima(self, suave=True):
        if suave: self.mover_suave_ambos(h_alvo=50, v_alvo=10, pc_alvo=0, pb_alvo=50, sb_alvo=70, duracao=0.7)
        else:
            self.virar_olho("olho_direito", 50, 10); self.virar_olho("olho_esquerdo", 50, 10)
            self.fechar_palpebra("olho_direito", 0, 50); self.fechar_palpebra("olho_esquerdo", 0, 50)
            self.mover_sobrancelhas(70)

    def olhar_frente(self, suave=True):
        if suave: self.mover_suave_ambos(50, 50, 0, sb_alvo=50, duracao=0.5)
        else: self.olhar_para(50, 50)

    def desconfiado(self):
        # Uma sobrancelha levantada, outra baixa
        self.mover_suave_ambos(80, 50, 70, duracao=0.5)
        self.mover_sobrancelha("olho_direito", 80)
        self.mover_sobrancelha("olho_esquerdo", 20)

    def piscar(self):
        pc_old_d = self.estado["olho_direito"]["pc"]
        pb_old_d = self.estado["olho_direito"]["pb"]
        pc_old_e = self.estado["olho_esquerdo"]["pc"]
        pb_old_e = self.estado["olho_esquerdo"]["pb"]
        
        self.fechar_palpebra("olho_direito", 100); self.fechar_palpebra("olho_esquerdo", 100)
        time.sleep(0.1)
        self.fechar_palpebra("olho_direito", pc_old_d, pb_old_d)
        self.fechar_palpebra("olho_esquerdo", pc_old_e, pb_old_e)

    def piscar_natural(self):
        """Piscada natural: pálpebra superior desce completamente,
        inferior sobe apenas levemente — como o olho humano real."""
        pc_old_d = self.estado["olho_direito"]["pc"]
        pb_old_d = self.estado["olho_direito"]["pb"]
        pc_old_e = self.estado["olho_esquerdo"]["pc"]
        pb_old_e = self.estado["olho_esquerdo"]["pb"]
        # Fecha rápido: superior vai a 100, inferior sobe só um pouco (20)
        self.mover_suave_ambos(pc_alvo=100, pb_alvo=20, duracao=0.12)
        time.sleep(0.05)
        # Abre ligeiramente mais devagar, voltando ao estado anterior
        def abrir_dir(): self.mover_suave("olho_direito", pc_alvo=pc_old_d, pb_alvo=pb_old_d, duracao=0.15)
        def abrir_esq(): self.mover_suave("olho_esquerdo", pc_alvo=pc_old_e, pb_alvo=pb_old_e, duracao=0.15)
        t1 = threading.Thread(target=abrir_dir); t2 = threading.Thread(target=abrir_esq)
        t1.start(); t2.start(); t1.join(); t2.join()

    def pisca_um_olho(self, olho):
        pc_old = self.estado[olho]["pc"]
        pb_old = self.estado[olho]["pb"]
        # Piscada suave
        self.mover_suave(olho, p_alvo=100, duracao=0.15)
        self.mover_suave(olho, pc_alvo=pc_old, pb_alvo=pb_old, duracao=0.2)

    def olhar_ao_redor(self):
        # Centro -> Dir -> Esq -> Cima -> Baixo -> Centro
        pts = [(80, 50), (20, 50), (50, 80), (50, 20), (50, 50)]
        for p in pts:
            self.mover_suave_ambos(h_alvo=p[0], v_alvo=p[1], duracao=0.9)
            time.sleep(0.2)
            if getattr(self, '_stop_anim', False): break

    def olhar_vesgo(self):
        # Para ficar vesgo, os olhos convergem para o centro do nariz
        def t_dir(): self.mover_suave("olho_direito", h_alvo=100, v_alvo=50, duracao=0.3)
        def t_esq(): self.mover_suave("olho_esquerdo", h_alvo=0, v_alvo=50, duracao=0.3)
        th1 = threading.Thread(target=t_dir)
        th2 = threading.Thread(target=t_esq)
        th1.start(); th2.start()
        th1.join(); th2.join()

    def alternar_piscar(self, batidas=6, vel=0.15):
        """Alterna rapidamente entre os olhos aberto/fechado, simulando o clock do cavalo."""
        for _ in range(batidas):
            if getattr(self, '_stop_anim', False): break
            self.fechar_palpebra("olho_direito", 100)
            self.fechar_palpebra("olho_esquerdo", 0)
            time.sleep(vel)
            
            self.fechar_palpebra("olho_direito", 0)
            self.fechar_palpebra("olho_esquerdo", 100)
            time.sleep(vel)
        # Reseta no final
        self.olhar_neutro(suave=False)

    # ANIMAÇÕES COMPLEXAS
    def animacao_acordar(self):
        self.fechar_palpebra("olho_direito", 100); self.fechar_palpebra("olho_esquerdo", 100)
        time.sleep(1.0)
        self.mover_suave_ambos(p_alvo=70, duracao=0.8)
        time.sleep(0.4)
        self.piscar()
        time.sleep(0.3)
        self.olhar_neutro()

    def animacao_dormir(self):
        self.mover_suave_ambos(p_alvo=60, duracao=1.0)
        time.sleep(0.5)
        self.mover_suave_ambos(p_alvo=100, duracao=1.5)

# Apenas a classe, os arquivos de interface criam as instâncias.
