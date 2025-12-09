from games.base import GameBase
import pygame
import random
import time

class Game(GameBase):
    def __init__(self, hardware, gui, brain):
        super().__init__(hardware, gui, brain)
        self.nome = "Jogo das Cores (Toque)"
        
        # Cores (reutilizando constantes do GUI se quisesse, mas definindo aqui para garantir)
        self.VERMELHO = (255, 50, 50)
        self.AZUL = (0, 0, 255)
        self.BRANCO = (255, 255, 255)
        
        self.alvo_atual = None
        self.acertou = False
        self.last_touch_time = 0
        
        self.w = gui.screen.get_width()
        self.h = gui.screen.get_height()
        
        self.rect_esq = pygame.Rect(0, 0, self.w // 2, self.h)
        self.rect_dir = pygame.Rect(self.w // 2, 0, self.w // 2, self.h)
        self.font = pygame.font.Font(None, 100)

    def start(self):
        super().start()
        # Mostra a tela dividida
        self.loop()
        
        # Instrução
        # Vou pedir uma cor e voc\u00ea toca nela!
        self.hardware.speak_animated("Vou pedir uma cor e voc\u00ea toca nela!", ui_callback=None)
        
        # Começa a rodada
        self.nova_rodada()

    def nova_rodada(self):
        if not self.running: return
        
        self.alvo_atual = random.choice(["VERMELHO", "AZUL"])
        
        if self.alvo_atual == "VERMELHO":
            msg = "Toque no Vermelho!"
        else:
            msg = "Toque no Azul!"
            
        self.hardware.speak_animated(msg, ui_callback=None)
        self.last_touch_time = time.time()

    def stop(self):
        self.running = False
        self.hardware.speak_animated("Fim de jogo!", ui_callback=None)
        self.gui.set_state("IDLE")

    def on_touch(self, x, y):
        # Fallback
        self.on_mouse_down(x, y)

    def on_mouse_down(self, x, y):
        # Debounce simples
        if time.time() - self.last_touch_time < 0.2:
            return
            
        if not self.alvo_atual:
            return

        print(f"Toque em {x}, {y}. Alvo: {self.alvo_atual}")
        
        # Lógica de colisão simples (Metade Esquerda = Vermelho, Metade Direita = Azul)
        cor_tocada = "VERMELHO" if x < self.w // 2 else "AZUL"
        
        if cor_tocada == self.alvo_atual:
            self.hardware.speak_animated("Acertou! Muito bem!", ui_callback=None)
            time.sleep(1)
            self.nova_rodada()
        else:
            # Ops, esse \u00e9 o {}
            self.hardware.speak_animated(f"Ops, esse \u00e9 o {cor_tocada}.", ui_callback=None)
            # Dá mais uma chance? Ou nova rodada?
            # Vamos pedir de novo
            self.hardware.speak_animated(f"Tente tocar no {self.alvo_atual}!", ui_callback=None)
            
        self.last_touch_time = time.time()

    def on_mouse_up(self, x, y):
        pass

    def on_mouse_move(self, x, y):
        pass

    def on_voice(self, text):
        if "sair" in text.lower():
            self.stop()

    def loop(self):
        screen = self.gui.screen
        
        # Desenha Lado Esquerdo (Vermelho)
        pygame.draw.rect(screen, self.VERMELHO, self.rect_esq)
        
        # Desenha Lado Direito (Azul)
        pygame.draw.rect(screen, self.AZUL, self.rect_dir)
        
        # Textos (Opcional, ajuda a identificar)
        txt_vermelho = self.font.render("VERMELHO", True, self.BRANCO)
        tr = txt_vermelho.get_rect(center=self.rect_esq.center)
        screen.blit(txt_vermelho, tr)
        
        txt_azul = self.font.render("AZUL", True, self.BRANCO)
        ta = txt_azul.get_rect(center=self.rect_dir.center)
        screen.blit(txt_azul, ta)
        
        pygame.display.flip()
