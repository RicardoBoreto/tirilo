# 🤖 Projeto: Tirilo PlayTrace & Gestão de Frotas V2

Este documento descreve a arquitetura técnica e funcional para o módulo de **Ludoterapia Digital Integrada** e **Gestão de Frotas via Tailscale** do SaaS Tirilo.

---

## 1. Visão Geral da Arquitetura

O sistema opera em um **Loop Fechado de Dados Clínicos**:

1.  **Planejamento (IA):** O Terapeuta solicita um plano -> A IA sugere um **Jogo**.
2.  **Execução (Robô):** O Robô baixa o jogo (se licenciado) e o executa com o paciente.
3.  **Coleta (IoT):** O Robô envia métricas de desempenho (erros, tempo) via **Supabase Realtime**.
4.  **Análise (SaaS):** O sistema processa os dados e atualiza o "Histórico Lúdico" do paciente.
5.  **Feedback (IA):** No próximo plano, a IA lê o histórico e ajusta a dificuldade.

### 1.1 Diagrama de Componentes

```mermaid
graph TD
    User[Terapeuta] -->|Cria Plano/Comando| Web[SaaS Web/IA]
    Web -->|Insere Comando| DB[(Supabase DB)]
    
    subgraph "Clínica & Robô"
        Robo[Robô Tirilo]
        Robo -->|Realtime (Listen)| DB
        Robo -->|Insert Dados| DB
        Robo -->|Conecta VPN| Tailscale[Rede Tailscale]
        Robo -->|Baixa Jogo| Storage[Supabase Storage]
    end
    
    Tailscale -->|SSH Seguro| Web
    User -->|Analisa Relatório| Web
```

---

## 2. Modelo de Dados (Novas Estruturas)

Baseado na Migration `20251210000008` e ajustes:

### 2.1 Inteligência Clínica
*   **`saas_habilidades`**: Catálogo do "Para que serve" (ex: Atenção, Memória).
*   **`saas_jogos_habilidades`**: Vínculo (Jogo X melhora Habilidade Y nível 8).

### 2.2 Monetização e Licenciamento
*   **`saas_jogos`**: Marketplace, contém `preco` e demos.
*   **`saas_clinicas_jogos`**: Controla licenças ativas por clínica.

### 2.3 Registro Terapêutico
*   **`sessao_ludica`**: Resumo estatístico do jogo (Pontos, Erros, Tempo).
*   **`sessao_diario_bordo`**: (NOVO) Log textual da sessão.

```sql
CREATE TABLE sessao_diario_bordo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sessao_ludica_id UUID REFERENCES sessao_ludica(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    texto_transcrito TEXT, -- O que o robô ouviu
    tipo_evento TEXT, -- 'FALA', 'NOTA_AUTO', 'ERRO'
    tags_ia TEXT[] -- Etiquetas geradas posteriormente pela IA
);
```

---

## 3. Gestão de Frotas com Tailscale

A integração com Tailscale permite que o SaaS Tirilo atue como um MDM para suporte avançado. O dia-a-dia usa Supabase, o suporte técnico usa Tailscale.

### Funcionalidades:
1.  **Diagnóstico Remoto:** Acesso SSH (`ssh pi@100.x.y.z`) seguro.
2.  **Atualização em Massa:** Scripts via SSH para `git pull`.

---

## 4. O Robô como "Escriba" (Diário de Bordo)

Aproveitando a infraestrutura de **STT (Speech-to-Text)** já existente no robô (`src/games/base.py`), criaremos um módulo dedicado à documentação passiva.

### 4.1 Novo Modo: `diario.py`
Um script que herda de `GameBase` mas foca em escuta ativa.
1.  **Loop:** Executa `self.hardware.listen()` continuamente.
2.  **Ação:** Ao detectar fala, não responde (não fala nada), apenas envia o texto para `sessao_diario_bordo` via Supabase Client.
3.  **Resultado:** Um chat-log completo da sessão, gerado sem intervenção manual.

---

## 5. Integração com Inteligência Artificial (Prompts)

O sistema de prompts será enriquecido com **Variáveis Dinâmicas**.

### Novas Chaves Disponíveis:

| Chave | Fonte dos Dados | Exemplo de Conteúdo Injetado |
| :--- | :--- | :--- |
| `{{JOGOS_DISPONIVEIS}}` | `saas_clinicas_jogos` | "- Jogo das Cores (Treina: Atenção Visual) [Instalado]" |
| `{{HISTORICO_LUDICO}}` | `sessao_ludica` | "Sessão 12/12: Cores (Médio). Acertos: 80%." |
| `{{DIARIO_SESSAO}}` | `sessao_diario_bordo` | "[14:02] Terapeuta: Lucas, tente usar a mão direita.<br>[14:03] Robô: Atividade Concluída." |

Isso permite que a IA gere relatórios como: *"O registro da sessão indica dificuldade motora fina, corroborada pela intervenção verbal do terapeuta às 14:02."*

---

## 5. Fluxos de Trabalho (User Stories)

### Fluxo A: Compra de Novo Jogo
1.  **Gestor** acessa "Loja de Apps" no Painel Admin.
2.  Visualiza "Jogo da Memória Musical" (R$ 29,90). Assiste ao vídeo demo.
3.  Clica em **"Adquirir Licença"**.
4.  Sistema cria registro em `saas_clinicas_jogos`.
5.  **Imediatamente**, o Robô da clínica recebe notificação "NOVA_LICENCA" e baixa os assets do jogo em background.

### Fluxo B: Sessão Terapêutica
1.  **Terapeuta** abre perfil do paciente e clica "🎲 Iniciar Atividade".
2.  Seleciona "Jogo das Cores" e define Dificuldade "Adaptativa".
3.  Robô convida o paciente pelo nome: *"Olá João, vamos brincar com as cores?"*.
4.  Após o jogo, o Robô diz: *"Mandou bem! Fizemos 850 pontos!"*.
5.  O sistema salva os dados em `sessao_ludica`.
6.  **Terapeuta** pode adicionar observação manual no registro: *"O paciente usou a mão esquerda hoje."*

---

## 6. Próximos Passos para Implementação

Para transformar este projeto em realidade, a sequência sugerida de desenvolvimento é:

1.  [x] **Banco de Dados:** Migration criada (`20251210000008_ludoterapia_e_monetizacao.sql`).
2.  [ ] **Backend (Server Actions):**
    *   Criar `getJogosDisponiveis(clinicaId)`
    *   Criar `registrarSessaoLudica(dados)`
    *   Atualizar `generateAIPlan` para processar novas chaves.
3.  [ ] **Frontend (Loja):** Criar página de Marketplace de Jogos.
4.  [ ] **Frontend (Paciente):** Criar aba "Ludoterapia" com gráficos de evolução.
5.  [ ] **Robô (Python):** Atualizar script principal para consultar licenças antes de baixar jogos.

---
**Status do Projeto:** Design Aprovado. Pronto para Codificação.
