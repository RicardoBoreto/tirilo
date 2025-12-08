-- Add id_terapeuta to contratos table
ALTER TABLE contratos 
ADD COLUMN id_terapeuta UUID REFERENCES usuarios(id);

-- Create index for faster lookup
CREATE INDEX idx_contratos_terapeuta ON contratos(id_terapeuta);
