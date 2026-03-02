-- ============================================
-- THEFUNDEDDIARIES - BAZA DE DATE COMPLETA
-- ============================================

-- 1. Activează extensia UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Șterge tabelele existente (dacă există)
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS trading_accounts CASCADE;
DROP TABLE IF EXISTS challenges CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Creează tabelul PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Creează tabelul CHALLENGES
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  balance INTEGER NOT NULL,
  profit_target NUMERIC NOT NULL,
  daily_drawdown NUMERIC NOT NULL,
  max_drawdown NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Creează tabelul TRADING_ACCOUNTS
CREATE TABLE trading_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
  account_login TEXT UNIQUE,
  account_password TEXT,
  balance NUMERIC DEFAULT 0,
  equity NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Creează tabelul TRADES
CREATE TABLE trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  lot_size NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  pnl NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Creează tabelul PAYOUTS
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Creează INDEXURI pentru performanță
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX idx_trading_accounts_status ON trading_accounts(status);
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_payouts_account_id ON payouts(account_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- 9. Inserează CHALLENGES implicite
INSERT INTO challenges (type, balance, profit_target, daily_drawdown, max_drawdown, price, active)
VALUES 
  ('two-step', 10000, 10, 5, 10, 99, true),
  ('two-step', 25000, 10, 5, 10, 199, true),
  ('two-step', 50000, 10, 5, 10, 299, true),
  ('two-step', 100000, 10, 5, 10, 499, true),
  ('instant', 10000, 8, 5, 8, 299, true),
  ('instant', 25000, 8, 5, 8, 599, true);

-- 10. Activează ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- 11. POLITICI RLS pentru PROFILES
CREATE POLICY profiles_select_own ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_update_own ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY profiles_select_admin ON profiles 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY profiles_update_admin ON profiles 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 12. POLITICI RLS pentru TRADING_ACCOUNTS
CREATE POLICY accounts_select_own ON trading_accounts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY accounts_insert_own ON trading_accounts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY accounts_select_admin ON trading_accounts 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY accounts_update_admin ON trading_accounts 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY accounts_insert_admin ON trading_accounts 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 13. POLITICI RLS pentru TRADES
CREATE POLICY trades_select_own ON trades 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trading_accounts 
      WHERE trading_accounts.id = trades.account_id 
      AND trading_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY trades_select_admin ON trades 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 14. POLITICI RLS pentru PAYOUTS
CREATE POLICY payouts_select_own ON payouts 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM trading_accounts 
      WHERE trading_accounts.id = payouts.account_id 
      AND trading_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY payouts_insert_own ON payouts 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM trading_accounts 
      WHERE trading_accounts.id = account_id 
      AND trading_accounts.user_id = auth.uid()
    )
  );

CREATE POLICY payouts_select_admin ON payouts 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY payouts_update_admin ON payouts 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 15. POLITICI RLS pentru CHALLENGES (public read, admin write)
CREATE POLICY challenges_select_public ON challenges 
  FOR SELECT USING (active = true OR auth.uid() IS NOT NULL);

CREATE POLICY challenges_all_admin ON challenges 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 16. FUNCȚIE pentru generarea automată a credențialelor trading account
CREATE OR REPLACE FUNCTION generate_trading_account()
RETURNS TRIGGER AS $$
BEGIN
  -- Generează login de 8 cifre (stil MT4/MT5)
  NEW.account_login := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
  
  -- Generează parolă random de 8 caractere
  NEW.account_password := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
  
  -- Setează balance-ul inițial din challenge
  IF NEW.challenge_id IS NOT NULL THEN
    NEW.balance := (SELECT balance FROM challenges WHERE id = NEW.challenge_id);
    NEW.equity := NEW.balance;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 17. TRIGGER pentru generarea automată a credențialelor
DROP TRIGGER IF EXISTS generate_account_credentials ON trading_accounts;
CREATE TRIGGER generate_account_credentials 
  BEFORE INSERT ON trading_accounts 
  FOR EACH ROW 
  WHEN (NEW.account_login IS NULL) 
  EXECUTE FUNCTION generate_trading_account();

-- 18. FUNCȚIE pentru crearea automată a profilului
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email, city, country, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'city', 'Unknown'),
    COALESCE(NEW.raw_user_meta_data->>'country', 'Unknown'),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. TRIGGER pentru crearea automată a profilului
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- FINALIZAT! BAZA DE DATE ESTE GATA!
-- ============================================

-- Verificare: Afișează toate tabelele create
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
