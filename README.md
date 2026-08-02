# Supermed Pharmacy Loyalty MVP

Staff-facing loyalty system for Supermed Pharmacy: register customers, assign
physical loyalty cards, record purchases, award points, and redeem them.

## Data backends

Every read and write goes through one repository interface (`src/lib/db`), with
two interchangeable implementations:

| `DATA_BACKEND` | Storage | Use |
|---|---|---|
| `json` | `.data/loyalty-store.json` | local development only — writes to disk, so it cannot run on Vercel |
| `supabase` | Supabase Postgres | production source of truth |

If `DATA_BACKEND` is unset, the app uses Supabase when `NEXT_PUBLIC_SUPABASE_URL`
and `SUPABASE_SERVICE_ROLE_KEY` are present, and the JSON store otherwise.

## Run locally

```bash
npm install
cp .env.example .env.local   # DATA_BACKEND=json is enough for local work
npm run seed                 # loads 20 sample cards (SM000001…) into the JSON store
npm run dev
```

Open http://localhost:3000.

## Checks

```bash
npm run build
npm run lint
npm test
```

## Points

`points = floor(purchase amount × points_multiplier)`, multiplier default `1`
(so `$42.75` earns `42` points). The multiplier is stored per environment: in
`app_settings` on Supabase, in the JSON file locally.

## Key endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/v1/health` | backend status and record counts |
| GET/POST | `/api/v1/cards` | list card inventory / load new card numbers |
| GET/POST | `/api/v1/customers` | list or look up by phone / register |
| GET | `/api/v1/customers/search?q=` | search by name, phone, or card number |
| GET | `/api/v1/customers/[id]` | profile plus transaction history |
| GET | `/api/v1/customers/[id]/balance` | current points balance |
| GET/POST | `/api/v1/transactions` | history / record purchase or redemption |
| POST | `/api/v1/redemptions` | redeem points |
| GET/POST | `/api/v1/settings` | read or change the points multiplier |

## Deployment

See `docs/DEPLOYMENT_GUIDE.md` for the Supabase and Vercel setup steps.
