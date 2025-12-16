import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Player, User } from '../types';
import { useMatches } from '../contexts/MatchContext';
import PlayerAvatar from '../components/PlayerAvatar';
import { divideIntoTeams } from '../utils/teamUtils';
import './MatchDetailsPage.css';

const USER_STORAGE_KEY = 'grus-gras-user';

function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { matches, joinMatch, leaveMatch } = useMatches();
  const match = matches.find(m => m.id === id);
  
  // Get current user
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  const currentUser: User | null = userJson ? JSON.parse(userJson) : null;
  const isCreator = match?.createdBy === currentUser?.id;
  
  const players = match?.players || [];
  const [generatedTeams, setGeneratedTeams] = useState<Player[][] | null>(null);
  const [showShareConfirmation, setShowShareConfirmation] = useState(false);
  
  // Check if current user has joined
  const hasJoined = currentUser ? players.some(p => p.id === currentUser.id) : false;
  const isFull = players.length >= (match?.maxPlayers || 0);

  if (!match) {
    return (
      <div className="match-details-page">
        <div className="error-container">
          <div className="error-icon">⚽</div>
          <h2 className="error-title">Matchen hittades inte</h2>
          <p className="error-message">
            Denna match har antingen tagits bort eller så är länken felaktig.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Visa alla matcher
          </button>
        </div>
      </div>
    );
  }

  const emptySlots = Math.max(0, match.maxPlayers - players.length);
  const emptySlotArray = Array.from({ length: emptySlots }, (_, i) => i);

  const handleGenerateTeams = () => {
    const teams = divideIntoTeams(players, 2);
    setGeneratedTeams(teams);
  };

  const handleResetTeams = () => {
    setGeneratedTeams(null);
  };
  
  const handleJoinMatch = () => {
    if (!currentUser || !match) return;
    joinMatch(match.id, { id: currentUser.id, name: currentUser.name });
  };
  
  const handleLeaveMatch = () => {
    if (!currentUser || !match) return;
    leaveMatch(match.id, currentUser.id);
  };

  const handleShare = async () => {
    if (!match) return;
    
    try {
      const url = `${window.location.origin}/match/${match.id}`;
      await navigator.clipboard.writeText(url);
      
      setShowShareConfirmation(true);
      setTimeout(() => {
        setShowShareConfirmation(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  return (
    <div className="match-details-page">
      <header className="details-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <p className="match-label">MATCH</p>
        <p className="match-date">{match.date}</p>
      </header>

      <div className="details-content">
        <section className="match-header-section">
          <h1 className="match-title">{match.title}</h1>
          
          <div className="time-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>{match.time}</span>
          </div>

          <div className="player-count-badge">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 8c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zM8 9.5c-2.33 0-7 1.17-7 3.5V15h14v-2c0-2.33-4.67-3.5-7-3.5z" fill="currentColor"/>
            </svg>
            {players.length} / {match.maxPlayers} Spelare
          </div>

          {match.playStyle && (
            <div className="play-style-info">
              <div className="play-style-badge">
                {match.playStyle === 'spontanspel' && '⚽'}
                {match.playStyle === 'träning' && '🏃'}
                {match.playStyle === 'match' && '🏆'}
                <span>{match.playStyle.charAt(0).toUpperCase() + match.playStyle.slice(1)}</span>
              </div>
              <p className="play-style-description">
                {match.playStyle === 'spontanspel' && 'Alla nivåer välkomna'}
                {match.playStyle === 'träning' && 'Fokus på tempo och spel'}
                {match.playStyle === 'match' && 'Seriöst tempo'}
              </p>
            </div>
          )}
        </section>

        <section className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <span className="info-label">Underlag</span>
              <span className="info-value">{match.surface}</span>
            </div>
            <div className="info-card">
              <span className="info-label">Utrustning</span>
              <span className="info-value">
                {match.hasBall ? 'Boll finns på plats' : 'Boll saknas'}
              </span>
            </div>
          </div>

          {match.requiresFootballShoes && (
            <div className="footwear-notice">
              <span className="footwear-icon">👟</span>
              <span className="footwear-text">Fotbollsskor krävs</span>
            </div>
          )}

          {match.description && (
            <div className="description-card">
              <p className="description-text">{match.description}</p>
            </div>
          )}
        </section>

        {currentUser && (
          <section className="join-section">
            {!hasJoined ? (
              <button 
                onClick={handleJoinMatch} 
                className="btn-join"
                disabled={isFull}
              >
                {isFull ? 'Matchen är full' : 'Gå med i matchen'}
              </button>
            ) : (
              <button onClick={handleLeaveMatch} className="btn-leave">
                Lämna matchen
              </button>
            )}
            
            {isCreator && (
              <>
                <button onClick={handleShare} className="btn-share">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M15 6.66667C16.3807 6.66667 17.5 5.54738 17.5 4.16667C17.5 2.78595 16.3807 1.66667 15 1.66667C13.6193 1.66667 12.5 2.78595 12.5 4.16667C12.5 5.54738 13.6193 6.66667 15 6.66667Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 12.5C6.38071 12.5 7.5 11.3807 7.5 10C7.5 8.61929 6.38071 7.5 5 7.5C3.61929 7.5 2.5 8.61929 2.5 10C2.5 11.3807 3.61929 12.5 5 12.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 18.3333C16.3807 18.3333 17.5 17.214 17.5 15.8333C17.5 14.4526 16.3807 13.3333 15 13.3333C13.6193 13.3333 12.5 14.4526 12.5 15.8333C12.5 17.214 13.6193 18.3333 15 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M7.15833 11.175L12.85 14.6583" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.8417 5.34167L7.15833 8.825" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Dela match
                </button>
                <p className="share-helper-text">
                  Dela länken med kompisar – de kan gå med direkt utan konto.
                </p>
              </>
            )}
          </section>
        )}

        {showShareConfirmation && (
          <div className="share-confirmation">
            Länk kopierad – dela med dina vänner
          </div>
        )}

        <section className="players-section">
          <h2 className="section-title">Spelare</h2>
          <p className="section-subtitle">{players.length} anmälda</p>
          <div className="players-grid">
            {players.map((player) => (
              <div key={player.id} className="player-card">
                <PlayerAvatar name={player.name} />
                <span className="player-name">{player.name}</span>
              </div>
            ))}
            {emptySlotArray.map((index) => (
              <div key={`empty-${index}`} className="player-card player-card-empty">
                <div className="player-avatar player-avatar-empty">?</div>
                <span className="player-name player-name-empty">Ledig</span>
              </div>
            ))}
          </div>
        </section>

        {players.length >= 4 && (
          <section className="ai-section">
            <div className="ai-header">
              <span className="ai-icon">🤖</span>
              <h2 className="ai-title">Coach AI</h2>
            </div>
            <p className="ai-description">
              Låt mig analysera spelarna, skapa jämna lag och ta fram vinnande taktik.
            </p>
            
            {!generatedTeams ? (
              isCreator ? (
                <button onClick={handleGenerateTeams} className="btn-generate">
                  Generera laguppställning
                </button>
              ) : (
                <p className="ai-note">
                  Bara matchskaparen kan generera lag.
                </p>
              )
            ) : (
              <div className="teams-container">
                <div className="team-column">
                  <h3 className="team-title">Lag A</h3>
                  <div className="team-players">
                    {generatedTeams[0].map((player) => (
                      <div key={player.id} className="team-player">
                        <PlayerAvatar name={player.name} />
                        <span>{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="team-column">
                  <h3 className="team-title">Lag B</h3>
                  <div className="team-players">
                    {generatedTeams[1].map((player) => (
                      <div key={player.id} className="team-player">
                        <PlayerAvatar name={player.name} />
                        <span>{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleResetTeams} className="btn-reset">
                  Återställ
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default MatchDetailsPage;
