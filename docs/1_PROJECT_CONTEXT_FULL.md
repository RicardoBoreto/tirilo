# 🚀 Funcionalidades do Sistema Tirilo SaaS

Este documento detalha todas as funcionalidades disponíveis no sistema Tirilo, organizadas por módulo. O sistema é uma plataforma completa para gestão de clínicas de terapias multidisciplinares (foco em TEA e Neurodesenvolvimento), com recursos avançados de Inteligência Artificial e Robótica.

---

## 🏢 1. Gestão SaaS e Clínicas (Super Admin)

Módulo destinado à administração central da plataforma (Multi-tenant) e configurações da empresa proprietária do software.

*   **Gestão de Clínicas:**
    *   Cadastro completo de clínicas (Razão Social, CNPJ, Endereço Estruturado).
    *   Upload de Logotipo e configuração de cores (Identidade Visual).
    *   Painel de estatísticas por clínica.
    *   Backup de dados em formato JSON.
*   **Configurações SaaS:**
    *   Cadastro da empresa proprietária (Tirilo) para emissão de faturas do software.
    *   Gestão de dados fiscais e contato central.

---

## 👨‍👩‍👧‍👦 2. Gestão de Pacientes e Família

Prontuário eletrônico completo e interface de comunicação com responsáveis.

*   **Prontuário Digital:**
    *   Dados pessoais completos e foto.
    *   **Vínculo com Operadoras:** Cadastro de Convênio, Número da Carteirinha e Validade.
    *   **Anamnese Digital:** Ficha detalhada de histórico clínico.
        *   *Feature IA:* Importação automática de anamneses físicas via foto/PDF (OCR + IA).
    *   **Documentos e Laudos:** Upload seguro de PDFs e laudos médicos (Bucket Privado).
*   **Gestão de Responsáveis:**
    *   Cadastro de múltiplos responsáveis (Pais, Tutores).
    *   Controle de acesso ao Portal da Família (Reset de senha/login).
*   **Portal da Família:**
    *   Acesso restrito para pais visualizarem a evolução da criança.
    *   Visualização de Agenda e Relatórios (quando liberados pelo terapeuta).

---

## 👩‍⚕️ 3. Gestão Terapêutica e Evolução

Ferramentas para o dia a dia dos terapeutas, focadas em produtividade e qualidade clínica.

*   **Agenda Inteligente:**
    *   Visualizações por Dia, Semana e Mês.
    *   Status de agendamento (Pendente, Confirmado, Concluído, Cancelado, Falta).
    *   Detecção de conflitos de horário e sala.
    *   Filtros por terapeuta e status.
*   **Relatórios de Atendimento (Evolução):**
    *   Registro detalhado de cada sessão.
    *   **Assistente de Escrita (IA):** Gera o texto técnico baseado em tópicos brutos inseridos pelo terapeuta.
    *   **Contexto Histórico:** A IA analisa os últimos 3 relatórios para sugerir continuidade.
    *   **Liberação para Família:** Controle granular de quais relatórios os pais podem ver.
    *   Geração de PDF do relatório.
*   **Planos de Intervenção (PEI):**
    *   Criação de planos terapêuticos estruturados.
    *   **Gerador IA:** Cria planos personalizados baseados na Anamnese e Objetivos do paciente.
    *   **Chat Interativo:** Permite refinamento do plano conversando com a IA ("Ajuste o objetivo para focar mais na fala").

---

## 🧠 4. Inteligência Artificial (Módulo Brain)

Recursos transversais de IA para potencializar a clínica.

*   **Modelos:** Integração com Google Gemini (versão 2.5 Flash).
*   **Prompts e Templates:**
    *   Bibliotecas de prompts compartilhados entre a clínica.
    *   Gestão de templates de relatório e planos.
*   **Text-to-Speech (TTS):** Leitura em voz alta, natural e fluida, dos planos de intervenção para acessibilidade.
*   **Visão Computacional:**
    *   Identificação de brinquedos/recursos por foto.
    *   Digitalização de documentos físicos.
*   **Privacidade:** Anonimização automática de nomes (Data Masking) antes do envio para a API da IA.

---

## 💰 5. Financeiro e Faturamento

Ciclo financeiro completo: do agendamento à quitação.

*   **Contratos e Cobrança:**
    *   Gestão de contratos por sessão ou mensalidade fixa.
    *   Geração de faturas em lote baseadas nos atendimentos "Concluídos".
*   **Convênios e Operadoras:**
    *   Cadastro de Operadoras de Saúde (CNPJ, Tabela).
    *   **Guias TISS/Assinatura:** Geração automática de guia de atendimento para assinatura do paciente, personalizada com logo da clínica e dados da operadora.
