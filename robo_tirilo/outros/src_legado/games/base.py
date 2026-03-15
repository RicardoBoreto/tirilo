from abc import ABC, abstractmethod

class GameBase(ABC):
    """
    Classe base para todos os jogos do Robô Tirilo.
    Qualquer novo jogo DEVE herdar desta classe e implementar seus métodos.
    """
    
    def __init__(self, hardware, gui, brain):
        self.hardware = hardware
        self.gui = gui
        self.brain = brain
        self.running = False
        self.nome = "Jogo Genérico"

    @abstractmethod
    def start(self):
        """Chamado quando o jogo começa. Use para inicializar variáveis e dar as boas-vindas."""
        self.running = True
        pass

    @abstractmethod
    def stop(self):
        """Chamado quando o jogo é interrompido. Use para limpar recursos."""
        self.running = False
        pass

    @abstractmethod
    def on_touch(self, x, y):
        """Chamado quando o usuário toca na tela (compatibilidade legada)."""
        pass

    def on_mouse_down(self, x, y):
        """Início do toque."""
        pass

    def on_mouse_up(self, x, y):
        """Fim do toque."""
        pass

    def on_mouse_move(self, x, y):
        """Movimento do toque/mouse."""
        pass

    @abstractmethod
    def on_voice(self, text):
        """Chamado quando o robô escuta algo. Retorne True se o jogo consumiu o comando."""
        pass

    @abstractmethod
    def loop(self):
        """Chamado repetidamente pelo main loop. Use para animações ou lógica de tempo."""
        pass
