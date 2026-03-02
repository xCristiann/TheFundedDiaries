-- Șterge challenge-urile vechi și inserează toate tipurile noi
DELETE FROM challenges;

-- 1-Step Challenges (10k - 200k)
INSERT INTO challenges (type, balance, profit_target, daily_drawdown, max_drawdown, price, active)
VALUES 
  ('one-step', 10000, 10, 5, 10, 99, true),
  ('one-step', 25000, 10, 5, 10, 179, true),
  ('one-step', 50000, 10, 5, 10, 299, true),
  ('one-step', 100000, 10, 5, 10, 499, true),
  ('one-step', 200000, 10, 5, 10, 899, true);

-- 2-Step Challenges (10k - 200k)
INSERT INTO challenges (type, balance, profit_target, daily_drawdown, max_drawdown, price, active)
VALUES 
  ('two-step', 10000, 8, 5, 10, 79, true),
  ('two-step', 25000, 8, 5, 10, 149, true),
  ('two-step', 50000, 8, 5, 10, 249, true),
  ('two-step', 100000, 8, 5, 10, 399, true),
  ('two-step', 200000, 8, 5, 10, 699, true);

-- Pay After You Pass Challenges (10k - 200k)
INSERT INTO challenges (type, balance, profit_target, daily_drawdown, max_drawdown, price, active)
VALUES 
  ('pay-after-pass', 10000, 10, 5, 10, 0, true),
  ('pay-after-pass', 25000, 10, 5, 10, 0, true),
  ('pay-after-pass', 50000, 10, 5, 10, 0, true),
  ('pay-after-pass', 100000, 10, 5, 10, 0, true),
  ('pay-after-pass', 200000, 10, 5, 10, 0, true);
