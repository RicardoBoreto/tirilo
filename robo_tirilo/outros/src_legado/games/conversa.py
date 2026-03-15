from games.base import GameBase

class Game(GameBase):
    def __init__(self, hardware, gui, brain):
        super().__init__(hardware, gui, brain)
        self.nome = "Modo Conversa (IA)"

    def start(self):
        super().start()
        self.gui.set_state("LISTENING")
        self.hardware.speak_animated("Modo conversa iniciado! Pode falar comigo.", ui_callback=None)

    def stop(self):
        # At\u00e9 logo! Encerrando conversa.
        self.hardware.speak_animated("At\u00e9 logo! Encerrando conversa.", ui_callback=None)
        self.gui.set_state("IDLE")

    def on_touch(self, x, y):
        pass

    def on_voice(self, text):
        pass

    def loop(self):
        # Evita ouvir a si mesmo: Se estiver falando, só atualiza tela e espera
        if self.hardware.speaking:
            self.gui.set_state("TALKING")
            self.gui.draw()
            return

        # Escuta
        self.gui.set_state("LISTENING")
        self.gui.draw()
        
        heard_text = self.hardware.listen(timeout=5)
        
        if heard_text:
            print(f"User said: {heard_text}")
            if "sair" in heard_text.lower() or "tchau" in heard_text.lower():
                self.running = False
            else:
                # Think
                self.gui.set_state("THINKING")
                self.gui.draw()
                
                response = self.brain.process_input(heard_text)
                print(f"AI response: {response}")
                
                # Speak (Non-blocking, loop handles animation)
                self.hardware.speak_animated(response, ui_callback=None)
