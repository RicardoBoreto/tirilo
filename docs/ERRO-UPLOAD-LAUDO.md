# 🚨 SOLUÇÃO COMPLETA - Erro no Upload de Laudo

## ❌ Problema
O upload de PDF está falhando. Possíveis causas:
1. Bucket "laudos" não foi criado
2. Políticas RLS do Storage não estão corretas
3. Permissões insuficientes

## ✅ SOLUÇÃO PASSO A PASSO

### 1️⃣ Execute o Script de Correção do Storage

**Arquivo:** `fix-storage-bucket.sql`

1. Acesse: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/sql/new
2. Copie TODO o conteúdo de: **`fix-storage-bucket.sql`**
3. Cole no SQL Editor
4. Clique em **RUN**
5. Verifique os resultados:
   - ✅ Bucket "laudos" deve aparecer
   - ✅ 4 políticas devem ser criadas (Upload, Leitura, Atualização, Exclusão)

---

### 2️⃣ Verifique o Console do Navegador

Agora que o código tem logs detalhados, você verá no console:

**Logs esperados:**
```
Upload iniciado: {
  pacienteId: 1,
  fileName: "laudo.pdf",
  fileSize: 123456,
  fileType: "application/pdf"
}
```

**Se der erro, você verá:**
```
Erro detalhado ao fazer upload do laudo: {
  error: {...},
  message: "mensagem do erro",
  statusCode: 400,
  fileName: "1/1733012345678_laudo.pdf"
}
```

**Copie essa mensagem de erro e me envie!**

---

### 3️⃣ Reinicie o Servidor

```bash
# Parar com Ctrl+C
npm run dev
```

---

### 4️⃣ Teste Novamente

1. Acesse um paciente
2. Vá para aba "Anamnese" → "Laudo Médico"
3. Selecione um PDF
4. **Abra o Console do Navegador** (F12)
5. Observe os logs
6. Tente fazer upload

---

## 🔍 DIAGNÓSTICO

### Erro Comum 1: "Bucket not found"
**Solução:** Execute `fix-storage-bucket.sql`

### Erro Comum 2: "new row violates row-level security policy"
**Solução:** As políticas RLS não estão corretas. Execute `fix-storage-bucket.sql`

### Erro Comum 3: "Invalid file type"
**Solução:** Certifique-se de que está enviando um PDF

### Erro Comum 4: "File too large"
**Solução:** Arquivo muito grande. Limite padrão do Supabase é 50MB

---

## 🛠️ VERIFICAÇÃO MANUAL

### Verificar se o bucket existe:

1. Acesse: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/storage/buckets
2. Deve aparecer um bucket chamado "laudos"
3. Se não aparecer, execute o SQL:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('laudos', 'laudos', false);
   ```

### Verificar políticas:

1. Acesse: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/auth/policies
2. Vá para "storage" → "objects"
3. Deve ter 4 políticas começando com "Laudos"

---

## 📋 CHECKLIST

Antes de testar novamente:

- [ ] Executei `fix-storage-bucket.sql`
- [ ] Bucket "laudos" existe no painel do Supabase
- [ ] 4 políticas RLS foram criadas
- [ ] Reiniciei o servidor (`npm run dev`)
- [ ] Console do navegador está aberto (F12)
- [ ] Arquivo PDF é menor que 50MB

---

## 🎯 PRÓXIMO PASSO

**Tente fazer upload novamente e me envie:**
1. A mensagem de erro completa do console
2. Screenshot do erro (se houver)
3. Confirmação se o bucket foi criado

Com essas informações, posso diagnosticar exatamente o que está acontecendo!

---

## 💡 ALTERNATIVA: Upload Direto no Supabase

Se o upload continuar falhando, você pode testar diretamente no painel:

1. Acesse: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/storage/buckets/laudos
2. Clique em "Upload file"
3. Selecione um PDF
4. Se funcionar aqui, o problema é no código
5. Se não funcionar, o problema é nas permissões do Supabase

---

**Execute o `fix-storage-bucket.sql` e me avise o resultado!** 🚀
