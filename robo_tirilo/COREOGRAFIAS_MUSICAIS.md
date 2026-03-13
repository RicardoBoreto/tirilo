# Documentação de Coreografias Musicais (Tirilo Animado)

Este documento detalha o funcionamento avançado do novo sistema de coreografias matemáticas (BPM) integradas com interface visual (Display Pygame), introduzido para expandir as capacidades de animação do Robô Tirilo.

## 🌟 Inovações Principais

### 1. Motor de Sincronia Matemática (Calculadora de BPM)
A coreografia não é mais feita de forma estática com `time.sleep()` empíricos baseados em palpites. O sistema agora engloba uma engine musical realétrica baseada em **BPM (Batidas por Minuto)** e **Compassos (4/4)**.

Para a música tema ("Old MacDonald" / "Seu Lobato"), utilizamos o tempo cravado de **92 BPM**:
- 1 Tempo (Beat) = ~0.652 segundos.
- 1 Compasso Musical (4 Tempos) = ~2.608 segundos.

Isso garante que toda animação (Galope, Varrida, Vesgo) caia perfeitamente na "cabeça" do tempo da música.

### 2. Multi-Threading Absoluto (Coreografia Fantasma)
As coreografias agora rodam em **Background Threads (`daemon=True`)**, totalmente isoladas do framerate da Tela Principal (UI).
Isso trouxe duas grandes vantagens:
- As animações dos servo-motores correm de forma perfeita, sem qualquer interrupção, delay ou engasgo de processamento da interface.
- A tela principal pode rodar a 30 FPS constantes, lendo toques na tela e renderizando imagens pesadas sem afetar a música.

### 3. Tela de Apresentação Dinâmica (UI Slideshow)
Foi incluído um exibidor visual `Pygame` que roda simultaneamente à dança do robô.
- O programa busca imagens pré-definidas (`fazenda.png`, `cavalo.png`, `porco.png`) no diretório local.
- Entra em modo **FullScreen** automático nas telas de 800x480 (do Raspberry Pi), ou roda em janela no Windows.
- Oculte o cursor do mouse e faz uma transição de imagens em formato "Slideshow" a cada 4 segundos de forma assíncrona.
- Proteção Touch: A apresentação pode ser abortada imediatamente com qualquer toque na tela LCD, executando saída limpa (`sys.exit`).
- Auto-Finalização: O script "ouve" a atividade de áudio. Assim que a música acaba, a engine fecha todas as imagens automaticamente, abre os olhos do robô, e libera o Raspberry Pi para outros processos.

### 4. Controle Labial Sincronizado (Canto Animado)
Além dos olhos, o servo motor da **Boca** (porta `8`) agora conta com rotinas especializadas de simulação de fala (`animar_boca_canto()`).
- Ele possui uma Thread isolada que lê o sinal binário de que a música ainda está tocando.
- Para gerar um aspecto natural de articulação vocal, a boca seleciona aleatoriamente aberturas consideráveis **(40% a 90%)** em pulsos rápidos por batida (beat/2).
- **Mapeamento de Pausas (Restos Matemáticos)**: A inteligência musical conta o "Compasso Global" atual do áudio em tempo real. O algoritmo sabe que o robô não canta nos ritmos de espera ou refrões estendidos, silenciando a boca seccionadamente a cada dezena musical sempre que o compasso terminar no intervalo **1** ou **2** (Compassos: 1 e 2, 11 e 12, 21 e 22... 51 e 52). No compasso 53 final a boca é paralisada totalmente.

### 5. Ciclos de Loop Dinâmicos e o *Gran Finale*
A animação é escrita em um formato de "Loop base" que se auto-repete (neste caso, blocos rítmicos consistentes de **9 compassos musicais inteiros (~23.5s)**).

Foi implementado um sistema de intercepção (Watcher de Compassos Globais). Como o áudio finaliza aos **53 compassos globais**, o script "quebra" a malha do loop principal dinamicamente durante o **Compasso 52** (exatamente no meio do ciclo 6) e sobrepõe uma animação emergencial chamada **Gran Finale**:
- 4 Piscadas simultâneas ultra-pesadas marcando exatamente os 4 tempos finais da música.
- Travamento mecânico com Olhos totalmentes abertos.
- Interrupção sistêmica suave.

### 6. Versões Bilíngues Equivalentes
O algoritmo foi generalizado para rodar múltiplos cenários que compartilhem a mesma métrica sem sujar os repositórios originais:
- `coreografia_macdonald.py` → Dispara a variação em inglês (Lê `macdonald.mp3`).
- `coreografia_seulobato.py` → Dispara a variação adaptada nativa (Lê `seulobato.mp3`).
