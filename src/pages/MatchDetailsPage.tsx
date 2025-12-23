import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMatches } from '../contexts/MatchContext';
import PlayerAvatar from '../components/PlayerAvatar';
import PasswordModal from '../components/PasswordModal';
import './MatchDetailsPage.css';

function MatchDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { matches, joinMatch, leaveMatch, deleteMatch } = useMatches();

  const [joinPassword, setJoinPassword] = useState<string | undefined>(undefined);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const loading = !matches;
  const match = matches ? matches.find(m => m.id === id) : undefined;
  const [fetchedMatch, setFetchedMatch] = useState<any | null>(null);

  // If the match isn't present in the current `matches` (because the
  // list is filtered by `city_key`), use the context helper to fetch
  // the single match by id WITHOUT applying any city filter.
  const { getMatchById } = useMatches();
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!id) return;
      if (match) {
        setFetchedMatch(null);
        return;
      }
      try {
        const single = await getMatchById(id);
        if (mounted) setFetchedMatch(single as any);
      } catch (err) {
        console.error('MatchDetails: getMatchById failed', err);
        if (mounted) setFetchedMatch(null);
      }
    };
    load();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, match, getMatchById]);

  // Debug logs removed for production polish

  // Current user from app state (persistent authenticated user)
  const { currentUser } = useMatches();
  const currentUserId = currentUser?.id || '';

  // Determine membership based on authoritative `matchPlayers` returned
  // from Supabase `match_players` relationship. Check both `player_id` and
  // `player_name` to support rows created before `player_id` existed.
  const effectiveMatch = match || fetchedMatch || undefined;

  const isMember = !!effectiveMatch?.matchPlayers?.some((p: any) => {
    const pid = (p as any).id || (p as any).player_id || '';
    const pname = (p as any).name || (p as any).player_name || '';
    return pid === currentUserId || pname === (currentUser?.username || '');
  });
  const isCreator = effectiveMatch ? ((effectiveMatch.createdBy || (effectiveMatch as any).creatorId) === currentUserId) : false;
  const isFull = effectiveMatch ? (effectiveMatch.players.length >= (effectiveMatch.maxPlayers || 0)) : false;
  const players = effectiveMatch?.players || [];
  const maxPlayers = effectiveMatch?.maxPlayers || 0;
  const remainingSpots = maxPlayers > players.length ? maxPlayers - players.length : 0;

  // Action button state logging removed

  const handleJoin = async () => {
    try {
      console.log('Join clicked', { matchId: effectiveMatch?.id, userId: currentUserId });
      if (!effectiveMatch || !joinMatch) return;
      if (!currentUserId) {
        const ok = window.confirm('Du måste vara inloggad för att gå med i en match. Vill du logga in nu?');
        if (ok) navigate('/auth/login');
        return;
      }
      // If this match is marked private, show modal to collect password (no window.prompt)
      if (effectiveMatch.isPrivate) {
        // Only show the modal if user is not already a member
        if (isMember) return;
        setShowPasswordModal(true);
        return;
      }

      try {
        console.debug('MatchDetails: calling joinMatch with no password');
        await joinMatch(effectiveMatch.id, undefined);
        setJoinError(null);
      } catch (err: any) {
        const msg = String(err || '').toLowerCase();
        if (msg.includes('password') || msg.includes('invalid')) {
          // Ask user for password via modal and show inline error if they retry
          setShowPasswordModal(true);
          setJoinError('Fel lösenord. Försök igen.');
          return;
        }
        if (msg.includes('match not found') || msg.includes('not found')) {
          setJoinError('Matchen hittades inte eller har tagits bort.');
          return;
        }
        if (msg.includes('already') || msg.includes('joined')) {
          setJoinError('Du är redan med i matchen');
          return;
        }
        setJoinError(String(err || 'Kunde inte gå med i matchen'));
        throw err;
      }
    } catch (err) {
      console.error('Error joining:', err);
    }
  };

  const handleLeave = async () => {
    try {
      console.log('Leave clicked', { matchId: effectiveMatch?.id, userId: currentUserId });
      if (!effectiveMatch || !leaveMatch) return;
      await leaveMatch(effectiveMatch.id, currentUserId);
    } catch (err) {
      console.error('Error leaving:', err);
    }
  };

  const handleDelete = async () => {
    try {
      console.log('Delete clicked', { matchId: effectiveMatch?.id, userId: currentUserId });
      if (!effectiveMatch || !deleteMatch) return;
      const ok = window.confirm('Är du säker på att du vill radera denna match? Denna åtgärd kan inte ångras.');
      if (!ok) return;
      await deleteMatch(effectiveMatch.id);
      // Navigate back to match list after deletion
      navigate('/');
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    try {
      // Try joining with provided password. Keep modal open on password error
      setJoinPassword(password);
      setJoinError(null);
      await joinMatch?.(effectiveMatch?.id || '', password);
      // success: clear error and close modal
      setJoinError(null);
      setShowPasswordModal(false);
    } catch (err: any) {
      const msg = String(err || '').toLowerCase();
      if (msg.includes('password') || msg.includes('invalid')) {
        // keep modal open and show inline error
        setJoinError('Fel lösenord. Försök igen.');
        return;
      }
      if (msg.includes('match not found') || msg.includes('not found')) {
        setShowPasswordModal(false);
        setJoinError('Matchen hittades inte eller har tagits bort.');
        return;
      }
      if (msg.includes('already') || msg.includes('joined')) {
        setShowPasswordModal(false);
        setJoinError('Du är redan med i matchen');
        return;
      }
      console.error('Error joining with password:', err);
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

      {!loading && !effectiveMatch && (
        <div className="error-container">
          <div className="error-icon">⚽</div>
          <h2 className="error-title">Matchen hittades inte</h2>
          <p className="error-message">Denna match har antingen tagits bort eller så är länken felaktig.</p>
        </div>
      )}

      <header className="details-header">
        {joinError && !showPasswordModal && (
          <div className="loading-banner" style={{ borderColor: 'rgba(162,35,47,0.15)', color: '#a2232f' }}>{joinError}</div>
        )}
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

        <h1 className="match-title">{effectiveMatch?.title || 'Ingen titel'}</h1>
        <p className="match-date">Datum: {effectiveMatch?.date || 'Okänt datum'}</p>
      </header>

      <section className="info-section">
        <div className="info-grid">
          <div className="description-card">
            <p className="description-text">{effectiveMatch?.description || 'Ingen beskrivning tillgänglig'}</p>
          </div>

          <div className="info-card">
            <div className="info-label">Max antal spelare</div>
            <div className="info-value">{effectiveMatch?.maxPlayers ?? 'Okänt antal'}</div>
            {effectiveMatch?.playStyle && <div className="play-style-description">Spelstil: {effectiveMatch.playStyle}</div>}
          </div>
        </div>
      </section>

      {/* Matchinfo card: summary of match location and settings (mobile-friendly) */}
      <section className="match-info-card">
        <div className="match-info-inner">
          { (effectiveMatch?.area || effectiveMatch?.city) && (
            <div className="info-row">
              <div className="info-icon">📍</div>
              <div className="info-text">{effectiveMatch?.area || effectiveMatch?.city}</div>
            </div>
          )}

          { effectiveMatch?.surface && (
            <div className="info-row">
              <div className="info-icon">🌱</div>
              <div className="info-text">{effectiveMatch.surface}</div>
            </div>
          )}

          { typeof effectiveMatch?.requiresFootballShoes === 'boolean' && (
            <div className="info-row">
              <div className="info-icon">👟</div>
              <div className="info-text">{effectiveMatch.requiresFootballShoes ? 'Fotbollsskor krävs' : 'Fotbollsskor behövs ej'}</div>
            </div>
          )}

          { typeof effectiveMatch?.hasBall === 'boolean' && (
            <div className="info-row">
              <div className="info-icon">⚽</div>
              <div className="info-text">{effectiveMatch.hasBall ? 'Boll finns på plats' : 'Ta med boll'}</div>
            </div>
          )}

          { effectiveMatch?.playStyle && (
            <div className="info-row">
              <div className="info-icon">🎯</div>
              <div className="info-text">{effectiveMatch.playStyle.charAt(0).toUpperCase() + effectiveMatch.playStyle.slice(1)}</div>
            </div>
          )}

          { effectiveMatch?.description && (
            <div className="info-row">
              <div className="info-icon">🗒️</div>
              <div className="info-text">{effectiveMatch.description}</div>
            </div>
          )}
        </div>
      </section>

      <section className="players-section">
        <h2 className="section-title">Spelare</h2>
        <p className="section-subtitle">Anmälda spelare för matchen</p>

        <div className="players-grid">
          {(() => {
            const players = effectiveMatch?.players || [];
            const max = effectiveMatch?.maxPlayers || 0;
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
          const players = effectiveMatch?.players || [];
          const max = effectiveMatch?.maxPlayers || 0;
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
      <PasswordModal
        open={showPasswordModal}
        initialPassword={joinPassword}
        onSubmit={handlePasswordSubmit}
        onClose={() => { setShowPasswordModal(false); setJoinError(null); }}
        errorText={joinError || null}
      />
      </div>
    </div>
  );
}

export default MatchDetailsPage;
