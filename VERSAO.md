# 📝 Histórico de Versões - Tirilo SaaS

## Formato do Changelog

Cada versão segue o formato:
- **Data:** DD/MM/YYYY
- **Versão:** X.Y.Z (Semantic Versioning)
- **Categorias:** 
  - ✨ Novos Recursos
  - 🔧 Melhorias
  - 🐛 Correções de Bugs
  - 🐛 Correções de Bugs
## [1.8.0] - 17/01/2026

### 🤖 Gestão Avançada de IA (Prompts e Relatórios)

#### Templates de Clínica e Clonagem
- **Prompts Compartilhados:** Prompts criados por Administradores funcionam automaticamente como "Templates da Clínica", visíveis para todos os terapeutas.
- **Permissões Inteligentes:** Terapeutas podem *ver* e *usar* templates, mas não podem *editar* ou *excluir* os originais.
- **Clonagem com Edição:** Botão "Clonar" inteligente que abre imediatamente o formulário de edição com os dados copiados, permitindo que o terapeuta personalize um template e salve como seu.
- **Templates Institucionais:** Administradores podem salvar prompts explicitamente como "Template da Clínica" (propriedade do Admin) ao clonar prompts de outros terapeutas.
- **Filtro de Admin:** Adicionada opção rápida para filtrar "Meus Prompts (Admin)" na lista de gestão.

#### Relatórios Assistidos 2.0
- **Contexto Histórico Automático:** A IA agora recebe os últimos 3 relatórios e 2 planos de intervenção como contexto, permitindo maior precisão na análise de evolução.
- **Fidelidade Garantida:** Ajustes nos prompts para garantir fidelidade estrita às anotações brutas (sem "alucinações" de instrumentos).
- **Data da Sessão:** A data do relatório gerado agora reflete a data real do *Agendamento*, e não a data atual.
- **Persona Dinâmica:** O prompt se adapta automaticamente ao cargo do terapeuta (ex: Musicoterapeuta) com base no cadastro.

### 🐛 Correções
- **RLS de Prompts:** Ajuste nas políticas de segurança do banco para permitir visibilidade compartilhada de templates na mesma clínica.

## [1.7.5] - 17/01/2026

### 🔧 Atualizações de Infraestrutura
- **Gemini 2.5:** Migração completa dos modelos de IA para a família `gemini-2.5-flash`, devido à descontinuação das versões 1.5. Isso garante maior velocidade e qualidade nas respostas.

## [1.7.4] - 17/01/2026

### 🧠 Importação Inteligente (IA)
- **Anamnese por Foto:** Preenchimento automático da ficha de anamnese a partir de fotos ou PDFs de documentos físicos, usando Visão Computacional AI.
- **Digitalização de Histórico:** Importação de relatórios de atendimento antigos (legado). O sistema lê a data e o conteúdo do papel e cria registros digitais retroativos, integrando o passado do paciente à base de conhecimento da IA.

## [1.7.3] - 16/01/2026

### 🔒 Segurança e Privacidade (IA)
- **Anonimização de Dados (Data Masking):** Implementado sistema de proteção de identidade que substitui nomes reais por codinomes ("HORACE" para pacientes, "SAM" para terapeutas) antes de enviar dados para a IA.
- **Deanonimização Automática:** O sistema reverte os codinomes para os nomes reais ao receber a resposta, garantindo transparência para o usuário.

### 📱 Melhorias de Interface Mobile (Responsividade)
- **Help Desk:** Corrigido layout da lista de chamados e do chat (mensagens cortadas e altura da tela).
- **Agenda:** Melhorada visualização em telas pequenas (botões quebrados em linhas, dias da semana abreviados) e adicionado botão "Cancelar" no formulário.
- **Gerenciar Jogos:** Adicionada rolagem horizontal na tabela para evitar cortes.

## [1.7.2] - 16/01/2026

### ✨ Melhorias de Interface (UI/UX)

#### Configurações SaaS - Premium UI
- **Redesign Completo:** Formulário de configurações da empresa SaaS (`ConfigSaasForm`) reescrito utilizando componentes visuais modernos (Shadcn UI).
- **Cards Organizadores:** Dados agrupados logicamente em "Dados Cadastrais", "Endereço" e "Contato".
- **Identificação Clara:** Campos renomeados para maior clareza (ex: "Inscrição Estadual (IE)").
- **Preview de Logo:** Melhor visualização do logo atual e preview imediato ao selecionar nova imagem.

### 🐛 Correções de Bugs

#### Permissões de Super Admin
- **Acesso SaaS:** Garantido que usuários com perfil `master_admin` ou `super_admin` tenham acesso às configurações SaaS, corrigindo bloqueio indevido quando vinculados a uma clínica para testes.

## [1.7.1] - 14/12/2025

### 🐛 Correções e Melhorias

#### Configurações SaaS
- **Correção de Permissões (RLS):** Ajustada política de segurança da tabela `saas_empresa` para identificar corretamente Super Admins (usuários sem vínculo com clínica) e permitir a edição dos dados.
- **Interface:** O logo e nome da Empresa SaaS agora são exibidos corretamente no menu lateral do Super Admin.
- **Navegação:** Corrigida lógica do menu lateral para manter os links de administração (Master) visíveis mesmo quando os dados da empresa são carregados.

