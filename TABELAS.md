# 📊 Estrutura das Tabelas do Banco de Dados

## Tabela: `salas_recursos`

Armazena informações sobre as salas de atendimento da clínica.

### Colunas

| Coluna | Tipo | Nullable | Descrição |
|--------|------|----------|-----------|
| `id` | INTEGER | NOT NULL | ID único da sala (PK) |
| `id_clinica` | INTEGER | NOT NULL | ID da clínica (FK) |
| `nome` | TEXT | NOT NULL | Nome da sala |
| `descricao` | TEXT | NULL | Descrição/observações sobre a sala |
| `capacidade` | INTEGER | NOT NULL | Capacidade de crianças |
| `cor_identificacao` | TEXT | NOT NULL | Cor em hexadecimal para identificação visual |
| `foto_url` | TEXT | NULL | URL da foto da sala (Supabase Storage) |
| `ativa` | BOOLEAN | NOT NULL | Se a sala está ativa/disponível |
| `created_at` | TIMESTAMP | NOT NULL | Data de criação |
| `updated_at` | TIMESTAMP | NOT NULL | Data da última atualização |

### Relacionamentos

- **id_clinica** → `saas_clinicas.id`

### Índices

- PRIMARY KEY: `id`
- INDEX: `id_clinica` (para consultas por clínica)

### RLS (Row Level Security)

- Usuários só podem ver/editar salas da própria clínica
- Política baseada em `id_clinica` do usuário

### Storage

As fotos das salas são armazenadas no bucket `fotos` do Supabase Storage:
- Caminho: `salas/{sala_id}-{timestamp}.{ext}`
- Acesso: Público (public bucket)
- Formatos aceitos: Imagens (jpg, png, webp, etc.)

### Exemplo de Registro

```json
{
  "id": 1,
  "id_clinica": 5,
  "nome": "Sala Azul",
  "descricao": "Sala equipada para musicoterapia",
  "capacidade": 4,
  "cor_identificacao": "#3B82F6",
  "foto_url": "https://[projeto].supabase.co/storage/v1/object/public/fotos/salas/1-1733493600000.jpg",
  "ativa": true,
  "created_at": "2025-12-06T10:00:00Z",
  "updated_at": "2025-12-06T10:30:00Z"
}
```

### Migrations Aplicadas

#### 2025-12-06: Adicionar coluna foto_url
```sql
ALTER TABLE salas_recursos 
ADD COLUMN foto_url TEXT;

COMMENT ON COLUMN salas_recursos.foto_url IS 'URL da foto da sala armazenada no Supabase Storage';
```

---

## Outras Tabelas

### `saas_clinicas`
Tabela principal de clínicas (detalhes em outro documento)

### `usuarios`
Usuários do sistema (terapeutas, recepcionistas, admin)

### `pacientes`
Pacientes atendidos pelas clínicas

### `agendamentos`
Agendamentos de sessões

### `materiais_recursos`
Materiais e recursos disponíveis (similar a salas_recursos, também tem `foto_url`)

---

**Última atualização:** 06/12/2025
