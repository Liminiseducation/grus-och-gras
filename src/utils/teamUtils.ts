import type { Player } from '../types';

/**
 * Divides players into balanced teams.
 * 
 * @param players - Array of players to divide
 * @param numberOfTeams - Number of teams to create (default: 2)
 * @returns Array of teams, where each team is an array of players
 * 
 * @example
 * const players = [player1, player2, player3, player4];
 * const teams = divideIntoTeams(players);
 * // Returns: [[player1, player3], [player2, player4]]
 */
export function divideIntoTeams(
  players: Player[],
  numberOfTeams: number = 2
): Player[][] {
  if (players.length === 0) {
    return Array.from({ length: numberOfTeams }, () => []);
  }

  if (numberOfTeams <= 0) {
    return [players];
  }

  const teams: Player[][] = Array.from({ length: numberOfTeams }, () => []);

  // Distribute players in round-robin fashion
  players.forEach((player, index) => {
    const teamIndex = index % numberOfTeams;
    teams[teamIndex].push(player);
  });

  return teams;
}
