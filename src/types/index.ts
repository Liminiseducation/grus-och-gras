export interface User {
  id: string;
  // `username` is used for auth; `name` is display name chosen in setup.
  username?: string;
  name?: string;
  homeCity?: string;
  role?: 'user' | 'admin';
}

export interface Player {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  maxPlayers: number;
  surface: 'Grus' | 'Konstgräs' | 'Naturgräs' | 'Asfalt';
  hasBall: boolean;
  requiresFootballShoes: boolean;
  playStyle?: 'spontanspel' | 'träning' | 'match';
  players: Player[];
  area: string; // Primary location field (e.g. "Lerum", "Kungälv")
  city?: string; // Secondary/optional (e.g. "Göteborg")
  latitude?: number;
  longitude?: number;
  createdBy?: string; // User ID of match creator
  creatorId?: string; // alias for createdBy (optional)
  creatorName?: string; // Name of match creator
  createdAt?: string | Date;
  // Normalized forms (for matching only, do not display these directly)
  normalizedArea?: string;
  normalizedCity?: string;
  // Local-only flag: mark a match as private (password stored locally for testing)
  isPrivate?: boolean;
  // Optional password for private matches (dev-only storage)
  password?: string;
  // Authoritative players loaded via `match_players` relationship
  matchPlayers?: Player[];
}

export interface Team {
  teamA: Player[];
  teamB: Player[];
}
