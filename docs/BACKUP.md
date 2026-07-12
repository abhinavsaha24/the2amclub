# Backup and Recovery Strategy

## 1. Database Backups
Supabase handles daily automated backups for the PostgreSQL database.
- **PITR (Point-in-Time Recovery):** Recommended for production (requires Supabase Pro Plan).
- Manual backups can be downloaded from the Supabase Dashboard -> Database -> Backups.

## 2. Storage Backups
Supabase Storage is backed by S3. 
- It is highly recommended to set up an automated script (e.g., AWS Lambda or GitHub Actions) to sync the `product-images` bucket to an external AWS S3 bucket weekly.

## 3. Disaster Recovery (Schema)
If the database is destroyed, it can be entirely recreated using the idempotent `supabase/schema_v3.sql` script.
- Execute `schema_v3.sql` in the Supabase SQL editor.
- The script automatically recreates all tables, indexes, policies, and buckets safely.
