
import os
import time
from datetime import datetime
from games.base import GameBase
from supabase_client import supabase  # Assumindo que você tem um cliente centralizado, senão instancio aqui

class Game(GameBase):
    """
    Modo Diário de Bordo (Escriba).
    O robô atua como um ouvinte passivo, transcrevendo interações para o banco de dados.
    Não possui feedback de fala constante, apenas processamento silencioso.
    """

    def __init__(self, hardware, gui, brain):
        super().__init__(hardware, gui, brain)
        self.name = "Diário de Sessão"
        self.sessao_id = None
        self.last_voice_time = 0

    def start(self):
        print("Iniciando Modo Diário de Bordo...")
        self.running = True
        self.gui.set_state("LISTENING")
        self.gui.draw()
        
        # Tenta recuperar ou criar uma sessão lúdica para hoje
        # Em produção, esse ID viria do comando de inicio "START_GAME diario {sessao_id}"
        # Por enquanto, vamos criar uma 'sessao_avulsa' se não fornecido
        if not self.sessao_id:
            print("AVISO: ID de sessão não vinculado. Logando em modo 'flutuante'.")

    def stop(self):
        print("Finalizando Diário...")
        self.running = False

    def on_voice(self, text):
        """
        Callback acionado quando o hardware detecta fala (se usarmos modo event-driven).
        Mas o GameBase padrão geralmente roda em loop. Vamos usar o loop.
        """
        return False

    def loop(self):
        # 1. Feedback Visual
        self.gui.set_face("neutral") # Olhos abertos, atentos
        self.gui.draw()

        # 2. Escuta Ativa
        # O timeout define a 'janela' de silêncio para considerar uma frase terminada.
        heard_text = self.hardware.listen(timeout=8)

        if heard_text:
            print(f"Ouvido: {heard_text}")
            
            # Animação rápida para indicar processamento
            self.gui.set_state("THINKING") 
            self.gui.draw()

            # 3. Envia para Supabase
            self.log_to_cloud(heard_text)

            # Voltar ao estado neutro
            self.gui.set_state("LISTENING")
            self.gui.draw()

    def log_to_cloud(self, text):
        try:
            # Estrutura do payload
            payload = {
                "texto_transcrito": text,
                "timestamp": datetime.now().isoformat(),
                "tipo_evento": "FALA_DETECTADA",
                "sessao_ludica_id": self.sessao_id # Pode ser null se for autônomo
            }
            
            # Insert assíncrono seria ideal, mas sync para MVP
            res = supabase.table("sessao_diario_bordo").insert(payload).execute()
            print(f"Log salvo: {res}")
            
        except Exception as e:
            print(f"Erro ao salvar log: {e}")
            # Fazer cache local se falhar? (V2)

