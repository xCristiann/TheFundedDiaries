# 🎯 SQL Final pentru Baza de Date - TheFundedDiaries

## ✅ Schema Completă Actualizată

Rulează acest SQL în **Supabase SQL Editor** pentru a crea/actualiza baza de date cu toate câmpurile:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Șterge tabelul vechi dacă există
DROP TABLE IF EXISTS profiles CASCADE;

-- Creează tabelul profiles cu toate câmpurile
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

-- Creează indexuri pentru performanță
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Activează Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politici de securitate
CREATE POLICY p1 ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY p2 ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY p3 ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Funcție pentru a crea automat profilul când se înregistrează un user
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

-- Trigger pentru crearea automată a profilului
DROP TRIGGER IF EXISTS tr2 ON auth.users;
CREATE TRIGGER tr2 AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

## 📋 Câmpuri în Tabelul Profiles

| Câmp | Tip | Descriere |
|------|-----|-----------|
| id | UUID | ID-ul userului (din auth.users) |
| **first_name** | TEXT | Prenume |
| **last_name** | TEXT | Nume |
| **email** | TEXT | Email (preluat automat din auth.users) |
| **city** | TEXT | Oraș |
| **country** | TEXT | Țară |
| role | TEXT | Rol ('user' sau 'admin') |
| created_at | TIMESTAMPTZ | Data creării |

## 🔄 Ce Face Acest SQL

1. **Șterge tabelul vechi** profiles (dacă există)
2. **Creează tabelul nou** cu toate câmpurile: first_name, last_name, email, city, country
3. **Adaugă indexuri** pe role și email pentru performanță
4. **Activează RLS** (Row Level Security)
5. **Creează politici** pentru a proteja datele userilor
6. **Creează funcție** care populează automat profilul când cineva se înregistrează
7. **Creează trigger** care apelează funcția automat

## ⚠️ IMPORTANT

- Acest script va **șterge** tabelul profiles existent
- Dacă ai useri înregistrați, vor trebui să se **re-înregistreze**
- Email-ul este preluat **automat** din `auth.users` prin trigger
- Toate câmpurile sunt **obligatorii** (NOT NULL)

## ✅ După Rulare

Verifică în **Supabase Table Editor** că:
1. Tabelul `profiles` există
2. Are coloanele: id, first_name, last_name, email, city, country, role, created_at
3. Indexurile sunt create
4. Funcția `handle_new_user()` există în Database → Functions
5. Trigger-ul `tr2` este activ pe `auth.users`

## 🧪 Testare

1. Mergi la `/login?mode=signup`
2. Completează formularul cu toate datele
3. Creează contul
4. Verifică în Supabase → Table Editor → profiles
5. Profilul ar trebui să fie creat automat cu toate datele

---

**Gata! Baza de date este configurată complet! 🚀**