*   **Contas a Receber/Pagar:**
    *   Painel de lançamentos financeiros.
    *   **Baixa Interativa:** Modal para quitação com data real, forma de pagamento e upload de **Comprovante (Recibo/Pix)**.
    *   **Estorno:** Funcionalidade de reversão de pagamentos indevidos.
*   **Dashboard:** Visão de fluxo de caixa (Receita vs Despesa).

---

## 🧸 6. Recursos, Estoque e Robótica

Gestão de materiais de apoio e tecnologia assistiva.

*   **Inventário de Recursos:**
    *   Cadastro de brinquedos, jogos e materiais pedagógicos.
    *   Sugestão automática de uso terapêutico (Descrição e Objetivos) via IA ao cadastrar foto do objeto.
    *   Controle de localização (Sala/Armário).
*   **Frota de Robôs (Tirilo):**
    *   Cadastro e vínculo de robôs com clínicas.
    *   **Telemetria:** Monitoramento em tempo real (Online/Offline, Bateria).
    *   **Manutenção:** Gestão de Ordens de Serviço (Preventiva/Corretiva) para a frota.

---

## 👥 7. Equipe e Segurança

Controle de acesso robusto baseado em papéis (RBAC).

*   **Perfis de Acesso:**
    *   **Master/Super Admin:** Acesso total ao SaaS.
    *   **Gestor da Clínica:** Administração financeira e equipe da sua unidade.
    *   **Terapeuta:** Acesso aos seus pacientes, agenda e relatórios.
    *   **Recepção:** Gestão de agenda, check-in e cadastro básico.
*   **Segurança de Dados:**
    *   **RLS (Row Level Security):** Isolamento estrito de dados entre clínicas no banco de dados.
    *   **Audit:** Rastreabilidade de criação e edição de registros.

---

## 🆘 8. Help Desk e Suporte

Canal de comunicação interno.

*   **Sistema de Tickets:** Abertura de chamados para suporte técnico ou manutenção predial.
*   **Chat:** Comunicação direta com admin.
*   **Anexos:** Envio de prints e documentos no chamado.

---

**Gerado em:** 18/01/2026
**Versão do Sistema:** 1.10.1
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
## [1.10.1] - 18/01/2026

### 🐛 Correções (Mobile & Layout)

#### Financeiro (Responsividade)
- **Contas a Receber:** Adicionada rolagem horizontal na tabela de lançamentos para evitar cortes em telas pequenas. Ajuste no cabeçalho (filtros) para empilhar verticalmente em celulares.
- **Faturamento:** Tabela de "Faturamento Pendente" agora possui rolagem horizontal. Botões "Gerar Guia" e "Gerar Fatura" ajustados para ocupar largura total no mobile, melhorando a área de toque.
- **Visualização de Guia:** Modal de pré-visualização da guia de assinatura ajustado para permitir rolagem horizontal do documento A4, evitando distorções ou cortes laterais em dispositivos móveis.

## [1.10.0] - 18/01/2026

### 💰 Financeiro & Convênios (Major Update)

#### Gestão de Operadoras e Convênios
- **Cadastro Completo:** Novo módulo para gerenciamento de convênios/operadoras de saúde.
  - Dados detalhados: Razão Social, CNPJ mascarado, Endereço de Faturamento e Contato Financeiro.
- **Vínculo com Pacientes:** Prontuário do paciente atualizado para incluir dados do plano de saúde (Operadora, Carteirinha, Validade).
- **Guias TISS/Convênio:** Geração automática de guias de atendimento (SADT/Consulta) personalizadas com os dados da operadora e do paciente.

#### Contas a Receber (Financeiro)
- **Baixa Interativa:** Novo modal de quitação de títulos.
  - Seleção da data real do pagamento.
  - Seleção da forma de pagamento (PIX, Dinheiro, Cartão, etc.).
  - **Upload de Comprovante:** Anexo de arquivos (PDF/Imagem) diretamente no lançamento.
- **Estorno:** Funcionalidade de desfazer baixa (retornar para pendente) com um clique, para correção de erros.
- **Banco de Dados:** Atualização na tabela `financeiro_lancamentos` para suportar auditoria de pagamentos (`comprovante_url`, `forma_pagamento`).

### 📱 Interface e Navegação
- **Menu Unificado:** O item "Convênios" foi adicionado à barra lateral principal e mobile.
- **Correção Mobile:** Ajuste no menu lateral (Sidebar) em dispositivos móveis para permitir rolagem quando há muitos itens, evitando cortes em telas menores.

## [1.9.0] - 18/01/2026

