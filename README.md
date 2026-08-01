# Supermed Pharmacy Loyalty MVP

This project implements a lean staff-facing loyalty workflow for Supermed Pharmacy.

## What is included

- Card registration and assignment
- Customer enrollment
- Purchase points accrual with configurable multiplier
- Redemption flow with balance protection
- Simple dashboard and health endpoint
- JSON-backed local data store for fast local development

## Run locally

1. Install dependencies
   ```bash
   npm install
   ```
2. Seed the local data store
   ```bash
   npm run seed
   ```
3. Start the app
   ```bash
   npm run dev
   ```
4. Open the dashboard at http://localhost:3000/dashboard

## Key endpoints

- GET /api/v1/health
- POST /api/v1/cards
- GET /api/v1/customers
- POST /api/v1/customers
- GET /api/v1/customers/[id]
- POST /api/v1/transactions
- POST /api/v1/redemptions
- GET /api/v1/settings

## Example workflow

1. Register cards with POST /api/v1/cards
2. Enroll a customer with POST /api/v1/customers
3. Record a purchase with POST /api/v1/transactions
4. Redeem points with POST /api/v1/redemptions
