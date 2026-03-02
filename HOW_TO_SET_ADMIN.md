# 🔧 Cum să Setezi un Utilizator ca Admin

## Problema
Nu apare butonul admin pe dashboard chiar dacă ai setat `role='admin'` în baza de date.

## Soluție: Pași Exacți

### Pasul 1: Rulează SQL pentru Politici RLS
Deschide Supabase SQL Editor și rulează tot din fișierul `/app/FIX_ADMIN_POLICIES.sql`

Aceasta va repara politicile RLS pentru ca utilizatorii să-și poată citi propriul rol.

### Pasul 2: Setează Role-ul în Baza de Date

**În Supabase Table Editor:**

1. Click pe **Table Editor** (sidebar stânga)
2. Selectează tabelul **`profiles`**
3. Găsește user-ul tău după email
4. Click pe **row-ul** respectiv
5. În coloana **`role`** schimbă din `user` în **`admin`**
6. Click **Save** (sau Enter)

**SAU prin SQL:**

```sql
-- Înlocuiește cu email-ul tău
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';
```

### Pasul 3: LOGOUT și LOGIN ⭐ (CEL MAI IMPORTANT)

**NU merge dacă doar refreshuiești pagina!**

1. În aplicație, click pe **Logout** (jos în sidebar)
2. **Așteaptă** să fii redirectat la homepage
3. Click pe **Login**
4. Introdu email și parola
5. După login, vei vedea:
   - Badge **"Admin"** sub numele tău în sidebar
   - 3 menu items noi:
     - **Manage Challenges** (primul)
     - **Manage Users**
     - **All Payouts**

### Pasul 4: Verificare

După login, în sidebar ar trebui să vezi:

```
┌─────────────────────────┐
│ John Doe                │
│ john@example.com        │
│ [Admin] ← badge blue    │
├─────────────────────────┤
│ ⚡ Terminal             │
│ 👤 Accounts             │
│ 📊 Metrics              │
│ 💰 Payouts              │
│ 📜 Certificates         │
├─────────────────────────┤
│ 🏆 Manage Challenges   │← DOAR ADMIN
│ 👥 Manage Users        │← DOAR ADMIN
│ 💳 All Payouts         │← DOAR ADMIN
├─────────────────────────┤
│ 🚪 Logout              │
└─────────────────────────┘
```

## Debugging

### Verifică în Browser Console:

1. Deschide aplicația
2. Apasă **F12** (Developer Tools)
3. Mergi la **Console**
4. Scrie:
```javascript
// Verifică user-ul curent
const { createClient } = await import('./lib/supabase/client.js')
const supabase = createClient()
const { data } = await supabase.from('profiles').select('*').eq('id', (await supabase.auth.getUser()).data.user.id).single()
console.log('Profile:', data)
console.log('Role:', data.role)
```

Ar trebui să vezi: `Role: 'admin'`

### Verifică în Supabase:

1. Mergi la Supabase → **Table Editor** → **profiles**
2. Găsește user-ul tău
3. Verifică că:
   - Coloana `role` = **'admin'** (nu 'user')
   - Email-ul este corect
   - `id` matches user-ul din **Authentication** → **Users**

### Verifică Auth Session:

În browser console:
```javascript
const { createClient } = await import('./lib/supabase/client.js')
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
console.log('User ID:', user.id)
```

Apoi compară acest ID cu ID-ul din tabelul `profiles`.

## Common Issues

### 1. "Am setat admin dar nu văd badge-ul"
→ **Soluție:** Fă LOGOUT și LOGIN din nou

### 2. "Am făcut logout/login dar tot nu văd"
→ **Soluție:** 
- Verifică în Supabase că role='admin' (nu 'Admin' sau altceva)
- Rulează SQL-ul din FIX_ADMIN_POLICIES.sql
- Șterge cookies din browser (Ctrl+Shift+Delete)
- Logout și login din nou

### 3. "Badge-ul apare dar nu văd menu items admin"
→ **Soluție:** Hard refresh (Ctrl+Shift+R) sau închide/deschide browser

### 4. "Eroare: permission denied"
→ **Soluție:** Rulează FIX_ADMIN_POLICIES.sql pentru a repara RLS

## Quick Test

După ce ai setat admin și ai făcut logout/login:

1. **Mergi la Dashboard**
2. **Caută badge-ul "Admin"** sub email
3. **Caută "Manage Challenges"** în meniu
4. **Click pe "Manage Challenges"**
5. **Ar trebui să vezi:**
   - Buton "Add New Challenge" (verde)
   - Tabel cu toate challenges
   - Butoane Edit și Delete

## SQL Rapid pentru Admin

```sql
-- Vezi toți adminii
SELECT id, first_name, last_name, email, role 
FROM profiles 
WHERE role = 'admin';

-- Setează admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your@email.com';

-- Verifică că a mers
SELECT first_name, last_name, email, role 
FROM profiles 
WHERE email = 'your@email.com';
```

---

**IMPORTANT: După orice schimbare de rol în baza de date, ÎNTOTDEAUNA fă LOGOUT și LOGIN! 🔑**
