# Deployment Guide

The 2AM Club is designed to be effortlessly deployed on **Vercel** with the database on **Supabase**.

## Pre-requisites
1. A Vercel Account linked to the repository.
2. A Supabase Project.

## Environment Variables

Configure the following variables in Vercel under Project Settings > Environment Variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key (safe for public) |
| `CRON_SECRET` | Secret token used by Vercel Cron to trigger background cleanup jobs. |

## CI/CD Pipeline
A GitHub Action workflow (`.github/workflows/main.yml`) automatically performs:
- TypeScript type-checking (`tsc --noEmit`)
- ESLint linting (`next lint`)
- Unit Testing

A failing CI build will block PR merges into `main`.

## Database Deployment
With the V4 architecture, we now use the Supabase CLI for migrations to guarantee strict RLS enforcement.

1. Ensure the Supabase CLI is installed (`npm install -g supabase`).
2. Link your production project:
   ```bash
   supabase link --project-ref <your-project-id>
   ```
3. Push the new schema and RLS policies to production:
   ```bash
   supabase db push
   ```
   *(This applies `supabase/migrations/00000000000000_init.sql` securely.)*
