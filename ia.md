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
