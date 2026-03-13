-- 1. Alteramos a restrição para permitir atualização em cascata (ON UPDATE CASCADE)
-- Isso faz com que mudar o Mac na tabela principal mude em todas as outras automaticamente.
ALTER TABLE comandos_robo 
DROP CONSTRAINT IF EXISTS comandos_robo_mac_address_fkey,
ADD CONSTRAINT comandos_robo_mac_address_fkey 
    FOREIGN KEY (mac_address) 
    REFERENCES saas_frota_robos(mac_address) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- 2. Agora basta limpar a tabela principal. O Supabase cuidará do resto!
UPDATE saas_frota_robos 
SET mac_address = TRIM(mac_address);

-- 3. Opcional: Garantir que tudo seja Uppercase
UPDATE saas_frota_robos 
SET mac_address = UPPER(mac_address);
