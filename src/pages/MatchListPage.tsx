import { useState, useEffect } from 'react';
import { useMatches } from '../contexts/MatchContext';
import { normalizeArea } from '../utils/normalizeArea';
import MatchCard from '../components/MatchCard';
import Header from '../components/Header';
import FloatingActionButton from '../components/FloatingActionButton';
import './MatchListPage.css';
import { supabase } from '../lib/supabase';

function MatchListPage() {
  const { matches, loading, currentUser, setCurrentUser } = useMatches();
  const [showChangeCityPrompt, setShowChangeCityPrompt] = useState(false);
  const [cityInput, setCityInput] = useState('');
  // Get user's home city from app state (persistent authenticated user)
  const homeCity = currentUser?.homeCity || '';
  const currentUserId = currentUser?.id || '';
  
  useEffect(() => {
    try { setCityInput(homeCity); } catch (e) {}
  }, [homeCity]);
  
  const now = new Date();
  
  
  console.log('All matches:', matches);
  console.log('Current user ID:', currentUserId);

  // Time + Area filtering:
  // - Show matches that are in the future or up to 2 hours in the past (grace period).
  // - Matches missing date or time should always be shown.
  // - Time comparisons are done using local timezone by constructing a Date from
  //   the `date` and `time` fields (e.g. `YYYY-MM-DD` + `HH:mm`) so comparisons
  //   occur in the same timezone as the client.
  // Grace period rationale: allow slight clock skew / recently-started matches
  // to remain visible briefly so users can still join or see them (2 hours chosen).
  const GRACE_PERIOD_MS = 2 * 60 * 60 * 1000; // 2 hours
  const cutoff = new Date(now.getTime() - GRACE_PERIOD_MS);

  const filteredMatches = matches.filter((match) => {
    // Time check: if both date and time exist, evaluate; otherwise keep the match
    let timeOk = true;
    if (match?.date && match?.time) {
      try {
        const matchDateTime = new Date(`${match.date}T${match.time}`);
        timeOk = matchDateTime >= cutoff; // allow future and up to 2h past
      } catch (e) {
        // If parsing fails, do not filter out the match
        timeOk = true;
      }
    }

    if (!timeOk) return false;

    // Area check — only show matches for the user's current home city
    const effectiveSelected = normalizeArea(homeCity || '');
    if (!effectiveSelected) return false;

    const matchAreaNorm = (match && (match.normalizedArea || normalizeArea(match.area || '')) ) as string;
    const matchCityNorm = (match && (match.normalizedCity || normalizeArea(match.city || '')) ) as string;
    // Include matches missing an area/city (do not filter them out)
    if (!matchAreaNorm && !matchCityNorm) return true;
    return matchAreaNorm === effectiveSelected || matchCityNorm === effectiveSelected;
  });
  return (
    <div className="match-list-page">
      <Header />
      <div className="area-header">
        <h2 className="area-title">Matcher i {homeCity || 'din stad'}</h2>
        <div style={{ marginTop: 6 }}>
          <button className="add-area-button" onClick={async () => {
            const newCity = window.prompt('Ange stad eller ort', homeCity || '');
            if (!newCity || !newCity.trim() || !currentUser) return;
            const updated = { ...currentUser, homeCity: newCity.trim() };
            try { await supabase.from('profiles').update({ home_city: updated.homeCity }).eq('id', currentUser.id); } catch (e) {}
            try { await supabase.from('users').update({ home_city: updated.homeCity }).eq('id', currentUser.id); } catch (e) {}
            setCurrentUser(updated);
          }}>Byt stad</button>
        </div>
      </div>

      <div className="matches-container">
        {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <h3 className="empty-title">Laddar matcher...</h3>
            </div>
          ) : !(normalizeArea(homeCity || '')) ? (
            <div className="empty-state">
              <div className="empty-icon">📍</div>
              <h3 className="empty-title">Välj ett område för att se matcher</h3>
              <p className="empty-message">Tryck på "Byt stad" för att välja din stad.</p>
            </div>
          ) : filteredMatches.length > 0 ? (
            filteredMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon">⚽</div>
              <h3 className="empty-title">Inga matcher i dina områden just nu</h3>
              <p className="empty-message">
                Var den första! Skapa en match så kommer andra snart med.
              </p>
            </div>
          )}
      </div>

      <FloatingActionButton />
    </div>
  );
}

export default MatchListPage;
