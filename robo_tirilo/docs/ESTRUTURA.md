# Estrutura de Arquivos — Robô Tirilo

## Visão Geral

```
robo_tirilo/
│
├── tirilo.py               ← Programa principal do robô
├── olhos_tirilo.py         ← Módulo de controle dos servos (olhos, boca, pálpebras)
├── config_olhos.json       ← Calibração dos servos (portas e ângulos min/max)
├── requirements.txt        ← Dependências Python
├── haarcascades/           ← Modelo de detecção facial (OpenCV Haar Cascade)
│
├── jogos/                  ← Jogos com interface gráfica própria (subprocess KMS/DRM)
│   ├── parear_cores/
│   │   ├── parearcor.py    ← Jogo arrastar e soltar por cor
│   │   ├── imagens/        ← Imagens do jogo
│   │   └── musica/         ← Músicas do jogo
│   ├── coreografia_macdonald/
│   │   ├── coreografia_macdonald.py
│   │   ├── imagens/        ← fazenda.png, cavalo.png, porco.png
│   │   └── musica/         ← macdonald.mp3  ← colocar no Pi
│   └── coreografia_seulobato/
│       ├── coreografia_seulobato.py
│       ├── imagens/
│       └── musica/         ← seulobato.mp3  ← colocar no Pi
│
├── ferramentas/            ← Programas de uso do terapeuta (não são jogos)
│   ├── calibrador_olhos.py ← Interface gráfica para calibrar ângulos dos servos
│   ├── calibrar_terminal.py← Calibração via terminal (sem display)
│   └── rastreador_tela.py  ← Exibe câmera na tela com rastreamento facial (tem botão SAIR)
│
├── src/                    ← Módulos internos usados pelo tirilo.py
│   ├── cloud.py            ← CloudManager: Supabase, comandos, diretriz IA, jogos
│   └── brain.py            ← BrainManager: wrapper Gemini (legado)
│
├── docs/                   ← Documentação
│   ├── ESTRUTURA.md        ← Este arquivo
│   ├── robo_versao.md      ← Histórico de versões
│   ├── descricao.md        ← Descrição geral do projeto
│   ├── DEV_JOGOS.md        ← Guia para desenvolvimento de novos jogos
│   ├── GUIA_PCA9685.md     ← Guia do controlador de servos
│   ├── COREOGRAFIAS_MUSICAIS.md
│   └── RASTREAMENTO_VISAO.md
│
├── install/                ← Scripts de instalação e deploy
│   ├── 01_update_system.sh
│   ├── 02_setup_audio.sh
│   ├── 03_setup_hardware.sh
│   ├── 04_setup_python_libs.sh
│   ├── 05_setup_camera.sh
│   ├── 06_setup_tailscale.sh
│   ├── setup_autostart_tirilo.sh ← Instala tirilo.service no systemd
│   ├── tirilo.service            ← Definição do serviço systemd
│   ├── enviar_para_pi.ps1        ← Cópia completa Windows → Pi (limpa e recopia tudo)
│   └── atualizar_pi.ps1          ← Atualização incremental Windows → Pi (dia a dia)
│
└── outros/                 ← Arquivos antigos, testes e código legado (não usados)
    ├── src_legado/         ← Arquitetura anterior (src/games/, gui.py, hardware.py…)
    ├── tiriloV324*.py      ← Versões antigas do programa principal
    ├── teste_*.py          ← Scripts de teste pontuais
    ├── check_*.py          ← Diagnóstico de câmera e vídeo
    └── …
```

---

## Scripts de Deploy (Windows → Pi)

### `install/enviar_para_pi.ps1` — Cópia Completa
Use quando quiser enviar tudo do zero (ex: primeira instalação ou após reorganização de arquivos).

```powershell
cd "C:\Users\Boreto\Documents\IA\antigravity\SaaS_tirilo_v2\robo_tirilo\install"
.\enviar_para_pi.ps1
```

**O que faz:**
1. Apaga todo o conteúdo de `~/projeto_robo/robo_tirilo` no Pi
2. Copia todos os arquivos do projeto
3. Copia o `.env.local` com as credenciais

---

### `install/atualizar_pi.ps1` — Atualização Incremental
Use no dia a dia após modificar arquivos de código.

