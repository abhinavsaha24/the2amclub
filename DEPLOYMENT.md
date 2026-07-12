# 🚀 Deployment Guide: The 2AM Club

This guide provides step-by-step instructions for deploying the modernized 2AM Club application to production using Vercel (Frontend) and Supabase (Database/Auth/Storage). 

The app uses a Multi-Admin architecture scoped by `location_id` and utilizes manual UPI payments without a payment gateway.

## Prerequisites
- A GitHub repository containing the project code.
- A free [Vercel](https://vercel.com/) account.
- A free [Supabase](https://supabase.com/) account.

---

## 1. Supabase Setup (Backend)
Your Supabase project acts as the backend database, storage bucket, and realtime event server.

1. **Create Project**: Log in to Supabase and create a new project.
2. **Setup Schema**:
   - Go to the **SQL Editor** on the left sidebar.
   - Click "New Query" and paste the contents of `supabase/schema_v3.sql`.
   - Run the query to create all tables, set up Row Level Security (RLS), apply indexes, and **automatically create the storage buckets and policies**.
3. **Setup Storage (Fully Automated & Secure)**:
   - The SQL script you just ran automatically created a public bucket named `product-images` and applied **Read-Only** storage policies. 
   - **Production Security:** All uploads are handled strictly on the server via `app/api/admin/upload/route.ts` using the Service Role Key. Anonymous users (and potential attackers) cannot upload, update, or delete files directly from the browser.
4. **Get Credentials**:
   - Go to **Project Settings** (the gear icon) -> **API**.
   - Copy the `Project URL`, `anon public` key, and `service_role` secret. You will need these for Vercel.

### Create Initial Location Admin
Since admins log in using a specific `admin_code` tied to a location:
1. Go to the **Table Editor** -> `locations`.
2. Insert a new row.
   - `name`: "Hostel Block A"
   - `admin_code`: "HOSTELA-SECRET-123" (Use this to log in later)
   - `upi_id`: Your personal/business UPI ID
   - `shop_open`: `true`

---

## 2. Vercel Deployment (Frontend)
Vercel is the optimal platform for Next.js applications.

1. **Import Project**:
   - Log in to Vercel and click **Add New -> Project**.
   - Import your GitHub repository for The 2AM Club.

2. **Configure Environment Variables**:
   In the Vercel dashboard, before clicking Deploy, add the following variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = (Your Supabase Project URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (Your Supabase anon public key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (Your Supabase service_role key - REQUIRED for secure server-side image uploads)
   - `NEXT_PUBLIC_APP_URL` = `https://your-vercel-domain.vercel.app` (Add this after deployment if you don't know it yet).
   - Click **Deploy**. Vercel will build the Next.js application and deploy it globally.

---

## 3. Post-Deployment Checks
Once Vercel provides you with a live URL (e.g., `the2amclub.vercel.app`):

1. **Admin Portal Setup**:
   - Navigate to `https://your-vercel-domain.vercel.app/admin/login`.
   - Log in using the `admin_code` you created in step 1.
   - Go to **Settings** and upload your UPI QR Code image.
2. **Product Setup**:
   - Go to **Products** in the admin dashboard.
   - Add a few test products (e.g., "Butter Maggi") and set their stock and images.
3. **Test Customer Flow**:
   - Open the homepage.
   - Select your location.
   - Add a product to the cart and proceed to checkout.
   - You should see the specific UPI ID and QR code you uploaded in the admin settings.
   - Enter a dummy UTR and place the order.
4. **Test Realtime Dashboard**:
   - Have the admin dashboard open on your laptop.
   - When the test order is placed, it should instantly appear in the **Orders** tab without refreshing. You can then mark it as "Confirmed".
