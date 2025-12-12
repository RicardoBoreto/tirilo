ALTER TABLE public.saas_clinicas ADD COLUMN IF NOT EXISTS end_logradouro TEXT;
ALTER TABLE public.saas_clinicas ADD COLUMN IF NOT EXISTS end_numero TEXT;
ALTER TABLE public.saas_clinicas ADD COLUMN IF NOT EXISTS end_complemento TEXT;
ALTER TABLE public.saas_clinicas ADD COLUMN IF NOT EXISTS end_bairro TEXT;
ALTER TABLE public.saas_clinicas ADD COLUMN IF NOT EXISTS end_cidade TEXT;
ALTER TABLE public.saas_clinicas ADD COLUMN IF NOT EXISTS end_estado TEXT;
ALTER TABLE public.saas_clinicas ADD COLUMN IF NOT EXISTS end_cep TEXT;
