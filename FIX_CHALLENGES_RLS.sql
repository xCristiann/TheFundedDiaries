-- 1. Adaugă coloana "rules" la challenges
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS rules TEXT;

-- 2. Repară politicile RLS pentru challenges
DROP POLICY IF EXISTS challenges_select_public ON challenges;
DROP POLICY IF EXISTS challenges_all_admin ON challenges;

-- Oricine autentificat poate vedea challenges active
CREATE POLICY challenges_select_authenticated ON challenges 
  FOR SELECT 
  TO authenticated
  USING (active = true OR auth.uid() IS NOT NULL);

-- Adminii pot face orice cu challenges
CREATE POLICY challenges_insert_admin ON challenges 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY challenges_update_admin ON challenges 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY challenges_delete_admin ON challenges 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
