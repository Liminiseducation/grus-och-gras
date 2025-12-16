# Supabase Setup Guide

This guide will walk you through setting up Supabase for the Grus & Gräs football app with authentication and role-based access control.

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - **Name**: Grus & Gräs (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users
4. Click "Create new project"

## 2. Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGc...`)

3. Create a `.env` file in your project root (copy from `.env.example`):
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## 3. Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run these SQL commands:

### Create Profiles Table

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow anyone to read profiles (for displaying user info in matches)
CREATE POLICY "Anyone can read profiles"
  ON profiles
  FOR SELECT
  USING (true);

-- Create a trigger to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Create Matches Table (Optional - if you want to store matches in database)

```sql
-- Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  max_players INTEGER NOT NULL,
  surface TEXT NOT NULL,
  has_ball BOOLEAN NOT NULL DEFAULT false,
  city TEXT NOT NULL,
  area TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Anyone can read matches
CREATE POLICY "Anyone can read matches"
  ON matches
  FOR SELECT
  USING (true);

-- Authenticated users can create matches
CREATE POLICY "Authenticated users can create matches"
  ON matches
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own matches
CREATE POLICY "Users can update own matches"
  ON matches
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Users can delete their own matches, or admins can delete any match
CREATE POLICY "Users can delete own matches or admins can delete any"
  ON matches
  FOR DELETE
  USING (
    auth.uid() = created_by 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

## 4. Create Your First Admin User

After you've created your account through the app:

1. Go to **Authentication** → **Users** in your Supabase dashboard
2. Find your user account
3. Go to **SQL Editor** and run:

```sql
-- Replace 'your-user-email@example.com' with your actual email
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-user-email@example.com';
```

## 5. Email Confirmation (Optional)

By default, Supabase requires email confirmation. To disable it during development:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle off "Confirm email"

For production, keep email confirmation enabled for security.

## 6. Test Your Setup

1. Start your development server: `npm run dev`
2. Navigate to `/register` and create a new account
3. You should be automatically logged in and redirected to `/app`
4. Check the **Authentication** → **Users** section in Supabase to see your new user
5. Check the **Database** → **profiles** table to see the automatically created profile

## 7. Admin-Only Features

To protect admin-only actions in your app, use the `isAdmin` flag from `useAuth()`:

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { isAdmin } = useAuth();

  return (
    <>
      {isAdmin && (
        <button onClick={handleDeleteFacility}>
          Delete Facility (Admin Only)
        </button>
      )}
    </>
  );
}
```

For database-level enforcement, use the RLS policies shown above.

## Troubleshooting

### "Missing Supabase environment variables" error
- Make sure you created a `.env` file in the project root
- Verify the variable names start with `VITE_`
- Restart your dev server after creating the `.env` file

### Users not appearing in profiles table
- Check that the trigger was created correctly in SQL Editor
- Manually insert a profile if needed using the SQL above

### "Row Level Security policy violation" errors
- Verify RLS policies were created correctly
- Check that users are authenticated before performing actions
- Review policy conditions in SQL Editor

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use RLS policies** - Enforce permissions at the database level
3. **Validate on both client and server** - Don't trust client-side checks alone
4. **Keep anon key public** - It's safe to expose in frontend code
5. **Rotate keys regularly** - Generate new keys periodically in production

## Next Steps

- Customize the profiles table with additional user fields
- Move matches from local state to Supabase database
- Add real-time subscriptions for live match updates
- Implement image uploads with Supabase Storage
- Add email notifications with Supabase Edge Functions
