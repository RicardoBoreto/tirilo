ALTER TABLE public.planos_intervencao_ia
ADD COLUMN IF NOT EXISTS historico_chat JSONB DEFAULT '[]'::jsonb;
