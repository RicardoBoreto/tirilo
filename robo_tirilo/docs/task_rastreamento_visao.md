# Task: Visão Computacional e Rastreamento

## 1. Objetivo
Implementar capacidades de visão computacional no Tirilo, permitindo rastrear usuários (faces) ou objetos e direcionar os servos dos olhos (via PCA9685 e ControladorOlhos) para acompanhá-los.

## 2. Abordagem (Execução Direta no Raspberry Pi 3 com PCA9685)
- O mapeamento base usará OpenCV (`cv2`) com algoritmos leves (como Haar Cascades) visando compatibilidade máxima nos Single Board Computers mais antigos (Pi 3).
- O script rodará diretamente no Raspberry Pi, abrindo uma janela Pygame/OpenCV para exibir a câmera com a marcação do rosto, e já invocando o movimento real dos servos do Tirilo.

## 3. Checklist de Implementação
- [ ] Atualizar dependências (`opencv-python`).
- [ ] Criar modulo `rastreador_visao.py`.
- [ ] Capturar a Câmera USB (`cv2.VideoCapture`) exibindo na tela do Pi.
- [ ] Implementar a detecção Haar Cascade na imagem exibida.
- [ ] Prototipar conversão de Pixels XY da Câmera (por ex. Resolução 640x480) para Eixos X e Y de movimento Ocular Padrão (0 a 100).
- [ ] Refinar a taxa de invocação da função `virar_olho()` (evitando overload I2C/Serial).

## 4. Notas de Arquitetura
A câmera web ligada via USB no Raspberry Pi será a `/dev/video0`.
O loop do OpenCV deve conter pequenos delays ou amostragem reduzida para que a leitura de detecção de rosto (que é pesada para o Pi 3) não trave a movimentação fluída dos servos via thread.
