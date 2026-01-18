# 🚀 Guia de Instalação - Tirilo SaaS

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Instalação Local](#instalação-local)
3. [Configuração do Supabase](#configuração-do-supabase)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Deploy na Vercel](#deploy-na-vercel)
6. [Dependências do Projeto](#dependências-do-projeto)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18.x ou superior ([Download](https://nodejs.org/))
- **npm** 9.x ou superior (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))
- Conta no **Supabase** ([Criar conta](https://supabase.com/))
- Conta no **Vercel** (opcional, para deploy) ([Criar conta](https://vercel.com/))
- **Google Gemini API Key** ([Obter chave](https://makersuite.google.com/app/apikey))

---

## 💻 Instalação Local

### 1. Clone o repositório

```bash
git clone <URL_DO_REPOSITORIO>
cd SaaS_tirilo_v2
```

### 2. Instale as dependências

```bash
npm install
```

Este comando instalará todas as dependências listadas no `package.json`, incluindo:

#### **Dependências Principais:**
- `next@15.5.6` - Framework React
- `react@19.0.0` - Biblioteca React
- `react-dom@19.0.0` - React DOM

#### **Supabase:**
- `@supabase/ssr@0.6.1` - Supabase SSR
- `@supabase/supabase-js@2.47.10` - Cliente Supabase

#### **UI e Estilo:**
- `tailwindcss@3.4.17` - Framework CSS
- `lucide-react@0.468.0` - Ícones
- `class-variance-authority@0.7.1` - Variantes de classes
- `clsx@2.1.1` - Utilitário para classes CSS
- `tailwind-merge@2.6.0` - Merge de classes Tailwind

#### **Formulários e Validação:**
- `zod@3.24.1` - Validação de schemas

#### **Datas:**
- `date-fns@4.1.0` - Manipulação de datas

#### **IA:**
- `@google/generative-ai@0.21.0` - Google Gemini AI

#### **PDF:**
- `jspdf@2.5.2` - Geração de PDFs

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Ou crie manualmente (veja seção [Variáveis de Ambiente](#variáveis-de-ambiente))

### 4. Execute o projeto

```bash
npm run dev
```

O projeto estará disponível em: `http://localhost:3000`

---

## 🗄️ Configuração do Supabase

### 1. Criar Projeto no Supabase

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Clique em "New Project"
3. Preencha:
   - **Name:** Tirilo SaaS
   - **Database Password:** (anote essa senha!)
   - **Region:** Escolha a mais próxima
4. Aguarde a criação do projeto (~2 minutos)

### 2. Obter Credenciais

No dashboard do projeto, vá em **Settings** > **API**:

- **Project URL:** `https://xxxxx.supabase.co`
- **anon/public key:** `eyJhbGc...` (chave pública)
- **service_role key:** `eyJhbGc...` (chave privada - **NUNCA** exponha!)

### 3. Executar Migrations

#### Opção 1: Via SQL Editor (Recomendado)

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em "New Query"
3. Copie e cole o conteúdo de `TABELAS.sql`
4. Clique em "Run"

#### Opção 2: Via CLI do Supabase

```bash
# Instalar CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref <PROJECT_REF>

# Executar migrations
supabase db push
```

### 4. Configurar Storage Buckets

Os buckets são criados automaticamente pelas migrations, mas verifique se existem:

1. No dashboard, vá em **Storage**
2. Verifique se existem os buckets:
   - `laudos` (privado)
   - `help-desk-anexos` (privado)
   - `logos` (público)

Se não existirem, execute as queries de storage do arquivo `TABELAS.sql`

### 5. Configurar Autenticação

1. Vá em **Authentication** > **Providers**
2. Habilite **Email** provider
3. Em **Email Templates**, customize se desejar
4. Em **URL Configuration**:
   - **Site URL:** `http://localhost:3000` (dev) ou `https://seu-dominio.com` (prod)
   - **Redirect URLs:** Adicione as URLs permitidas

---

## 🔐 Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Gemini AI
GOOGLE_GEMINI_API_KEY=AIzaSy...

# Next.js (opcional)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Onde obter cada chave:

| Variável | Onde obter |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard > Settings > API > Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard > Settings > API > Project API keys > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard > Settings > API > Project API keys > service_role |
| `GOOGLE_GEMINI_API_KEY` | [Google AI Studio](https://makersuite.google.com/app/apikey) |

⚠️ **IMPORTANTE:** 
- Nunca commite o arquivo `.env.local` no Git
- O arquivo `.env.local` já está no `.gitignore`
- Use variáveis de ambiente na Vercel para produção

---

## 🚀 Deploy na Vercel

### 1. Preparar o Projeto

Certifique-se de que:
- ✅ Todas as migrations foram executadas no Supabase
- ✅ As variáveis de ambiente estão configuradas
- ✅ O projeto está em um repositório Git (GitHub, GitLab, Bitbucket)

### 2. Importar Projeto na Vercel

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique em "Add New..." > "Project"
3. Selecione seu repositório Git
4. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./` (raiz)
   - **Build Command:** `npm run build` (padrão)
   - **Output Directory:** `.next` (padrão)

### 3. Configurar Variáveis de Ambiente

Na página de configuração do projeto, vá em **Environment Variables** e adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
GOOGLE_GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
```

⚠️ **Importante:** Adicione as variáveis para os ambientes:
- ✅ Production
- ✅ Preview
- ✅ Development

### 4. Deploy

1. Clique em "Deploy"
2. Aguarde o build (~2-3 minutos)
3. Acesse a URL gerada: `https://seu-projeto.vercel.app`

### 5. Configurar Domínio Customizado (Opcional)

1. Na Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções
4. Atualize `NEXT_PUBLIC_APP_URL` e **Redirect URLs** no Supabase

### 6. Atualizar Supabase

No Supabase, vá em **Authentication** > **URL Configuration**:
- **Site URL:** `https://seu-dominio.vercel.app`
- **Redirect URLs:** Adicione `https://seu-dominio.vercel.app/**`

---

## 📦 Dependências do Projeto

### Script de Instalação Completo

Se precisar reinstalar todas as dependências do zero:

```bash
# Limpar node_modules e cache
rm -rf node_modules package-lock.json
npm cache clean --force

# Instalar todas as dependências
npm install

# Dependências principais
npm install next@15.5.6 react@19.0.0 react-dom@19.0.0

# Supabase
npm install @supabase/ssr@0.6.1 @supabase/supabase-js@2.47.10

# UI e Estilo
npm install tailwindcss@3.4.17 postcss autoprefixer
npm install lucide-react@0.468.0
npm install class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@2.6.0

# Formulários e Validação
npm install zod@3.24.1

# Datas
npm install date-fns@4.1.0

# IA
npm install @google/generative-ai@0.21.0

# PDF
npm install jspdf@2.5.2

# TypeScript (dev dependencies)
npm install -D typescript @types/node @types/react @types/react-dom
```

### Verificar Dependências Instaladas

```bash
npm list --depth=0
```

---

## 🔍 Troubleshooting

### Erro: "Module not found"

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Supabase connection failed"

**Verificar:**
1. ✅ Variáveis de ambiente estão corretas
2. ✅ Projeto Supabase está ativo
3. ✅ Migrations foram executadas
4. ✅ RLS (Row Level Security) está configurado

### Erro: "Google Gemini API error"

**Verificar:**
1. ✅ API Key está correta
2. ✅ API está habilitada no Google Cloud
3. ✅ Quota não foi excedida

### Build falha na Vercel

**Verificar:**
1. ✅ Todas as variáveis de ambiente estão configuradas
2. ✅ Não há erros de TypeScript
3. ✅ Todas as dependências estão no `package.json`

**Comando para testar build localmente:**
```bash
npm run build
```

### Erro de permissão no Supabase

**Verificar:**
1. ✅ RLS está habilitado nas tabelas
2. ✅ Políticas RLS estão corretas
3. ✅ Usuário está autenticado

**Testar políticas:**
```sql
-- Ver políticas de uma tabela
SELECT * FROM pg_policies WHERE tablename = 'usuarios';
```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Next.js](https://nextjs.org/docs)
- [Supabase](https://supabase.com/docs)
- [Vercel](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Google Gemini AI](https://ai.google.dev/docs)

### Arquivos de Referência

- `REGRAS.md` - Regras e permissões do sistema
- `TABELAS.sql` - Schema completo do banco de dados
- `VERSAO.md` - Histórico de versões e mudanças
- `PACIENTES-README.md` - Documentação do módulo de pacientes

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique a seção [Troubleshooting](#troubleshooting)
2. Consulte os logs:
   - **Local:** Terminal onde rodou `npm run dev`
   - **Vercel:** Dashboard > Deployment > Logs
   - **Supabase:** Dashboard > Logs
3. Verifique se todas as migrations foram executadas
4. Confirme que as variáveis de ambiente estão corretas

---

**Última atualização:** 04/12/2024  
**Versão do sistema:** 1.2.0  
**Node.js requerido:** 18.x ou superior  
**Next.js:** 15.5.6
