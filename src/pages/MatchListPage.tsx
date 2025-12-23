import { useState } from 'react';
import { useMatches } from '../contexts/MatchContext';
import { normalizeArea } from '../utils/normalizeArea';
import MatchCard from '../components/MatchCard';
import Header from '../components/Header';
import FloatingActionButton from '../components/FloatingActionButton';
import './MatchListPage.css';
import { supabase } from '../lib/supabase';
import CityChangeModal from '../components/CityChangeModal';

function MatchListPage() {
  const { matches, loading, currentUser, setCurrentUser, selectedArea, setSelectedArea } = useMatches();
  // Get user's home city from app state (persistent authenticated user)
  const homeCity = currentUser?.homeCity || '';
  const currentUserId = currentUser?.id || '';
  const [showCityModal, setShowCityModal] = useState(false);
  
  
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
    // No area filtering here: show all matches that pass the time check.
    return true;
  });

  // Do not apply city filtering in this view — show all matches that
  // pass the time-based `filteredMatches` check.
  const visibleMatches = filteredMatches;

  // Note: match fetching is handled centrally in MatchContext. This view
  // must not trigger fetches on mount or navigation to avoid loops.
  return (
    <div className="match-list-page">
      <Header />
      <div className="area-header">
        <h2 className="area-title">Matcher i {homeCity || 'din stad'}</h2>
        <div style={{ marginTop: 6 }}>
          <button className="add-area-button" onClick={() => setShowCityModal(true)}>Byt stad</button>
        </div>
        <CityChangeModal
          open={showCityModal}
          initialCity={homeCity}
          onClose={() => setShowCityModal(false)}
          onSave={async (newCity: string) => {
            if (!currentUser) return;
            const updated = { ...currentUser, homeCity: newCity };
            try { await supabase.from('profiles').update({ home_city: updated.homeCity }).eq('id', currentUser.id); } catch (e) {}
            try { await supabase.from('users').update({ home_city: updated.homeCity }).eq('id', currentUser.id); } catch (e) {}
            setCurrentUser(updated);
            try { setSelectedArea(normalizeArea(newCity)); } catch (e) { /* ignore */ }
            setShowCityModal(false);
          }}
        />
      </div>

      <div className="matches-container">
        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <h3 className="empty-title">Laddar matcher...</h3>
          </div>
        ) : visibleMatches.length > 0 ? (
          visibleMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon">⚽</div>
            <h3 className="empty-title">Inga matcher just nu</h3>
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
