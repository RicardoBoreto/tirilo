-- Enable RLS
ALTER TABLE IF EXISTS "public"."planos_intervencao_ia" ENABLE ROW LEVEL SECURITY;

-- Create generic policy for authenticated users (Select, Insert, Update, Delete)
CREATE POLICY "Enable all access for authenticated users" 
ON "public"."planos_intervencao_ia"
AS PERMISSIVE FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
