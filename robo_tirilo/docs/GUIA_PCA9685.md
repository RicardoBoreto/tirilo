# Guia de Ligação e Configuração PCA9685 - Robô Tirilo

O projeto Robô Tirilo utiliza um módulo **PCA9685 (Controlador PWM 16 Canais via I2C)** para movimentar 8 micro servos 9g. Este guia explica a montagem física.

---

## 1. Conexão do PCA9685 com o Raspberry Pi

Você precisará usar os pinos GPIO do Raspberry Pi para comunicação I2C e alimentação lógica.

| Pino PCA9685 | Pino no Raspberry Pi (Header 40 pinos) | Descrição |
| :--- | :--- | :--- |
| **GND** | **Pino 6** (Ground) | Terra comum do sinal lógico. |
| **VCC** | **Pino 1** (3.3V Power) | Alimentação LÓGICA do chip (não alimenta os motores). Use 3.3V no Raspberry! |
| **SDA** | **Pino 3** (GPIO 2 - SDA) | Linha de Dados (I2C). |
| **SCL** | **Pino 5** (GPIO 3 - SCL) | Linha de Clock (I2C). |

**ALERTA IMPORTANTE:**
Nunca alimente o V+ (Borne de energia para os Servos) usando o pino 5V do Raspberry Pi. Oito servos exigem **alta corrente (ex: 5V e 3 Amperes ou mais)**.
Para a energia dos motores: Conecte uma **bateria externa (ou fonte Step-Down configurada para 5V - 6V)** no **Borne Verde** do PCA9685 (onde diz `V+` e `GND`).

---

## 2. Ligação dos Servos no PCA9685

Os servos devem ser conectados respeitando a cor dos fios (Marrom=GND, Vermelho=V+, Amarelo/Laranja=PWM).

### Olho Direito
- **Porta 0:** Movimento Vertical (Cima/Baixo do Globo)
- **Porta 1:** Movimento Horizontal (Esquerda/Direita do Globo)
- **Porta 2:** Pálpebra Superior (Cima)
- **Porta 3:** Pálpebra Inferior (Baixo)

### Olho Esquerdo
- **Porta 4:** Movimento Vertical (Cima/Baixo do Globo)
- **Porta 5:** Movimento Horizontal (Esquerda/Direita do Globo)
- **Porta 6:** Pálpebra Superior (Cima)
- **Porta 7:** Pálpebra Inferior (Baixo)

---

## 3. Instalação do Software no Raspberry Pi

Para o controle I2C, o Raspberry Pi precisa ter o I2C ativado nativamente.

1. **Ativar o I2C:**
   No terminal: `sudo raspi-config` -> `Interface Options` -> `I2C` -> `Yes`.
   Reinicie se necessário.

2. **Instalar a biblioteca Python (Raspberry Pi OS Bookworm ou mais recente):**
   Abra o terminal do Raspberry Pi e execute o comando abaixo. Como as versões recentes do Raspberry Pi bloqueiam a instalação global do pip, é necessário usar o `apt` ou adicionar a flag `--break-system-packages`:
   ```bash
   pip install adafruit-circuitpython-servokit --break-system-packages
   ```

3. **Iniciando o Calibrador:**
   Execute pelo terminal ou tela touch:
   ```bash
   python3 calibrador_olhos.py
   ```
   *Nota: O script precisa estar no mesmo nível que o painel e necessita estar num ambiente onde o módulo `adafruit-circuitpython-servokit` é reconhecido.*

---

## 4. O Sistema de Calibragem Dual (`calibrador_olhos.py`)

A cabeça do robô é mecanicamente assimétrica e cheia de limites físicos. Para evitar que os servos quebrem o plástico ou os filamentos, desenvolvemos um calibrador visual assíncrono.

### Como funciona o Calibrador:
Ao abrir o `calibrador_olhos.py` (desenhado no Pygame para uso otimizado na tela Touch Screen do Raspberry):
1. **Navegação:** Use os botões `<` e `>` no topo para alternar entre os quatro mecanismos mecânicos (`vertical`, `horizontal`, `palpebra_cima`, `palpebra_baixo`).
2. **Edição Simultânea:** A tela é dividida em dois painéis (Olho Direito e Olho Esquerdo). Você pode ajustar ângulos usando os botões `+1`, `+10`, `-1`, `-10` de forma individualizada para cada olho simultaneamente.
3. **Mapeamento de Regras Mecânicas (Min/Cen/Max):**
   - **Centro (SALVAR CEN):** Onde o servo deve ficar quando o robô estiver relaxado olhando pra frente (Ex: Pupilas a 90° graus).
   - **Mínimo (SALVAR MIN):** O limite eletrônico para movimentação "negativa" e evitar que o braço bata na carcaça.
     - Nas **Pálpebras Superiores**, o MÍNIMO (0%) configura o olho **ESTATELADO (Totalmente aberto)**.
     - Nas **Pálpebras Inferiores**, o MÍNIMO (0%) configura o olho **FECHADO (Sobe apagando a visão)**.
   - **Máximo (SALVAR MAX):** O limite inverso do espectro de movimento de cada motor.

### O Arquivo de Estado (`config_olhos.json`)
Toda vez que você aperta para salvar qualquer valor na interface, ele exporta os parâmetros instantaneamente no arquivo de configuração `config_olhos.json`. 

A inteligência da coreografia (`olhos_tirilo.py`) usa esse arquivo base para calcular inversões lógicas usando porcentagens. No controlador final das emoções dinâmicas de 0% a 100%, 0% na pálpebra sempre fará o robô esbugalhar o olho e 100% será olho fortemente fechado, sendo essa inteligência traduzida da matemática de graus contida no JSON fornecido por esse calibrador!
