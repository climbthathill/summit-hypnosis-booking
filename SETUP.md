# Summit Hypnosis Booking — Setup Guide

## Prerequisites
- Node.js 18+ (already installed)
- **ethanhillmovement@gmail.com** — for Google Calendar access (create Cloud project from this account)
- **ole@summithypnosis.net** — Gmail app password for sending emails

---

## Step 1 — Install dependencies (already done)

```bash
cd ~/summit-hypnosis-booking
npm install
```

---

## Step 2 — Configure Google OAuth

You need a Google Cloud project to read/write your personal calendar.

> **Sign in as ethanhillmovement@gmail.com** before doing the steps below.

1. Go to https://console.cloud.google.com/
2. Create a new project (e.g. "Summit Hypnosis Booking")
3. Enable the **Google Calendar API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URI: `http://localhost:3000/api/auth`
7. Copy the **Client ID** and **Client Secret**
8. Paste them into `.env`:

```env
GOOGLE_CLIENT_ID="your-client-id-here"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
```

Then run the app (`npm run dev`) and visit:

```
http://localhost:3000/api/auth?action=start
```

Complete the Google sign-in, then copy the **refresh token** shown on screen into `.env`:

```env
GOOGLE_REFRESH_TOKEN="your-refresh-token-here"
```

---

## Step 3 — Configure Gmail for sending emails

1. Enable 2-Factor Authentication on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for "Mail" on "Other (custom name)"
4. Copy the 16-character password into `.env`:

```env
SMTP_PASS="xxxx xxxx xxxx xxxx"
```

---

## Step 4 — Set a cron secret

Open `.env` and change:

```env
CRON_SECRET="change-this-to-a-random-secret"
```

to any random string, e.g.:

```env
CRON_SECRET="summit-hypnosis-abc123xyz"
```

---

## Step 5 — Start the app

```bash
npm run dev
```

Visit `http://localhost:3000` — it redirects to the booking page.

---

## Step 6 — Set up the reminder cron job

Reminders are sent by calling `GET /api/reminders` with a bearer token.
This must be called on a schedule (every 5–10 minutes).

**Option A: macOS launchd (recommended for running locally)**

Create `/Library/LaunchDaemons/net.summithypnosis.reminders.plist` or use a simple crontab:

```bash
crontab -e
```

Add:

```
*/5 * * * * curl -s -H "Authorization: Bearer summit-hypnosis-abc123xyz" http://localhost:3000/api/reminders
```

**Option B: If deployed to Vercel/Render/Railway**

Use their built-in cron feature or an external service like cron-job.org to hit:

```
GET https://your-domain.com/api/reminders
Authorization: Bearer <your-cron-secret>
```

---

## Deploying to summithypnosis.net (Vercel)

### Step A — Push to GitHub

1. Go to github.com → New repository → name it `summit-hypnosis-booking` → Create
2. In your terminal:

```bash
cd ~/summit-hypnosis-booking
git init
git add .
git commit -m "Initial booking app"
git remote add origin https://github.com/YOUR_USERNAME/summit-hypnosis-booking.git
git push -u origin main
```

### Step B — Deploy on Vercel

1. Go to vercel.com → Sign in with GitHub
2. Click **"Add New Project"** → import `summit-hypnosis-booking`
3. Click **"Environment Variables"** and add every variable from your `.env` file:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` → set to `https://summithypnosis.net/api/auth`
   - `GOOGLE_REFRESH_TOKEN`
   - `GOOGLE_CALENDAR_ID`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
   - `OWNER_EMAIL`
   - `NEXT_PUBLIC_APP_URL` → set to `https://summithypnosis.net`
   - `CRON_SECRET`
4. Click **Deploy**

### Step C — Connect your domain

1. In Vercel dashboard → your project → **Settings → Domains**
2. Add `summithypnosis.net` and `www.summithypnosis.net`
3. Vercel will show you DNS records to add — go to wherever summithypnosis.net is registered (GoDaddy, Namecheap, etc.) and add those records
4. SSL is automatic

### Step D — Re-run Google OAuth for production

Since the redirect URI changed to `https://summithypnosis.net/api/auth`:

1. Go to Google Cloud Console → Credentials → your OAuth client → add `https://summithypnosis.net/api/auth` as an authorised redirect URI
2. Visit `https://summithypnosis.net/api/auth?action=start`, complete sign-in, copy the new refresh token
3. Update `GOOGLE_REFRESH_TOKEN` in Vercel environment variables → redeploy

### Step E — Set up reminder cron (free via cron-job.org)

1. Go to cron-job.org → create a free account
2. New cronjob → URL: `https://summithypnosis.net/api/reminders`
3. Add header: `Authorization: Bearer <your-cron-secret>`
4. Schedule: every 5 minutes
5. Save
