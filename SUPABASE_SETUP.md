# Bangla-Chain ERP — Supabase Setup Guide

এই গাইড অনুসরণ করলে তোমার ERP যেকোনো device থেকে কাজ করবে এবং Vercel-এ deploy হবে।

---

## Step 1 — Supabase Project তৈরি করো

1. **[supabase.com](https://supabase.com)** → Sign up / Log in
2. **New Project** button click করো
3. Project Name দাও (যেমন: `bangla-chain-erp`)
4. একটি strong database password দাও (**এটি সংরক্ষণ করো**)
5. Region: **Southeast Asia (Singapore)** বেছে নাও
6. **Create new project** click করো (২-৩ মিনিট লাগবে)

---

## Step 2 — Database Schema তৈরি করো

1. Left sidebar → **SQL Editor** click করো
2. **New query** button click করো
3. `supabase/schema.sql` ফাইলটি open করো (এই project-এ আছে)
4. পুরো content কপি করো
5. SQL Editor-এ paste করো
6. **Run** button (▶) click করো
7. `Success. No rows returned` দেখলে সফল হয়েছে

---

## Step 3 — API Keys সংগ্রহ করো

1. Left sidebar → **Settings** → **API**
2. নিচের দুটো value কপি করো:
   - **Project URL** — `https://xxxxx.supabase.co` আকারের
   - **anon / public** key — একটি লম্বা string

---

## Step 4 — Local Development Setup

Project root-এ `.env.local` নামে একটি file তৈরি করো:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ANON_KEY_HERE"
```

> **⚠️ সতর্কতা:** `.env.local` file কখনো git-এ push করবে না। `.gitignore`-এ এটি already আছে।

তারপর dev server চালু করো:

```bash
pnpm dev
```

Browser-এ `http://localhost:3001` খুলো। প্রথমবার login করলে demo data automatically seed হয়ে যাবে।

---

## Step 5 — Vercel Deployment

### 5a. GitHub-এ Push করো

```bash
git add -A
git commit -m "feat: Supabase backend integration"
git push origin main
```

### 5b. Vercel-এ Deploy করো

1. **[vercel.com](https://vercel.com)** → Import your GitHub repository
2. Framework: **Next.js** (auto-detected)
3. **Environment Variables** section-এ নিচের দুটো add করো:
   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | তোমার Supabase Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | তোমার anon key |
4. **Deploy** click করো

### 5c. Supabase-এ Redirect URL Set করো

Vercel deploy হলে তোমার URL পাবে (যেমন: `https://my-erp.vercel.app`)

1. Supabase Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: `https://your-app.vercel.app` দাও
3. **Redirect URLs** → **Add URL**: `https://your-app.vercel.app/auth/callback`
4. **Save** click করো

---

## Login Guide

### Admin Login
- **Email**: তোমার registered email (যেমন: `admin@gmail.com`)
- **Password**: তোমার password (minimum 6 characters)
- নতুন admin account → Login page-এ "Create Account" button

### SR Login
- **SR Username**: SR-এর login username (যেমন: `rakib`)
- **Password**: SR-এর password (যেমন: `rakib123`)
- SR credentials Settings → Routes & SRs থেকে manage করা যায়

---

## Multi-Device Data Sync

Supabase integration এর পরে:
- ✅ যেকোনো device থেকে login করলে same data পাবে
- ✅ এক device-এ challan create করলে অন্য device-এ সাথে সাথে দেখা যাবে (page refresh এর পরে)
- ✅ Password reset email Supabase থেকে automatically পাঠানো হয়
- ✅ প্রতিটি admin-এর data আলাদা (Row Level Security)

---

## Data Architecture

| Data Type | Storage | Notes |
|---|---|---|
| Admin credentials | Supabase Auth | Email + password, hashed |
| SR credentials | `srs` table | username/password (SR-রা Supabase Auth ব্যবহার করে না) |
| All ERP data | Supabase Database | RLS দিয়ে protected |
| Language preference | localStorage | Device-specific UI setting |
| Sidebar state | localStorage | Device-specific UI setting |

---

## Troubleshooting

**"Missing Supabase environment variables"**
→ `.env.local` file check করো। URL এবং anon key ঠিকমতো আছে কিনা দেখো।

**Login করছি কিন্তু data দেখা যাচ্ছে না**
→ SQL Editor-এ schema.sql পুরোটা run করা হয়েছে কিনা confirm করো।

**SR login হচ্ছে না**
→ SR credentials Settings → Routes & SRs page থেকে check করো।

**Vercel deploy-এ error**
→ Vercel dashboard → Settings → Environment Variables-এ দুটো key আছে কিনা দেখো।

---

Made with ❤️ by [Al Mumeetu Saikat](https://almumeetusaikat.me)
