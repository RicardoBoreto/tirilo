# 📝 Histórico de Versões - Tirilo SaaS

## Formato do Changelog

Cada versão segue o formato:
- **Data:** DD/MM/YYYY
- **Versão:** X.Y.Z (Semantic Versioning)
- **Categorias:** 
  - ✨ Novos Recursos
  - 🔧 Melhorias
  - 🐛 Correções de Bugs
  - 🔒 Segurança
  - 📚 Documentação
  - 🗄️ Banco de Dados

---

## [1.2.2] - 07/12/2024

### ✨ Novos Recursos

#### Assistente IA - Visualização e TTS
- **Descrição:** Nova aba "Planos IA" no perfil do paciente e funcionalidade de leitura em voz alta.
- **Funcionalidades:**
  - **Aba "Planos IA":** Histórico completo de planos gerados para o paciente.
  - **Leitura em Voz Alta (TTS):** Botão "Ouvir Plano" com leitura natural.
  - **Configurações de Voz:** Controle de velocidade (0.5x a 2.0x) e seleção de vozes do sistema.
  - **Formatação:** Exibição do plano com Markdown renderizado visualmente.
- **Arquivos modificados:**
  - `components/AI/PlanosIATab.tsx`
  - `components/PacienteDetailsTabs.tsx`
  - `lib/actions/ai_generation.ts`

### 🔧 Melhorias

#### Assistente IA - Geração e Listagem
- **Correção de Colunas:** Ajustada query de busca para usar `nome_prompt` corretamente.
- **Limpeza de Texto:** Filtro inteligente que remove caracteres Markdown (`#`, `*`) antes da leitura por voz.
- **Scroll Infinito:** Correção no modal de visualização para permitir rolagem de textos longos.

### 🗄️ Banco de Dados

#### Correção de Permissões (RLS)
- **Descrição:** Adicionada política que permite aos usuários visualizarem os planos de intervenção que eles mesmos geraram.
- **Migration:** `supabase/migrations/20251207120000_fix_planos_ia_rls.sql`

---

## [1.2.1] - 07/12/2024

### ✨ Novos Recursos

#### Assistente IA - Categorização de Prompts
- **Descrição:** Prompts agora são divididos em "Plano de Intervenção" e "Relatório de Atendimento"
- **Funcionalidades:**
  - Campo de categoria na criação/edição de prompts
  - Filtro automático nos modais de geração (Plano vs Relatório)
  - Badges visuais na lista de prompts para fácil identificação
- **Arquivos modificados:**
  - `lib/actions/ai_prompts.ts`
  - `components/AI/PromptForm.tsx`
  - `components/AI/GerarPlanoModal.tsx`
  - `components/Relatorios/RelatorioModal.tsx`

### 🔧 Melhorias

#### Agenda - Visual e Usabilidade
- **Descrição:** Refinamentos visuais nas visualizações de Dia e Semana
- **Mudanças:**
  - Correção de alinhamento nas colunas da semana
  - Aumento de contraste (modo zebra e grid)
  - Cartões de agendamento com cores mais nítidas (status)
- **Arquivo:** `components/Agenda/AgendaCalendar.tsx`

### 🔒 Segurança

#### Correção de Vazamento de Chave API
- **Descrição:** Remoção de chave hardcoded em script de teste e reforço no uso de `.env.local`
- **Ação:** Script `manual-test-gemini.js` removido e chave regenerada

---

## [1.2.0] - 04/12/2024

### ✨ Novos Recursos

#### Usuários - Campo Apelido
- **Descrição:** Adicionado campo `apelido` na tabela `usuarios` para nome curto/amigável
- **Funcionalidades:**
  - Permite cadastrar um nome curto para exibição no sistema
  - Útil para referências rápidas (ex: "Dr. João", "Mari", "Dra. Ana")
  - Campo opcional, pode ser deixado em branco
- **Arquivos modificados:**
  - `supabase/migrations/20241204000002_add_apelido_to_usuarios.sql` - Migration
  - `TABELAS.sql` - Schema consolidado atualizado
- **Uso sugerido:** Agenda, chat, notificações, badges de identificação

#### Relatórios - Geração de PDF
- **Descrição:** Implementada funcionalidade de exportação de relatórios em PDF
- **Funcionalidades:**
  - Botão "Baixar PDF" no modal de visualização de relatórios
  - PDF formatado profissionalmente com cabeçalho e metadados
  - Quebra automática de páginas para relatórios longos
  - Nome do arquivo: `relatorio_YYYY-MM-DD_HHmm.pdf`
- **Biblioteca:** jsPDF
- **Arquivos modificados:**
  - `components/RelatoriosTab.tsx` - Função `handleGeneratePDF`
- **Formato do PDF:**
  - Título: "Relatório de Atendimento"
  - Metadados: Data da sessão, Nome do terapeuta
  - Conteúdo completo do relatório formatado

