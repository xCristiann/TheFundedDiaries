-- 1. Tabel pentru cupoane de reducere
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Adaugă coloană pentru platformă de trading în trading_accounts
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'tfd-trade';

-- 3. Adaugă coloană pentru adresa de livrare în profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS street_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS postal_code TEXT;

-- 4. Tabel pentru comenzi (orders)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id),
  platform TEXT DEFAULT 'tfd-trade',
  coupon_code TEXT,
  original_price NUMERIC NOT NULL,
  discount_amount NUMERIC DEFAULT 0,
  final_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  street_address TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Index pentru performanță
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(active);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_platform ON trading_accounts(platform);

-- 6. RLS pentru coupons (doar adminii pot vedea și gestiona)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY coupons_admin_all ON coupons
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 7. RLS pentru orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_select_own ON orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY orders_insert_own ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY orders_admin_all ON orders
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- 8. Funcție pentru validare cupon
CREATE OR REPLACE FUNCTION validate_coupon(coupon_code_param TEXT)
RETURNS TABLE (
  valid BOOLEAN,
  discount_type TEXT,
  discount_value NUMERIC,
  message TEXT
) AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  SELECT * INTO coupon_record
  FROM coupons
  WHERE code = coupon_code_param
  AND active = TRUE
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (max_uses IS NULL OR current_uses < max_uses);

  IF coupon_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::TEXT, NULL::NUMERIC, 'Invalid or expired coupon'::TEXT;
  ELSE
    RETURN QUERY SELECT TRUE, coupon_record.discount_type, coupon_record.discount_value, 'Coupon valid'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 9. Funcție pentru incrementare utilizare cupon
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_code_param TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
  SET current_uses = current_uses + 1
  WHERE code = coupon_code_param;
END;
$$ LANGUAGE plpgsql;
