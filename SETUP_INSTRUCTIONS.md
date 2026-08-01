# Supermed Customer Platform — Backend Setup Guide

## 📋 Quick Start (5 Minutes)

```bash
# 1. Clone or create new Next.js project
npx create-next-app@latest supermed-loyalty --typescript --tailwind

# 2. Navigate to project
cd supermed-loyalty

# 3. Copy all files from this package into your project directory
# (Follow the directory structure below)

# 4. Install dependencies
npm install

# 5. Initialize Supabase
npm install -g supabase
supabase init

# 6. Set up environment variables
cp .env.example .env.local

# 7. Start local database
supabase start

# 8. Deploy schema
supabase db push

# 9. Start development server
npm run dev

# 10. Create feature branch
git checkout -b feat/backend-mvp
```

---

## 📁 Complete Directory Structure

```
supermed-loyalty/
├── .env.example                    # Environment template
├── .env.local                      # Local secrets (DO NOT COMMIT)
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config
├── next.config.js                  # Next.js config
├── jest.config.js                  # Testing config
├── eslint.config.js                # Linting config
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── customers/
│   │   │       │   ├── enroll/
│   │   │       │   │   └── route.ts
│   │   │       │   ├── [id]/
│   │   │       │   │   ├── balance/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   ├── timeline/
│   │   │       │   │   │   └── route.ts
│   │   │       │   │   └── preferences/
│   │   │       │   │       └── route.ts
│   │   │       │   └── search/
│   │   │       │       └── route.ts
│   │   │       ├── transactions/
│   │   │       │   └── route.ts
│   │   │       ├── redemptions/
│   │   │       │   └── route.ts
│   │   │       ├── rewards/
│   │   │       │   └── route.ts
│   │   │       ├── audit/
│   │   │       │   └── route.ts
│   │   │       └── health/
│   │   │           └── route.ts
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client initialization
│   │   ├── auth.ts                 # Authentication helpers
│   │   ├── jwt.ts                  # JWT token handling
│   │   ├── constants.ts            # App constants
│   │   └── validation/
│   │       └── schemas.ts          # Zod validation schemas
│   │
│   ├── services/
│   │   ├── customer/
│   │   │   ├── index.ts
│   │   │   ├── enrollment.service.ts
│   │   │   ├── search.service.ts
│   │   │   └── preferences.service.ts
│   │   ├── loyalty/
│   │   │   ├── index.ts
│   │   │   ├── points.service.ts
│   │   │   ├── redemption.service.ts
│   │   │   ├── rewards.service.ts
│   │   │   └── rules-engine.ts
│   │   ├── cards/
│   │   │   ├── index.ts
│   │   │   ├── issuance.service.ts
│   │   │   ├── lifecycle.service.ts
│   │   │   └── qrcode.service.ts
│   │   ├── timeline/
│   │   │   ├── index.ts
│   │   │   └── events.service.ts
│   │   ├── accounting/
│   │   │   ├── index.ts
│   │   │   └── financial.service.ts
│   │   ├── audit/
│   │   │   └── logger.ts
│   │   └── notifications/
│   │       ├── index.ts
│   │       └── sender.service.ts
│   │
│   ├── utils/
│   │   ├── errors.ts               # Error handling
│   │   ├── response.ts             # API response formatting
│   │   ├── idempotency.ts          # Idempotency key management
│   │   ├── phone.ts                # Phone number utilities
│   │   ├── logger.ts               # Logging utility
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── index.ts                # Database types
│   │   ├── customer.ts
│   │   ├── loyalty.ts
│   │   ├── cards.ts
│   │   └── api.ts
│   │
│   └── middleware.ts               # Next.js middleware
│
├── supabase/
│   ├── config.toml                 # Supabase local config
│   ├── migrations/
│   │   └── 20240101000000_initial_schema.sql
│   ├── seed.sql                    # Database seed data
│   └── functions/
│       └── (edge functions, if needed)
│
├── tests/
│   ├── unit/
│   │   ├── customer.test.ts
│   │   ├── loyalty.test.ts
│   │   └── rules.test.ts
│   └── integration/
│       └── e2e-flows.test.ts
│
├── scripts/
│   ├── seed.ts                     # Database seeding script
│   └── init-tenant.ts              # Initialize test tenant
│
├── docs/
│   ├── ARCHITECTURE_DECISIONS.md
│   ├── DATABASE_CHANGELOG.md
│   ├── BACKEND_PROGRESS.md
│   ├── API_DESIGN.md
│   └── DEPLOYMENT_GUIDE.md
│
└── public/
    └── (static assets)
```