### 👨‍👩‍👧‍👦 Portal da Família (Relatórios e UX)
- **Visibilidade de Relatórios:** Agora os terapeutas podem liberar relatórios de atendimento específicos para visualização dos pais.
  - **Terapeutas:** Novo controle "Liberar Família" na visualização do relatório.
  - **Família:** Nova aba "Relatórios" no perfil da criança no Portal da Família.
  - **Banco de Dados:** Nova coluna `visivel_familia` na tabela `relatorios_atendimento`.
- **Experiência do Usuário (UX):**
  - **Identidade Visual:** O cabeçalho do portal agora exibe o **Logo e Nome da Clínica** do paciente.
  - **Mobile:** Menu de navegação ajustado para formato de "Grade" em celulares, garantindo que todas as opções (Agenda, Relatórios, etc.) fiquem visíveis sem rolagem horizontal.
  - **Padronização:** Botão "Sair" atualizado para seguir o padrão visual do sistema (vermelho).

### 🔧 Administração e Acesso
- **Reset de Login (Responsáveis):** Adicionado botão **"Resetar Login"** na gestão de responsáveis.
  - Permite desvincular um usuário de acesso (email) para corrigir problemas de login ou recadastrar senha, habilitando o botão "Habilitar Acesso" novamente.

## [1.8.1] - 18/01/2026

### 🤖 IA para Recursos Terapêuticos
- **Análise Visual:** Novo botão "Identificar com IA" no cadastro de materiais. O sistema analisa a foto do brinquedo/recurso e sugere Nome, Descrição e Objetivos Terapêuticos (ABA/Denver).
- **Enriquecimento de Dados:** Campo "Descrição" adicionado aos recursos, preenchido automaticamente pela IA.
- **Integração com Planos:** A IA agora utiliza os detalhes completos dos materiais (descrição e objetivos) ao gerar planos de intervenção através da chave `{{RECURSOS_LISTA}}`.

### ✨ Melhorias de Interface (UI/UX)
- **Visualização Rápida (Quick View):** Clicar no card de um material abre um modal detalhado com foto ampliada e descrição completa, facilitando a consulta sem entrar em modo de edição.
- **Tooltips:** Descrições longas na listagem agora exibem o texto completo ao passar o mouse.
- **Imagens:** Ajuste na exibição de fotos (`object-contain`) para garantir que o objeto seja visualizado por inteiro sem cortes.

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

#### Planos de Intervenção Interativos
- **Refinamento Conversacional:** Nova interface de chat que permite ao terapeuta "conversar" com a IA para ajustar e refinar o plano gerado em tempo real. O histórico da conversa é salvo automaticamente.
- **Mobile First:** Melhorias na navegação (menu dropdown) e na leitura de voz (TTS Chunking) para garantir funcionamento perfeito em celulares.

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

-- ============================================================================
-- TIRILO SAAS - SCHEMA DE BANCO DE DADOS (V2.0)
-- Atualizado em: 10/12/2025
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. SAAS & CLÍNICAS
-- ----------------------------------------------------------------------------

