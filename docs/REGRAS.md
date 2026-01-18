# 📋 Regras e Permissões do Sistema Tirilo

## 🎭 Perfis de Usuário

O sistema Tirilo possui **4 perfis de usuário** com diferentes níveis de acesso e permissões:

### 1. 👑 Super Admin (Master)
**Tipo:** `master_admin` (sem registro na tabela `usuarios`)  
**Descrição:** Administrador geral do SaaS, gerencia todas as clínicas.

**Permissões:**
- ✅ Visualizar e gerenciar **todas as clínicas** cadastradas
- ✅ Criar, editar e desativar clínicas
- ✅ Gerenciar **Configurações SaaS** (Dados da Empresa, Logo)
- ✅ Acessar **Help Desk** de todas as clínicas
- ✅ Responder chamados de suporte
- ✅ Fazer **backup completo** do sistema
- ✅ Visualizar estatísticas globais
- ❌ **NÃO** tem acesso aos dados internos das clínicas (pacientes, terapeutas, etc.)

**Acesso:**
- `/admin/clinicas` - Gestão de clínicas
- `/admin/help-desk` - Central de suporte

---

### 2. 🏥 Gestor da Clínica (Admin)
**Tipo:** `admin`  
**Descrição:** Administrador de uma clínica específica.

**Permissões:**
- ✅ Gerenciar **equipe** (terapeutas e recepcionistas)
- ✅ Gerenciar **pacientes** e responsáveis
- ✅ Visualizar e editar **configurações da clínica**
- ✅ Gerenciar **salas** de atendimento
- ✅ Visualizar **agenda geral** da clínica
- ✅ Gerenciar **materiais e recursos**
- ✅ Criar e gerenciar **prompts de IA**
- ✅ Gerar **planos de intervenção com IA**
- ✅ Abrir **chamados de suporte** (Help Desk)
- ✅ Visualizar **relatórios e estatísticas**
- ❌ **NÃO** pode fazer backup (exclusivo do Super Admin)
- ❌ **NÃO** pode acessar outras clínicas
- ❌ **NÃO** pode alterar configurações globais do SaaS

**Acesso:**
- `/admin/recepcao` - Dashboard de recepção
- `/admin/pacientes` - Gestão de pacientes
- `/admin/agenda` - Agenda de atendimentos
- `/admin/terapeutas` - Gestão de terapeutas
- `/admin/equipe` - Gestão de equipe
- `/admin/salas` - Gestão de salas
- `/admin/materiais` - Materiais e recursos
- `/admin/prompts-ia` - Prompts de IA
- `/admin/configuracoes` - Configurações da clínica
- `/admin/help-desk` - Suporte

---

### 3. 🩺 Terapeuta
**Tipo:** `terapeuta`  
**Descrição:** Profissional que realiza atendimentos.

**Permissões:**
- ✅ Visualizar **seus pacientes** atribuídos
- ✅ Editar **anamnese e dados clínicos** dos pacientes
- ✅ Fazer **upload de laudos médicos**
- ✅ Registrar **sessões e evoluções**
- ✅ Gerar **planos de intervenção com IA**
- ✅ Visualizar e gerenciar **sua agenda**
- ✅ Criar e editar **agendamentos**
- ✅ Visualizar **materiais e recursos**
- ✅ Editar **seu próprio perfil**
- ✅ Abrir **chamados de suporte**
- ❌ **NÃO** pode gerenciar equipe
- ❌ **NÃO** pode gerenciar salas
- ❌ **NÃO** pode acessar configurações da clínica
- ❌ **NÃO** pode visualizar dashboard de recepção
- ❌ **NÃO** pode criar/editar prompts de IA
- ❌ **NÃO** pode visualizar pacientes de outros terapeutas

**Acesso:**
- `/admin/pacientes` - Seus pacientes (filtrado)
- `/admin/agenda` - Sua agenda
- `/admin/materiais` - Materiais
- `/admin/terapeutas/[id]/editar` - Seu perfil
- `/admin/help-desk` - Suporte

