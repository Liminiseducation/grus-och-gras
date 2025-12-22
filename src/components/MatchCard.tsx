import { Link } from 'react-router-dom';
import type { Match } from '../types';
import './MatchCard.css';

interface MatchCardProps {
  match: Match;
}

function MatchCard({ match }: MatchCardProps) {
  

  return (
    <Link to={`/match/${match.id}`} className="match-card">
      <div className="match-card-header">
        <span className="status-badge status-open">ÖPPEN</span>
      </div>

      <h2 className="match-title">{match.title}</h2>
      
      {match.description && (
        <p className="match-description">{match.description}</p>
      )}

      <div className="match-chips">
        <span className="chip">{match.surface}</span>
        <span className="chip">
          {match.hasBall ? 'Boll finns' : 'Boll saknas'}
        </span>
        {match.playStyle && (
          <span className="chip chip-play-style">
            {match.playStyle.charAt(0).toUpperCase() + match.playStyle.slice(1)}
          </span>
        )}
      </div>

      <div className="match-players">
        <span className="player-count">
          {match.players.length} / {match.maxPlayers} spelare
        </span>
      </div>

      <div className="match-footer">
        <div className="match-time">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{match.time}</span>
        </div>
      </div>
      <div className="match-actions" />
    </Link>
  );
}

export default MatchCard;