CREATE TABLE public.saas_empresa (
    id SERIAL PRIMARY KEY,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    
    -- Endereço Estruturado
    end_logradouro TEXT,
    end_numero TEXT,
    end_complemento TEXT,
    end_bairro TEXT,
    end_cidade TEXT,
    end_estado TEXT,
    end_cep TEXT,

    telefone TEXT,
    email_contato TEXT,
    site_url TEXT,
    logo_url TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.saas_clinicas (
    id SERIAL PRIMARY KEY,
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT UNIQUE,
    email_contato TEXT,
    telefone TEXT,
    endereco JSONB, -- { "rua": "...", "numero": "...", ... } (Legado/Alternativo)
    
    -- Endereço Estruturado (Adicionado em 12/12/2025)
    end_logradouro TEXT,
    end_numero TEXT,
    end_complemento TEXT,
    end_bairro TEXT,
    end_cidade TEXT,
    end_estado TEXT,
    end_cep TEXT,

    logo_url TEXT,
    
    -- Dados Adicionais (Adicionado em 12/12/2025)
    inscricao_estadual TEXT,
    missao TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    ativo BOOLEAN DEFAULT TRUE,

    -- Configurações e Customizações
    configuracoes JSONB DEFAULT '{}'::jsonb -- { "cor_primaria": "#...", ... }
);

CREATE TABLE public.clinicas_salas (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    nome TEXT NOT NULL,
    descricao TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

CREATE TABLE public.saas_operadoras (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    nome_fantasia TEXT NOT NULL,
    razao_social TEXT,
    cnpj TEXT,
    registro_ans TEXT,
    
    -- Endereço e Contato (Adicionado 1.10.0)
    endereco_logradouro TEXT,
    endereco_numero TEXT,
    endereco_complemento TEXT,
    endereco_bairro TEXT,
    endereco_cidade TEXT,
    endereco_estado TEXT,
    endereco_cep TEXT,
    
    telefone TEXT,
    contato_nome TEXT,
    contato_cargo TEXT,
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. USUÁRIOS & PERMISSÕES
-- ----------------------------------------------------------------------------

CREATE TYPE tipo_usuario_enum AS ENUM ('superadmin', 'gestor', 'terapeuta', 'recepcionista');

CREATE TABLE public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    nome_completo TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id), -- Null se superadmin
    tipo_usuario tipo_usuario_enum NOT NULL,
    
    -- Dados Terapeuta
    registro_profissional TEXT, -- CRP/CRM
    especialidade TEXT,
    bio TEXT,
    foto_url TEXT,
    celular_whatsapp TEXT,

    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. PACIENTES & FAMÍLIA
-- ----------------------------------------------------------------------------

CREATE TABLE public.pacientes (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) NOT NULL,
    nome TEXT NOT NULL,
    data_nascimento DATE,
    genero TEXT,
    nome_responsavel TEXT, -- Legado/Simples
    contato_responsavel TEXT, -- Legado/Simples
    foto_url TEXT,
    endereco TEXT,
    operadora_id INTEGER REFERENCES public.saas_operadoras(id), -- Adicionado 1.10.0
    carteirinha_planodesaude TEXT,
    validade_planodesaude DATE, -- Adicionado 1.10.0
    status TEXT DEFAULT 'ATIVO', -- ATIVO, INATIVO, ALTA
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pacientes_anamnese (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES public.pacientes(id) ON DELETE CASCADE,
    
    -- Dados Clínicos
    queixa_principal TEXT,
    historico_medico TEXT,
    medicamentos_atuais TEXT,
    alergias TEXT,
    
    -- Desenvolvimento
    gestacao_intercorrencias TEXT,
    parto_tipo TEXT,
    desenvolvimento_motor TEXT,
    desenvolvimento_linguagem TEXT,
    
    -- Musicoterapia (Específico)
    musicoterapia JSONB DEFAULT '{}'::jsonb, -- { "preferencias_musicais": [...], "reacao_sons": "..." }

    laudo_medico_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pacientes_terapeutas (
    paciente_id INTEGER REFERENCES public.pacientes(id) ON DELETE CASCADE,
    terapeuta_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (paciente_id, terapeuta_id)
);

CREATE TABLE public.responsaveis (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), -- Link para login (Portal da Família)
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    telefone TEXT,
    email TEXT
);

CREATE TABLE public.pacientes_responsaveis (
    id SERIAL PRIMARY KEY,
    paciente_id INTEGER REFERENCES public.pacientes(id) ON DELETE CASCADE,
    responsavel_id INTEGER REFERENCES public.responsaveis(id) ON DELETE CASCADE,
    tipo_vinculo TEXT -- Pai, Mãe, Avô, etc.
);

-- ----------------------------------------------------------------------------
-- 4. AGENDAMENTO & FINANCEIRO
-- ----------------------------------------------------------------------------

CREATE TYPE status_agendamento_enum AS ENUM ('AGENDADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO', 'FALTA');

CREATE TABLE public.agendamentos (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    id_paciente INTEGER REFERENCES public.pacientes(id),
    id_terapeuta UUID REFERENCES public.usuarios(id),
    id_sala INTEGER REFERENCES public.clinicas_salas(id), -- Opcional
    
    data_hora_inicio TIMESTAMPTZ NOT NULL,
    data_hora_fim TIMESTAMPTZ NOT NULL,
    
    tipo_sessao TEXT, -- Terapia, Avaliação, Ludoterapia, Histórico
    status status_agendamento_enum DEFAULT 'AGENDADO',
    observacoes TEXT,
    
    valor_sessao NUMERIC(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.financeiro_lancamentos (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    tipo TEXT CHECK (tipo IN ('RECEITA', 'DESPESA')),
    descricao TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    data_vencimento DATE NOT NULL,
    data_pagamento DATE,
    status TEXT DEFAULT 'PENDENTE', -- PENDENTE, PAGO, ATRASADO
    categoria TEXT,
    
    forma_pagamento TEXT, -- Adicionado 1.10.0
    comprovante_url TEXT, -- Adicionado 1.10.0
    
    -- Vínculos
    id_paciente INTEGER REFERENCES public.pacientes(id),
    id_agendamento INTEGER REFERENCES public.agendamentos(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. ROBÔS & LUDOTERAPIA (MÓDULO NOVO)
-- ----------------------------------------------------------------------------

-- Catálogo de Habilidades (Loja)
CREATE TABLE public.saas_habilidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL UNIQUE, -- Ex: "Foco", "Memória", "Interação Social"
    descricao TEXT,
    codigo_ia TEXT -- Prompt base ou tag para IA
);

-- Catálogo de Jogos (Global)
CREATE TABLE public.saas_jogos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT, -- "EDUCATIVO", "MOTOR", "SOCIAL"
    comando_entrada TEXT, -- Comando para iniciar no robô (ex: "start_memoria")
    
    imagem_url TEXT,
    preco NUMERIC(10,2) DEFAULT 0.00, -- 0 = Gratuito
    
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relacionamento Jogo <-> Habilidades (N:N)
CREATE TABLE public.saas_jogos_habilidades (
    jogo_id UUID REFERENCES public.saas_jogos(id) ON DELETE CASCADE,
    habilidade_id UUID REFERENCES public.saas_habilidades(id) ON DELETE CASCADE,
    nivel_impacto INTEGER DEFAULT 1, -- 1 a 5
    PRIMARY KEY (jogo_id, habilidade_id)
);

-- Controle de Versões (OTA)
CREATE TABLE public.saas_jogos_versoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    jogo_id UUID REFERENCES public.saas_jogos(id) ON DELETE CASCADE,
    versao TEXT NOT NULL, -- "1.0.0"
    arquivo_url TEXT NOT NULL, -- URL do .zip ou .py no Storage
    changelog TEXT,
    obrigatorio BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aquisições da Clínica
CREATE TABLE public.saas_clinicas_jogos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) ON DELETE CASCADE,
    jogo_id UUID REFERENCES public.saas_jogos(id) ON DELETE CASCADE,
    
    ativo BOOLEAN DEFAULT TRUE, -- Se a clínica ativou/desativou
    data_aquisicao TIMESTAMPTZ DEFAULT NOW(),
    validade TIMESTAMPTZ, -- Null = perpétuo
    licenca_tipo TEXT DEFAULT 'PERPETUA', -- PERPETUA, MENSAL, TESTE
    
    UNIQUE(clinica_id, jogo_id)
);

-- Frota de Robôs
CREATE TABLE public.saas_frota_robos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) ON DELETE CASCADE,
    nome_robo TEXT NOT NULL, -- Ex: "Tirilo 01"
    modelo TEXT DEFAULT 'Raspberry Pi 4',
    numero_serie TEXT UNIQUE NOT NULL, -- Usado para identificar o robô na API
    
    status TEXT DEFAULT 'OFFLINE', -- ONLINE, OFFLINE, EM_SESSAO, MANUTENCAO
    bateria_nivel INTEGER,
    versao_software TEXT,
    
    -- Rede (Tailscale)
    endereco_tailscale TEXT, -- IP 100.x.y.z
    usuario_ssh TEXT, -- Default: 'pi'

    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ
);

-- Configuração de IA da Clínica (Personalidade)
CREATE TABLE public.saas_clinicas_config_ia (
    id SERIAL PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id) UNIQUE,
    tom_de_voz TEXT DEFAULT 'Empático e Lúdico',
    restricoes TEXT, -- O que NÃO fazer
    model_version TEXT DEFAULT 'gemini-2.5-flash'
);

