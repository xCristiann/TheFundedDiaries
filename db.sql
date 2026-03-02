CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('one-step', 'two-step', 'instant', 'pay-after-pass')),
  balance INTEGER NOT NULL,
  profit_target NUMERIC NOT NULL,
  daily_drawdown NUMERIC NOT NULL,
  max_drawdown NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
  account_login TEXT NOT NULL UNIQUE,
  account_password TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  equity NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'breached', 'funded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  lot_size NUMERIC NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  pnl NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_status ON trading_accounts(status);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_payouts_account_id ON payouts(account_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

INSERT INTO challenges (type, balance, profit_target, daily_drawdown, max_drawdown, price, active)
VALUES 
  ('two-step', 10000, 10, 5, 10, 99, true),
  ('two-step', 25000, 10, 5, 10, 199, true),
  ('two-step', 50000, 10, 5, 10, 299, true),
  ('two-step', 100000, 10, 5, 10, 499, true),
  ('instant', 10000, 8, 5, 8, 299, true),
  ('instant', 25000, 8, 5, 8, 599, true)
ON CONFLICT DO NOTHING;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trading_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_select_admin ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY accounts_select_own ON trading_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY accounts_insert_own ON trading_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY accounts_select_admin ON trading_accounts FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY accounts_update_admin ON trading_accounts FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY trades_select_own ON trades FOR SELECT USING (EXISTS (SELECT 1 FROM trading_accounts WHERE trading_accounts.id = trades.account_id AND trading_accounts.user_id = auth.uid()));
CREATE POLICY trades_select_admin ON trades FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY payouts_select_own ON payouts FOR SELECT USING (EXISTS (SELECT 1 FROM trading_accounts WHERE trading_accounts.id = payouts.account_id AND trading_accounts.user_id = auth.uid()));
CREATE POLICY payouts_insert_own ON payouts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM trading_accounts WHERE trading_accounts.id = account_id AND trading_accounts.user_id = auth.uid()));
CREATE POLICY payouts_select_admin ON payouts FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));
CREATE POLICY payouts_update_admin ON payouts FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY challenges_select_public ON challenges FOR SELECT USING (active = true OR auth.uid() IS NOT NULL);
CREATE POLICY challenges_all_admin ON challenges FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE OR REPLACE FUNCTION generate_trading_account()
RETURNS TRIGGER AS $$
BEGIN
  NEW.account_login := LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
  NEW.account_password := SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8);
  IF NEW.challenge_id IS NOT NULL THEN
    NEW.balance := (SELECT balance FROM challenges WHERE id = NEW.challenge_id);
    NEW.equity := NEW.balance;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_account_credentials BEFORE INSERT ON trading_accounts FOR EACH ROW WHEN (NEW.account_login IS NULL) EXECUTE FUNCTION generate_trading_account();

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

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
