# 🚨 SOLUÇÃO RÁPIDA - Erro "clinica_id column not found"

## ❌ Erro Encontrado
```
Could not find the 'clinica_id' column of 'pacientes' in the schema cache
```

## ✅ SOLUÇÃO (Escolha UMA das opções)

---

### 🔧 OPÇÃO 1: Adicionar coluna (Se você tem dados importantes)

**Execute este arquivo no SQL Editor do Supabase:**
```
migration-add-clinica-id.sql
```

Este script:
- ✅ Adiciona a coluna `clinica_id` à tabela existente
- ✅ Vincula com a primeira clínica disponível
- ✅ Preserva dados existentes
- ✅ Cria índices necessários

**Passos:**
1. Abra: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/sql/new
2. Copie TODO o conteúdo de: `migration-add-clinica-id.sql`
3. Cole e clique em **RUN**
4. Aguarde mensagem de sucesso
5. Reinicie o servidor: `npm run dev`

---

### 🔥 OPÇÃO 2: Reset Completo (Recomendado - Se NÃO tem dados importantes)

**Execute este arquivo no SQL Editor do Supabase:**
```
reset-pacientes.sql
```

Este script:
- ⚠️ **DELETA** todas as tabelas de pacientes
- ✅ Recria tudo do zero corretamente
- ✅ Garante estrutura 100% correta
- ✅ Mais seguro e limpo

**Passos:**
1. Abra: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/sql/new
2. Copie TODO o conteúdo de: `reset-pacientes.sql`
3. Cole e clique em **RUN**
4. Aguarde mensagem: "Reset completo! Tabelas recriadas com sucesso!"
5. Reinicie o servidor: `npm run dev`

---

## 🔍 Verificar se Funcionou

Após executar UMA das opções acima, execute este SQL para verificar:

```sql
-- Verificar estrutura da tabela pacientes
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'pacientes'
ORDER BY ordinal_position;
```

**Resultado esperado:**
Você deve ver a coluna `clinica_id` na lista!

```
column_name          | data_type                   | is_nullable
---------------------|-----------------------------|--------------
id                   | bigint                      | NO
created_at           | timestamp with time zone    | YES
updated_at           | timestamp with time zone    | YES
clinica_id           | bigint                      | NO  ← DEVE APARECER!
nome                 | text                        | NO
data_nascimento      | date                        | NO
foto_url             | text                        | YES
observacoes          | text                        | YES
ativo                | boolean                     | YES
```

---

## 🎯 Depois de Corrigir

1. **Reinicie o servidor:**
   ```bash
   # Parar (Ctrl+C)
   npm run dev
   ```

2. **Teste novamente:**
   - Acesse: http://localhost:3000/admin/pacientes
   - Clique em "Novo Paciente"
   - Preencha o formulário
   - Clique em "Salvar Paciente"
   - ✅ Deve funcionar!

---

## 💡 Por que isso aconteceu?

A tabela `pacientes` foi criada ANTES de executar o script completo, provavelmente com uma estrutura diferente ou incompleta. O `CREATE TABLE IF NOT EXISTS` não adiciona colunas em tabelas existentes.

---

## 📞 Ainda com problemas?

Se o erro persistir:

1. **Verifique se executou o SQL corretamente:**
   - O script deve retornar "Success"
   - Não deve ter erros em vermelho

2. **Limpe o cache do Supabase:**
   - No painel do Supabase, vá em Settings → API
   - Clique em "Restart API"

3. **Verifique as credenciais:**
   - Confirme que o `.env.local` tem as credenciais corretas
   - Project ID: `kragnthopsuwejezvixw`

---

## ✅ Recomendação

**Use a OPÇÃO 2 (Reset Completo)** se você está apenas testando e não tem dados importantes. É mais rápido e garante que tudo está correto!
