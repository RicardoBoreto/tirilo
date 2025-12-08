import pygame
import os

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 480
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
BLUE = (0, 120, 215)
RED = (200, 0, 0)
GREEN = (0, 200, 0)

class GuiManager:
    def __init__(self):
        os.environ['SDL_VIDEO_CENTERED'] = '1'
        pygame.init()
        # Use FULLSCREEN on RPi, but windowed for dev/testing if needed
        # self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT), pygame.FULLSCREEN)
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Tirilo")
        self.font = pygame.font.SysFont("Arial", 40)
        self.clock = pygame.time.Clock()
        
        self.state = "IDLE" # IDLE, TALKING, GAME_SELECTION, LOCKED
        self.game_buttons = []
        self.running = True

    def set_state(self, state):
        self.state = state

    def handle_events(self):
        """Process input events."""
        action = None
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                action = "QUIT"
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.running = False
                    action = "QUIT"
            elif event.type == pygame.MOUSEBUTTONDOWN:
                if self.state == "GAME_SELECTION":
                    pos = pygame.mouse.get_pos()
                    for btn in self.game_buttons:
                        if btn['rect'].collidepoint(pos):
                            action = f"GAME_{btn['id']}"
        return action

    def draw(self):
        """Render the screen based on state."""
        self.screen.fill(BLACK)

        if self.state == "LOCKED":
            self._draw_locked()
        elif self.state == "GAME_SELECTION":
            self._draw_game_selection()
        elif self.state == "IDLE":
            self._draw_face(talking=False)
        elif self.state == "TALKING":
            self._draw_face(talking=True)
        
        pygame.display.flip()
        self.clock.tick(30) # 30 FPS

    def _draw_locked(self):
        text = self.font.render("BLOQUEADO - Contatar Suporte", True, RED)
        rect = text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2))
        self.screen.blit(text, rect)

    def _draw_face(self, talking):
        # Eyes
        pygame.draw.circle(self.screen, BLUE, (250, 200), 60)
        pygame.draw.circle(self.screen, BLUE, (550, 200), 60)
        
        # Mouth
        if talking:
            # Simple animation simulation or just open mouth
            # For better animation, we'd use a timer or frame counter
            import time
            offset = int(time.time() * 10) % 20
            pygame.draw.ellipse(self.screen, WHITE, (300, 350 - offset, 200, 50 + offset*2))
        else:
            pygame.draw.arc(self.screen, WHITE, (300, 320, 200, 100), 3.14, 0, 5)

    def _draw_game_selection(self):
        self.game_buttons = []
        
        # Button 1
        rect1 = pygame.Rect(100, 150, 250, 180)
        pygame.draw.rect(self.screen, GREEN, rect1)
        text1 = self.font.render("Cores", True, BLACK)
        self.screen.blit(text1, (160, 220))
        self.game_buttons.append({'rect': rect1, 'id': 'CORES'})

        # Button 2
        rect2 = pygame.Rect(450, 150, 250, 180)
        pygame.draw.rect(self.screen, BLUE, rect2)
        text2 = self.font.render("Sons", True, WHITE)
        self.screen.blit(text2, (520, 220))
        self.game_buttons.append({'rect': rect2, 'id': 'SONS'})

    def quit(self):
        pygame.quit()

if __name__ == "__main__":
    gui = GuiManager()
    while gui.running:
        gui.handle_events()
        gui.draw()
    gui.quit()
