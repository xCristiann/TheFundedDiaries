# 🚀 SETUP COMPLET - TheFundedDiaries

## 📋 Script SQL Complet

Fișierul este: **`/app/FINAL_DATABASE_SETUP.sql`**

## ⚡ Pași Rapizi

### 1. Rulează SQL-ul în Supabase

1. Mergi la **Supabase Dashboard**: https://supabase.com/dashboard
2. Selectează proiectul tău
3. Click pe **SQL Editor** (din sidebar stânga)
4. Click pe **New Query**
5. Deschide fișierul `/app/FINAL_DATABASE_SETUP.sql`
6. **Copiază TOT conținutul**
7. **Lipește** în SQL Editor
8. Click pe **RUN** (sau Ctrl+Enter)

### 2. Verifică că totul a mers bine

După rulare, ar trebui să vezi:
- ✅ 5 tabele create
- ✅ 6 challenge-uri inserate
- ✅ Trigger-e și funcții create

**Verificare în Table Editor:**
- `profiles` (gol deocamdată)
- `challenges` (6 rânduri)
- `trading_accounts` (gol)
- `trades` (gol)
- `payouts` (gol)

## 🎯 Ce Face Script-ul?

### Creează 5 Tabele:

1. **profiles** - Utilizatori
   - id, first_name, last_name, email, city, country, role

2. **challenges** - Challenge-uri disponibile
   - type, balance, profit_target, daily_drawdown, max_drawdown, price

3. **trading_accounts** - Conturi de trading
   - user_id, challenge_id, account_login (8 cifre), account_password, balance, equity, status

4. **trades** - Tranzacții
   - account_id, symbol, type, lot_size, entry_price, exit_price, pnl

5. **payouts** - Plăți
   - account_id, amount, status

### Inserează Challenge-uri:

- $10,000 Two-Step - $99
- $25,000 Two-Step - $199
- $50,000 Two-Step - $299
- $100,000 Two-Step - $499
- $10,000 Instant - $299
- $25,000 Instant - $599

### Setează Securitate:

✅ Row Level Security (RLS) pe toate tabelele
✅ Politici pentru utilizatori normali (văd doar datele lor)
✅ Politici pentru admini (văd tot)

### Creează Automatizări:

✅ **Trigger 1:** Când cineva se înregistrează → se creează automat profilul
✅ **Trigger 2:** Când se creează un trading account → se generează automat login (8 cifre) și parolă

## 🧪 Testare

### Test 1: Creează un Cont

1. Mergi la: https://trader-dashboard-v1.preview.emergentagent.com/login?mode=signup
2. Completează formularul:
   - First Name: John
   - Last Name: Doe
   - Email: john@test.com
   - Password: test123456
   - City: Bucharest
   - Country: Romania
   - ✅ Bifează "I agree to Terms"
3. Click **Create Account**
4. Verifică în Supabase → Table Editor → `profiles`
5. Ar trebui să vezi un rând nou cu datele tale

### Test 2: Login

1. Mergi la: https://trader-dashboard-v1.preview.emergentagent.com/login
2. Login cu email și parola
3. Vei fi redirectat la Dashboard
4. Vei vedea "No Trading Accounts Yet" (normal, pentru că nu ai încă conturi)

### Test 3: Setează-te Admin

1. Mergi în Supabase → Table Editor → `profiles`
2. Găsește contul tău (john@test.com)
3. Click pe row
4. Editează coloana `role`
5. Schimbă din `user` în `admin`
6. Save
7. Logout din app și login din nou
8. Vei vedea badge-ul "Admin" și menu items extra (Manage Users, Challenges, All Payouts)

### Test 4: Creează un Trading Account (Manual)

1. Mergi în Supabase → Table Editor → `trading_accounts`
2. Click **Insert row**
3. Completează:
   - `user_id`: [Copiază UUID-ul tău din profiles]
   - `challenge_id`: [Copiază un UUID din challenges table]
   - `status`: active
   - Lasă `account_login` și `account_password` goale (se vor genera automat)
4. Click **Save**
5. Refresh pagina
6. Vei vedea că `account_login` (ex: 12345678) și `account_password` (ex: a3f7c9d2) au fost generate automat!
7. Reîncarcă Dashboard-ul
8. Vei vedea contul tău în secțiunea "Accounts"

## 📊 Structură Completă

```
profiles
├── id (UUID) → din auth.users
├── first_name (TEXT)
├── last_name (TEXT)
├── email (TEXT)
├── city (TEXT)
├── country (TEXT)
├── role (TEXT) → 'user' sau 'admin' ⭐
└── created_at (TIMESTAMPTZ)

challenges
├── id (UUID)
├── type (TEXT) → 'two-step', 'instant', etc.
├── balance (INTEGER) → 10000, 25000, etc.
├── profit_target (NUMERIC) → 10%
├── daily_drawdown (NUMERIC) → 5%
├── max_drawdown (NUMERIC) → 10%
├── price (NUMERIC) → $99, $199, etc.
└── active (BOOLEAN)

trading_accounts
├── id (UUID)
├── user_id (UUID) → referință la profiles
├── challenge_id (UUID) → referință la challenges
├── account_login (TEXT) → generat automat (8 cifre) ⭐
├── account_password (TEXT) → generat automat ⭐
├── balance (NUMERIC)
├── equity (NUMERIC)
└── status (TEXT) → 'active', 'funded', 'breached', 'failed'

payouts
├── id (UUID)
├── account_id (UUID) → referință la trading_accounts
├── amount (NUMERIC)
└── status (TEXT) → 'pending', 'approved', 'rejected'
```

## 🔑 Role în Baza de Date

### User Normal (role='user')
- Vede doar propriile conturi
- Vede doar propriile payouts
- NU are acces la datele altor utilizatori

### Admin (role='admin')
- Vede TOATE conturile
- Vede TOATE payouts
- Poate aproba payouts
- Vede toți utilizatorii în "Manage Users"

## 🎨 Dashboard Features

După ce ai cont și te-ai logat:

**Sidebar Stânga:**
- Profile info (nume, email, badge admin)
- Terminal (coming soon)
- **Accounts** → Conturile tale cu login/password
- **Metrics** → Metrici detaliate (balance, equity, target, drawdown)
- **Payouts** → Istoric plăți
- Certificates (coming soon)
- Logout (jos)

**Dacă ești Admin (+):**
- Manage Users → Vezi toți userii
- Challenges → Vezi toate challenge-urile
- All Payouts → Aprobă plăți

## ✅ Checklist Setup

- [ ] Rulat SQL-ul în Supabase
- [ ] Verificat că tabelele există
- [ ] Creat un cont prin signup
- [ ] Verificat că profilul a fost creat automat
- [ ] Făcut login
- [ ] Setat role='admin' pentru test
- [ ] Creat un trading account manual
- [ ] Verificat că login/password au fost generate automat
- [ ] Testat dashboard-ul
- [ ] Testat secțiunile admin

---

**Totul este gata! Baza de date este COMPLET configurată! 🎉**
