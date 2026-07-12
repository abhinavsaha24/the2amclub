# The 2AM Club

A multi-tenant location-scoped SaaS platform for campus food ordering. 

## Features
- **Multi-Admin / Multi-Location:** Support for multiple distinct campus stores, hostels, or cafes.
- **Custom Auth:** Streamlined `admin_code` authentication for location admins.
- **Secure Storage:** Production-ready backend image processing (WebP/Sharp) using Supabase Service Role.
- **UPI Integration:** Scan and pay via UPI with manual UTR verification.

## Documentation
- [Deployment Guide (DEPLOYMENT.md)](./DEPLOYMENT.md) - Instructions for setting up Supabase and deploying to Vercel.
- [System Architecture (ARCHITECTURE.md)](./ARCHITECTURE.md) - Detailed breakdown of the custom authentication flow and highly secure server-side storage architecture.

## Getting Started Locally

1. Create a `.env.local` file with your Supabase credentials (see `DEPLOYMENT.md`).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
