-- Add role column to users and default to 'user'
ALTER TABLE IF EXISTS public.users
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Optional: set existing nulls to 'user'
UPDATE public.users SET role = 'user' WHERE role IS NULL;

-- Note: Run this in Supabase SQL editor. Promotion to 'admin' can be done
-- manually in the dashboard or via UPDATE public.users SET role = 'admin' WHERE id = '<user-id>';
