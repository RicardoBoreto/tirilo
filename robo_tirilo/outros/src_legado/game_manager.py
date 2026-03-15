import importlib
import os
import sys

class GameManager:
    def __init__(self, hardware, gui, brain):
        self.hardware = hardware
        self.gui = gui
        self.brain = brain
        self.current_game = None
        self.loaded_games = {}
        self.games_path = os.path.join(os.path.dirname(__file__), 'games')
        
    def load_games(self):
        """Escaneia a pasta 'games' e carrega os módulos dinamicamente."""
        print("Scaning for games in:", self.games_path)
        sys.path.append(os.path.dirname(__file__)) # Ensure src is in path
        
        for filename in os.listdir(self.games_path):
            if filename.endswith(".py") and filename != "base.py" and filename != "__init__.py":
                module_name = f"games.{filename[:-3]}"
                try:
                    module = importlib.import_module(module_name)
                    # Reload ensures we get changes if development is happening live
                    importlib.reload(module)
                    
                    # Instantiate the Game class (Convention: Class name must be 'Game')
                    if hasattr(module, 'Game'):
                        game_instance = module.Game(self.hardware, self.gui, self.brain)
                        self.loaded_games[filename[:-3]] = game_instance
                        print(f"Loaded game plugin: {filename}")
                    else:
                        print(f"Skipped {filename}: No 'Game' class found.")
                except Exception as e:
                    print(f"Error loading game {filename}: {e}")

    def start_game(self, game_id):
        """Inicia um jogo pelo ID (nome do arquivo sem .py)."""
        if self.current_game:
            self.stop_current_game()
            
        # Tenta carregar sob demanda se não estiver carregado (hot swap)
        if game_id not in self.loaded_games:
            self.load_games()
            
        if game_id in self.loaded_games:
            self.current_game = self.loaded_games[game_id]
            print(f"Starting game engine: {self.current_game.nome}")
            self.current_game.start()
            return True
        else:
            print(f"Game {game_id} not found.")
            return False

    def stop_current_game(self):
        if self.current_game:
            print(f"Stopping game: {self.current_game.nome}")
            self.current_game.stop()
            self.current_game = None

    def handle_input(self, input_type, data):
        """Roteia eventos (toque, voz) para o jogo ativo."""
        if not self.current_game:
            return

        if input_type == 'touch':
            self.current_game.on_touch(data['x'], data['y'])
        elif input_type == 'voice':
            self.current_game.on_voice(data['text'])
        elif input_type == 'loop':
            self.current_game.loop()

    def handle_pygame_event(self, event):
        """Processa eventos crus do Pygame."""
        if not self.current_game:
            return
        
        import pygame
        if event.type == pygame.MOUSEBUTTONDOWN:
            x, y = event.pos
            self.current_game.on_mouse_down(x, y)
        elif event.type == pygame.FINGERDOWN:
            # FINGERDOWN returns normalized x,y (0 to 1)
            # Need to know screen size to convert. 
            # self.gui.screen.get_width() ...
            x = int(event.x * self.gui.screen.get_width())
            y = int(event.y * self.gui.screen.get_height())
            self.current_game.on_mouse_down(x, y)
        elif event.type == pygame.MOUSEBUTTONUP:
            x, y = event.pos
            self.current_game.on_mouse_up(x, y)
        elif event.type == pygame.FINGERUP:
            x = int(event.x * self.gui.screen.get_width())
            y = int(event.y * self.gui.screen.get_height())
            self.current_game.on_mouse_down(x, y) # Treat Up as Down? No, Up.
            self.current_game.on_mouse_up(x, y)
        elif event.type == pygame.MOUSEMOTION:
            x, y = event.pos
            self.current_game.on_mouse_move(x, y)
        elif event.type == pygame.FINGERMOTION:
            x = int(event.x * self.gui.screen.get_width())
            y = int(event.y * self.gui.screen.get_height())
            self.current_game.on_mouse_move(x, y)
