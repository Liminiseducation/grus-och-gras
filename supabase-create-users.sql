-- Create users table for the app
-- Run this in Supabase SQL editor (or via psql)

-- If you have the pgcrypto extension, use gen_random_uuid(); otherwise use uuid_generate_v4()
-- To enable pgcrypto: CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- To enable uuid-ossp: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- If gen_random_uuid() is not available, you can recreate the table using:
-- CREATE TABLE IF NOT EXISTS public.users (
--   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
--   username text UNIQUE NOT NULL,
--   password_hash text NOT NULL,
--   created_at timestamptz DEFAULT now()
-- );

-- Optional: allow anon inserts while developing (NOT for production)
-- This creates a permissive policy for the "anon" key to INSERT into users.
-- If Row Level Security (RLS) is enabled for the table, run these statements:
-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anon_insert_users" ON public.users FOR INSERT USING (true) WITH CHECK (true);

-- After running, refresh the Supabase dashboard schema or reload the SQL editor so the schema cache updates.
