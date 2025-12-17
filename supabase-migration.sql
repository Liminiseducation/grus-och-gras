-- Migration: Add missing fields to matches table
-- Run this in Supabase SQL Editor

-- Add missing columns if they don't exist
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS date TEXT NOT NULL DEFAULT CURRENT_DATE::TEXT,
ADD COLUMN IF NOT EXISTS time TEXT NOT NULL DEFAULT '00:00',
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS surface TEXT,
ADD COLUMN IF NOT EXISTS has_ball BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS latitude NUMERIC,
ADD COLUMN IF NOT EXISTS longitude NUMERIC,
ADD COLUMN IF NOT EXISTS created_by TEXT,
ADD COLUMN IF NOT EXISTS creator_name TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS requires_football_shoes BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS play_style TEXT CHECK (play_style IN ('spontanspel', 'träning', 'match', NULL)),
ADD COLUMN IF NOT EXISTS players JSONB DEFAULT '[]'::jsonb;

-- Update existing records to have empty players array if NULL
UPDATE matches SET players = '[]'::jsonb WHERE players IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN matches.title IS 'Match title/name';
COMMENT ON COLUMN matches.description IS 'Match description';
COMMENT ON COLUMN matches.date IS 'Match date in YYYY-MM-DD format';
COMMENT ON COLUMN matches.time IS 'Match time in HH:MM format';
COMMENT ON COLUMN matches.max_players IS 'Maximum number of players allowed';
COMMENT ON COLUMN matches.surface IS 'Playing surface type';
COMMENT ON COLUMN matches.has_ball IS 'Whether organizer will bring a ball';
COMMENT ON COLUMN matches.area IS 'Municipality or area name (e.g., Lerum, Göteborg)';
COMMENT ON COLUMN matches.city IS 'City name for filtering';
COMMENT ON COLUMN matches.latitude IS 'Location latitude coordinate';
COMMENT ON COLUMN matches.longitude IS 'Location longitude coordinate';
COMMENT ON COLUMN matches.created_by IS 'User ID of the match creator';
COMMENT ON COLUMN matches.creator_name IS 'Name of the match creator';
COMMENT ON COLUMN matches.created_at IS 'Timestamp when match was created';
COMMENT ON COLUMN matches.players IS 'Array of player objects with id and name';
COMMENT ON COLUMN matches.requires_football_shoes IS 'Whether football shoes are required';
COMMENT ON COLUMN matches.play_style IS 'Type of play: spontanspel, träning, or match';