---

### 4. 📞 Recepcionista
**Tipo:** `recepcao`  
**Descrição:** Responsável pela recepção e agendamentos.

**Permissões:**
- ✅ Visualizar **dashboard de recepção** (status das salas)
- ✅ Visualizar **agenda geral** da clínica
- ✅ Criar e editar **agendamentos**
- ✅ Visualizar **lista de pacientes**
- ✅ Cadastrar **novos pacientes**
- ✅ Editar **dados básicos** de pacientes (nome, contato, etc.)
- ✅ Visualizar **materiais e recursos**
- ✅ Abrir **chamados de suporte**
- ❌ **NÃO** pode editar dados clínicos (anamnese, laudos)
- ❌ **NÃO** pode gerar planos de IA
- ❌ **NÃO** pode gerenciar equipe
- ❌ **NÃO** pode gerenciar salas
- ❌ **NÃO** pode acessar configurações
- ❌ **NÃO** pode acessar prompts de IA
- ❌ **NÃO** pode fazer backup

**Acesso:**
- `/admin/recepcao` - Dashboard de recepção
- `/admin/pacientes` - Pacientes (visualização limitada)
- `/admin/agenda` - Agenda geral
- `/admin/materiais` - Materiais
- `/admin/help-desk` - Suporte

---

## 🔐 Matriz de Permissões

| Funcionalidade | Super Admin | Gestor | Terapeuta | Recepcionista |
|---|:---:|:---:|:---:|:---:|
| **Gestão de Clínicas** | ✅ | ❌ | ❌ | ❌ |
| **Backup Completo** | ✅ | ❌ | ❌ | ❌ |
| **Gestão de Equipe** | ❌ | ✅ | ❌ | ❌ |
| **Gestão de Salas** | ❌ | ✅ | ❌ | ❌ |
| **Configurações da Clínica** | ❌ | ✅ | ❌ | ❌ |
| **Configurações SaaS** | ✅ | ❌ | ❌ | ❌ |
| **Prompts de IA** | ❌ | ✅ | ❌ | ❌ |
| **Gerar Plano IA** | ❌ | ✅ | ✅ | ❌ |
| **Dashboard Recepção** | ❌ | ✅ | ❌ | ✅ |
| **Cadastrar Pacientes** | ❌ | ✅ | ✅ | ✅ |
| **Editar Dados Básicos** | ❌ | ✅ | ✅ | ✅ |
| **Editar Anamnese** | ❌ | ✅ | ✅ | ❌ |
| **Upload de Laudos** | ❌ | ✅ | ✅ | ❌ |
| **Registrar Sessões** | ❌ | ✅ | ✅ | ❌ |
| **Visualizar Agenda** | ❌ | ✅ | ✅** | ✅ |
| **Criar Agendamentos** | ❌ | ✅ | ✅ | ✅ |
| **Materiais** | ❌ | ✅ | ✅ | ✅ |
| **Help Desk** | ✅ | ✅ | ✅ | ✅ |

**Legenda:**
- `**` Apenas sua agenda pessoal

---

## 🚫 Regras de Negócio

### Autenticação e Sessão
1. Todos os usuários devem fazer login com email e senha
2. **Cadastro Público Desativado:** Novos usuários só podem ser cadastrados internamente por administradores.
3. Senha padrão para novos usuários: `Tirilo2025!`
4. Usuários devem trocar a senha no primeiro acesso (flag `precisa_trocar_senha`)
5. Sessão expira após inatividade (configurável)

### Hierarquia de Acesso
1. **Super Admin** → Todas as clínicas
2. **Gestor** → Apenas sua clínica
3. **Terapeuta** → Apenas seus pacientes
4. **Recepcionista** → Visualização geral, edição limitada

### Gestão de Equipe
1. Apenas **Gestores** podem adicionar/editar/inativar membros
2. Membros inativos não podem fazer login
3. Não é permitido **deletar** membros (apenas inativar)
4. Email não pode ser alterado após criação

