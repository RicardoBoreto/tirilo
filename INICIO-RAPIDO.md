# ⚡ INÍCIO RÁPIDO - SaaS Tirilo

## 🎯 Objetivo
Ter o sistema rodando em **menos de 10 minutos**!

---

## 📋 Checklist Rápido

### ✅ Passo 1: Node.js (2 min)
```bash
# Verificar se já tem instalado
node --version
npm --version

# Se não tiver, baixe em:
# https://nodejs.org/ (versão LTS)
```

### ✅ Passo 2: Instalar Dependências (3 min)
```bash
# Opção A: Automático (Windows)
instalar.bat

# Opção B: Manual
npm install
```

### ✅ Passo 3: Configurar Banco (2 min)
1. Acesse: https://supabase.com/dashboard
2. Projeto: `kragnthopsuwejezvixw`
3. SQL Editor → Cole e execute `supabase-setup.sql`

### ✅ Passo 4: Iniciar Servidor (1 min)
```bash
npm run dev
```

### ✅ Passo 5: Testar (2 min)
1. Abra: http://localhost:3000
2. Vá para: http://localhost:3000/signup
3. Cadastre-se com seu email
4. Confirme o email (verifique inbox/spam)
5. Faça login: http://localhost:3000/login
6. Pronto! Você está em `/admin/clinicas`

---

## 🚀 Teste Rápido do CRUD

### 1️⃣ Criar Clínica (30 seg)
- Clique em **"Nova Clínica"**
- Preencha:
  - Razão Social: `Teste LTDA`
  - Nome Fantasia: `Teste`
  - CNPJ: `12.345.678/0001-90`
  - Status: `Ativo`
  - Plano: `Básico`
  - Cor: Escolha uma cor
- Clique em **"Salvar Clínica"**

### 2️⃣ Buscar (10 seg)
- Digite `Teste` na barra de busca
- Veja a filtragem em tempo real

### 3️⃣ Ver Detalhes (10 seg)
- Clique em **"Ver"** na linha da clínica
- Veja todos os campos formatados

### 4️⃣ Editar (20 seg)
- Clique em **"Editar"**
- Mude o nome fantasia para `Teste Editado`
- Clique em **"Salvar Alterações"**

### 5️⃣ Excluir (10 seg)
- Na página de edição
- Clique em **"Excluir Clínica"**
- Confirme a exclusão

---

## 📂 Arquivos Importantes

| Arquivo | Para que serve |
|---------|----------------|
| `INSTALACAO.md` | Guia detalhado de instalação |
| `README.md` | Documentação completa |
| `CHECKLIST.md` | Lista de verificação |
| `RESUMO.md` | Resumo executivo |
| `ESTRUTURA.md` | Estrutura do projeto |
| `supabase-setup.sql` | Script do banco de dados |

---

## 🆘 Problemas?

### "npm não é reconhecido"
➡️ Instale o Node.js e reinicie o terminal

### "Erro ao conectar com Supabase"
➡️ Verifique se `.env.local` existe e tem as credenciais corretas

### "Tabela não encontrada"
➡️ Execute o arquivo `supabase-setup.sql` no Supabase

### "Erro de autenticação"
➡️ Confirme seu email após o cadastro

### Outros problemas?
➡️ Leia o `README.md` completo

---

## 🎨 Páginas Disponíveis

| URL | Descrição |
|-----|-----------|
| `/` | Redireciona para admin |
| `/login` | Login |
| `/signup` | Cadastro |
| `/admin/clinicas` | Lista de clínicas |
| `/admin/clinicas/nova` | Criar clínica |
| `/admin/clinicas/[id]` | Ver detalhes |
| `/admin/clinicas/[id]/editar` | Editar |

---

## 💡 Dicas

1. **Dark Mode**: Funciona automaticamente com as preferências do sistema
2. **Busca**: Busca em tempo real por razão social, nome fantasia ou CNPJ
3. **Validação**: Todos os formulários têm validação em tempo real
4. **Logout**: Botão no canto superior direito
5. **Responsivo**: Funciona em mobile, tablet e desktop

---

## 🎯 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar produção
npm start

# Limpar cache
Remove-Item -Recurse -Force .next
npm run dev
```

---

## ✅ Tudo Funcionando?

Se você conseguiu:
- ✅ Fazer login
- ✅ Ver a lista de clínicas
- ✅ Criar uma clínica
- ✅ Editar uma clínica
- ✅ Excluir uma clínica

**PARABÉNS! 🎉 O sistema está 100% funcional!**

---

## 📚 Próximos Passos

1. Leia o `README.md` para entender a arquitetura
2. Veja o `ESTRUTURA.md` para entender os fluxos
3. Customize o design em `app/globals.css`
4. Adicione novas funcionalidades conforme necessário

---

**Desenvolvido em < 10 minutos! ⚡**

**Pronto para usar! 🚀**
