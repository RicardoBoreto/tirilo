# Guia de Visão Computacional e Rastreamento (Tirilo)

Este documento documenta o módulo de visão habilitado no Robô Tirilo, permitindo que ele identifique pessoas através de uma câmera (via OpenCV) e utilize os servos do PCA9685 para mover os olhos organicamente em direção ao alvo acompanhando seu movimento.

---

## 1. Arquitetura do Rastreamento

O rastreamento foi projetado para rodar em dispositivos de baixo processamento gráfico (Headless) como o Raspberry Pi 3. Por isso, a lógica foi dividida de forma a não "congelar" a rotina de controle de motores I2C.

Ao invés de processar motores e vídeo no mesmo fluxo contínuo (o que causaria paradas travadas), o sistema utiliza **Multithreading**:
- **Thread 1 (OpenCV/Câmera):** Roda o mais rápido possível capturando frames e inferindo através do algoritmo *Haar Cascade*. Quando acha um rosto, joga a coordenada % (0-100) na variável unificada.
- **Thread 2 (Servos PI I2C):** Roda num relógio cravado dormindo levemente (0.05s). Ela pega a última coordenada válida encontrada pela Thread 1, suaviza o movimento e manda as ordens pro arquivo `olhos_tirilo.py`.

---

## 2. Abordagens de Arquivos

Para maximizar o controle durante os testes e o uso de produção no hardware montado (como Pi 5 ou Pi 3), existem três scripts vitais:

### `setup_visao.py`
Baixa a inteligência neural necessária para a OpenCV reconhecer rostos (O modelo Xml *Haar Cascade Frontal Face* original da Inteligência Artificial em Visão). Precisa ser executado apenas a primeira vez após instalar a dependência.

### `rastreador_visao.py` *(Otimizado para Produção/Hardware)*
A versão de produção para o Raspberry. 
Nela, toda parte visual de interface gráfica (X11 / cv2.imshow / Flask Server) foi removida. A câmera abre na menor resolução possível (320x240 @ 10 ~ 15 fps) apenas para enviar coordenadas cruas aos motores, garantindo que o Robô mexa os olhos super rápido e não exija demais do processador fraco.

**Uso:**
```bash
python3 rastreador_visao.py
```

### `rastreador_visao_web.py` *(Auxiliar de Testes Web)*
A versão dedicada para calibragem técnica e auditoria do que ele está vendo. 
Mantém o rastreamento leve, contudo integra um pequeno servidor web (`Microframework Flask`) embutido no Python. O frame processado com o retângulo verde do OpenCV no rosto detectado vira uma imagem JPEG transmitida para a rede local sem necessitar abrir janelas de terminal X11 no Pi.

**Uso:**
- Rode no raspberry: `python3 rastreador_visao_web.py`
- Abra no computador/celular o IP da placa: `http://<IP_DO_RASPBERRY>:5000`

---

## 3. Dinâmica de Transformação (Mapping)

O arquivo de núcleo de olhos `olhos_tirilo.py` aceita "0 a 100%" (Graus configurados).
A lente da câmera entende "0 a 320" Pixels no eixo de Largura (X).

O papel do algoritmo é:
1. Pega o centro do retângulo do rosto no frame.
2. Faz uma regra de proporção linear: Ex: Pessoa no meio da tela (160 px em Largura 320) = Transforma para `50%` da tela.
3. Repassa os **X:50 e Y:50** para a função `olhos.virar_olho("olho_direito", 50, 50)`.
4. Os eixos reagem diretamente, sem inversão física pois o `calibrador_olhos` no JSON garante a integridade mecânica prévia.

---

## 4. Requisitos e Setup
Se for fazer um fresh-install em um novo Raspberry, lembre-se:

```bash
# 1. Instalar depedências de ML/Video
pip install opencv-python --break-system-packages
pip install flask --break-system-packages

# 2. Baixar os Modelos Haar Cascade
python3 setup_visao.py
```
