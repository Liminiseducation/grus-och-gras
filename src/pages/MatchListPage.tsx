import { useState, useEffect } from 'react';
import { useMatches } from '../contexts/MatchContext';
import { normalizeArea } from '../utils/normalizeArea';
import type { User } from '../types';
import MatchCard from '../components/MatchCard';
import Header from '../components/Header';
import FloatingActionButton from '../components/FloatingActionButton';
import './MatchListPage.css';

const USER_STORAGE_KEY = 'grus-gras-user';
const FAVORITE_AREAS_KEY = 'grus-gras-favorite-areas';
const SELECTED_AREA_KEY = 'grus-gras-selected-area';

function MatchListPage() {
  const { matches, loading, selectedArea, setSelectedArea } = useMatches();
  const [showAreaExpansion, setShowAreaExpansion] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [limitMessage, setLimitMessage] = useState('');
  const [favoriteAreas, setFavoriteAreas] = useState<string[]>([]);
  
  const MAX_FAVORITE_AREAS = 7;
  
  // Get user's home city from app state (persistent authenticated user)
  const { currentUser } = useMatches();
  const homeCity = currentUser?.homeCity || '';
  const currentUserId = currentUser?.id || '';
  
  // Load favorite areas from localStorage on mount and when homeCity changes
  useEffect(() => {
    const favoriteAreasJson = localStorage.getItem(FAVORITE_AREAS_KEY);
    const storedFavorites: string[] = favoriteAreasJson ? JSON.parse(favoriteAreasJson) : [];
    
    // Ensure homeCity is always included in favorites (keep original strings for display)
    const rawAreas = homeCity && !storedFavorites.includes(homeCity)
      ? [homeCity, ...storedFavorites]
      : storedFavorites.length > 0
      ? storedFavorites
      : homeCity
      ? [homeCity]
      : [];

    setFavoriteAreas(rawAreas);

    // If the user has multiple favorite areas, clear any previously persisted single selection
    try {
      const storedSelected = typeof window !== 'undefined' ? localStorage.getItem(SELECTED_AREA_KEY) : null;
      if (rawAreas.length > 1 && storedSelected) {
        localStorage.removeItem(SELECTED_AREA_KEY);
        // update context selectedArea as well
        setSelectedArea('');
      }
    } catch (e) {
      // ignore
    }
    // previously selected area is handled in MatchContext
  }, [homeCity]);
  
  // Use shared normalizeArea util for all comparisons (keeps original strings for display)
  
  const addFavoriteArea = () => {
    setLimitMessage('');
    
    const newAreaTrimmed = newAreaInput.trim();
    const normalizedNew = normalizeArea(newAreaTrimmed);
    if (!normalizedNew) {
      setLimitMessage('Skriv in ett område eller stad.');
      return;
    }
    
    // Check if already exists by normalized form
    const existingNormalized = favoriteAreas.map(a => normalizeArea(a));
    if (existingNormalized.includes(normalizedNew)) {
      setLimitMessage('Detta område finns redan i favoriter.');
      return;
    }
    
    // Count non-home favorites
    const nonHomeFavorites = favoriteAreas.filter(area => area !== homeCity);
    
    if (nonHomeFavorites.length >= MAX_FAVORITE_AREAS) {
      setLimitMessage(`Du kan ha max ${MAX_FAVORITE_AREAS} favoritområden. Ta bort något för att lägga till nytt.`);
      return;
    }
    
    // Add the original trimmed input to favorites for display
    const updatedFavorites = [...favoriteAreas.filter(a => normalizeArea(a) !== normalizeArea(homeCity)), newAreaTrimmed];
    localStorage.setItem(FAVORITE_AREAS_KEY, JSON.stringify(updatedFavorites));
    setFavoriteAreas([...favoriteAreas, newAreaTrimmed]);
    setNewAreaInput('');
  };
  
  const removeFavoriteArea = (area: string) => {
    // Don't allow removing homeCity (compare normalized)
    if (normalizeArea(area) === normalizeArea(homeCity)) return;
    
    const updatedAreas = favoriteAreas.filter(a => a !== area);
    const updatedFavorites = updatedAreas.filter(a => normalizeArea(a) !== normalizeArea(homeCity));
    localStorage.setItem(FAVORITE_AREAS_KEY, JSON.stringify(updatedFavorites));
    setFavoriteAreas(updatedAreas);
    setLimitMessage('');
  };
  
  const now = new Date();
  
  
  console.log('All matches:', matches);
  console.log('Favorite areas:', favoriteAreas);
  // Detailed normalized debug to help find mismatches between match area/city and favorites
  try {
    const normalizedFavs = favoriteAreas.map(a => normalizeArea(a));
    const matchDebug = (matches || []).map(m => ({ id: m.id, area: m.area, city: m.city, normArea: m.normalizedArea || normalizeArea(m.area || ''), normCity: m.normalizedCity || normalizeArea(m.city || '') }));
    console.log('Normalized favorites:', normalizedFavs);
    console.log('Matches (normalized area/city):', matchDebug);
    console.log('Selected area (normalized):', selectedArea ? selectedArea : '(none)');
  } catch (e) {
    // ignore logging errors
  }
  console.log('Current user ID:', currentUserId);
  console.log('Selected area:', selectedArea);

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

    // Area check
    // Do NOT show any matches unless a single area is actively selected.
    // This ensures onboarding requirement: a logged-in user must choose an area
    // before seeing matches. If no `selectedArea` is present, this filter
    // will exclude all matches.
    if (!selectedArea) return false;

    const matchAreaNorm = (match && (match.normalizedArea || normalizeArea(match.area || '')) ) as string;
    const matchCityNorm = (match && (match.normalizedCity || normalizeArea(match.city || '')) ) as string;
    // Include matches missing an area/city (do not filter them out)
    if (!matchAreaNorm && !matchCityNorm) return true;
    return matchAreaNorm === selectedArea || matchCityNorm === selectedArea;
  });
  


  return (
    <div className="match-list-page">
      <Header />

      <div className="area-header">
        <h2 className="area-title">
          Matcher i {favoriteAreas.length === 1 ? homeCity : `${favoriteAreas.length} områden`}
        </h2>
        <p className="area-helper-text">
          Lägg till stad eller område för att se matcher där
        </p>
        <button 
          className="expand-areas-button"
          onClick={() => setShowAreaExpansion(!showAreaExpansion)}
        >
          {showAreaExpansion ? 'Dölj områden' : 'Hantera områden'}
        </button>
      </div>

      {showAreaExpansion && (
        <div className="area-expansion">
          <div className="area-pills">
            {favoriteAreas.map(area => (
              <div key={area} className="area-pill-wrapper">
                <button
                  className={`area-pill ${normalizeArea(area) === normalizeArea(homeCity) ? 'area-pill-home' : 'area-pill-active'} ${normalizeArea(area) === selectedArea ? 'area-pill-selected' : ''}`}
                  onClick={() => {
                    const normalized = normalizeArea(area);
                    const newSelection = selectedArea === normalized ? '' : normalized;
                    setSelectedArea(newSelection);
                  }}
                >
                  {area}{area === homeCity ? ' • Hem' : ''}
                </button>
                {area !== homeCity && (
                  <button
                    className="remove-area-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavoriteArea(area);
                    }}
                    title="Ta bort från favoriter"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="add-area-section">
            <input
              type="text"
              className="add-area-input"
              placeholder="Lägg till område eller stad"
              value={newAreaInput}
              onChange={(e) => setNewAreaInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addFavoriteArea()}
            />
            <button onClick={addFavoriteArea} className="add-area-button">
              Lägg till
            </button>
          </div>
          {limitMessage && (
            <p className="limit-message">{limitMessage}</p>
          )}
        </div>
      )}

      <div className="matches-container">
        {loading ? (
            <div className="empty-state">
              <div className="empty-icon">⏳</div>
              <h3 className="empty-title">Laddar matcher...</h3>
            </div>
          ) : !selectedArea ? (
            <div className="empty-state">
              <div className="empty-icon">📍</div>
              <h3 className="empty-title">Välj ett område för att se matcher</h3>
              <p className="empty-message">Hantera dina områden ovan för att välja vilket område du vill se matcher i.</p>
              <button className="add-area-button" onClick={() => setShowAreaExpansion(true)}>Hantera områden</button>
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
