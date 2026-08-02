# Setup Guide

## Requirements

- Node.js 18+ (Node 22 recommended: `@supabase/supabase-js` warns on older versions)
- npm
- Supabase CLI (only needed for the production database)

## Local development (JSON backend)

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

`DATA_BACKEND=json` keeps everything in `.data/loyalty-store.json`, which is
git-ignored. Reset it any time by re-running `npm run seed`.

Authentication is skipped locally: the middleware only enforces a Supabase
session when the Supabase environment variables are present.

## Local development against Supabase

1. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, and `SUPERMED_TENANT_ID` in `.env.local`.
2. Set `DATA_BACKEND=supabase`.
3. Apply the migrations and seed (see `docs/DEPLOYMENT_GUIDE.md`).

## Checks

```bash
npm run build
npm run lint
npm test
```