#### Help Desk - Sistema de Anexos
- **Descrição:** Implementado sistema completo de anexos no Help Desk
- **Funcionalidades:**
  - Upload de arquivos (imagens, PDFs, documentos Word)
  - Preview inline de imagens diretamente no chat
  - Download seguro com URLs assinadas temporárias (1 hora)
  - Bucket privado `help-desk-anexos` no Supabase Storage
- **Arquivos modificados:**
  - `lib/actions/help-desk.ts` - Adicionadas funções `sendMessage` (com FormData) e `getAnexoSignedUrl`
  - `components/HelpDesk/TicketChat.tsx` - Componente `AnexoPreview` para exibição de anexos
  - `supabase/migrations/20241204000001_add_help_desk_attachments.sql` - Colunas `anexo_url`, `anexo_nome`, `anexo_tipo`
- **Tipos de arquivo aceitos:** `image/*`, `.pdf`, `.doc`, `.docx`

#### Gestão de Equipe - Edição de Membros
- **Descrição:** Implementada funcionalidade completa de edição de dados de membros da equipe
- **Funcionalidades:**
  - Modal de edição com dados pré-preenchidos
  - Edição de: Nome, Telefone, Registro Profissional (terapeutas), Especialidade (terapeutas)
  - Validação de dados antes de salvar
  - Atualização em tempo real após salvar
- **Arquivos modificados:**
  - `lib/actions/equipe.ts` - Função `updateMembroEquipe`
  - `components/EquipeManager.tsx` - Modal de edição e handlers
- **Limitações:** Email não pode ser alterado (usado para autenticação)

### 🔧 Melhorias

#### Help Desk - Exibição de Solicitante
- **Descrição:** Nome completo do solicitante agora aparece em todos os lugares
- **Mudanças:**
  - Lista de tickets: Exibe `👤 Nome Completo` antes das outras informações
  - Detalhes do chamado: Nome em destaque + email abaixo
  - Correção do campo `nome` → `nome_completo` em todas as queries
- **Arquivos modificados:**
  - `lib/actions/help-desk.ts` - Queries atualizadas
  - `app/admin/help-desk/page.tsx` - Exibição na lista
  - `components/HelpDesk/TicketChat.tsx` - Exibição nos detalhes

#### Gestão de Equipe - Filtros e Status
- **Descrição:** Sistema de filtros e gerenciamento de status de membros
- **Funcionalidades:**
  - Filtro "Ativos" / "Todos" com tabs
  - Ativar/Inativar membros (soft delete)
  - Indicadores visuais para membros inativos
  - Badge "Inativo" em vermelho
  - Opacidade reduzida em cards de inativos
- **Arquivos modificados:**
  - `components/EquipeManager.tsx` - Implementação de filtros
  - `lib/actions/equipe.ts` - Função `toggleStatusMembro`

### 🐛 Correções de Bugs

#### Fix: Nested Button Error
- **Problema:** Erro de hydration "button cannot be a descendant of button"
- **Solução:** Substituído componente `Button` por elemento `<button>` nativo no `DropdownMenuTrigger`
- **Arquivo:** `components/EquipeManager.tsx`
- **Linha:** 249

#### Fix: EquipeManager Corrupted File
- **Problema:** Arquivo `EquipeManager.tsx` estava corrompido (faltando imports e declarações)
- **Solução:** Reescrita completa do componente com todas as funcionalidades
- **Arquivo:** `components/EquipeManager.tsx`

### 🔒 Segurança

#### Proteção da Página de Clínicas
- **Descrição:** Adicionada verificação de permissão para acesso à página de gestão de clínicas
- **Implementação:**
  - Verifica se usuário está autenticado
  - Verifica se usuário tem `id_clinica` (se sim, NÃO é Super Admin)
  - Redireciona Gestores/Terapeutas/Recepcionistas para `/admin/recepcao`
  - Apenas Super Admin (sem `id_clinica`) pode acessar
- **Arquivo:** `app/admin/clinicas/page.tsx`
- **Impacto:** Gestor da Clínica não pode mais acessar backup

#### Remoção de Acesso - Recepcionista
- **Descrição:** Recepcionistas não têm mais acesso a:
  - Configurações da Clínica
  - Assistente IA (Prompts)
- **Arquivo:** `components/Sidebar.tsx`
- **Linhas:** 93-94

### 📚 Documentação

#### REGRAS.md - Documentação de Permissões
- **Descrição:** Criado documento completo com regras e permissões do sistema
- **Conteúdo:**
  - 4 perfis de usuário detalhados (Super Admin, Gestor, Terapeuta, Recepcionista)
  - Matriz de permissões comparativa
  - Regras de negócio por módulo
  - Estrutura do banco de dados
  - Próximos passos
- **Arquivo:** `REGRAS.md`

### 📚 Documentação

#### Guia de Instalação e Deploy
- **Descrição:** Criado guia completo de instalação, configuração e deploy
- **Arquivo:** `INSTALACAO.md`
- **Conteúdo:**
  - Pré-requisitos do sistema
  - Instalação local passo a passo
  - Configuração do Supabase
  - Lista completa de dependências
  - Deploy na Vercel
  - Troubleshooting
