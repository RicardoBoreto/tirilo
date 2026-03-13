# Guia de Instalação - Robô Tirilo (Raspberry Pi 5)

Este guia descreve como configurar o Raspberry Pi 5 do zero para rodar o software do Robô Tirilo.

## 1. Gravação do Cartão SD

Para manter o sistema leve e otimizado, utilizaremos a versão **Lite** do sistema operacional.

1.  Baixe e instale o [Raspberry Pi Imager](https://www.raspberrypi.com/software/).
2.  Insira o cartão Micro SD no seu computador.
3.  No Imager:
    - **CHOOSE DEVICE:** Raspberry Pi 5.
    - **CHOOSE OS:** Raspberry Pi OS (other) -> **Raspberry Pi OS Lite (64-bit)**.
    - *Nota: Mesmo na versão Lite (sem desktop), ativamos o suporte à tela física para as interfaces do robô via drivers KMS/DRM.*
    - **CHOOSE STORAGE:** Selecione seu cartão SD.
4.  Clique em **NEXT** e selecione **EDIT SETTINGS**:
    - Defina o hostname (ex: `tirilo`).
    - Configure usuário e senha (ex: `boreto`).
    - Configure seu Wi-fi.
    - **IMPORTANTE:** Habilite o **SSH** na aba "Services".
5.  Grave o cartão e insira no Raspberry Pi 5.

---

## 2. Transferência de Arquivos

Você precisa copiar a pasta `robo_tirilo` para o Raspberry Pi. Recomendamos usar o diretório `~/projeto_robo` para manter compatibilidade com os caminhos do código.

**No seu computador (Windows):**
Use o script que criei ou execute o comando manualmente no PowerShell (substitua `tirilo.local` pelo IP do Raspberry se necessário):

```powershell
scp -r "C:\Users\Boreto\Documents\IA\antigravity\SaaS_tirilo_v2\robo_tirilo" boreto@tirilo.local:~/projeto_robo
```

---

## 3. Instalação Modular

Acesse via SSH e navegue até a pasta de instalação no novo diretório:

```bashch
ssh boreto@tirilo.local
cd ~/projeto_robo/install/
```

### Ordem de Execução

Execute um script por vez e verifique se houve erros.

```bash
cd ~/SaaS_tirilo_v2/robo_tirilo/install/

# Passo 1: Atualiza o sistema e instala ferramentas base
chmod +x *.sh
./01_update_system.sh

# Passo 2: Configura áudio e voz
./02_setup_audio.sh

# Passo 3: Habilita I2C e permissões de hardware
./03_setup_hardware.sh

# Passo 4: Instala bibliotecas Python diretamente no sistema
./04_setup_python_libs.sh

# Passo 5: Configura a Câmera e Visão
./05_setup_camera.sh

# Passo 6: Instala Tailscale para acesso remoto
./06_setup_tailscale.sh
```

---

## 3. Estruturação de Pastas

O sistema está organizado da seguinte forma:

- `robo_tirilo/`: Código principal.
- `robo_tirilo/install/`: Scripts de instalação (que você acabou de rodar).
- `robo_tirilo/assets/`: Sons, imagens e modelos.
- `robo_tirilo/assets/choreography/`: Imagens específicas para as rotinas de dança.
- `robo_tirilo/src/`: Módulos de hardware, cérebro e jogos.

---

## 4. Testes Básicos de Hardware

### Áudio
```bash
aplay -l  # Verifica se o EMEET M1A aparece como card 2
# Teste de reprodução:
speaker-test -D plughw:2,0 -t wav -c 2
```

### I2C e Calibração de Servos
1. Verifique se o hardware é detectado:
```bash
i2cdetect -y 1
# Você deve ver o número "40" na tabela.
```

2. Calibre os servos:
Como o sistema é **Lite** (sem interface gráfica), utilize o calibrador via terminal:
```bash
python3 calibrar_terminal.py
```
*Siga as instruções na tela para ajustar os ângulos e salvar as configurações.*

### Câmera
```bash
rpicam-hello # Deve abrir um preview rápido (se houver monitor) ou confirmar conexão
```

---

## 5. Como Iniciar o Robô

Como instalamos tudo globalmente, basta dar o comando:

```bash
cd ~/projeto_robo/
python3 tiriloV324.py
```
