-- Supabase SQL function: join_match_secure
-- Minimal, dev-only implementation to enforce private match passwords
-- Usage: SELECT public.join_match_secure(match_id := '<uuid>', provided_password := 'pw', user_id := '<uuid>', user_name := 'Display');

CREATE OR REPLACE FUNCTION public.join_match_secure(
  p_match_id uuid,
  p_player_name text DEFAULT NULL,
  p_password text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  m RECORD;
  updated_players jsonb;
  maxp int;
  user_id_text text;
  user_id uuid;
BEGIN
  -- derive calling user id from auth context
  user_id_text := auth.uid();
  IF user_id_text IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = 'PGRST401';
  END IF;
  user_id := user_id_text::uuid;

  SELECT is_private, private_password, players, max_players
    INTO m
    FROM public.matches
   WHERE id = p_match_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found' USING ERRCODE = 'PGRST116';
  END IF;

  IF m.is_private THEN
    IF p_password IS NULL OR p_password <> m.private_password THEN
      RAISE EXCEPTION 'Invalid password' USING ERRCODE = 'PGRST117';
    END IF;
  END IF;

  -- Build player object
  -- Check current participant count from `match_players` table
  SELECT COUNT(*) INTO maxp FROM public.match_players WHERE match_id = p_match_id;

  -- Do not pre-check existence here; attempt insert and handle unique-violation.

  -- Enforce max players when defined
  IF COALESCE(m.max_players, 0) > 0 AND maxp >= m.max_players THEN
    RAISE EXCEPTION 'Match is full' USING ERRCODE = 'PGRST118';
  END IF;

  -- Insert a new participant row into the dedicated table (include player_id when available).
  BEGIN
    BEGIN
      INSERT INTO public.match_players(match_id, player_name, player_id)
      VALUES (p_match_id, COALESCE(p_player_name, ''), user_id);
    EXCEPTION WHEN undefined_column THEN
      -- Schema doesn't have player_id; try inserting by player_name only
      INSERT INTO public.match_players(match_id, player_name)
      VALUES (p_match_id, COALESCE(p_player_name, ''));
    END;
  EXCEPTION WHEN unique_violation THEN
    -- A unique constraint prevented insertion: user already joined
    RETURN jsonb_build_object('status', 'already_joined');
  END;

  RETURN jsonb_build_object('status', 'ok');
END;
$$;

-- Note: This function is intentionally minimal and for dev/testing only.
-- It stores passwords in plain text and uses SECURITY DEFINER for convenience.
-- Do NOT use in production without proper authentication, RLS, and password hashing.
