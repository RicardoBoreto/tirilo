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
        os.environ["SDL_MOUSEDRV"] = "evdev"
        os.environ["SDL_MOUSEDEV"] = "/dev/input/event3" 
        pygame.mouse.set_visible(False) # Hide cursor for touch feel
        pygame.display.set_caption("Tirilo")
        self.font = pygame.font.SysFont("Arial", 40)
        self.clock = pygame.time.Clock()
        
        self.state = "IDLE" # IDLE, TALKING, GAME_SELECTION, LOCKED
        self.game_buttons = []
        self.running = True

    def set_state(self, state):
        self.state = state

    def get_events(self):
        """Fetch raw events."""
        return pygame.event.get()

    def process_events(self, events):
        """Process input events."""
        action = None
        for event in events:
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
            self._draw_face("IDLE")
        elif self.state == "TALKING":
            self._draw_face("TALKING")
        elif self.state == "LISTENING":
            self._draw_face("LISTENING")
        elif self.state == "THINKING":
            self._draw_face("THINKING")
        
        pygame.display.flip()
        self.clock.tick(60) # 60 FPS for smoother animation

    def _draw_locked(self):
        text = self.font.render("BLOQUEADO - Contatar Suporte", True, RED)
        rect = text.get_rect(center=(SCREEN_WIDTH//2, SCREEN_HEIGHT//2))
        self.screen.blit(text, rect)

    def _draw_face(self, state):
        # Eyes Base Color
        eye_color = BLUE
        status_text = ""
        
        if state == "LISTENING":
            eye_color = GREEN
            status_text = "Ouvindo..."
        elif state == "THINKING" or state == "PROCESSING":
            eye_color = (200, 200, 0) # Yellow/Gold
            status_text = "Pensando..."
        elif state == "TALKING":
            eye_color = BLUE
            
        # Draw Eyes
        pygame.draw.circle(self.screen, eye_color, (250, 200), 60)
        pygame.draw.circle(self.screen, eye_color, (550, 200), 60)
        
        # Pupils
        pygame.draw.circle(self.screen, BLACK, (250, 200), 20)
        pygame.draw.circle(self.screen, BLACK, (550, 200), 20)
        
        # Draw Status Text
        if status_text:
            text_surf = self.font.render(status_text, True, WHITE)
            text_rect = text_surf.get_rect(center=(SCREEN_WIDTH//2, 450))
            self.screen.blit(text_surf, text_rect)
        
        # Draw Mouth
        if state == "TALKING":
            # Dynamic Mouth Animation
            import random
            # Use time to control speed, but random magnitude
            t = pygame.time.get_ticks() 
            # Open/Close amount
            open_amount = abs(int(50 *  (0.5 + 0.5 *  (1 if (t // 150) % 2 == 0 else -1))))
            # Or use Sine wave? Let's use random for "talking" vibe if simpler, 
            # but a simple open/close loop is safer for loop based rendering.
            
            # Simple "Pacman" style open/close based on time
            mouth_rect = pygame.Rect(300, 320, 200, 10 + open_amount)
            mouth_rect.centery = 350
            
            pygame.draw.ellipse(self.screen, WHITE, mouth_rect)
            # Inner mouth (black)
            if open_amount > 10:
                pygame.draw.ellipse(self.screen, BLACK, mouth_rect.inflate(-10, -10))
                
        else:
            # Smile
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
