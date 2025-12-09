# Histórico de Versões - Robô Tirilo

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
