-- Migration: Adiciona coluna versao_firmware em saas_frota_robos
-- Executar no SQL Editor do Supabase

ALTER TABLE saas_frota_robos
ADD COLUMN IF NOT EXISTS versao_firmware TEXT DEFAULT NULL;

COMMENT ON COLUMN saas_frota_robos.versao_firmware IS 'Versão do firmware tirilo.py em execução no robô. Atualizada via heartbeat.';
