# LaceUp Client Handoff

Web app for managing WMS implementation specs per client.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Environment variables
Edit `.env` and add your Anthropic API key:
```
VITE_SUPABASE_URL=https://safggbmmjkxbpqwvlvja.supabase.co
VITE_SUPABASE_KEY=sb_publishable_o0fBWcLxi3PB6McoyTa4kg_n8SxD0hJ
VITE_ANTHROPIC_KEY=sk-ant-...your key here...
```

### 3. Run locally
```bash
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → Import your repo
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_KEY`  
   - `VITE_ANTHROPIC_KEY`
4. Deploy

## Adding/removing questions

Edit the `SECTIONS` array in `src/App.jsx`.
Each field: `{ k: "unique_key", l: "Label text", t: "text"|"area"|"yn" }`
