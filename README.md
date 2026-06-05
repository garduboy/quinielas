# PoolFC — Soccer Prediction Pool

A Next.js app for running a soccer prediction pool with friends.

## Tech Stack
- **Next.js 14** — React framework with App Router
- **Supabase** — Auth + PostgreSQL database + real-time
- **Tailwind CSS** — Styling
- **football-data.org** — Free API for match data

## Getting Started

### 1. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Set up Supabase
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `supabase-schema.sql`
3. Copy your Project URL and anon key from Settings → API

### 3. Configure environment variables
\`\`\`bash
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and football-data.org key
\`\`\`

### 4. Run the dev server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000)

## Project Structure
\`\`\`
src/
  app/
    matches/        → Pick predictions for upcoming matches
    leaderboard/    → Pool standings
    results/        → Your past prediction results
    api/
      matches/      → GET matches from DB (or football-data.org)
      predictions/  → POST save user picks
  lib/
    supabase.ts     → Supabase client
    types.ts        → TypeScript types
    scoring.ts      → Points calculation logic
\`\`\`

## Deploying to Vercel
1. Push to GitHub
2. Connect repo at [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy — done!