## [1.7.0] - 13/12/2025

### ✨ Novos Recursos

#### Configurações da Empresa (SaaS)
- **Descrição:** Módulo para gerenciamento dos dados da empresa proprietária do software (Tirilo SaaS).
- **Dados Cadastrais:** Razão Social, Nome Fantasia, CNPJ, Inscrição Estadual/Municipal.
- **Endereço e Contato:** Endereço completo estruturado, telefone, email e site.
- **Identidade Visual:** Upload de logo da empresa (bucket `logos`).
- **Acesso:** Exclusivo para Super Administradores.

### 🗄️ Banco de Dados

#### Novas Estruturas
- **Tabela `saas_empresa`:** Armazena dados únicos da empresa proprietária.
- **Bucket `logos`:** Armazenamento público para logos de empresas/clínicas.
- **RLS:** Políticas de segurança configuradas para limitar escrita ao Super Admin.

---

## [1.6.0] - 12/12/2025

### ✨ Novos Recursos

#### Endereço Estruturado
- **Descrição:** Migração do campo de endereço único para múltiplos campos estruturados.
- **Campos:** CEP, Logradouro, Número, Complemento, Bairro, Cidade, Estado.
- **Interface:** Novos campos nos formulários de criação, edição e configurações da clínica.
- **API:** Validação e processamento individual de cada componente do endereço.

#### Dados Corporativos
- **Novos Campos:**
  - `nome_fantasia`: Nome comercial da clínica.
  - `inscricao_estadual`: Registro estadual (opcional).
  - `missao`: Missão e valores da clínica (campo de texto longo).
- **Visibilidade:** Exibição detalhada no perfil da clínica e painel administrativo.

### 🗄️ Banco de Dados

#### Migrações
- **Tabela `saas_clinicas`:**
  - Adição de colunas textuais para endereço (`end_cep`, `end_logradouro`, etc.).
  - Adição de colunas `inscricao_estadual` e `missao`.
  - Coluna `endereco` JSONB mantida como legado/backup.

---

## [1.5.0] - 10/12/2024

### 🤖 Gestão de Frota e Acesso Seguro

#### Monitoramento em Tempo Real
- **Status Online:** Implementado sistema de Heartbeat (60s) e Ping Ativo para monitorar robôs.
- **Painel:** Visualização clara de Status (Online/Offline) e tempo desde o último contato.
- **Telemetria:** Feedback visual instantâneo ao enviar comandos (Ping/Pong).

#### Acesso Seguro (Tailscale/SSH)
- **Integração:** Campos para gerenciar Endereço Tailscale e Usuário SSH diretamente no dashboard.
- **Facilidade:** Botão "Copiar Comando SSH" gera a string de conexão pronta para uso.
- **Manuais:** Criado `MANUAL_GESTAO_ROBOS.md` para auxiliar administradores.

#### Módulo de Segurnaça IoT
- **RLS:** Políticas de segurança robustas permitindo que robôs (acesso anônimo) enviem telemetria mas sem comprometer dados sensíveis.

---

## [1.4.0] - 09/12/2024

### 🤖 Robótica e Monetização 

#### Módulo de Manutenção de Frota (O.S.)
- **Abertura de Chamados:** Sistema completo para abrir Ordens de Serviço (Preventiva, Corretiva, Upgrade).
- **Workflow:** Status `em_analise`, `aguardando_peca`, `em_reparo`, `concluido`.
- **Financeiro:** Registro de custo de peças e mão e obra.
- **Integração:** Bloqueio automático do robô durante manutenção.

#### Monetização de Jogos
- **Preços:** Jogos agora podem ser "Pagos" ou "Gratuitos".
- **Controle de Acesso:** Clínicas só acessam jogos licenciados via tabela `saas_clinicas_jogos`.
- **Distribuição:** Interface para Admin liberar jogos específicos para clínicas.

#### Detalhamento de Hardware
- **Inventário:** Cadastro de Modelo, Versão de Hardware e Número de Série.
- **Financeiro da Frota:** Registro de Valor de Venda e Aluguel de cada unidade.
- **Fotos:** URL de foto do robô integrada ao dashboard.

---

## [1.3.0] - 07/12/2024

### 💰 Financeiro (Novo Módulo Completo)

#### Fluxo Financeiro End-to-End
- **Descrição:** Ciclo completo implementado: Agendamento -> Conclusão -> Fatura -> Pagamento.
- **Funcionalidades:**
  - **Geração de Cobrança:** Geração em lote via "Faturar" ou mensalidade fixa automática.
  - **Contratos:** Gestão completa de contratos (Sessão ou Mensal), upload de PDF e controle de vigência.
  - **Contas a Receber:** Visão clara dos lançamentos, com modal detalhado da fatura.
  - **Baixa:** Registro de paagamento (Baixa/Quitação) com data e forma de pagamento.
  - **Roteamento:** Agendamentos "concluídos" fluem automaticamente para a lista de faturamento pendente.