-- ----------------------------------------------------------------------------
-- 6. SESSÕES LÚDICAS (HISTÓRICO)
-- ----------------------------------------------------------------------------

CREATE TABLE public.sessao_ludica (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clinica_id INTEGER REFERENCES public.saas_clinicas(id),
    paciente_id INTEGER REFERENCES public.pacientes(id),
    terapeuta_id UUID REFERENCES public.usuarios(id),
    robo_id UUID REFERENCES public.saas_frota_robos(id),
    jogo_id UUID REFERENCES public.saas_jogos(id),
    
    data_inicio TIMESTAMPTZ DEFAULT NOW(),
    data_fim TIMESTAMPTZ,
    duracao_segundos INTEGER,
    
    status TEXT DEFAULT 'EM_ANDAMENTO', -- EM_ANDAMENTO, CONCLUIDO, INTERROMPIDO
    
    pontuacao_final INTEGER,
    nivel_dificuldade TEXT, -- FACIL, MEDIO, DIFICIL
    
    -- Métricas estruturadas
    metricas JSONB DEFAULT '{}'::jsonb, -- { "tempolatencia": 2.5, "acertos": 10 }
    
    observacoes_terapeuta TEXT
);

CREATE TABLE public.sessao_diario_bordo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sessao_ludica_id UUID REFERENCES public.sessao_ludica(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    tipo_evento TEXT, -- FALA_ROBO, FALA_PACIENTE, ACAO_JOGO, INTERVENCAO_TERAPEUTA
    texto_transcrito TEXT, -- O que foi falado (STT/TTS)
    metadados JSONB -- Emoção detectada, contexto, etc.
);

