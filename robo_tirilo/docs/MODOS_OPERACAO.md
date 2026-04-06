# Modos de Operação — Robô Tirilo

## Visão Geral

O robô Tirilo opera em dois modos distintos que definem **quem está à frente do robô** e ajustam o comportamento de interface, comunicação e jogos disponíveis.

> **Modo ≠ Perfil.**
> O **modo** define o contexto de uso (criança ou terapeuta em sessão).
> O **perfil** define a personalidade e o prompt de instrução da IA.
> Ambos são independentes: um perfil "Animado" pode ser usado tanto no modo Criança quanto no modo Terapeuta.

---

## Modos Disponíveis

### 🧒 MODO CRIANÇA (`MODO_ROBO_ATUAL = "CRIANCA"`)

Ativado quando uma sessão terapêutica começa — a criança está à frente do robô.

**O que muda:**
| Aspecto | Comportamento |
|---------|---------------|
| Interface gráfica (GUI) | Exibe tela de jogo / face do robô |
| Logs de sessão | Escreve em `sessao_crianca_YYYYMMDD_HHMM.txt` |
| Barge-in (interrupção por voz) | **Desativado** — criança não pode cortar a fala do robô |
| Injeção de jogos no prompt | Lista de jogos disponíveis enviada ao Gemini para que a IA possa sugerir `[JOGO:codigo]` |
| Comando de voz "Doutor Tirilo" | Ativado — criança chama o robô por este nome |
| Modo Papagaio | Disponível via comando SaaS `MODO_PAPAGAIO` |

**Como ativar:**
- Botão "🧒 Modo Criança" no SaaS (Dashboard → Robôs → aba Controle)
- Envia comando `MODO_CRIANCA` via fila `comandos_robo`

---

### 🩺 MODO TERAPEUTA (`MODO_ROBO_ATUAL = "TERAPEUTA"`)

Ativado entre sessões — o terapeuta está configurando ou testando o robô.

**O que muda:**
| Aspecto | Comportamento |
|---------|---------------|
| Interface gráfica (GUI) | Modo espera / sem jogo ativo |
| Logs de sessão | Escreve em `sessao_terapeuta_YYYYMMDD_HHMM.txt` |
| Barge-in (interrupção por voz) | **Ativado** — terapeuta pode interromper o robô a qualquer momento |
| Injeção de jogos no prompt | Não injeta lista de jogos (terapeuta não precisa que a IA sugira jogos) |
| Comando de voz "Doutor Tirilo" | Desativado |
| Ferramentas de diagnóstico | Disponíveis via SaaS (CALIBRAR_OLHOS, RASTREADOR_TELA) |

**Como ativar:**
- Botão "🩺 Modo Terapeuta" no SaaS (Dashboard → Robôs → aba Controle)
- Envia comando `MODO_TERAPEUTA` via fila `comandos_robo`

---

## Modos Adicionais

### 🦜 MODO PAPAGAIO (`MODO_PAPAGAIO`)

Modo especial de repetição. O robô repete tudo que a criança diz, com animação de boca.
Útil em exercícios de fala e imitação.

**Como ativar:** Botão "🦜 Papagaio" no SaaS, ou via comando `MODO_PAPAGAIO`.
**Como sair:** Comando `PARAR` ou mudança de modo.

---

## Relação com Perfis de Personalidade

Os **perfis** (`saas_perfis_robo`) definem a personalidade da IA (prompt de instrução).
O campo `modo_base` em um perfil indica **para qual modo o perfil foi otimizado** — serve como sugestão e filtro visual, não impede o uso em outros modos.

| Campo | Tabela | Descrição |
|-------|--------|-----------|
| `MODO_ROBO_ATUAL` | Variável em `tirilo.py` | Modo atual do robô em tempo de execução |
| `modo_base` | `saas_perfis_robo` | Modo para o qual o perfil foi criado (`CRIANCA` ou `TERAPEUTA`) |
| `perfil_ativo_id` | `saas_frota_robos` | ID do perfil carregado ao ligar o robô |

**Exemplo de uso:**
- Perfil "Animado com músicas" → `modo_base = CRIANCA`
- Perfil "Protocolo clínico formal" → `modo_base = TERAPEUTA`
- Ao ligar, o robô sempre inicia no modo Terapeuta e carrega o `perfil_ativo_id` da tabela `saas_frota_robos`.

---

## Fluxo Típico de Sessão

```
[Robô liga]
    → Modo TERAPEUTA (padrão)
    → Perfil ativo carregado do Supabase (perfil_ativo_id em saas_frota_robos)
    → Terapeuta prepara o ambiente

[Criança chega]
    → Terapeuta clica "Modo Criança" no SaaS
    → MODO_ROBO_ATUAL muda para CRIANCA
    → GUI exibe tela de sessão
    → Barge-in desativado
    → Log de sessão inicia

[Durante a sessão]
    → IA pode sugerir [JOGO:codigo] baseado nos jogos disponíveis
    → Terapeuta pode lançar jogos manualmente pelo SaaS
    → PARAR encerra qualquer jogo em andamento

[Sessão termina]
    → Terapeuta clica "Modo Terapeuta"
    → Log salvo, barge-in reativado
```

---

## Referência de Comandos

| Comando SaaS | Efeito |
|-------------|--------|
| `MODO_CRIANCA` | Ativa modo criança |
| `MODO_TERAPEUTA` | Ativa modo terapeuta |
| `MODO_PAPAGAIO` | Ativa modo papagaio (repetição) |
| `PARAR` | Encerra jogo/programa em execução |
| `MUDAR_PERFIL:<id>` | Troca o perfil de personalidade ativo |
| `CALIBRAR_OLHOS` | Abre ferramenta de calibração de servos |
| `RASTREADOR_TELA` | Abre rastreamento facial na tela |
