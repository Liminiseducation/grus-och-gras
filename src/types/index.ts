export interface User {
  id: string;
  name: string;
  homeCity: string;
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
}

export interface Team {
  teamA: Player[];
  teamB: Player[];
}