#### Geração de Documentos
- **Faturas:** Visualização detalhada (Sessões, Datas, Valores) pronta para impressão.
- **Guia de Assinatura (Convênio):** Geração de guia personalizada com logo e dados da clínica (capturados dinamicamente).
- **Upload de Contratos:** Armazenamento seguro de contratos assinados (PDF) em bucket privado.

#### Dashboard Financeiro
- **Visão Geral:** Cards de Receita, Despesa e Saldo (Previsto vs Realizado).
- **Filtros Temporais:** Navegação completa por Mês e Ano para projeção de fluxo de caixa futuro.

#### Filtros e Usabilidade
- **Filtro por Terapeuta:** Adicionado filtro de profissional tanto em "Contas a Receber" quanto na geração de "Faturas".
- **Integração:** Agenda visualmente reflete status de conclusão para facilitar o faturamento.

---

## [1.2.4] - 07/12/2024

### 🗄️ Banco de Dados

#### Limpeza e Consistência
- **Descrição:** Remoção de 20 tabelas legadas/sem uso e correção de nomes de tabelas na documentação.
- **Tabelas Removidas:** `saas_audit_logs`, `financeiro_cobrancas`, `avaliacao_protocolos`, entre outras.
- **Correção de Nomes:** Ajuste na documentação (`TABELAS.sql`) e no backup para refletir nomes reais:
  - `relatorios` → `relatorios_atendimento`
  - `anamnese` → `pacientes_anamnese`
  - `planos_ia` → `planos_intervencao_ia`

### 🔧 Melhorias

#### Backup Completo
- **Ajuste:** Script de backup atualizado para incluir todas as tabelas corretas do sistema, incluindo `pacientes_anamnese` e `terapeutas_curriculo`.

---

## [1.2.3] - 07/12/2024

### 🎨 Interface e Experiência (UI/UX)

#### Padronização de Botões IA
- **Descrição:** Padronização visual completa dos botões de ação da IA.
- **Mudanças:**
  - **Formato:** Ambos botões agora são grandes (`h-14`), arredondados (`rounded-2xl`) e com texto destacado.
  - **Nomenclatura:** Sufixo `(IA)` padronizado em ambos: "Gerar Plano (IA)" e "Registrar Atendimento (IA)".
  - **Cores Distintas:**
    - 🟣 **Roxo/Azul:** Ações de Criação ("Gerar Plano").
    - 🟢 **Verde/Teal:** Ações de Registro/Relatório ("Registrar Atendimento").
- **Arquivos modificados:**
  - `components/Agenda/DetalhesAgendamento.tsx`
  - `components/AI/GerarPlanoModal.tsx`
  - `components/Relatorios/RelatorioModal.tsx`

#### Fix: Grade da Agenda
- **Problema:** Linhas da grade sumiam em certas resoluções/zoom.
- **Solução:** Substituição de `border` por `gap` (espaçamento) no grid CSS.
- **Melhoria:** Aumento da espessura da linha para 2px (`gap-0.5`) para melhor visibilidade.
- **Arquivo:** `components/Agenda/AgendaCalendar.tsx`

### 🔧 Melhorias Técnicas

#### Centralização de Navegação
- **Descrição:** Lógica do menu lateral unificada em um único arquivo de configuração.
- **Benefício:** Garante que o menu Desktop e Mobile mostrem exatamente as mesmas opções para todos os perfis.
- **Arquivos:**
  - `lib/nav-config.tsx` (Novo)
  - `components/Sidebar.tsx` (Refatorado)

### 🐛 Correções de Bugs

#### Fix: Menu Mobile "Meu Perfil"
- **Problema:** Opção "Meu Perfil" não aparecia no menu mobile para terapeutas.
- **Solução:** Envio correto das props de usuário para o componente Sidebar no Header.
- **Arquivo:** `components/Header.tsx`

#### Fix: Acessibilidade (A11y)
- **Problema:** Erro de console `DialogContent requires DialogTitle`.
- **Solução:** Adicionado título invisível (`SheetTitle`) no menu mobile para leitores de tela.
- **Arquivo:** `components/Header.tsx`

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


### 🤖 Robôs Tirilo

#### Gestão de Frota e Vínculo com Clínicas
- **Melhoria no Cadastro:** Agora é possível selecionar a **clínica** a qual o robô pertence diretamente no momento do cadastro.
  - Super Admins veem uma lista de todas as clínicas.
  - Administradores de Clínica têm o campo preenchido automaticamente com sua própria clínica.
- **Edição de Robôs:** Adicionada funcionalidade de **edição** nos detalhes do robô.
  - Permite alterar: Nome de Identificação, Endereço MAC e Clínica vinculada.
  - Visualização "Somente Leitura" melhorada com nome da clínica e botão "Editar Dados" em destaque.

#### Correção de Configuração (Brain)
- **Variável de Ambiente:** Atualizada a chave de API no módulo `brain.py` para usar `GOOGLE_GEMINI_API_KEY`, padronizando com o resto do sistema.

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

**Última atualização:** 08/12/2024
