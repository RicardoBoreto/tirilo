from games.base import GameBase
import time

class Game(GameBase):
    def __init__(self, hardware, gui, brain):
        super().__init__(hardware, gui, brain)
        self.nome = "Modo Papagaio"

    def start(self):
        super().start()
        self.gui.set_state("LISTENING")
        self.hardware.speak_animated("Modo papagaio ativado! Fale sair para parar.", ui_callback=None)

    def stop(self):
        self.hardware.speak_animated("Saindo do modo papagaio.", ui_callback=None)
        self.gui.set_state("IDLE")

    def on_touch(self, x, y):
        pass

    def on_voice(self, text):
        pass

    def loop(self):
        # A lógica original do papagaio era um loop bloqueante (while parrot_mode).
        # Aqui, seremos chamados repetidamente pelo main loop.
        
        # Escuta (bloqueante por 5s)
        self.gui.set_state("LISTENING")
        self.gui.draw() # Garante atualização visual
        
        heard_text = self.hardware.listen(timeout=5)
        
        if heard_text:
            print(f"Parrot heard: {heard_text}")
            print(f"DEBUG: Texto ouvido: '{heard_text}'")
            if "sair" in heard_text.lower() or "parar" in heard_text.lower():
                print("DEBUG: Palavra chave de saída detectada.")
                self.running = False
            else:
                self.gui.set_state("TALKING")
                self.hardware.speak_animated(heard_text, ui_callback=None)
                self.gui.set_state("LISTENING")
