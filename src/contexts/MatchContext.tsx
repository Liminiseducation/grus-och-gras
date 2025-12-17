import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import type { Match } from '../types';
import { supabase } from '../lib/supabase';

interface MatchContextType {
  matches: Match[];
  loading: boolean;
  addMatch: (match: Omit<Match, 'id' | 'players' | 'createdBy'>, createdBy?: string, creatorName?: string) => Promise<void>;
  joinMatch: (matchId: string, player: { id: string; name: string }) => Promise<void>;
  leaveMatch: (matchId: string, playerId: string) => Promise<void>;
  deleteMatch: (matchId: string) => Promise<void>;
  refreshMatches: () => Promise<void>;
  // DEV only helpers
  deleteEmptyMatches?: () => Promise<void>;
  deleteMatchesOlderThan?: (days: number) => Promise<void>;
  deletePastMatches?: () => Promise<void>;
  deleteOrphanMatches?: () => Promise<void>;
}

const MatchContext = createContext<MatchContextType | undefined>(undefined);

function isMatchExpired(match: Match): boolean {
  const matchDateTime = new Date(`${match.date}T${match.time}`);
  const expiryTime = new Date(matchDateTime.getTime() + 30 * 60 * 1000); // +30 minuter
  return new Date() > expiryTime;
}

function filterActiveMatches(matches: Match[]): Match[] {
  return matches.filter(match => !isMatchExpired(match));
}

