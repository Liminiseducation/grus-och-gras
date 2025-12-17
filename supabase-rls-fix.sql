-- Fix RLS policies for matches table
-- Run this in Supabase SQL Editor

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON matches;
DROP POLICY IF EXISTS "Enable insert for all users" ON matches;
DROP POLICY IF EXISTS "Enable update for all users" ON matches;
DROP POLICY IF EXISTS "Enable delete for all users" ON matches;

-- Enable RLS
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for anonymous users
CREATE POLICY "Enable read access for all users" 
ON matches FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for all users" 
ON matches FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for all users" 
ON matches FOR UPDATE 
USING (true);

CREATE POLICY "Enable delete for all users" 
ON matches FOR DELETE 
USING (true);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'matches';
