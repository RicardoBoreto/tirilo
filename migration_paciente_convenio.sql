ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS convenio_nome TEXT;
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS convenio_numero_carteirinha TEXT;
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS convenio_validade DATE;

-- Update types if needed via Supabase UI or leave as is (Postgres handles it)
