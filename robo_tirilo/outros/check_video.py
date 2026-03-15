#!/usr/bin/env python3
import os
import pygame
import sys

def testar():
    print("=== DIAGNÓSTICO DE VÍDEO (PI 5 LITE) ===")
    print(f"Versão Pygame: {pygame.version.ver}")
    print(f"Usuário: {os.getlogin()}")
    
    drivers = ['kmsdrm', 'drm', 'fbcon', 'x11', 'dummy']
    print("\nTentando inicializar drivers:")
    
    for d in drivers:
        for idx in ['0', '1']:
            os.environ["SDL_VIDEODRIVER"] = d
            os.environ["SDL_KMSDRM_DEVICE_INDEX"] = idx
            try:
                pygame.display.init()
                print(f"  [OK] Driver: {d} (Index {idx})")
                info = pygame.display.Info()
                print(f"       Resolução: {info.current_w}x{info.current_h}")
                pygame.display.quit()
            except Exception as e:
                print(f"  [ERRO] Driver: {d} (Index {idx}) -> {e}")

    print("\nVerificando permissões de arquivos de vídeo:")
    os.system("ls -l /dev/dri/card*")
    os.system("groups")

if __name__ == "__main__":
    testar()
