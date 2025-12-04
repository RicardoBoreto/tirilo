# 🚀 Módulo de Pacientes - Instruções de Instalação

## 1️⃣ Execute o SQL no Supabase

Acesse o SQL Editor do Supabase e execute o arquivo:
```
supabase-pacientes-setup.sql
```

Este script irá criar:
- ✅ Bucket de storage "laudos"
- ✅ Tabelas: pacientes, responsaveis, pacientes_responsaveis, pacientes_anamnese
- ✅ Índices para performance
- ✅ Políticas RLS
- ✅ Triggers de updated_at

## 2️⃣ Gere os tipos do TypeScript

Execute no terminal do projeto:

```bash
npx supabase gen types typescript --project-id kragnthopsuwejezvixw > types/database.types.ts
```

## 3️⃣ Teste o Módulo

1. Inicie o servidor:
```bash
npm run dev
```

2. Acesse: http://localhost:3000/admin/pacientes

3. Teste as funcionalidades:
   - ✅ Criar novo paciente
   - ✅ Listar pacientes
   - ✅ Ver detalhes do paciente
   - ✅ Adicionar responsáveis
   - ✅ Preencher anamnese
   - ✅ Upload de laudo médico (PDF)
   - ✅ Dados de musicoterapia

## 📁 Arquivos Criados

### Server Actions
- `lib/actions/pacientes.ts` - Todas as operações de backend

### Páginas
- `app/admin/pacientes/page.tsx` - Lista de pacientes
- `app/admin/pacientes/novo/page.tsx` - Formulário de novo paciente
- `app/admin/pacientes/[id]/page.tsx` - Detalhes do paciente

### Componentes
- `components/Sidebar.tsx` - Atualizado com link "Pacientes"
- `components/PacienteDetailsTabs.tsx` - Abas de detalhes
- `components/ResponsaveisTab.tsx` - Gestão de responsáveis
- `components/AnamneseTab.tsx` - Anamnese completa com upload

### SQL
- `supabase-pacientes-setup.sql` - Script de setup do banco

## 🎯 Funcionalidades Implementadas

### ✅ Pacientes
- CRUD completo
- Foto do paciente
- Data de nascimento com cálculo de idade
- Observações

### ✅ Responsáveis
- Múltiplos responsáveis por paciente
- CPF, WhatsApp, E-mail
- Grau de parentesco
- Responsável principal

### ✅ Anamnese
- **Desenvolvimento**: Gestação, parto, desenvolvimento motor/linguagem
- **Histórico Médico**: Doenças, medicamentos, alergias
- **Laudo Médico**: Upload de PDF com storage no Supabase
- **Musicoterapia**: Músicas favoritas, reforçadoras, rejeitadas, instrumentos, objetivos

### ✅ Segurança
- RLS 100% implementado
- Terapeuta só vê pacientes da própria clínica
- Storage com políticas de acesso

## 🔧 Próximos Passos (Opcional)

1. **Portal da Família**: Criar `/familia` para responsáveis verem seus filhos
2. **Integração com Clínica**: Pegar `clinica_id` do contexto de autenticação
3. **Validação de CPF**: Adicionar validação de CPF no frontend
4. **Máscaras**: Adicionar máscaras para telefone e CPF
5. **Fotos**: Implementar upload de foto do paciente no Storage

## ⚡ Tempo Estimado
- Setup SQL: 2 min
- Gerar tipos: 1 min
- Testar: 5-10 min
- **Total: ~15 minutos** ✅

---

**Pronto para testar!** 🎉
