-- Allow users to update their own user record
CREATE POLICY "Users can update own record" ON usuarios
FOR UPDATE
USING (auth.uid() = id);

-- Allow users to view their own curriculum (already covered by select policy usually, but ensuring)
-- Allow users to insert their own curriculum
CREATE POLICY "Users can insert own curriculum" ON terapeutas_curriculo
FOR INSERT
WITH CHECK (auth.uid() = id_usuario);

-- Allow users to update their own curriculum
CREATE POLICY "Users can update own curriculum" ON terapeutas_curriculo
FOR UPDATE
USING (auth.uid() = id_usuario);