- **Template de variáveis:** `env.template`
- **Benefício:** Facilita onboarding de novos desenvolvedores e deploy em novos servidores

### 🗄️ Banco de Dados

#### Migration: Anexos no Help Desk
- **Arquivo:** `supabase/migrations/20241204000001_add_help_desk_attachments.sql`
- **Mudanças:**
  - Adicionadas colunas: `anexo_url`, `anexo_nome`, `anexo_tipo` na tabela `help_desk_mensagens`
  - Criado bucket `help-desk-anexos` (privado)
  - Políticas RLS para upload, visualização e exclusão de anexos

#### Migration: Campo Ativo em Usuários
- **Arquivo:** `supabase/migrations/20241202000016_add_ativo_to_usuarios.sql`
- **Mudanças:**
  - Adicionada coluna `ativo BOOLEAN DEFAULT TRUE` na tabela `usuarios`
  - Permite soft delete de membros da equipe

---

## [1.1.0] - 02/12/2024

### ✨ Novos Recursos

#### Perfil de Recepcionista
- **Descrição:** Implementado perfil completo de Recepcionista
- **Funcionalidades:**
  - Dashboard de recepção com status das salas
  - Visualização da agenda geral
  - Cadastro e edição básica de pacientes
  - Acesso limitado (sem dados clínicos)
- **Arquivos criados:**
  - `app/admin/recepcao/page.tsx`
  - `components/Recepcao/StatusSalas.tsx`
  - `components/Recepcao/AgendaGeral.tsx`

#### Gestão de Salas
- **Descrição:** Sistema completo de gerenciamento de salas de atendimento
- **Funcionalidades:**
  - Cadastro de salas
  - Status em tempo real (Livre, Ocupada, Manutenção)
  - Integração com agendamentos
- **Migration:** `supabase/migrations/20241202000014_add_recepcao_and_salas.sql`

### 🔧 Melhorias

#### Agenda - Múltiplas Visualizações
- **Descrição:** Refatoração do componente de agenda para suportar diferentes visualizações
- **Funcionalidades:**
  - Visualização: Dia, Semana, Mês
  - Navegação entre períodos
  - Cores alternadas para melhor legibilidade (zebra striping)
  - Destaque do dia atual
- **Arquivo:** `components/Agenda/AgendaCalendar.tsx`

#### Header - Informações do Usuário
- **Descrição:** Header agora exibe informações dinâmicas do usuário
- **Mudanças:**
  - Exibe nome completo do usuário
  - Exibe perfil correto (Recepção, Terapeuta, Gestor, Super Admin)
  - Busca dados da tabela `usuarios`
- **Arquivo:** `components/Header.tsx`

### 🐛 Correções de Bugs

#### Fix: Restrição de Plano IA para Recepcionista
- **Problema:** Recepcionistas podiam gerar planos de IA
- **Solução:** Botão "Gerar Plano IA" ocultado condicionalmente
- **Arquivo:** `app/admin/pacientes/[id]/page.tsx`

---

## [1.0.0] - 30/11/2024

### ✨ Lançamento Inicial

#### Autenticação e Usuários
- Sistema completo de autenticação com Supabase
- Gestão de usuários multi-perfil
- Middleware para proteção de rotas
- Troca obrigatória de senha no primeiro acesso

#### Gestão de Clínicas (Super Admin)
- CRUD completo de clínicas
- Backup de dados em JSON
- Estatísticas por clínica

#### Gestão de Pacientes
- Cadastro completo de pacientes
- Responsáveis e vínculos familiares
- Anamnese detalhada
- Upload de laudos médicos
- Portal da família

#### Gestão de Terapeutas
- Cadastro de terapeutas
- Currículo profissional
- Licenças e especialidades
- Atribuição de pacientes

#### Agenda e Agendamentos
- Sistema completo de agendamentos
- Visualização por terapeuta
- Status de sessões
- Conflitos de horário

#### Assistente IA
- Integração com Google Gemini
- Geração de planos de intervenção
- Gestão de prompts customizados
- Histórico de planos gerados

#### Help Desk
- Sistema de tickets de suporte
- Prioridades e status
- Comunicação bidirecional
- Filtros por status

---

## 📌 Próximas Versões Planejadas

### [1.3.0] - Planejado
- [ ] Sistema de notificações em tempo real
- [ ] Relatórios e dashboards avançados
- [ ] Exportação de dados em PDF
- [ ] Logs de auditoria
- [ ] Filtro de pacientes por terapeuta

### [1.4.0] - Planejado
- [ ] Autenticação de dois fatores (2FA)
- [ ] Integração com calendários externos (Google Calendar)
- [ ] Sistema de mensagens internas
- [ ] Lembretes automáticos de sessões

---

**Convenções de Versionamento:**
- **X.0.0** - Mudanças maiores, breaking changes
- **0.X.0** - Novos recursos, melhorias significativas
- **0.0.X** - Correções de bugs, pequenas melhorias

**Última atualização:** 04/12/2024
