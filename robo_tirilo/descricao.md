# Documentação de Inteligência Artificial - Robô Tirilo

## Histórico de Modelos e Ciclo de Vida (Março 2026)

O Robô Tirilo utiliza a API do Google Gemini para processamento de linguagem natural. Devido à rápida evolução dos modelos, a escolha do "cérebro" do robô segue as diretrizes de descontinuação do Google.

### Modelos Utilizados

1.  **Gemini 2.5 Flash (Atual)**
    *   **Status**: Ativo e Recomendado.
    *   **Motivo**: Escolhido para substituir as versões anteriores (1.5 e 2.0) que foram descontinuadas ou restringidas. Oferece o melhor balanço entre latência (respostas rápidas) e inteligência para um robô interativo.
    *   **Capacidades**: Suporte nativo a multimodalidade, raciocínio avançado e baixa latência.

### Histórico de Depreciação (Contexto de Março 2026)

*   **Gemini 1.5 Flash 001**: Descontinuado em Maio de 2025.
*   **Gemini 1.5 Flash 002**: Aposentado em Setembro de 2025.
*   **Gemini 2.0 Flash**: Substituído por versões superiores (2.5+) para novos usuários após períodos de teste em 2025.

### Configuração de Chaves

A chave de API deve ser configurada no arquivo `.env` dentro da pasta `robo_tirilo` ou no arquivo `.env.local` na raiz do projeto SaaS.
*   **Variável Principal**: `GOOGLE_GEMINI_API_KEY`
*   **Fallbacks**: `GEMINI_API_KEY`, `GOOGLE_API_KEY`.

---
*Nota: Sempre verifique a disponibilidade de novos modelos no Google AI Studio (maio de 2026 e além).*