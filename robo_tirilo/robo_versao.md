# Histórico de Versões - Robô Tirilo

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
