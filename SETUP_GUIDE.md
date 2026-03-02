# 🚀 TheFundedDiaries - Complete Setup Guide

## Step 1: Set Up Supabase Database

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project**:
   - Visit: https://supabase.com/dashboard
   - Select your project: https://dxkslffgqfxgzcgmoyho.supabase.co

2. **Navigate to SQL Editor**:
   - Click on the "SQL Editor" icon in the left sidebar
   - Click "New Query"

3. **Copy and Execute the Schema**:
   - Open the file `/app/supabase-schema.sql` in this project
   - Copy the ENTIRE contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Tables Created**:
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - ✅ profiles
     - ✅ challenges
     - ✅ trading_accounts
     - ✅ trades
     - ✅ payouts

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref dxkslffgqfxgzcgmoyho

# Run the migration
supabase db push --db-url "postgresql://postgres:[YOUR_PASSWORD]@db.dxkslffgqfxgzcgmoyho.supabase.co:5432/postgres"
```

## Step 2: Verify Database Setup

### Check Tables and Data

1. **Go to Table Editor** → **challenges**
   - You should see 6 pre-populated challenges:
     - $10,000 Two-Step ($99)
     - $25,000 Two-Step ($199)
     - $50,000 Two-Step ($299)
     - $100,000 Two-Step ($499)
     - $10,000 Instant ($299)
     - $25,000 Instant ($599)

2. **Verify RLS Policies**:
   - Go to Authentication → Policies
   - Each table should have multiple policies listed

3. **Check Functions**:
   - Go to Database → Functions
   - You should see:
     - `generate_trading_account()`
     - `handle_new_user()`

## Step 3: Test the Application

### 3.1 Test User Signup

1. **Go to**: https://trader-dashboard-v1.preview.emergentagent.com/login?mode=signup

2. **Fill in the form**:
   - Full Name: Test User
   - Email: test@example.com
   - Password: TestPassword123!

3. **Click "Create Account"**

4. **Check your email** for the verification link (if email confirmation is enabled in Supabase)
   - Go to Supabase Dashboard → Authentication → Email Templates
   - For testing, you can disable email confirmation:
     - Go to Authentication → Providers → Email
     - Disable "Confirm email"

5. **Verify in Supabase**:
   - Go to Table Editor → profiles
   - You should see your new user with role='user'

### 3.2 Test Login

1. **Go to**: https://trader-dashboard-v1.preview.emergentagent.com/login

2. **Login with your credentials**

3. **You should be redirected to**: /dashboard

4. **You should see**: "No Trading Accounts Yet" message

### 3.3 Test Challenge Purchase (Manual)

Since Stripe is not integrated yet, you can manually create a trading account:

#### Method 1: Using Supabase Dashboard

1. **Go to Table Editor** → **trading_accounts**
2. **Click "Insert row"**
3. **Fill in**:
   - user_id: [Your user's UUID from profiles table]
   - challenge_id: [Pick any challenge UUID from challenges table]
   - status: active
   - Leave account_login and account_password empty (they'll auto-generate)
4. **Click Save**

#### Method 2: Using the API (via curl)

```bash
# First, get your auth token by logging in and checking browser localStorage
# Then:

curl -X POST https://trader-dashboard-v1.preview.emergentagent.com/api/challenges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -d '{"challengeId": "CHALLENGE_UUID_HERE"}'
```

### 3.4 Verify Trading Account

1. **Refresh the dashboard**
2. **You should now see**:
   - Account selector with your new account
   - MT4/MT5 style 8-digit login number (e.g., "87654321")
   - Balance, Equity, Profit Target, Max Drawdown metrics

## Step 4: Create Admin User

### Make Yourself an Admin

1. **Log in to the app** with your account
2. **Go to Supabase Dashboard** → Table Editor → profiles
3. **Find your profile**
4. **Click the row to edit**
5. **Change `role` from 'user' to 'admin'**
6. **Save**

### Test Admin Features

1. **Log out and log back in**
2. **Go to Dashboard**
3. **You should now see**:
   - Admin Panel section
   - Users list
   - Challenges list
   - Payouts management

## Step 5: Test Complete User Flow

### Scenario: New User Journey

1. ✅ **Visit homepage** → See all marketing sections
2. ✅ **Click "Join the Group"** → Redirected to /login?mode=signup
3. ✅ **Sign up** → Account created, profile created automatically
4. ✅ **Log in** → Redirected to dashboard
5. ✅ **See "No accounts" state** → Clear messaging
6. ✅ **Admin creates trading account** → Using Supabase dashboard
7. ✅ **Refresh dashboard** → See account with credentials
8. ✅ **View metrics** → Balance, Equity, Targets displayed

### Scenario: Admin Journey

1. ✅ **Log in as admin**
2. ✅ **View all users** → See user list with roles
3. ✅ **View challenges** → See all available challenges
4. ✅ **Manage payouts** → Approve/reject pending payouts

## Step 6: Common Issues & Solutions

### Issue 1: "Error: relation 'profiles' does not exist"

**Solution**: Run the SQL schema in Supabase SQL Editor

### Issue 2: "Error: JWT expired"

**Solution**: 
1. Log out
2. Clear browser cookies
3. Log in again

### Issue 3: Can't see trading account after creation

**Solution**: 
1. Check if RLS policies are enabled
2. Verify the user_id matches your profile id
3. Refresh the page

### Issue 4: Auto-generated credentials not working

**Solution**:
1. Go to Supabase → Database → Functions
2. Verify `generate_trading_account()` function exists
3. Check the trigger is attached to trading_accounts table

### Issue 5: Profile not created on signup

**Solution**:
1. Check if `handle_new_user()` function exists
2. Verify the trigger `on_auth_user_created` is active
3. Check auth.users table has your user

## Step 7: Next Steps

### For Development:

1. **Integrate Stripe**:
   - Create Stripe account
   - Add Stripe keys to .env
   - Implement payment flow in /api/challenges/route.js

2. **Build Trading Terminal**:
   - Add MT4/MT5 WebSocket integration
   - Implement chart library (TradingView)
   - Add order execution

3. **Add Email Notifications**:
   - Set up SendGrid or Resend
   - Send account creation emails
   - Send payout approval notifications

4. **Implement Analytics**:
   - Add performance charts
   - Calculate profit/loss
   - Track daily drawdown

### For Production:

1. **Security**:
   - Review RLS policies
   - Add rate limiting
   - Implement CSRF protection

2. **Performance**:
   - Add database indexes
   - Implement caching
   - Optimize queries

3. **Monitoring**:
   - Set up error tracking (Sentry)
   - Add application monitoring
   - Set up uptime monitoring

## 📞 Support

If you encounter any issues:

1. Check the browser console for errors
2. Check Supabase logs (Logs & Analytics section)
3. Review the `/var/log/supervisor/nextjs.out.log` file
4. Verify all environment variables are set correctly

## ✅ Setup Checklist

- [ ] Supabase database schema executed
- [ ] All tables visible in Table Editor
- [ ] RLS policies enabled
- [ ] Functions and triggers created
- [ ] Default challenges inserted
- [ ] Test user account created
- [ ] Test login successful
- [ ] Dashboard accessible
- [ ] Trading account created (manually)
- [ ] Admin user configured
- [ ] Admin panel visible
- [ ] All pages load correctly

Once all items are checked, your TheFundedDiaries platform is ready! 🎉
