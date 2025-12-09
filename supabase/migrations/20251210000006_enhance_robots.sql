-- Add monetization and detail fields to fleet table
ALTER TABLE saas_frota_robos 
    ADD COLUMN IF NOT EXISTS modelo_hardware TEXT,
    ADD COLUMN IF NOT EXISTS versao_hardware TEXT,
    ADD COLUMN IF NOT EXISTS numero_serie TEXT,
    ADD COLUMN IF NOT EXISTS foto_url TEXT,
    ADD COLUMN IF NOT EXISTS valor_venda DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS valor_aluguel DECIMAL(10,2) DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS status_operacional TEXT DEFAULT 'disponivel'; -- disponivel, manutencao, em_uso

-- Allow nullable mac_address for pre-registration if needed, but safer to keep it mandatory for now. 
-- Assuming registration implies having the hardware info.

-- Update RLS if needed?
-- Existing policies cover 'saas_frota_robos' for admins. That should be enough for management.
