# SaaS Tirilo - Base Funcional

Sistema de gestão de clínicas com Next.js 15 + Supabase.

## 🚀 Stack Tecnológica

- **Next.js 15** (App Router)
- **TypeScript** (strict mode)
- **Supabase** (Auth + Database com SSR)
- **Tailwind CSS**
- **Zod** (validação de formulários)

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase com banco de dados configurado

## 🔧 Instalação

1. Clone o repositório ou navegue até a pasta do projeto:
```bash
cd SaaS_tirilo_v2
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env.local`
   - Preencha com suas credenciais do Supabase

4. Certifique-se de que a tabela `saas_clinicas` existe no seu banco Supabase:
```sql
create table saas_clinicas (
  id bigint primary key generated always as identity,
  created_at timestamp with time zone default now(),
  razao_social text not null,
  nome_fantasia text,
  cnpj text unique,
  logo_url text,
  status_assinatura text default 'ativo',
  config_cor_primaria text default '#3b82f6',
  plano_atual text default 'basico'
);
```

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse: http://localhost:3000

## 🔐 Autenticação

### Criar primeiro usuário:
1. Acesse `/signup`
2. Cadastre-se com email e senha
3. Confirme o email (verifique sua caixa de entrada)
4. Faça login em `/login`

### Rotas protegidas:
- `/admin/*` - Requer autenticação
- Middleware redireciona automaticamente usuários não autenticados

## 📁 Estrutura do Projeto

```
SaaS_tirilo_v2/
├── app/
│   ├── admin/
│   │   ├── clinicas/
│   │   │   ├── [id]/
│   │   │   │   ├── editar/
│   │   │   │   │   └── page.tsx      # Editar clínica
│   │   │   │   └── page.tsx          # Ver detalhes
│   │   │   ├── nova/
│   │   │   │   └── page.tsx          # Criar clínica
│   │   │   └── page.tsx              # Listar clínicas
│   │   └── layout.tsx                # Layout admin (sidebar + header)
│   ├── login/
│   │   └── page.tsx                  # Página de login
│   ├── signup/
│   │   └── page.tsx                  # Página de cadastro
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ClinicasList.tsx              # Lista de clínicas com busca
│   ├── EditClinicaForm.tsx           # Formulário de edição
│   ├── Header.tsx                    # Header com logout
│   └── Sidebar.tsx                   # Sidebar de navegação
├── lib/
│   └── supabase/
│       ├── client.ts                 # Cliente Supabase (browser)
│       ├── server.ts                 # Cliente Supabase (server)
│       └── middleware.ts             # Middleware helper
├── types/
│   └── database.types.ts             # Tipos do banco de dados
├── middleware.ts                     # Middleware de autenticação
├── .env.local                        # Variáveis de ambiente (não commitado)
├── .env.example                      # Template de variáveis
└── package.json
```

## ✨ Funcionalidades Implementadas

### ✅ Autenticação Completa
- [x] Login com email/senha
- [x] Cadastro de novos usuários
- [x] Logout
- [x] Proteção de rotas via middleware
- [x] Sessão persistente com cookies

### ✅ CRUD de Clínicas
- [x] Listar todas as clínicas
- [x] Buscar clínicas (razão social, nome fantasia, CNPJ)
- [x] Ver detalhes de uma clínica
- [x] Criar nova clínica
- [x] Editar clínica existente
- [x] Excluir clínica

### ✅ Campos da Tabela saas_clinicas
- [x] `razao_social` (obrigatório)
- [x] `nome_fantasia`
- [x] `cnpj` (único)
- [x] `logo_url`
- [x] `status_assinatura` (ativo/inativo/suspenso)
- [x] `config_cor_primaria` (color picker)
- [x] `plano_atual` (basico/profissional/empresarial)

### ✅ UI/UX
- [x] Layout responsivo com Tailwind CSS
- [x] Dark mode suportado
- [x] Sidebar de navegação
- [x] Header com informações do usuário
- [x] Badges de status coloridos
- [x] Formulários com validação Zod
- [x] Mensagens de erro amigáveis

### ✅ Segurança
- [x] Supabase SSR configurado
- [x] Middleware de autenticação
- [x] Cookies seguros
- [x] Validação de formulários
- [x] TypeScript strict mode

## 🎨 Páginas Disponíveis

| Rota | Descrição | Acesso |
|------|-----------|--------|
| `/` | Redireciona para `/admin/clinicas` | Público |
| `/login` | Página de login | Público |
| `/signup` | Página de cadastro | Público |
| `/admin/clinicas` | Lista de clínicas | Protegido |
| `/admin/clinicas/nova` | Criar nova clínica | Protegido |
| `/admin/clinicas/[id]` | Ver detalhes da clínica | Protegido |
| `/admin/clinicas/[id]/editar` | Editar clínica | Protegido |

## 🔒 Row Level Security (RLS)

Para habilitar RLS no Supabase e permitir que apenas admins vejam todas as clínicas:

```sql
-- Habilitar RLS
ALTER TABLE saas_clinicas ENABLE ROW LEVEL SECURITY;

-- Política: Permitir leitura para usuários autenticados
CREATE POLICY "Permitir leitura para autenticados"
ON saas_clinicas FOR SELECT
TO authenticated
USING (true);

-- Política: Permitir inserção para usuários autenticados
CREATE POLICY "Permitir inserção para autenticados"
ON saas_clinicas FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política: Permitir atualização para usuários autenticados
CREATE POLICY "Permitir atualização para autenticados"
ON saas_clinicas FOR UPDATE
TO authenticated
USING (true);

-- Política: Permitir exclusão para usuários autenticados
CREATE POLICY "Permitir exclusão para autenticados"
ON saas_clinicas FOR DELETE
TO authenticated
USING (true);
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint
```

## 📝 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

## 🚨 Troubleshooting

### Erro de autenticação
- Verifique se as credenciais do Supabase estão corretas em `.env.local`
- Certifique-se de que o email foi confirmado

### Erro ao buscar clínicas
- Verifique se a tabela `saas_clinicas` existe no banco
- Verifique as políticas RLS no Supabase

### Erro de build
- Execute `npm install` novamente
- Limpe o cache: `rm -rf .next` e rode `npm run dev`

## 📦 Próximos Passos (Não Implementados)

- [ ] Upload de imagens para logos
- [ ] Paginação na lista de clínicas
- [ ] Filtros avançados
- [ ] Dashboard com métricas
- [ ] Multi-tenancy com isolamento por clínica
- [ ] Gestão de usuários por clínica
- [ ] Histórico de alterações
- [ ] Notificações por email

## 📄 Licença

Projeto privado - SaaS Tirilo © 2025

---

**Desenvolvido com ❤️ usando Next.js 15 + Supabase**
