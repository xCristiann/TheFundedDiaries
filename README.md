# TheFundedDiaries - Professional Prop Trading Platform

A luxury prop trading firm web application built with Next.js, Supabase, and Tailwind CSS.

## 🎨 Design Features

- **Luxury Dark + Gold Theme** (#8b7306 accent color)
- Fixed pill-style navbar with blur effect
- Glassy card components with premium shadows
- Full-page luxury background with vignette and grain overlay
- Responsive design for all screen sizes

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (Auth + PostgreSQL Database)
- **Icons**: Lucide React

## 📁 Project Structure

```
/app
├── app/
│   ├── page.js              # Marketing homepage
│   ├── login/page.jsx       # Combined login/signup page
│   ├── dashboard/page.jsx   # User dashboard (with admin panel)
│   ├── terminal/page.jsx    # Trading terminal (placeholder)
│   ├── layout.js            # Global layout with navbar
│   └── globals.css          # Global styles & luxury theme
├── components/
│   ├── navbar.jsx           # Fixed navbar component
│   └── glass-card.jsx       # Reusable glassy card component
├── lib/
│   └── supabase/
│       ├── client.js        # Browser Supabase client
│       └── server.js        # Server Supabase client
├── middleware.js            # Auth middleware for protected routes
└── supabase-schema.sql      # Complete database schema
```

## 🗄️ Database Schema

The application uses the following Supabase tables:

### Core Tables

1. **profiles** - User profiles (extends auth.users)
   - `id` (UUID, primary key, references auth.users)
   - `full_name` (TEXT)
   - `role` (TEXT: 'user' or 'admin')
   - `created_at` (TIMESTAMPTZ)

2. **challenges** - Available trading challenges
   - `id` (UUID, primary key)
   - `type` (TEXT: one-step, two-step, instant, pay-after-pass)
   - `balance` (INTEGER)
   - `profit_target` (NUMERIC)
   - `daily_drawdown` (NUMERIC)
   - `max_drawdown` (NUMERIC)
   - `price` (NUMERIC)
   - `active` (BOOLEAN)

3. **trading_accounts** - User trading accounts
   - `id` (UUID, primary key)
   - `user_id` (UUID, references profiles)
   - `challenge_id` (UUID, references challenges)
   - `account_login` (TEXT, auto-generated 8-digit MT4/MT5 style)
   - `account_password` (TEXT, auto-generated)
   - `balance` (NUMERIC)
   - `equity` (NUMERIC)
   - `status` (TEXT: active, breached, funded, failed)

4. **trades** - Trading history
   - `id` (UUID, primary key)
   - `account_id` (UUID, references trading_accounts)
   - `symbol` (TEXT)
   - `type` (TEXT: buy, sell)
   - `lot_size` (NUMERIC)
   - `entry_price` (NUMERIC)
   - `exit_price` (NUMERIC)
   - `pnl` (NUMERIC)

5. **payouts** - Payout requests
   - `id` (UUID, primary key)
   - `account_id` (UUID, references trading_accounts)
   - `amount` (NUMERIC)
   - `status` (TEXT: pending, approved, rejected)

### Special Features

- **Auto-generated Credentials**: Trading accounts automatically get MT4/MT5 style 8-digit login numbers and passwords
- **Row Level Security (RLS)**: Comprehensive policies ensure users only see their own data
- **Admin Access**: Admin users can view and manage all data
- **Automatic Profile Creation**: Profiles are created automatically on user signup

## 🔧 Setup Instructions

### 1. Supabase Configuration

1. Go to your Supabase project: https://dxkslffgqfxgzcgmoyho.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Run the SQL to create all tables, indexes, RLS policies, and functions

### 2. Environment Variables

The `.env` file is already configured with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dxkslffgqfxgzcgmoyho.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_a8PhmxYBAIrOOQZwNG7K2g_4CqiteaZ
```

### 3. Install Dependencies

```bash
cd /app
yarn install
```

### 4. Run Development Server

The server is already running via supervisor. To restart:

```bash
sudo supervisorctl restart nextjs
```

### 5. Create Admin User (Optional)

After creating a user account through the signup page:

1. Go to Supabase Dashboard → Table Editor → profiles
2. Find your user
3. Change the `role` field from 'user' to 'admin'
4. Log out and log back in to see the admin panel

## 📱 Pages & Features

### Marketing Homepage (/)

- **Hero Section**: Centered title with gold gradient and CTA button
- **Programs Section**: 3 cards showing different challenge types
- **Select Challenge Section**: 3 cards with pricing and details
- **Why Choose Us Section**: 5 feature cards in grid layout
- **Payouts Section**: Success stories table with status badges

All "Join the Group" and "Get Started" buttons link to `/login?mode=signup`

### Auth Page (/login)

- **Two-column layout** (marketing left, form right)
- **Single page with tabs** for login/signup toggle
- **Query param support**: `/login?mode=signup` opens signup tab
- **Supabase authentication** with email/password
- **Automatic profile creation** on signup

### Dashboard (/dashboard)

**For Regular Users:**
- Account selector dropdown
- Real-time metrics (Balance, Equity, Profit Target, Max Drawdown)
- Trading account credentials
- Status tracking

**For Admin Users (role='admin'):**
- All user features PLUS:
- **Users Management**: View all users and their roles
- **Challenges Management**: View all available challenges
- **Payouts Management**: Approve/reject payout requests

### Terminal (/terminal)

- Placeholder page for future trading interface
- Protected route (requires authentication)

## 🔐 Authentication & Security

- **Middleware Protection**: Dashboard and Terminal routes require authentication
- **Row Level Security**: Database-level access control
- **Role-based Access**: Admin panel only visible to admin users
- **Session Management**: Automatic session refresh via middleware

## 🎯 Key Features

### Auto-generated Trading Accounts

When a user purchases a challenge (Stripe integration to be added later):

1. A new trading account is automatically created
2. MT4/MT5 style 8-digit account login is generated (e.g., "87654321")
3. Random password is generated
4. Initial balance is set from the challenge
5. Status is set to "active"

### Admin Capabilities

Admins can:
- View all users and their information
- Create and manage trading challenges
- View all trading accounts
- Approve or reject payout requests
- Monitor platform activity

## 🚧 Coming Soon

- **Stripe Integration**: Payment processing for challenge purchases
- **Trading Terminal**: Full MT4/MT5 style trading interface
- **Live Market Data**: Real-time price feeds
- **Advanced Analytics**: Performance charts and statistics
- **Email Notifications**: Account status updates and alerts

## 🎨 Design System

### Colors

- **Primary Gold**: #8b7306
- **Background**: Black (#000000) with gradient overlays
- **Text**: White and gray shades
- **Borders**: Gold with transparency

### Components

- **GlassCard**: Reusable component with backdrop blur, gold borders, and shadows
- **Navbar**: Fixed top position, pill shape, blur effect
- **Buttons**: Gold gradient with hover effects
- **Tables**: Clean layout with status badges

## 📝 Notes

- The app uses Next.js App Router (not Pages Router)
- All components use "use client" directive where needed
- Supabase handles both authentication and database
- No duplicate routes (single `/login` route)
- Responsive design works on mobile, tablet, and desktop

## 🔗 URLs

- **Homepage**: https://trader-dashboard-v1.preview.emergentagent.com/
- **Login**: https://trader-dashboard-v1.preview.emergentagent.com/login
- **Signup**: https://trader-dashboard-v1.preview.emergentagent.com/login?mode=signup
- **Dashboard**: https://trader-dashboard-v1.preview.emergentagent.com/dashboard
- **Terminal**: https://trader-dashboard-v1.preview.emergentagent.com/terminal

## 💡 Development Tips

1. **Check logs**: `tail -f /var/log/supervisor/nextjs.out.log`
2. **Restart server**: `sudo supervisorctl restart nextjs`
3. **View Supabase errors**: Check browser console for detailed error messages
4. **Test RLS policies**: Try accessing data from different user accounts

---

Built with ❤️ using Next.js, Supabase, and Tailwind CSS
