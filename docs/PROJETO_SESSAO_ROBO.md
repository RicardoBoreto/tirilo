# 🤖 Projeto: Sessão Clínica com Robô Tirilo

**Status:** Planejado — a implementar em sprint futura
**Prioridade:** Alta (fecha o ciclo clínico SaaS ↔ Robô)

---

## Visão Geral

Integrar o Robô Tirilo ao fluxo clínico do SaaS para que ele:
- Receba o contexto da sessão antes de começar
- Grave cada fala (robô e paciente) no Supabase em tempo real
- Sintetize a sessão ao final com IA
- Alimente automaticamente o relatório de atendimento

O terapeuta não precisa mais tomar notas durante a sessão — o robô registra tudo.

---

## Fluxo Completo

```
Terapeuta abre sessão no SaaS (agendamento)
        ↓
Clica "Iniciar Sessão com Robô" → envia INICIAR_SESSAO ao robô
        ↓
Robô carrega: plano da sessão + histórico do paciente (últimas N sessões)
        ↓
Gemini inicializado com contexto clínico completo
        ↓
Conversa acontece → cada fala gravada em sessao_diario_bordo
        ↓
Terapeuta (ou robô ao ouvir "tchau") encerra sessão
        ↓
Gemini sintetiza → salva em sessao_ludica (status CONCLUIDO)
        ↓
SaaS usa síntese para gerar relatório de atendimento (já existe)
```

---

## Tabelas Já Existentes (nenhuma criação necessária)

| Tabela | Uso |
|---|---|
| `sessao_ludica` | Registro principal: início, fim, métricas, síntese final |
| `sessao_diario_bordo` | Log linha a linha: FALA_ROBO, FALA_PACIENTE, ACAO_JOGO |
| `planos_intervencao_ia` | Plano da sessão criado pelo terapeuta — contexto inicial do Gemini |
| `relatorios_atendimento` | Relatório final — alimentado pela síntese do robô |
| `comandos_robo` | Canal de comunicação SaaS → Robô |

---

## O que Implementar

### Robô — `tirilo.py` + `cloud.py`

**1. Comando `INICIAR_SESSAO`**
```python
# Payload: { paciente_id, sessao_ludica_id, plano_texto }
# - Carrega plano da sessão (planos_intervencao_ia)
# - Carrega resumo das últimas MAX_SESSOES_CONTEXTO sessões do paciente
# - Monta system prompt com contexto clínico
# - Cria objeto chat nativo Gemini (mantém histórico automático)
# - Registra data_inicio em sessao_ludica
```

**2. Durante a sessão — gravar cada troca**
```python
# A cada resposta do Gemini:
# INSERT sessao_diario_bordo (tipo=FALA_PACIENTE, texto_transcrito=texto)
# INSERT sessao_diario_bordo (tipo=FALA_ROBO, texto_transcrito=resposta)
# Assíncrono para não atrasar a conversa
```

**3. Comando `ENCERRAR_SESSAO` (ou "tchau" em sessão ativa)**
```python
# - Pede ao Gemini síntese em 1 parágrafo
# - UPDATE sessao_ludica: status=CONCLUIDO, data_fim, duracao, observacoes=síntese
# - Fecha objeto chat
```

**4. Novo método em `cloud.py`**
```python
def get_contexto_paciente(self, paciente_id, n_sessoes=3):
    """Retorna resumo das últimas n sessões do paciente."""

def gravar_fala(self, sessao_id, tipo, texto, metadados=None):
    """Insere linha em sessao_diario_bordo."""

def encerrar_sessao(self, sessao_id, sintese, duracao_seg):
    """Atualiza sessao_ludica com status CONCLUIDO e síntese."""
```

### SaaS — `RobotDashboard` ou página de Agendamento

**5. Botão "Iniciar Sessão com Robô"** (no agendamento ou na ficha do paciente)
- Envia `INICIAR_SESSAO` via `comandos_robo` com `paciente_id` + `sessao_ludica_id`
- Cria registro em `sessao_ludica` com status `EM_ANDAMENTO`

**6. Card de sessão ativa no dashboard do robô**
- Mostra paciente em atendimento, tempo decorrido, últimas falas

---

## Variáveis de Configuração (tirilo.py)

```python
MAX_TURNS_CHAT        = 20   # trocas mantidas no objeto chat Gemini
MAX_SESSOES_CONTEXTO  = 3    # sessões anteriores do paciente a injetar como contexto
GRAVAR_DIARIO_BORDO   = True # gravar cada fala no Supabase em tempo real
```

---

## Benefício Clínico

- Terapeuta foca 100% na sessão, sem anotações
- Continuidade real: robô "lembra" das últimas visitas do paciente
- Relatório gerado automaticamente com base na síntese do robô
- Histórico completo de interações acessível no SaaS

---

## Estimativa de Escopo

- `cloud.py`: +3 métodos novos (~60 linhas)
- `tirilo.py`: handler de 2 novos comandos + gravação assíncrona (~80 linhas)
- SaaS: botão no agendamento + card de sessão ativa (~100 linhas)
- Nenhuma migração de banco necessária

---

*Criado em: 29/03/2026*