---

## 🔐 Environment Setup

### Step 1: Create `.env.local`

Copy from `.env.example` and fill in your secrets:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_DB_PASSWORD=YOUR_DB_PASSWORD

# JWT Secret (generate: openssl rand -hex 32)
JWT_SECRET=your-super-secret-key-min-32-chars

# Notifications (Twilio - optional for MVP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Feature Flags
ENABLE_OFFLINE_MODE=true
ENABLE_RATE_LIMITING=true

# Environment
NODE_ENV=development
```

### Step 2: Generate JWT Secret

```bash
openssl rand -hex 32
# Copy output to JWT_SECRET in .env.local
```

---

## 🗄️ Database Setup

### Step 1: Start Supabase Locally

```bash
supabase start
# Wait for services to start
# You'll see the DB URL, API URL, and key in the output
```

### Step 2: Deploy Schema

```bash
# Copy the migration file into supabase/migrations/
supabase db push

# Verify schema deployed
supabase db pull
```

### Step 3: Seed Development Data

```bash
# Run seed script
npm run seed

# Or manually:
supabase db push --seed
```

---

## 📦 Installation & Development

### Install Dependencies

```bash
npm install
```

### Generate Supabase Types

```bash
supabase gen types typescript --local > src/types/database.ts
```

### Start Development Server

```bash
npm run dev
# Open http://localhost:3000
```

### Type Check

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Format Code

```bash
npm run format
```

---

## 🧪 Testing

### Run Unit Tests

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm test -- --coverage
```

---

## 📚 API Documentation

### All Endpoints (MVP)

#### Customers

**POST /api/v1/customers/enroll**
- Enroll new customer
- Body: `{ phone_e164, full_name, consent_given, idempotency_key }`
- Returns: `{ customer_id, card_code, card_id, virtual_card_url, points_balance }`

**GET /api/v1/customers/[id]/balance**
- Get customer balance & next reward
- Returns: `{ points_balance, tier_name, next_reward }`

**GET /api/v1/customers/[id]/timeline**
- Get customer's event timeline
- Returns: `{ events: [...], count }`

**POST /api/v1/customers/[id]/preferences**
- Update communication preferences
- Body: `{ preferred_channel, consent_marketing_given }`

**GET /api/v1/customers/search**
- Search customer by phone
- Query: `?phone_e164=+263771234567`
- Returns: `{ customer_summary }`

#### Transactions & Points

**POST /api/v1/transactions**
- Record customer purchase and award points
- Body: `{ customer_id, amount_usd, currency, idempotency_key }`
- Returns: `{ ledger_id, points_earned, new_balance }`

**POST /api/v1/redemptions**
- Redeem reward for points
- Body: `{ customer_id, reward_id, idempotency_key }`
- Returns: `{ redemption_id, points_spent, new_balance }`

#### Rewards

**GET /api/v1/rewards**
- Get active rewards
- Query: `?limit=50&offset=0`
- Returns: `{ rewards: [...], count }`

#### Audit

**GET /api/v1/audit**
- Get audit log (admin only)
- Query: `?entity_type=customers&action=enrolled&limit=50`
- Returns: `{ entries: [...], count }`

#### Health

**GET /api/v1/health**
- Health check
- Returns: `{ status, database, timestamp }`

---

## 🚀 Common Development Tasks

### Add New Service

1. Create file in `src/services/[module]/[feature].service.ts`
2. Implement service functions
3. Export from `src/services/[module]/index.ts`
4. Create API route in `src/app/api/v1/[endpoint]/route.ts`
5. Add validation schema in `src/lib/validation/schemas.ts`
6. Write unit tests in `tests/unit/[feature].test.ts`

### Add Database Schema Change

1. Create migration: `supabase migration new add_feature_x`
2. Edit `supabase/migrations/YYYYMMDDHHMMSS_add_feature_x.sql`
3. Test locally: `supabase db push`
4. Verify: `supabase db pull`
5. Commit with git

### Test API Endpoint

```bash
# Using curl
curl -X POST http://localhost:3000/api/v1/customers/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "phone_e164": "+263771234567",
    "full_name": "Test Customer",
    "consent_given": true,
    "idempotency_key": "00000000-0000-0000-0000-000000000000"
  }'

# Or using REST Client extension in VS Code
# See .http files in project root
```

---

## 🔍 Debugging

### View Logs

```bash
# Application logs
tail -f .next/logs/app.log

# Database logs
supabase logs tail

# Watch for errors
npm run lint:watch
```

