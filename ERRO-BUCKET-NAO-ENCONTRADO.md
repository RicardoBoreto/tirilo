# 🚨 SOLUÇÃO URGENTE - Bucket não encontrado

## ❌ Erro
```
{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}
```

## 🔍 Causa
O bucket "laudos" não foi criado no Supabase Storage.

## ✅ SOLUÇÃO (2 MINUTOS)

### **OPÇÃO 1: Via SQL (Mais Rápido)**

1. Acesse: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/sql/new
2. Copie e execute:
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('laudos', 'laudos', false)
   ON CONFLICT (id) DO NOTHING;
   ```
3. Clique em **RUN**
4. Pronto!

**OU use o arquivo:** `criar-bucket-laudos.sql`

---

### **OPÇÃO 2: Via Interface (Mais Visual)**

1. Acesse: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/storage/buckets
2. Clique em **"New bucket"** ou **"Create bucket"**
3. Preencha:
   - **Name:** `laudos`
   - **Public:** ❌ **Desmarque** (deve ser privado)
4. Clique em **Create bucket**
5. Pronto!

---

## 🔒 CONFIGURAR POLÍTICAS RLS

Depois de criar o bucket, execute este SQL:

```sql
-- Política para INSERT (upload)
CREATE POLICY "Laudos - Upload permitido"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'laudos');

-- Política para SELECT (download/visualização)
CREATE POLICY "Laudos - Leitura permitida"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'laudos');

-- Política para UPDATE
CREATE POLICY "Laudos - Atualização permitida"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'laudos')
WITH CHECK (bucket_id = 'laudos');

-- Política para DELETE
CREATE POLICY "Laudos - Exclusão permitida"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'laudos');
```

**OU use o arquivo:** `fix-storage-bucket.sql` (completo)

---

## ✅ VERIFICAR SE FUNCIONOU

1. Acesse: https://supabase.com/dashboard/project/kragnthopsuwejezvixw/storage/buckets
2. Deve aparecer um bucket chamado **"laudos"**
3. Clique nele
4. Deve ver a pasta `1/` com o arquivo `1764545806342_nf_joao_emanuel.pdf`

---

## 🔄 TESTAR NOVAMENTE

1. Acesse o paciente no sistema
2. Vá para "Anamnese" → "Laudo Médico"
3. Clique em **"Ver Laudo"**
4. ✅ **Deve abrir o PDF!**

---

## 💡 POR QUE ISSO ACONTECEU?

O arquivo foi enviado com sucesso (você viu nos logs), mas o bucket não existia no Supabase. O upload funcionou porque o código criou o caminho, mas o bucket em si não foi criado.

---

## 📋 CHECKLIST

- [ ] Executei o SQL para criar o bucket
- [ ] Bucket "laudos" aparece no painel do Supabase
- [ ] Executei as políticas RLS
- [ ] Testei o link do laudo novamente
- [ ] PDF abre corretamente

---

**Execute AGORA a OPÇÃO 1 (SQL) e me avise se funcionou!** 🚀