```powershell
cd "C:\Users\Boreto\Documents\IA\antigravity\SaaS_tirilo_v2\robo_tirilo\install"
.\atualizar_pi.ps1
```

**O que faz:**
1. Copia apenas os arquivos ativos: `tirilo.py`, `olhos_tirilo.py`, `src/`, `jogos/`, `ferramentas/`
2. Copia o `.env.local` se existir localmente
3. Pergunta se deseja reiniciar o serviço `tirilo` ao final

---

## Gerenciar o Serviço do Robô (no Pi via SSH)

Acesse o Pi:
```bash
ssh boreto@100.123.54.24
```

### Parar o serviço (para rodar manualmente / debugar)
```bash
sudo systemctl stop tirilo
sudo systemctl disable tirilo   # evita reiniciar automaticamente no boot
```

### Iniciar manualmente pelo terminal (com log visível)
```bash
cd ~/projeto_robo/robo_tirilo
python3 tirilo.py
```
> Todos os `print()` aparecem direto no terminal. Use `Ctrl+C` para encerrar.

### Reativar o serviço (após terminar o debug)
```bash
sudo systemctl enable tirilo
sudo systemctl start tirilo
```

### Outros comandos úteis
```bash
# Ver status do serviço
sudo systemctl status tirilo

# Ver log em tempo real (quando rodando como serviço)
journalctl -u tirilo -f

# Reiniciar o serviço (após atualização)
sudo systemctl restart tirilo

# Ver se o serviço está ativo
sudo systemctl is-active tirilo
```

---

## Arquitetura dos Jogos

### Jogos Inline (dentro do `tirilo.py`)
Rodam no mesmo processo, sem display separado. Implementados como funções:

| Função | Descrição |
|--------|-----------|
| `jogar_cores()` | Toca na cor certa (vermelho/azul na tela) |
| `jogar_emocoes()` | Mostra emoção com olhos/boca, criança identifica por voz |
| `jogar_adivinhacao()` | Gemini gera charadas de animais |
| `tocar_musica()` | Toca `assets/musica.mp3` com animação de boca |

### Jogos Subprocess (pasta `jogos/`)
Rodam como processo separado com display KMS/DRM exclusivo.
O `tirilo.py` suspende o display, lança o processo e aguarda terminar.

| Arquivo | `comando_entrada` no Supabase | Descrição |
|---------|-------------------------------|-----------|
| `jogos/parear_cores/parearcor.py` | `parear` | Arrastar bolinha para quadrado da mesma cor |
| `jogos/coreografia_macdonald/coreografia_macdonald.py` | — | Coreografia com música e imagens |
| `jogos/coreografia_seulobato/coreografia_seulobato.py` | — | Coreografia Seu Lobato |

> **Regra:** jogos não têm botão de sair. Só o terapeuta encerra via comando `PARAR` no SaaS.

### Adicionando um Novo Jogo
1. Criar pasta `jogos/nome_do_jogo/` com subpastas `imagens/` e `musica/`
2. Implementar o `.py` seguindo o padrão do `parearcor.py`
3. Adicionar no topo do arquivo:
```python
PASTA_JOGO = os.path.dirname(os.path.abspath(__file__))
PASTA_ROBO = os.path.dirname(os.path.dirname(PASTA_JOGO))
sys.path.insert(0, PASTA_ROBO)
```
4. Cadastrar no `saas_jogos` (Gerenciar Jogos no SaaS) com `comando_entrada = "codigo_do_jogo"`
5. Adicionar mapeamento em `_lancar_jogo()` no `tirilo.py`

---

## Ferramentas do Terapeuta

| Arquivo | Comando SaaS | Descrição |
|---------|-------------|-----------|
| `ferramentas/calibrador_olhos.py` | `CALIBRAR_OLHOS` | Interface para ajustar ângulos dos servos |
| `ferramentas/rastreador_tela.py` | `RASTREADOR_TELA` | Mostra câmera com rastreamento facial (tem botão SAIR) |

---

## Conexão

| | Valor |
|---|---|
| IP Tailscale | `100.123.54.24` |
| Usuário SSH | `boreto` |
| Diretório no Pi | `~/projeto_robo/robo_tirilo` |
| Serviço systemd | `tirilo` |