### Debug Database Queries

```bash
# Connect to local DB
supabase db connect

# Run SQL directly
SELECT * FROM customers LIMIT 10;
```

### Debug API Requests

1. Open DevTools in Chrome
2. Network tab
3. Check headers and payload
4. View Sentry errors (production)

---

## 📤 Deployment

### Deploy to Vercel

```bash
# Link project
vercel link

# Deploy preview
vercel

# Deploy production
vercel --prod
```

### Deploy Database Migrations

```bash
# Push migrations to production
supabase db push --linked

# Verify
supabase db pull
```

### Environment Variables on Vercel

1. Go to Vercel Dashboard
2. Project → Settings → Environment Variables
3. Add all from `.env.example` (use production Supabase keys)
4. Redeploy

### Database Backups

```bash
# Automatic backups (Supabase Pro)
# Manual backup:
supabase db dump --linked > backup.sql

# Restore from backup
supabase db restore < backup.sql
```

---

## ✅ Pre-Launch Checklist

- [ ] All dependencies installed (`npm install`)
- [ ] Environment variables set (`.env.local`)
- [ ] Database schema deployed (`supabase db push`)
- [ ] Tests passing (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No linting errors (`npm run lint`)
- [ ] Health endpoint working (`GET /api/v1/health`)
- [ ] Can enroll customer (test with Postman/curl)
- [ ] Can record transaction
- [ ] Can redeem reward
- [ ] Can fetch customer balance
- [ ] Audit log recording events
- [ ] Timeline events creating
- [ ] RLS policies enforced (test with wrong tenant_id)

---

## 📖 Learning Resources

- **SDD v1.0** — Architecture & requirements: See project docs
- **Architecture Addendum v2.0** — Financial model, rules engine, analytics
- **Database Schema** — `supabase/migrations/20240101000000_initial_schema.sql`
- **Service Layer** — Each service in `src/services/` has detailed comments
- **API Routes** — Each endpoint in `src/app/api/v1/` has examples

---

## 🆘 Troubleshooting

### Port 3000 Already in Use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

### Supabase Won't Start

```bash
# Check Docker is running
docker ps

# Reset Supabase
supabase stop
supabase start

# Check logs
supabase logs tail
```

### JWT Token Invalid

```bash
# Check token format
# Token must be sent as: Authorization: Bearer <token>

# Verify JWT_SECRET is set correctly
echo $JWT_SECRET

# Generate new token
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({tenant_id: '123', staff_role: 'admin'}, 'your-secret', {expiresIn: '24h'}))"
```

### RLS Errors

```bash
# Check RLS policies are enabled
SELECT * FROM pg_policies WHERE tablename = 'customers';

# Verify JWT claims in request
curl -X GET http://localhost:3000/api/v1/health -H "Authorization: Bearer YOUR_JWT"

# Check tenant_id in JWT matches
supabase sql "SELECT current_setting('request.jwt.claims');"
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## 📋 Next Steps After Setup

1. **Create test tenant** → `npm run init-tenant`
2. **Seed sample data** → `npm run seed`
3. **Create test user** → Use Supabase Auth UI
4. **Test all endpoints** → Use Postman collection (provided)
5. **Review logs** → Verify all operations logged
6. **Check database** → Query views for analytics
7. **Deploy to staging** → Before production
8. **Load test** → Simulate 100 concurrent users
9. **Security audit** → Review RLS policies
10. **Documentation** → Update API docs

---

## 📞 Support

- **Architecture questions** → See ARCHITECTURE_DECISIONS.md
- **Database questions** → See DATABASE_CHANGELOG.md
- **API questions** → See API_DESIGN.md
- **Deployment questions** → See DEPLOYMENT_GUIDE.md

---

## 🎯 Project Status

- ✅ Database Schema (Phase A) — COMPLETE
- ✅ Customer Module (Phase B) — COMPLETE
- ✅ Loyalty Engine (Phase C) — COMPLETE
- ✅ Redemption Engine (Phase D) — COMPLETE
- ✅ Timeline Events (Phase E) — COMPLETE
- ✅ Rules Engine (Phase F) — COMPLETE (MVP hardcoded)
- ✅ Accounting (Phase G) — COMPLETE
- ✅ Analytics Views (Phase H) — COMPLETE
- ✅ Infrastructure (Phase I) — COMPLETE
- ⏳ Frontend (PWA) — Coming next
- ⏳ Testing (Jest/Playwright) — Ready to implement

Happy coding! 🚀
