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
- **Estrutura de Dados:** Detalha as tabelas `prompts_ia` e `planos_intervencao_ia`.
- **Funcionalidades:** Cobre a geração de planos (modal) e a visualização do histórico (aba Planos IA) com TTS.