export function MatchProvider({ children }: { children: ReactNode }) {
  const USER_STORAGE_KEY = 'grus-gras-user';
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch matches from Supabase
  const fetchMatches = async () => {
    try {
      setLoading(true);
      console.log('Fetching matches from Supabase...');
      
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        return;
      }

      console.log('Fetched matches:', data);

      // Convert database format (snake_case) to app format (camelCase)
      const formattedMatches = (data || []).map((dbMatch: any) => ({
        id: dbMatch.id,
        title: dbMatch.title,
        description: dbMatch.description,
        date: dbMatch.date,
        time: dbMatch.time,
        maxPlayers: dbMatch.max_players,
        surface: dbMatch.surface,
        hasBall: dbMatch.has_ball,
        requiresFootballShoes: dbMatch.requires_football_shoes || false,
        playStyle: dbMatch.play_style,
        players: dbMatch.players || [],
        area: dbMatch.area || dbMatch.city,
        city: dbMatch.city,
        latitude: dbMatch.latitude,
        longitude: dbMatch.longitude,
        createdBy: dbMatch.created_by,
        creatorId: dbMatch.created_by,
        creatorName: dbMatch.creator_name,
      } as Match));

      // TODO: Temporarily disable active/time/expiry filtering and return all fetched matches.
      // Previously we filtered out expired matches here:
      // const activeMatches = filterActiveMatches(formattedMatches);
      // console.log('Active matches:', activeMatches);
      // setMatches(activeMatches);
      // For debugging/QA, set all fetched matches directly:
      console.log('All fetched matches (no filtering):', formattedMatches);
      setMatches(formattedMatches);
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMatches();
  }, []);

  // Rensa utgångna matcher var 60:e sekund
  // TODO: Temporarily disable periodic expiry filtering while QA is in progress.
  /*
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prev => filterActiveMatches(prev));
    }, 60000); // Kontrollera varje minut

    return () => clearInterval(interval);
  }, []);
  */

  const addMatch = async (matchData: Omit<Match, 'id' | 'players' | 'createdBy'>, createdBy?: string, creatorName?: string) => {
    try {
      console.log('Adding match to Supabase:', matchData);

      // Convert app format (camelCase) to database format (snake_case)
      const dbMatch = {
        title: matchData.title,
        description: matchData.description,
        date: matchData.date,
        time: matchData.time,
        max_players: matchData.maxPlayers,
        surface: matchData.surface,
        has_ball: matchData.hasBall,
        requires_football_shoes: matchData.requiresFootballShoes,
        play_style: matchData.playStyle,
        players: createdBy && creatorName ? [{ id: createdBy, name: (creatorName && creatorName.length > 1) ? creatorName : (localStorage.getItem(USER_STORAGE_KEY) ? JSON.parse(localStorage.getItem(USER_STORAGE_KEY) as string).name : creatorName) }] : [],
        area: matchData.area,
        city: matchData.city,
        latitude: matchData.latitude,
        longitude: matchData.longitude,
        created_by: createdBy,
        creator_name: creatorName,
      };

      console.log('Inserting match into Supabase with data:', {
        city: dbMatch.city,
        date: dbMatch.date,
        time: dbMatch.time,
        max_players: dbMatch.max_players,
        play_style: dbMatch.play_style,
        creator_name: dbMatch.creator_name
      });

      const { data, error } = await supabase
        .from('matches')
        .insert([dbMatch])
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase insert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('✅ Successfully inserted match into Supabase:', data);
      
      // Refresh matches from database
      await fetchMatches();
    } catch (err) {
      console.error('❌ Error in addMatch:', err);
      throw err;
    }
  };
  
  const joinMatch = async (matchId: string, player: { id: string; name: string }) => {
    try {
      console.log('🔵 joinMatch called with:', { matchId, player });
      const match = matches.find(m => m.id === matchId);
      if (!match) {
        console.log('❌ Match not found');
        return;
      }

      console.log('Current players:', match.players);

      if (match.players.some(p => p.id === player.id)) {
        console.log('⚠️ Player already in match');
        return;
      }
      if (match.players.length >= match.maxPlayers) {
        console.log('⚠️ Match is full');
        return;
      }

      // Ensure we don't save a truncated name (e.g. single char). Prefer full local user name when available.
      let fullName = player.name;
      if (!fullName || fullName.length <= 1) {
        try {
          const userJson = localStorage.getItem(USER_STORAGE_KEY);
          const storedUser = userJson ? JSON.parse(userJson) : null;
          if (storedUser?.name) {
            fullName = storedUser.name;
          }
        } catch (e) {
          // ignore parse errors
        }
      }

      const updatedPlayers = [...match.players, { id: player.id, name: fullName }];
      console.log('Updated players:', updatedPlayers);

      const { error } = await supabase
        .from('matches')
        .update({ players: updatedPlayers })
        .eq('id', matchId);

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

      console.log('✅ Successfully joined match');

      // Refresh matches
      await fetchMatches();
    } catch (err) {
      console.error('Error joining match:', err);
      throw err;
    }
  };
  

  const leaveMatch = async (matchId: string, playerId: string) => {
    try {
      const match = matches.find(m => m.id === matchId);
      if (!match) return;

      // Om skaparen lämnar, ta bort även createdBy och creatorName
      let updateObj: any = {};
      const updatedPlayers = match.players.filter(p => p.id !== playerId);
      updateObj.players = updatedPlayers;
      if (match.createdBy === playerId) {
        updateObj.created_by = null;
        updateObj.creator_name = null;
      }

      const { error } = await supabase
        .from('matches')
        .update(updateObj)
        .eq('id', matchId);

      if (error) throw error;

      // Refresh matches
      await fetchMatches();
    } catch (err) {
      console.error('Error leaving match:', err);
      throw err;
    }
  };

  const deleteMatch = async (matchId: string) => {
    try {
      // Ensure only creator can delete
      const userJson = localStorage.getItem(USER_STORAGE_KEY);
      const currentUser = userJson ? JSON.parse(userJson) : null;
      const currentUserId = currentUser?.id;

      const match = matches.find(m => m.id === matchId);
      if (!match) {
        console.warn('deleteMatch: match not found in state');
        return;
      }

      const creatorId = match.createdBy || (match as any).creatorId || null;
      if (!currentUserId || creatorId !== currentUserId) {
        console.warn('deleteMatch: only the creator can delete this match');
        throw new Error('Not authorized to delete this match');
      }

      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);
      if (error) {
        console.error('Error deleting match:', error);
        throw error;
      }

      // Update local state immediately
      setMatches(prev => prev.filter(m => m.id !== matchId));
      console.log(`Deleted match ${matchId} (creator: ${creatorId})`);
    } catch (err) {
      console.error('Error deleting match:', err);
      throw err;
    }
  };

  // DEV ONLY – REMOVE BEFORE PROD
  // Helper: delete matches that already happened (date/time in past)
  const deletePastMatches = async () => {
    try {
      console.log('DEV: Searching for past matches (date/time passed)...');
      // Use currently loaded matches to determine past matches
      const past = (matches || []).filter(m => isMatchExpired(m));
      console.log(`DEV: Found ${past.length} past matches:`);
      past.forEach(m => console.log('  -', m.id, m.title, 'date:', m.date, 'time:', m.time));

      if (past.length === 0) return;
      const ids = past.map(m => m.id);
      const { error: delErr } = await supabase.from('matches').delete().in('id', ids);
      if (delErr) {
        console.error('DEV: error deleting past matches:', delErr);
        return;
      }

      // Update local state
      setMatches(prev => prev.filter(m => !ids.includes(m.id)));
      console.log(`DEV: Deleted ${ids.length} past matches.`);
    } catch (err) {
      console.error('DEV: unexpected error in deletePastMatches:', err);
    }
  };

  // DEV ONLY – REMOVE BEFORE PROD
  // Helper: delete matches where players is null/empty
  const deleteEmptyMatches = async () => {
    try {
      console.log('DEV: Searching for matches with empty or null players...');
      const { data, error } = await supabase
        .from('matches')
        .select('id, title, players, created_at');
      if (error) {
        console.error('DEV: error fetching matches for cleanup:', error);
        return;
      }

      const toDelete = (data || []).filter((m: any) => !m.players || (Array.isArray(m.players) && m.players.length === 0));

      console.log(`DEV: Found ${toDelete.length} empty matches:`);
      toDelete.forEach((m: any) => console.log('  -', m.id, m.title, 'created_at:', m.created_at));

      if (toDelete.length === 0) return;

      const ids = toDelete.map((m: any) => m.id);
      const { error: delErr } = await supabase.from('matches').delete().in('id', ids);
      if (delErr) {
        console.error('DEV: error deleting empty matches:', delErr);
        return;
      }

      console.log(`DEV: Deleted ${ids.length} empty matches.`);
      await fetchMatches();
    } catch (err) {
      console.error('DEV: unexpected error in deleteEmptyMatches:', err);
    }
  };

  // DEV ONLY – REMOVE BEFORE PROD
  // Helper: delete matches older than X days based on created_at
  const deleteMatchesOlderThan = async (days: number) => {
    try {
      if (typeof days !== 'number' || days <= 0) {
        console.log('DEV: deleteMatchesOlderThan requires a positive number of days');
        return;
      }

      console.log(`DEV: Searching for matches older than ${days} day(s)...`);
      const { data, error } = await supabase
        .from('matches')
        .select('id, title, players, created_at');
      if (error) {
        console.error('DEV: error fetching matches for age cleanup:', error);
        return;
      }

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);

      const toDelete = (data || []).filter((m: any) => {
        const created = m.created_at ? new Date(m.created_at) : null;
        return created ? created < cutoff : false;
      });

      console.log(`DEV: Found ${toDelete.length} matches older than ${days} day(s):`);
      toDelete.forEach((m: any) => console.log('  -', m.id, m.title, 'created_at:', m.created_at));

      if (toDelete.length === 0) return;

      const ids = toDelete.map((m: any) => m.id);
      const { error: delErr } = await supabase.from('matches').delete().in('id', ids);
      if (delErr) {
        console.error('DEV: error deleting old matches:', delErr);
        return;
      }

      console.log(`DEV: Deleted ${ids.length} old matches.`);
      await fetchMatches();
    } catch (err) {
      console.error('DEV: unexpected error in deleteMatchesOlderThan:', err);
    }
  };

  // DEV ONLY – REMOVE BEFORE PROD
  // Helper: determine if a match is an orphan
  const isOrphanMatch = (match: Match) => {
    try {
      const creatorId = match.createdBy || (match as any).creatorId;
      if (!creatorId) return true;

      // Determine active session ids from localStorage (best-effort)
      const userJson = localStorage.getItem(USER_STORAGE_KEY);
      const currentUser = userJson ? JSON.parse(userJson) : null;
      const currentUserId = currentUser?.id;

      // If we cannot determine any active session, treat as not orphan (avoid accidental deletions)
      if (!currentUserId) return false;

      // If none of the players match an active session/user, mark as orphan
      const hasActivePlayer = Array.isArray(match.players) && match.players.some(p => p && p.id === currentUserId);
      return !hasActivePlayer;
    } catch (err) {
      console.error('DEV: error in isOrphanMatch:', err);
      return false;
    }
  };

  // DEV ONLY – REMOVE BEFORE PROD
  // Helper: delete orphan matches (creator missing or no active player/session)
  const deleteOrphanMatches = async () => {
    try {
      console.log('DEV: Searching for orphan matches...');
      const orphanList = (matches || []).filter(isOrphanMatch);
      console.log(`DEV: Found ${orphanList.length} orphan matches:`);
      orphanList.forEach(m => console.log('  -', m.id, m.title, 'creator:', m.createdBy || (m as any).creatorId, 'players:', m.players?.length));

      if (orphanList.length === 0) return;

      const ids = orphanList.map(m => m.id);
      const { error } = await supabase.from('matches').delete().in('id', ids);
      if (error) {
        console.error('DEV: error deleting orphan matches:', error);
        return;
      }

      // Update local state
      setMatches(prev => prev.filter(m => !ids.includes(m.id)));
      console.log(`DEV: Deleted ${ids.length} orphan matches.`);
    } catch (err) {
      console.error('DEV: unexpected error in deleteOrphanMatches:', err);
    }
  };

  // DEV ONLY – attach functions to window for quick manual invocation in dev console
  // DEV ONLY – REMOVE BEFORE PROD
  useEffect(() => {
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      (window as any).__deleteEmptyMatches = deleteEmptyMatches;
      (window as any).__deleteMatchesOlderThan = deleteMatchesOlderThan;
      (window as any).__deletePastMatches = deletePastMatches;
      (window as any).__deleteOrphanMatches = deleteOrphanMatches;

      return () => {
        try {
          delete (window as any).__deleteEmptyMatches;
          delete (window as any).__deleteMatchesOlderThan;
          delete (window as any).__deletePastMatches;
        } catch (e) {
          // ignore
        }
      };
    }
    return;
  }, [deleteEmptyMatches, deleteMatchesOlderThan, deletePastMatches, deleteOrphanMatches]);

  // DEV: optionally run orphan cleanup once after matches are loaded
  const ranOrphanCleanup = useRef(false);
  useEffect(() => {
    if (import.meta.env.DEV && !ranOrphanCleanup.current && !loading) {
      ranOrphanCleanup.current = true;
      // best-effort automatic cleanup in dev
      deleteOrphanMatches().catch(err => console.warn('DEV: deleteOrphanMatches failed:', err));
    }
  }, [loading]);

  return (
    <MatchContext.Provider value={{
      matches,
      loading,
      addMatch,
      joinMatch,
      leaveMatch,
      deleteMatch,
      deletePastMatches,
      deleteOrphanMatches,
      refreshMatches: fetchMatches,
      // DEV helpers (exported for manual invocation only)
      deleteEmptyMatches,
      deleteMatchesOlderThan,
    }}>
      {children}
    </MatchContext.Provider>
  );
}

// DEV ONLY – expose helpers on `window` for quick console usage during development
if (import.meta.env.DEV) {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (typeof window !== 'undefined') {
      // attach placeholders; real functions will be wired when MatchProvider mounts
      (window as any).__deleteEmptyMatches = async () => console.warn('Waiting for MatchProvider to mount...');
      (window as any).__deleteMatchesOlderThan = async (days: number) => console.warn('Waiting for MatchProvider to mount...');
      (window as any).__deletePastMatches = async () => console.warn('Waiting for MatchProvider to mount...');
          (window as any).__deleteOrphanMatches = async () => console.warn('Waiting for MatchProvider to mount...');
    }
  } catch (e) {
    // ignore
  }
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatches must be used within MatchProvider');
  }
  return context;
}
