# -*- coding: utf-8 -*-
from games.base import GameBase
import pygame
import random
import math
import time

class Game(GameBase):
    def __init__(self, hardware, gui, brain):
        super().__init__(hardware, gui, brain)
        self.nome = "Parear Cores (Arrastar)"
        
        # Cores
        self.RED = (255, 0, 0)
        self.BLUE = (0, 0, 255)
        self.GREEN = (0, 255, 0)
        self.YELLOW = (255, 255, 0)
        
        self.colors = [self.RED, self.BLUE, self.GREEN, self.YELLOW]
        self.color_names = {
            self.RED: "vermelho",
            self.BLUE: "azul",
            self.GREEN: "verde",
            self.YELLOW: "amarelo"
        }
        
        # Estado do Jogo
        self.shapes = []
        self.targets = []
        self.selected_shape = None
        self.score = 0
        self.level = 1
        self.last_touch_time = 0
        
        self.w = gui.screen.get_width()
        self.h = gui.screen.get_height()

    def start(self):
        super().start()
        # Reset Debounce
        self.last_touch_time = 0
        self.generate_level()
        
        # Desenha a primeira vez imediatamente
        self.loop()
        
        # Fala as instruções (thread paralela)
        self.hardware.speak_animated("Jogo de Parear! Arraste as bolinhas para os quadrados da mesma cor.", ui_callback=None)

    def stop(self):
        self.running = False
        # Fim de jogo! Você fez {} pontos.
        self.hardware.speak_animated(f"Fim de jogo! Você fez {self.score} pontos.", ui_callback=None)
        self.gui.set_state("IDLE")

    def generate_level(self):
        self.shapes = []
        self.targets = []
        self.selected_shape = None
        
        # Definir posições fixas para os alvos (quadrados) na parte inferior
        target_y = 350
        spacing = 150
        start_x = 100
        
        # Misturar as cores disponíveis neste nível (max 4)
        active_colors = self.colors[:min(4, self.level + 1)] 
        random.shuffle(active_colors)
        
        for i, color in enumerate(active_colors):
            # Target (Quadrado)
            tx = start_x + (i * spacing)
            self.targets.append({
                'rect': pygame.Rect(tx, target_y, 80, 80),
                'color': color,
                'type': 'square'
            })
            
            # Shape (Círculo) - Posição aleatória na parte superior
            sx = random.randint(50, 700)
            sy = random.randint(50, 200)
            self.shapes.append({
                'x': sx,
                'y': sy,
                'radius': 40,
                'color': color,
                'dragging': False,
                'matched': False
            })

    def on_touch(self, x, y):
        self.on_mouse_down(x, y)

    def on_mouse_down(self, x, y):
        # Debounce curto
        if time.time() - self.last_touch_time < 0.05:
            return
        self.last_touch_time = time.time()
        
        print(f"DEBUG: Mouse Down at {x}, {y}") 

        for shape in self.shapes:
            if not shape['matched']:
                # Distancia euclidiana (Hitbox GENEROSA: raio + 20)
                dist = math.hypot(x - shape['x'], y - shape['y'])
                if dist <= shape['radius'] + 20:
                    shape['dragging'] = True
                    self.selected_shape = shape
                    
                    # Traz pra frente (remove e append)
                    self.shapes.remove(shape)
                    self.shapes.append(shape)
                    
                    cname = self.color_names.get(shape['color'], "cor")
                    print(f"Selecionou: {cname}")
                    break

    def on_mouse_up(self, x, y):
        if self.selected_shape:
            # Verificar colisão com targets
            hit_target = None
            shape_rect = pygame.Rect(self.selected_shape['x'] - self.selected_shape['radius'], 
                                     self.selected_shape['y'] - self.selected_shape['radius'],
                                     self.selected_shape['radius']*2, self.selected_shape['radius']*2)
            
            for target in self.targets:
                if shape_rect.colliderect(target['rect']):
                    hit_target = target
                    break
            
            if hit_target:
                if hit_target['color'] == self.selected_shape['color']:
                    # Match Correto!
                    self.selected_shape['matched'] = True
                    self.selected_shape['x'] = hit_target['rect'].centerx
                    self.selected_shape['y'] = hit_target['rect'].centery
                    self.score += 10
                    # A fala agora é paralela
                    self.hardware.speak_animated("Muito bem!", ui_callback=None)
                    self.check_level_complete()
                else:
                    # Match Errado
                    # Texto temporário por falha de encoding persistente no deploy
                    self.hardware.speak_animated(f"Há não!Tente de novo.", ui_callback=None)
                    pass
            
            if self.selected_shape:
                self.selected_shape['dragging'] = False
                self.selected_shape = None

    def on_mouse_move(self, x, y):
        if self.selected_shape:
            self.selected_shape['x'] = x
            self.selected_shape['y'] = y

    def on_voice(self, text):
        if "sair" in text.lower():
            self.stop()

    def check_level_complete(self):
        if all(s['matched'] for s in self.shapes):
            self.level += 1
            if self.level > 3:
                # Parabéns! Você completou todos os níveis!
                self.hardware.speak_animated("Parabéns! Você completou todos os níveis!", ui_callback=None)
                self.stop()
            else:
                # Próximo nível!
                self.hardware.speak_animated("Próximo nível!", ui_callback=None)
                self.generate_level()

    def loop(self):
        # Renderização do Jogo
        screen = self.gui.screen
        screen.fill((30, 30, 30)) # Fundo escuro Original
        
        # Desenhar Targets (Quadrados)
        for t in self.targets:
            pygame.draw.rect(screen, t['color'], t['rect'])
            pygame.draw.rect(screen, (255,255,255), t['rect'], 2) # Borda branca
            
        # Desenhar Shapes (Círculos)
        # O selected está no final da lista agora, então desenha por cima
        for s in self.shapes:
             pygame.draw.circle(screen, s['color'], (int(s['x']), int(s['y'])), s['radius'])
             pygame.draw.circle(screen, (255,255,255), (int(s['x']), int(s['y'])), s['radius'], 2)
            
        # Draw Score
        score_surf = self.gui.font.render(f"Pontos: {self.score}", True, (255, 255, 255))
        screen.blit(score_surf, (10, 10))
        
        pygame.display.flip()
