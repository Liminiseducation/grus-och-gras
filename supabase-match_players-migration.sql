-- Migration: add player_id and unique constraint to match_players
DO $$
BEGIN
  -- Add player_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'match_players' AND column_name = 'player_id'
  ) THEN
    ALTER TABLE public.match_players ADD COLUMN player_id uuid;
  END IF;

  -- Add unique constraint on (match_id, player_name) if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'match_players_matchid_playername_key'
  ) THEN
    ALTER TABLE public.match_players ADD CONSTRAINT match_players_matchid_playername_key UNIQUE (match_id, player_name);
  END IF;
END$$;