### Pacientes
1. Pacientes devem ter pelo menos **1 responsável**
2. Responsáveis podem ter múltiplos pacientes
3. Apenas **Terapeutas e Gestores** podem editar dados clínicos
4. Laudos médicos são armazenados em bucket privado
5. Acesso a laudos requer URL assinada (temporária)

### Agendamentos
1. Agendamentos devem ter: paciente, terapeuta, sala, data/hora
2. Não é permitido **conflito de horários** (mesma sala/terapeuta)
3. Status possíveis: `agendado`, `em_andamento`, `concluido`, `cancelado`
4. Apenas o terapeuta responsável pode marcar como concluído

### IA (Assistente Terapêutico)
1. Apenas **Gestores** podem criar/editar prompts
2. **Terapeutas e Gestores** podem gerar planos
3. Planos gerados são salvos no histórico do paciente
4. Modelo padrão: `gemini-2.0-flash-exp`

### Help Desk
1. Todos os perfis podem **abrir chamados**
2. Apenas **Super Admin** pode **responder** chamados
3. Anexos permitidos: imagens, PDFs, documentos Word
4. Status: `aberto`, `em_andamento`, `aguardando_cliente`, `resolvido`, `fechado`

### Row Level Security (RLS)
1. Todas as tabelas principais têm RLS habilitado
2. Usuários só acessam dados da **sua clínica** (exceto Super Admin)
3. Terapeutas só acessam **seus pacientes**
4. Storage buckets são privados com políticas específicas

### 💰 Monetização e Jogos
1. **Jogos Pagos vs Gratuitos:** Jogos podem ter um preço associado.
2. **Licenciamento:** Clínicas só podem acessar jogos que foram explicitamente liberados (comprados/licenciados).
3. **Distribuição:** Admin controla quais clínicas têm acesso a quais jogos via aba "Distribuição".

### 🤖 Gestão de Frota (Robôs)
1. Cadastros de robôs incluem detalhes de **hardware** (modelo, versão, serial) e **financeiros** (valor venda/aluguel).
2. Status Operacional: `disponivel`, `em_uso`, `manutencao`, `indisponivel`.
3. Robôs são vinculados a uma clínica específica ou ficam no "Estoque Global" (sem vínculo).

### 🔧 Manutenção de Frota (O.S.)
1. **Ordens de Serviço (O.S.):** Ciclo completo (Abertura → Análise → Reparo → Testes → Conclusão).
2. **Histórico:** Cada robô possui um prontuário com todas as manutenções realizadas.
3. **Bloqueio Automático:** Robôs podem ser bloqueados automaticamente (`status: manutencao`) ao abrir um chamado.
4. **Custos:** Registro de custo total e flag para faturamento ao cliente (em caso de mau uso).

---

## 📁 Estrutura de Perfis no Banco

```sql
-- Tabela: usuarios
CREATE TABLE usuarios (
    id UUID PRIMARY KEY,
    id_clinica INTEGER REFERENCES saas_clinicas(id),
    email TEXT UNIQUE NOT NULL,
    nome_completo TEXT NOT NULL,
    tipo_perfil TEXT NOT NULL CHECK (tipo_perfil IN ('admin', 'terapeuta', 'recepcao')),
    ativo BOOLEAN DEFAULT TRUE,
    precisa_trocar_senha BOOLEAN DEFAULT TRUE,
    celular_whatsapp TEXT,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Observação:** Super Admin não tem registro na tabela `usuarios`, é identificado pela ausência de `id_clinica`.

---

## 🎯 Próximos Passos

- [x] Implementar edição de membros da equipe ✅
- [x] Adicionar filtro de pacientes por terapeuta ✅
- [ ] Implementar sistema de notificações
- [ ] Criar relatórios por perfil
- [ ] Adicionar logs de auditoria
- [ ] Implementar 2FA (autenticação de dois fatores)

---

**Última atualização:** 16/01/2026
**Versão:** 1.2
