import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Match } from '../types';
import { mockMatches as initialMatches } from '../data/mockMatches';

interface MatchContextType {
  matches: Match[];
  addMatch: (match: Omit<Match, 'id' | 'players' | 'createdBy'>, createdBy?: string, creatorName?: string) => void;
  joinMatch: (matchId: string, player: { id: string; name: string }) => void;
  leaveMatch: (matchId: string, playerId: string) => void;
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
  const [matches, setMatches] = useState<Match[]>(initialMatches);

  // Rensa utgångna matcher var 60:e sekund
  useEffect(() => {
    const interval = setInterval(() => {
      setMatches(prev => filterActiveMatches(prev));
    }, 60000); // Kontrollera varje minut

    // Initial rensning när komponenten mountar
    setMatches(prev => filterActiveMatches(prev));

    return () => clearInterval(interval);
  }, []);

  const addMatch = (matchData: Omit<Match, 'id' | 'players' | 'createdBy'>, createdBy?: string, creatorName?: string) => {
    const newMatch: Match = {
      ...matchData,
      id: Date.now().toString(),
      players: createdBy && creatorName ? [{ id: createdBy, name: creatorName }] : [],
      createdBy,
    };
    setMatches(prev => [newMatch, ...prev]);
  };
  
  const joinMatch = (matchId: string, player: { id: string; name: string }) => {
    setMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        // Check if player already joined
        if (match.players.some(p => p.id === player.id)) {
          return match;
        }
        // Check if match is full
        if (match.players.length >= match.maxPlayers) {
          return match;
        }
        return {
          ...match,
          players: [...match.players, player]
        };
      }
      return match;
    }));
  };
  
  const leaveMatch = (matchId: string, playerId: string) => {
    setMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        return {
          ...match,
          players: match.players.filter(p => p.id !== playerId)
        };
      }
      return match;
    }));
  };

  return (
    <MatchContext.Provider value={{ matches, addMatch, joinMatch, leaveMatch }}>
      {children}
    </MatchContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatches must be used within MatchProvider');
  }
  return context;
}
