-- Verifică și actualizează politicile RLS pentru profiles

-- Șterge politicile vechi
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_select_admin ON profiles;
DROP POLICY IF EXISTS profiles_update_admin ON profiles;

-- Recreează politici mai bune
-- 1. Utilizatorii pot vedea propriul profil (inclusiv rolul lor)
CREATE POLICY profiles_select_own ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- 2. Utilizatorii pot actualiza propriul profil
CREATE POLICY profiles_update_own ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- 3. Adminii pot vedea toate profilurile
CREATE POLICY profiles_select_all_admin ON profiles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4. Adminii pot actualiza toate profilurile (inclusiv rolurile)
CREATE POLICY profiles_update_all_admin ON profiles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Verifică politicile
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