-- Telemetria Bruta (Logs técnicos)
CREATE TABLE public.telemetry (
    id SERIAL PRIMARY KEY,
    robo_id UUID REFERENCES public.saas_frota_robos(id),
    cpu_usage NUMERIC,
    ram_usage NUMERIC,
    temp_cpu NUMERIC,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Comandos Remotos (Fila)
CREATE TABLE public.comandos_robo (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    robo_id UUID REFERENCES public.saas_frota_robos(id),
    comando TEXT NOT NULL, -- Ex: "update_software", "restart"
    parametros JSONB,
    status TEXT DEFAULT 'PENDENTE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    executed_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 7. IA GENERATIVA & RELATÓRIOS (V1.7.5)
-- ----------------------------------------------------------------------------

CREATE TABLE public.prompts_ia (
    id SERIAL PRIMARY KEY,
    id_clinica INTEGER REFERENCES public.saas_clinicas(id),
    terapeuta_id UUID REFERENCES public.usuarios(id),
    nome_prompt TEXT NOT NULL,
    descricao TEXT,
    prompt_texto TEXT NOT NULL,
    modelo_gemini TEXT DEFAULT 'gemini-2.5-flash',
    temperatura NUMERIC DEFAULT 0.7,
    ativo BOOLEAN DEFAULT TRUE,
    categoria TEXT, -- 'avaliacao', 'plano', 'relatorio'
    criado_por TEXT, -- Nome do criador
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.planos_intervencao_ia (
    id SERIAL PRIMARY KEY,
    id_paciente INTEGER REFERENCES public.pacientes(id),
    id_terapeuta UUID REFERENCES public.usuarios(id),
    id_prompt_ia INTEGER REFERENCES public.prompts_ia(id), -- Pode ser NULL
    
    titulo TEXT, -- Título do plano (Adicionado V1.7.5)
    plano_final TEXT, -- Texto gerado/importado
    plano_original TEXT, -- Texto raw da IA
    modelo_ia TEXT, -- Versão do modelo usado
    historico_chat JSONB DEFAULT '[]'::jsonb, -- Histórico de conversa para refinamento
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.relatorios_atendimento (
    id SERIAL PRIMARY KEY,
    id_agendamento INTEGER REFERENCES public.agendamentos(id),
    id_paciente INTEGER REFERENCES public.pacientes(id),
    id_terapeuta UUID REFERENCES public.usuarios(id),
    id_clinica INTEGER REFERENCES public.saas_clinicas(id),
    id_prompt_ia INTEGER REFERENCES public.prompts_ia(id),

    texto_bruto TEXT, -- Notas originais do terapeuta
    relatorio_gerado TEXT, -- Texto final melhorado pela IA
    status TEXT DEFAULT 'rascunho', -- 'rascunho', 'finalizado'
    visivel_familia BOOLEAN DEFAULT FALSE, -- Controle de visibilidade para o Portal da Família

    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
# 📚 Documentação do Sistema - SaaS Tirilo
Este arquivo contém uma descrição resumida de cada arquivo de documentação e do schema do banco de dados presentes no projeto.


## Diretrizes
Temos o ambiente de teste, sistema local, e o Github produção, o Github só deve ser atualizado quando eu Ricardo desenvolvedor do sistema autorizar ou pedir para atualizar.

## 🗄️ Banco de Dados

### `TABELAS.sql`
Schema completo do banco de dados do SaaS Tirilo. Contém:
- Definições de todas as tabelas (saas_clinicas, usuarios, pacientes, etc.).
- Políticas de segurança RLS (Row Level Security).
- Definições de buckets do Supabase Storage.
- Índices para otimização de performance.
- Este arquivo deve ser a ultima situação de cada tabela, deve ser atualizado quando qualquer alteração for feita no bando de dados, este arquivo vai servir para criar a base do sistema para implantação do sistema.

### `TABELAS.md`
Documentação detalhada focada nas tabelas de recursos, especificamente `salas_recursos`. Descreve colunas, relacionamentos, políticas de storage para fotos e migrations aplicadas.

## 📖 Documentação Geral

### `README.md`
O ponto de partida da documentação. Apresenta a stack tecnológica, pré-requisitos, instruções básicas de instalação, estrutura de pastas e visão geral das funcionalidades implementadas.

### `BEM-VINDO.md`
Mensagem de boas-vindas e introdução ao projeto entregue. Destaca o status "100% pronto", lista os passos imediatos para começar e resume o que foi entregue.

### `INDICE.md`
Um índice central para toda a documentação. Guia o usuário sobre por onde começar dependendo do seu objetivo (instalar, entender arquitetura, verificar status, etc.) e fornece um mapa mental dos docs.

### `INICIO-RAPIDO.md`
Guia acelerado para colocar o sistema para rodar em menos de 10 minutos. Foca em comandos diretos e testes rápidos das funcionalidades principais (CRUD).

### `INSTALACAO.md`
Guia de instalação detalhado e completo. Cobre instalação local, configuração aprofundada do Supabase, variáveis de ambiente, dependências e deploy na Vercel.

### `ESTRUTURA.md`
Documentação técnica da arquitetura do projeto. Detalha a árvore de arquivos, responsabilidade de cada componente, fluxos de navegação, fluxos de autenticação e fluxo de dados (CRUD).

### `REGRAS.md`
Define as regras de negócio e sistema de permissões. Detalha os 4 perfis de usuário (Super Admin, Gestor, Terapeuta, Recepcionista), matriz de acesso e regras específicas por módulo.

### `VERSAO.md`
Histórico de versões (Changelog) do projeto. Registra data, versão e detalhes de novos recursos, melhorias, correções de bugs e alterações de segurança para cada release.

### `RESUMO.md`
Resumo executivo do projeto. Apresenta o status de conclusão, estatísticas de desenvolvimento (número de arquivos, linhas de código), destaques técnicos e validação de entrega.

### `CHECKLIST.md`
Lista de verificação global do projeto base. Rastreia arquivos criados, funcionalidades de autenticação, CRUD, UI/UX e testes sugeridos para validar o sistema base.

## 🏥 Módulo de Pacientes

### `PACIENTES-COMPLETO.md`
Documentação abrangente da implementação do módulo de Pacientes. Lista todos os arquivos criados (Backend, Frontend, SQL), funcionalidades entregues (Anamnese, Responsáveis, Laudos) e estrutura de dados específica.

### `PACIENTES-README.md`
Instruções específicas de instalação e uso do módulo de Pacientes. Guia para execução de SQL, geração de tipos e testes das funcionalidades do módulo.

### `RESUMO-FINAL-PACIENTES.md`
Resumo focado na conclusão do módulo de Pacientes. Destaca problemas resolvidos (como URLs de laudos), arquivos entregues e confirmação de status "100% funcional".

### `CHECKLIST-PACIENTES.md`
Checklist de instalação e verificação específico para o módulo de Pacientes. Passo a passo para setup do banco, testes de criação, upload de laudos e validação final.

## 🆘 Troubleshooting e Erros Conhecidos

### `ERRO-BUCKET-NAO-ENCONTRADO.md`
Guia de solução para o erro de bucket de storage inexistente ("Bucket not found"). Fornece scripts SQL e instruções manuais para criar o bucket `laudos` corretamente.

### `ERRO-CLINICA-ID.md`
Guia de solução para o erro de coluna `clinica_id` faltante no banco de dados. Oferece opções de migration para adicionar a coluna ou script de reset completo das tabelas de pacientes.


### `ERRO-UPLOAD-LAUDO.md`
Guia completo para diagnósticos de falhas no upload de PDFs (laudos médicos). Cobre verificação de buckets, políticas RLS e debug via console do navegador.

## 🤖 Assistente IA

### `EXEMPLOS_PROMPTS.md`
Catálogo de prompts pré-definidos para copiar e colar. Inclui modelos otimizados para "Plano de Intervenção" e "Relatório de Atendimento", prontos para uso no sistema.

### `ia.md`
Este próprio arquivo, que detalha o funcionamento funcional e arquitetural do módulo de IA.
- **Funcionamento:** Explica como os prompts são gerenciados e como os planos são gerados.
- **Categorização:**
  - **Plano de Intervenção:** Prompts focados em criar estratégias futuras. Aparecem no modal "Gerar Plano (IA)".
  - **Relatório de Atendimento:** Prompts focados em resumir o passado (sessão). Aparecem no modal "Registrar Atendimento (IA)".
- **Visibilidade e Templates (Gestão 2.0):**
  - **Templates da Clínica:** Prompts criados por `admins` são visíveis para todos os terapeutas da clínica (Leitura).
  - **Permissões:** Terapeutas só editam/excluem seus próprios prompts. Templates são protegidos ("Read-Only" para terapeutas).
  - **Clonagem:** Qualquer usuário pode clonar um prompt (pessoal ou template). A clonagem abre imediatamente a tela de edição para personalização.
  - **Role Dinâmica:** O prompt adapta automaticamente a "persona" da IA (Ex: "Atue como Musicoterapeuta") baseando-se no cadastro profissional do usuário.
  - **Contexto Avançado:** A IA recebe automaticamente histórico de relatórios e planos anteriores para maior precisão e continuidade do tratamento.
- **Estrutura de Dados:** Detalha as tabelas `prompts_ia` e `planos_intervencao_ia`.
- **Funcionalidades:** Cobre a geração de planos (modal) e a visualização do histórico (aba Planos IA) com TTS.
  - **Refinamento Conversacional:** Interface de chat integrada que permite "conversar com o documento". O terapeuta envia feedbacks para a IA (ex: "Foque mais em coordenação motora"), e o sistema regenera o plano mantendo o contexto histórico.

### 🎨 Padrões de Interface (UI)
Detalha o padrão visual adotado para as ferramentas de IA:
- **Botões:** Grandes (`h-14`), arredondados (`rounded-2xl`) e com sufixo `(IA)`.
- **Código de Cores:**
  - 🟣 **Roxo (Criação):** Usado para "Gerar Plano (IA)". Representa a "magia" da criação criativa.
  - 🟢 **Verde (Registro):** Usado para "Registrar Atendimento (IA)". Representa a "conclusão" e "sucesso" da tarefa.

## 🔒 Privacidade e Segurança (IA)

Para garantir a proteção dos dados sensíveis de pacientes e profissionais, o sistema implementa um rigoroso processo de **Anonimização e Pseudonimização** antes de qualquer interação com a API externa (Google Gemini).

### Processo de Mascaramento de Dados

O sistema atua como um "middleware de privacidade", interceptando os dados sensíveis antes do envio e restaurando-os após o retorno da IA.

#### 1. Pseudonimização (Envio)
Antes de enviar o prompt para a IA, o sistema substitui automaticamente:
- **Nome do Paciente** → Substituído por **`HORACE`**
- **Nome do Terapeuta** → Substituído por **`SAM`**

Essa substituição ocorre de forma abrangente:
- Em **campos estruturados** (variáveis do sistema).
- Em **campos de texto livre** (Sessões anteriores, Diários, Observações, Diagnósticos). O sistema varre estes textos e mascara qualquer ocorrência dos nomes reais.

**Por que HORACE e SAM?**
Utilizamos nomes fictícios (personas) em vez de tokens genéricos para manter a coerência semântica e naturalidade do texto, permitindo que a IA gere respostas mais fluidas e contextualizadas.

#### 2. Processamento Seguro
A IA processa o pedido ("Gerar plano para Horace...") sem nunca ter acesso aos nomes reais (PII).

#### 3. Deanonimização (Retorno)
Assim que a resposta da IA é recebida pelo servidor:
- O sistema reverte **`HORACE`** para o **Nome Real do Paciente**.
- O sistema reverte **`SAM`** para o **Nome Real do Terapeuta**.

O usuário final vê apenas os nomes corretos, tornando o processo de segurança transparente e invisível na interface.

## 🤖 Modelos e Capacidades (IA)

### Modelos Utilizados
**ATENÇÃO:** O sistema está configurado para usar estritamente a versão `gemini-2.5-flash` (definida em `lib/constants/ai_models.ts`). Não faça downgrade para versões 1.5, pois foram descontinuadas ou substituídas.

O sistema utiliza a família de modelos **Google Gemini** através da API Vertex AI / Google AI Studio.
- **Geração de Texto:** `gemini-2.5-flash` (Alta velocidade e baixo custo para planos e relatórios).
- **Visão Computacional (OCR Inteligente):** `gemini-2.5-flash` (Multimodal). Capaz de analisar imagens de documentos (JPG, PNG) e PDFs para extrair dados estruturados.

### Capacidades de Importação
Além de gerar conteúdo novo, a IA atua como agente de digitalização para legados:
1.  **Anamnese por Foto:** O usuário tira foto da ficha de papel → IA extrai campos médicos e histórico → Preenche o formulário digital.
2.  **Histórico de Atendimentos:** O usuário tira foto de relatórios antigos/manuscritos → IA extrai Data e Texto → Sistema cria registros retroativos na linha do tempo do paciente.

Isso permite migrar acervos físicos inteiros para o sistema digital de forma rápida, enriquecendo o contexto para futuras gerações de planos.

### Recursos e Materiais
A IA também auxilia na gestão do inventário terapêutico da clínica:
- **Catalogação Inteligente:** Ao cadastrar um novo material, o usuário pode enviar uma foto. A IA analisa a imagem (Visão Computacional) e preenche automaticamente:
  - **Nome:** Sugestão do nome do brinquedo/recurso.
  - **Descrição:** Breve explicação funcional (para que serve).
  - **Objetivos Terapêuticos:** Lista de habilidades (ABA/Denver) que podem ser trabalhadas com aquele item (ex: "Coordenação Motora Fina", "Pareamento").
- **Integração com Planos:** Os materiais cadastrados enriquecem a geração de planos. A chave `{{RECURSOS_LISTA}}` agora fornece à IA não apenas nomes, mas descrições e objetivos de cada item disponível, permitindo sugestões de atividades muito mais assertivas e personalizadas.
