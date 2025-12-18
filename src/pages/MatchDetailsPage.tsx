import { useParams, useNavigate } from 'react-router-dom';
import { useMatches } from '../contexts/MatchContext';
import PlayerAvatar from '../components/PlayerAvatar';
import './MatchDetailsPage.css';

function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { matches, joinMatch, leaveMatch, deleteMatch } = useMatches();

  const loading = !matches;
  const match = matches ? matches.find(m => m.id === id) : undefined;

  // Debug logs removed for production polish

  // Current user from app state (persistent authenticated user)
  const { currentUser } = useMatches();
  const currentUserId = currentUser?.id || '';

  const isMember = !!match?.players?.some((p: any) => p.id === currentUserId);
  const isCreator = match ? ((match.createdBy || (match as any).creatorId) === currentUserId) : false;
  const isFull = match ? (match.players.length >= (match.maxPlayers || 0)) : false;
  const players = match?.players || [];
  const maxPlayers = match?.maxPlayers || 0;
  const remainingSpots = maxPlayers > players.length ? maxPlayers - players.length : 0;

  // Action button state logging removed

  const handleJoin = async () => {
    try {
      console.log('Join clicked', { matchId: match?.id, userId: currentUserId });
      if (!match || !joinMatch) return;
      await joinMatch(match.id, { id: currentUserId, name: currentUser?.name || '' });
    } catch (err) {
      console.error('Error joining:', err);
    }
  };

  const handleLeave = async () => {
    try {
      console.log('Leave clicked', { matchId: match?.id, userId: currentUserId });
      if (!match || !leaveMatch) return;
      await leaveMatch(match.id, currentUserId);
    } catch (err) {
      console.error('Error leaving:', err);
    }
  };

  const handleDelete = async () => {
    try {
      console.log('Delete clicked', { matchId: match?.id, userId: currentUserId });
      if (!match || !deleteMatch) return;
      const ok = window.confirm('Är du säker på att du vill radera denna match? Denna åtgärd kan inte ångras.');
      if (!ok) return;
      await deleteMatch(match.id);
      // Navigate back to match list after deletion
      navigate('/');
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  return (
    <div className="match-details-page">
      <div className="details-container">
      {/* Loading / error banners (always show main container) */}
      {loading && (
        <div className="loading-banner">
          <p>Laddar matcher…</p>
        </div>
      )}

      {!loading && !match && (
        <div className="error-container">
          <div className="error-icon">⚽</div>
          <h2 className="error-title">Matchen hittades inte</h2>
          <p className="error-message">Denna match har antingen tagits bort eller så är länken felaktig.</p>
        </div>
      )}

      <header className="details-header">
        <button
          className="back-button"
          onClick={() => navigate('/')}
          aria-label="Tillbaka till matcher"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Tillbaka
        </button>

        <h1 className="match-title">{match?.title || 'Ingen titel'}</h1>
        <p className="match-date">Datum: {match?.date || 'Okänt datum'}</p>
      </header>

      <section className="info-section">
        <div className="info-grid">
          <div className="description-card">
            <p className="description-text">{match?.description || 'Ingen beskrivning tillgänglig'}</p>
          </div>

          <div className="info-card">
            <div className="info-label">Max antal spelare</div>
            <div className="info-value">{match?.maxPlayers ?? 'Okänt antal'}</div>
            {match?.playStyle && <div className="play-style-description">Spelstil: {match.playStyle}</div>}
          </div>
        </div>
      </section>

      {/* Matchinfo card: summary of match location and settings (mobile-friendly) */}
      <section className="match-info-card">
        <div className="match-info-inner">
          { (match?.area || match?.city) && (
            <div className="info-row">
              <div className="info-icon">📍</div>
              <div className="info-text">{match?.area || match?.city}</div>
            </div>
          )}

          { match?.surface && (
            <div className="info-row">
              <div className="info-icon">🌱</div>
              <div className="info-text">{match.surface}</div>
            </div>
          )}

          { typeof match?.requiresFootballShoes === 'boolean' && (
            <div className="info-row">
              <div className="info-icon">👟</div>
              <div className="info-text">{match.requiresFootballShoes ? 'Fotbollsskor krävs' : 'Fotbollsskor behövs ej'}</div>
            </div>
          )}

          { typeof match?.hasBall === 'boolean' && (
            <div className="info-row">
              <div className="info-icon">⚽</div>
              <div className="info-text">{match.hasBall ? 'Boll finns på plats' : 'Ta med boll'}</div>
            </div>
          )}

          { match?.playStyle && (
            <div className="info-row">
              <div className="info-icon">🎯</div>
              <div className="info-text">{match.playStyle.charAt(0).toUpperCase() + match.playStyle.slice(1)}</div>
            </div>
          )}

          { match?.description && (
            <div className="info-row">
              <div className="info-icon">🗒️</div>
              <div className="info-text">{match.description}</div>
            </div>
          )}
        </div>
      </section>

      <section className="players-section">
        <h2 className="section-title">Spelare</h2>
        <p className="section-subtitle">Anmälda spelare för matchen</p>

        <div className="players-grid">
          {(() => {
            const players = match?.players || [];
            const max = match?.maxPlayers || 0;
            const remaining = max > players.length ? max - players.length : 0;

            const nodes: any[] = [];

            // Player cards
            players.forEach((player: any) => {
              const playerName = player.name || player.display_name || player.profile?.name || 'Okänt namn';
              const isYou = player.id === currentUserId;

              nodes.push(
                <div className="player-card" key={player.id}>
                  <PlayerAvatar name={playerName} />
                  <div className="player-name">
                    <span className="player-name-label">{playerName}</span>
                    {isYou && <span className="you-badge">Du</span>}
                  </div>
                </div>
              );
            });

            // Discreet empty slot placeholders
            if (remaining > 0) {
              for (let i = 0; i < remaining; i++) {
                nodes.push(
                  <div className="player-card player-card-empty player-empty" key={`empty-${i}`}>
                    <div className="player-avatar player-avatar-empty">⚪</div>
                    <div className="player-name player-name-empty">Ledig</div>
                  </div>
                );
              }
            }

            // If no players and no max defined, show placeholder
            if (players.length === 0 && max === 0) {
              nodes.push(
                <div className="player-card player-card-empty" key={`empty-none`}>
                  <div className="player-avatar player-avatar-empty">⚪</div>
                  <div className="player-name player-name-empty">Inga spelare ännu</div>
                </div>
              );
            }

            return nodes;
          })()}
        </div>

        {/* Remaining spots summary (replaces individual empty cards) */}
        {(() => {
          const players = match?.players || [];
          const max = match?.maxPlayers || 0;
          const remaining = max > players.length ? max - players.length : 0;
          if (max > 0) {
            return (
              <div className="remaining-spots">
                {remaining > 0 ? `${remaining} platser kvar` : 'Fullt'}
              </div>
            );
          }
          return null;
        })()}
        {/* Short helper texts to guide the user */}
        {(() => {
          if (!players || players.length === 0) {
            return <p className="helper-note empty-helper">Inga spelare ännu — bli den första!</p>;
          }

          if (maxPlayers > 0 && remainingSpots === 0) {
            return <p className="helper-note full-helper">Matchen är full</p>;
          }

          return null;
        })()}
      </section>

      <footer className="page-footer">
      </footer>
      {/* CTA section (mobile-first): primary action + spots/status */}
      <div className="action-bar join-bar" role="region" aria-label="Join actions">
        {!isMember ? (
          <div className="cta-not-member">
            <button
              className={`join-primary ${isFull || !currentUserId ? 'join-disabled' : ''}`}
              onClick={handleJoin}
              disabled={isFull || !currentUserId}
            >
              {isFull ? 'Fullt — kan inte anmäla' : 'Gå med i match'}
            </button>

            <div className="cta-spots">
              {maxPlayers > 0 ? `${remainingSpots} platser kvar` : ''}
            </div>
          </div>
        ) : (
          <div className="cta-member" style={{width: '100%'}}>
            <div className="member-status">Du är anmäld</div>
            <button className="leave-primary" onClick={handleLeave}>Lämna match</button>
            {isCreator && (
              <button className="btn-delete-discrete" onClick={handleDelete}>Radera</button>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default MatchDetailsPage;
