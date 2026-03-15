# Histórico de Versões - Robô Tirilo

## [4.6] - 2026-03-15
### 🗣️ Voz Neural no Modo Terapeuta + Barge-In + Editor de Diretrizes

#### TTS por Modo
- **Modo Criança**: mantém `espeak-ng --stdout | aplay` (pipeline sem arquivo, voz robótica).
- **Modo Terapeuta**: usa **Edge-TTS** (`pt-BR-AntonioNeural`, voz neural Microsoft) com fallback automático para espeak-ng se sem internet.

#### Barge-In (Modo Terapeuta)
- `_monitorar_barge_in()`: thread daemon que abre o microfone via `arecord` enquanto o robô fala.
- Se detectar voz contínua por ~100ms (RMS > 600 por 3 chunks), termina o processo `mpg123` imediatamente.
- `_parar_fala` (threading.Event): flag global que interrompe o loop de streaming em `perguntar_gemini()` — robô para de falar e volta a ouvir.
- Diagnóstico via log: `"Barge-in: monitorando mic..."` e `"Barge-in detectado! RMS=XXX"`.

#### Editor de Diretrizes IA (SaaS)
- Nova seção "Diretrizes de IA" no RobotDashboard: textareas lado a lado para Modo Criança e Modo Terapeuta.
- `getDirectives()` e `saveDirective()` em `lib/actions/robo.ts` gravam em `saas_diretrizes_ai` (Supabase).
- Ao salvar, envia comando `RELOAD_DIRETRIZES` ao robô automaticamente se online.
- Comando `RELOAD_DIRETRIZES` no robô: limpa `_cache_diretriz` → próxima interação recarrega do Supabase; robô confirma em voz.
- `install/02_setup_audio.sh`: adiciona `python3-pyaudio` via `apt`.

## [4.5] - 2026-03-15
### ⚡ Otimizações de Latência

#### VAD — Voice Activity Detection
- **Gravação dinâmica**: `_capturar_com_vad()` usa `pyaudio` + `audioop` para detectar silêncio (~1.3s após o usuário parar de falar) e encerrar a gravação automaticamente, eliminando a espera fixa de 4 segundos.
- **Fallback automático**: se `pyaudio` não estiver disponível, recai em `arecord -d 4` sem interrupção do fluxo.

#### Pipeline TTS sem arquivo
- `falar()` usa `espeak-ng --stdout` piped diretamente ao `aplay` via `subprocess.Popen` + `stdin=PIPE`, eliminando a geração e leitura de arquivo WAV temporário em disco.
- Remoção de `uuid` (import desnecessário após mudança).

#### Gemini Streaming
- `perguntar_gemini()` usa `generate_content_stream()`; cada frase completa (`.`, `!`, `?`) é falada assim que chega, em paralelo com a geração do restante da resposta.
- Som de pensamento ("Ummm...") é falado de forma síncrona enquanto o stream já roda em thread daemon — chegando a primeira frase logo após o "Ummm" terminar.
- Removidos `time.sleep(0.3)` (antes da chamada IA) e `time.sleep(0.5)` (após resposta) — ganho direto de 800ms.

#### Cache de Diretriz IA
- `ler_diretriz_ia()` armazena o resultado em `_cache_diretriz` por 5 minutos, eliminando query Supabase a cada interação do usuário.

#### Resumo de ganho estimado
| Melhoria | Ganho |
|----------|-------|
| VAD (gravação dinâmica) | −2 a −3s |
| Sleeps removidos | −0.8s |
| Pipeline TTS (sem arquivo) | −0.3–0.5s |
| Cache diretriz IA | −0.1–0.3s por interação |
| Streaming (percepção) | −1–4s percebidos |

## [4.4] - 2026-03-14
### 🎮 Jogos como Subprocesso + Piscada Natural + Rastreamento Melhorado

#### Jogos
- **JOGO_PAREAR migrado para subprocess**: `parearcor.py` roda como processo independente com display KMS/DRM exclusivo, mantendo rastreamento facial ativo (jogo não usa câmera).
- **Jogo elaborado restaurado**: 8 cores, progressão de níveis (a cada 6 acertos adiciona cores até 8), fogos de artifício ao completar round, drag & drop com snap nos alvos.
- **Boca sincronizada na fala do jogo**: `espeak-ng` via `Popen` com thread animando `mover_boca()` durante toda a fala.
- **Reações dos olhos**: `olhar_feliz()` ao acertar, `surpresa()` ao completar round, `olhar_triste()` ao errar.
- **Sem botão sair**: jogos não expõem saída para a criança — apenas o terapeuta pode encerrar via comando `PARAR` no SaaS.

