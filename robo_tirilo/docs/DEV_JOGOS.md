# Guia de Desenvolvimento de Jogos para Robô Tirilo 🤖

Este documento explica como criar, instalar e testar novos jogos para a plataforma Tirilo.

## 1. Estrutura Básica

Cada jogo é um arquivo `.py` independente localizado na pasta `src/games/`.
O arquivo **DEVE** conter uma classe chamada `Game` que herda de `GameBase`.

### Exemplo Mínimo (`meu_jogo_novo.py`)

```python
from games.base import GameBase
import random

class Game(GameBase):
    def __init__(self, hardware, gui, brain):
        super().__init__(hardware, gui, brain)
        self.nome = "Meu Jogo Novo"

    def start(self):
        # 1. Mensagem inicial (ui_callback=None para evitar conflito de thread)
        self.hardware.speak_animated("Bem vindo ao meu jogo novo!", ui_callback=None)
        # 2. Configura a tela (opcional)
        self.gui.set_state("GAME_GENERIC") 

    def stop(self):
        self.hardware.speak_animated("Tchau!", ui_callback=None)

    def on_touch(self, x, y):
        # x e y são as coordenadas do toque
        self.hardware.speak_animated("Você tocou na tela!", ui_callback=None)

    def on_voice(self, text):
        # text é o que o usuário falou
        if "sair" in text:
            self.stop()
        else:
            self.hardware.speak_animated(f"Eu ouvi {text}", ui_callback=None)

    def loop(self):
        # Chamado a cada frame. Use para animações ou cronômetros.
        pass
```

### Jogos de Alta Performance (Dedicados)
Para jogos que exigem **fluidez total** (arrastar peças, física), você pode "sequestrar" o loop principal dentro do método `start()`:

```python
    def start(self):
        self.running = True
        
        # Loop Local (Bloqueante para o Main, mas fluido para o jogo)
        clock = pygame.time.Clock()
        while self.running:
             events = pygame.event.get() # Processa eventos direto
             for e in events:
                 # Lógica de input...
                 pass
                 
             self.loop() # Desenha
             clock.tick(60) # Crava 60 FPS
             
        # Ao sair do while, o jogo termina
        self.gui.set_state("IDLE")
```

## 2. Instalação

### Modo Local (Desenvolvimento)
1. Crie seu arquivo `.py` seguindo o modelo acima.
2. Salve na pasta `robo_tirilo/src/games/`.
3. Reinicie o robô ou envie o comando para carregar.

### Modo Remoto (Deploy)
*(Feature Futura)*: Em breve será possível fazer upload do arquivo `.py` pelo Dashboard Web (SaaS) e o robô baixará automaticamente.

## 3. Integração com Hardware

Dentro da sua classe `Game`, você tem acesso a:

*   **Hardware Interop:**
    *   **IMPORTANTE:** Ao chamar `speak_animated`, use sempre `ui_callback=None`. O sistema agora gerencia a animação da boca automaticamente no loop principal. Passar callbacks visuais para threads de áudio pode causar travamentos ("Robocopy").
    *   `listen(timeout=5)`: Escuta o microfone (embora o `on_voice` já receba isso automaticamente se configurado no main).
    *   `move_head(...)`: (Se disponível) Comandos de servo.
*   **`self.gui`**:
    *   `set_state(estado)`: Muda o rosto (TALKING, LISTENING, etc).
    *   `draw()`: Renderiza a tela.
*   **`self.brain`**:
    *   `process_input(texto)`: Envia texto para o Gemini (IA) e recebe resposta inteligente.

## 4. Textos e Acentos (Novo!)

Você pode escrever textos em português normalmente (com acentos: `~`, `ç`, `é`), **sem precisar usar códigos** como `chr(227)` ou `\u00...`.

### Solução de Encodings (Windows vs Linux)
Devido a diferenças de codificação entre Windows (CP1252) e Linux (UTF-8), caracteres acentuados podem corromper durante a transferência.

Para resolver, incluímos um script de **auto-correção no Raspberry Pi**:

1.  Faça o deploy normalmente (`.\deploy_robo.ps1`).
2.  O arquivo `src/prepare_environment.sh` é enviado junto.
3.  Se notar problemas de acentuação ou cache, logue no Raspberry e rode:
    ```bash
    cd apps/tirilo_robo/src
    ./prepare_environment.sh
    ```
    Isso limpará caches (`__pycache__`) e converterá forçadamente qualquer arquivo corrompido para UTF-8 limpo.

## 5. Dicas de Design

*   **Interatividade:** Sempre dê feedback visual e sonoro.
*   **Simplicidade:** Crianças precisam de instruções claras e respostas curtas.
*   **Loop:** Não use `while True` dentro dos seus métodos (`start`, `on_touch`). Isso trava o robô. Use o método `loop()` para verificação contínua ou deixe o sistema de eventos (`on_touch`) guiar o fluxo.
