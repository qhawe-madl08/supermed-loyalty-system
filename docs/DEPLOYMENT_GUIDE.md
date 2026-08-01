# Deployment Guide

## Vercel

1. Create a Vercel project from this repository.
2. Add the environment variables from .env.example.
3. Deploy the app.

## Supabase

1. Create a Supabase project.
2. Apply the migrations in supabase/migrations.
3. Seed the database with supabase/seed.sql.
4. Configure the Supabase URL and keys in Vercel environment variables.