#### Comando PARAR
- Todos os subprocessos externos (jogos, calibrador, rastreador, coreografias) agora são encerrados imediatamente pelo comando `PARAR` via `terminate()` na referência global `_processo_externo`.

#### Piscada Natural
- Novo método `piscar_natural()` em `olhos_tirilo.py`: pálpebra superior fecha completamente (pc=100), inferior sobe apenas levemente (pb=20) — movimento em dois tempos (fechar 120ms, abrir 150ms).
- Thread daemon `_piscar_espontaneo` em `tirilo.py`: intervalo aleatório 6–16 segundos, dupla piscada com 15% de chance. Pausa durante programas externos.

#### Rastreamento Facial (VisaoThread)
- `scaleFactor` 1.1 → 1.05 e `minNeighbors` 5 → 4: detecção mais sensível em distâncias variadas.
- Frame rate 20 FPS efetivos: substituído `time.sleep(0.05)` fixo por timing baseado em clock (dorme apenas o restante do frame).
- Câmera liberada corretamente ao pausar: `stop()` + `close()` no Picamera2 (antes só `stop()`, hardware permanecia ocupado).

#### rastreador_tela.py
- Corrigido: `pygame.display.set_mode()` agora usa `pygame.FULLSCREEN` (necessário para KMS/DRM sem X11).
- Botão SAIR na tela (ferramenta do terapeuta, não jogo).

## [4.3] - 2026-03-13
### ⚡ Otimização de Resposta e Precisão Mecânica
- **Latência Zero no Pensamento**: Implementação de via expressa de áudio local. O Tirilo reage instantaneamente ao fim da fala do usuário.
- **Pálpebras Independentes**: Nova mecânica de "semicerrar"; ao olhar para cima, apenas a pálpebra inferior sobe, garantindo que o olho não seja coberto.
- **Voz Robótica Clássica**: Reversão para `espeak-ng` como voz primária, mantendo a identidade tradicional do robô sob pedido do usuário.
- **Calibração de Olhar**: Ajuste fino do curso dos servos (V=10 para olhar o teto) eliminando desalinhamentos.

## [4.2] - 2026-03-13
### 🎭 Refinamento de Personalidade
- **Animações Fluidas**: Implementação de variações horizontais no olhar de pensamento.
- **Inteligência de Visão**: Pausa automática do rastreamento facial durante animações complexas para evitar conflitos de hardware (tremores).

## [4.0] - 2026-03-13
### 🧬 Projeto Humanização e IA Avançada
- **Cérebro Gemini 2.5:** Migração para o modelo mais moderno do Google, com carregamento robusto de chaves (`.env.local`).
- **Voz Neural (Antonio):** Substituição do TTS robótico pelo **Edge-TTS Neural**. Tirilo agora fala com naturalidade e entonação humana.
- **Animação de Pensamento:** Inteligência de espera; o robô olha para cima e faz "Hummm..." enquanto processa a IA, eliminando silêncios estranhos.
- **Interface LCD Profissional:** Remoção de desenhos primitivos redundantes; foco total em sprites de expressão e texto de resposta.
- **Estabilidade Concorrente:** IDs únicos para áudio e proteção de threads garantem que a boca nunca trave aberta, mesmo em falhas de rede.
- **Resiliência de Áudio:** Sistema de fallback automático para `espeak-ng` caso a conexão caia.

## [3.26] - 2025-12-09
### 🚀 Alta Performance e Estabilidade
- **Engine Fluida:** Jogos como "Parear Cores" agora rodam em **thread própria** e **60 FPS**.
- **Voz Otimizada:** Sistema de cache para falas (fim da "voz robocopy" e erros de rede).
- **Sem Travamentos:** A fala do robô não bloqueia mais o toque na tela.
- **Correção de Acentos:** Strings ajustadas para Unicode (`\u00e1`) para garantir pronúncia perfeita.
- **Animação Facial:** Sincronização automática entre voz e movimento labial.

## [3.25] - 2025-12-08
### Adicionado
- Integração preliminar com SaaS Tirilo.
- Estrutura de arquivos modular (`src/`).
- Documentação de versionamento (`robo_versao.md`).

## [3.24] - 2025-11-25
### Mudanças Técnicas
- Implementação dos ambientes: Robô Tirilo (Criança) e Doutor Tirilo (Terapeuta).
- Diretrizes da IA externalizadas (`ia_crianca.txt`, `ia_terapeuta.txt`).
- Correção de saudação restaurada.
