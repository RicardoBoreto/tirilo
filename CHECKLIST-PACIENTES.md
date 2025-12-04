# ✅ CHECKLIST DE INSTALAÇÃO - MÓDULO DE PACIENTES

## 📋 Antes de Começar
- [ ] Servidor Next.js funcionando (`npm run dev`)
- [ ] Supabase configurado com credenciais no `.env.local`
- [ ] Acesso ao painel do Supabase

---

## 🚀 PASSO A PASSO (15 minutos)

### 1️⃣ Executar SQL no Supabase (5 min)

**Ação:**
1. Abra: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/sql/new
2. Copie TODO o conteúdo de: `supabase-pacientes-setup.sql`
3. Cole no SQL Editor
4. Clique em **RUN** (botão verde)
5. Aguarde mensagem: "Success. No rows returned"

**Verificação:**
```sql
-- Execute este SQL para verificar:
SELECT 
  'pacientes' as tabela, COUNT(*) as total FROM pacientes
UNION ALL
SELECT 'responsaveis', COUNT(*) FROM responsaveis
UNION ALL
SELECT 'pacientes_responsaveis', COUNT(*) FROM pacientes_responsaveis
UNION ALL
SELECT 'pacientes_anamnese', COUNT(*) FROM pacientes_anamnese;
```

- [ ] SQL executado com sucesso
- [ ] Tabelas criadas (4 tabelas)
- [ ] Bucket "laudos" criado

---

### 2️⃣ Gerar Tipos TypeScript (2 min)

**Ação:**
```bash
npx supabase gen types typescript --project-id kragnthopsuwejezvixw > types/database.types.ts
```

**Verificação:**
- [ ] Arquivo `types/database.types.ts` atualizado
- [ ] Arquivo contém tipos para as novas tabelas

---

### 3️⃣ Reiniciar Servidor (1 min)

**Ação:**
```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente:
npm run dev
```

**Verificação:**
- [ ] Servidor iniciou sem erros
- [ ] Nenhum erro de TypeScript
- [ ] Nenhum erro de importação

---

### 4️⃣ Testar Funcionalidades (7 min)

#### 4.1 Navegação
- [ ] Abrir: http://localhost:3000/admin/pacientes
- [ ] Sidebar mostra item "Pacientes" com ícone
- [ ] Página carrega sem erros

#### 4.2 Criar Paciente
- [ ] Clicar em "Novo Paciente"
- [ ] Preencher formulário:
  - Nome: "João da Silva"
  - Data Nascimento: "2020-01-15"
  - Observações: "Teste"
- [ ] Clicar em "Salvar Paciente"
- [ ] Redirecionado para página de detalhes

#### 4.3 Adicionar Responsável
- [ ] Na página de detalhes, ir para aba "Responsáveis"
- [ ] Clicar em "+ Adicionar Responsável"
- [ ] Preencher:
  - Nome: "Maria da Silva"
  - CPF: "123.456.789-00"
  - WhatsApp: "(11) 99999-9999"
  - Parentesco: "Mãe"
  - ✓ Responsável Principal
- [ ] Clicar em "Salvar Responsável"
- [ ] Responsável aparece na lista

#### 4.4 Preencher Anamnese - Desenvolvimento
- [ ] Ir para aba "Anamnese"
- [ ] Sub-aba "Desenvolvimento"
- [ ] Preencher campos:
  - Gestação: "Sem intercorrências"
  - Tipo de Parto: "Normal"
  - Desenvolvimento Motor: "Sentou aos 6 meses, andou com 1 ano"
  - Desenvolvimento Linguagem: "Primeiras palavras aos 12 meses"
- [ ] Clicar em "Salvar Desenvolvimento"
- [ ] Mensagem de sucesso

#### 4.5 Upload de Laudo
- [ ] Sub-aba "Laudo Médico"
- [ ] Preencher Diagnóstico: "TEA"
- [ ] Clicar em "Selecionar Laudo (PDF)"
- [ ] Escolher um arquivo PDF de teste
- [ ] Aguardar upload
- [ ] Ver mensagem "Laudo enviado com sucesso!"
- [ ] Link "Ver Laudo" aparece

#### 4.6 Musicoterapia
- [ ] Sub-aba "Musicoterapia"
- [ ] Preencher:
  - Músicas Favoritas: "Baby Shark, Galinha Pintadinha"
  - Músicas Reforçadoras: "Parabéns pra você"
  - Instrumentos: "Tambor, chocalho"
  - Objetivos: "Melhorar atenção e comunicação"
- [ ] Clicar em "Salvar Musicoterapia"
- [ ] Dados salvos

#### 4.7 Editar Paciente
- [ ] Voltar para lista de pacientes
- [ ] Clicar em "Editar" no paciente criado
- [ ] Alterar nome para "João da Silva Teste"
- [ ] Clicar em "Salvar Alterações"
- [ ] Nome atualizado na lista

#### 4.8 Verificar Lista
- [ ] Lista mostra paciente com:
  - Foto (ou inicial)
  - Nome completo
  - Data de nascimento formatada
  - Idade calculada corretamente
  - Links funcionando

---

## 🔍 TROUBLESHOOTING

### Erro: "Table doesn't exist"
**Solução:** Execute o SQL novamente no Supabase

### Erro: "Type error" no TypeScript
**Solução:** Gere os tipos novamente com o comando do passo 2

### Erro: "Storage bucket not found"
**Solução:** Verifique se o bucket "laudos" foi criado:
1. Supabase Dashboard → Storage
2. Deve aparecer bucket "laudos"
3. Se não existir, execute apenas a parte do SQL que cria o bucket

### Upload de laudo não funciona
**Solução:** Verifique as políticas RLS do Storage:
```sql
-- Execute no SQL Editor:
SELECT * FROM storage.policies WHERE bucket_id = 'laudos';
```

### Pacientes não aparecem
**Solução:** Verifique RLS:
```sql
-- Temporariamente desabilitar RLS para teste:
ALTER TABLE pacientes DISABLE ROW LEVEL SECURITY;
-- Lembre-se de reabilitar depois!
```

---

## ✅ VERIFICAÇÃO FINAL

### Banco de Dados
- [ ] 4 tabelas criadas
- [ ] Bucket "laudos" criado
- [ ] RLS habilitado em todas as tabelas
- [ ] Índices criados
- [ ] Triggers funcionando

### Código
- [ ] 0 erros de TypeScript
- [ ] 0 erros de importação
- [ ] 0 warnings críticos
- [ ] Todas as páginas carregam

### Funcionalidades
- [ ] CRUD de pacientes funcionando
- [ ] Responsáveis funcionando
- [ ] Anamnese salvando
- [ ] Upload de laudo funcionando
- [ ] Dark mode funcionando
- [ ] Navegação fluida

---

## 🎉 SUCESSO!

Se todos os itens estão marcados, o módulo está **100% funcional**!

**Próximos passos sugeridos:**
1. Criar dados de teste
2. Testar com múltiplos pacientes
3. Testar com múltiplos responsáveis
4. Implementar Portal da Família (opcional)
5. Adicionar máscaras de CPF/telefone (opcional)

---

**Tempo total estimado:** 15 minutos
**Dificuldade:** ⭐⭐ (Fácil)
