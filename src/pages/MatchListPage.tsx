import { useState, useEffect } from 'react';
import { useMatches } from '../contexts/MatchContext';
import type { User } from '../types';
import MatchCard from '../components/MatchCard';
import Header from '../components/Header';
import FloatingActionButton from '../components/FloatingActionButton';
import './MatchListPage.css';

const USER_STORAGE_KEY = 'grus-gras-user';
const FAVORITE_AREAS_KEY = 'grus-gras-favorite-areas';
const SELECTED_AREA_KEY = 'grus-gras-selected-area';

function MatchListPage() {
  const { matches, loading } = useMatches();
  const [showAreaExpansion, setShowAreaExpansion] = useState(false);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [limitMessage, setLimitMessage] = useState('');
  const [favoriteAreas, setFavoriteAreas] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  
  const MAX_FAVORITE_AREAS = 7;
  
  // Get user's home city
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  const user: User | null = userJson ? JSON.parse(userJson) : null;
  const homeCity = user?.homeCity || '';
  const currentUserId = user?.id || '';
  
  // Load favorite areas from localStorage on mount and when homeCity changes
  useEffect(() => {
    const favoriteAreasJson = localStorage.getItem(FAVORITE_AREAS_KEY);
    const storedFavorites: string[] = favoriteAreasJson ? JSON.parse(favoriteAreasJson) : [];
    
    // Ensure homeCity is always included in favorites
    const areas = homeCity && !storedFavorites.includes(homeCity)
      ? [homeCity, ...storedFavorites]
      : storedFavorites.length > 0
      ? storedFavorites
      : homeCity
      ? [homeCity]
      : [];
    
    setFavoriteAreas(areas);
    // Load previously selected area (if any) and normalize it
    const storedSelected = localStorage.getItem(SELECTED_AREA_KEY) || '';
    setSelectedArea(storedSelected ? normalizeAreaName(storedSelected) : '');
  }, [homeCity]);
  
  const normalizeAreaName = (name: string): string => {
    // Trim whitespace
    const trimmed = name.trim();
    
    // Capitalize first letter of each word
    return trimmed
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };
  
  const addFavoriteArea = () => {
    setLimitMessage('');
    
    // Normalize the input
    const normalizedArea = normalizeAreaName(newAreaInput);
    
    if (!normalizedArea) {
      setLimitMessage('Skriv in ett område eller stad.');
      return;
    }
    
    // Check if already exists (case-insensitive)
    const existingArea = favoriteAreas.find(
      area => area.toLowerCase() === normalizedArea.toLowerCase()
    );
    
    if (existingArea) {
      setLimitMessage('Detta område finns redan i favoriter.');
      return;
    }
    
    // Count non-home favorites
    const nonHomeFavorites = favoriteAreas.filter(area => area !== homeCity);
    
    if (nonHomeFavorites.length >= MAX_FAVORITE_AREAS) {
      setLimitMessage(`Du kan ha max ${MAX_FAVORITE_AREAS} favoritområden. Ta bort något för att lägga till nytt.`);
      return;
    }
    
    // Add the normalized area
    const updatedFavorites = [...favoriteAreas.filter(a => a !== homeCity), normalizedArea];
    localStorage.setItem(FAVORITE_AREAS_KEY, JSON.stringify(updatedFavorites));
    setFavoriteAreas([...favoriteAreas, normalizedArea]);
    setNewAreaInput('');
  };
  
  const removeFavoriteArea = (area: string) => {
    // Don't allow removing homeCity
    if (area === homeCity) return;
    
    const updatedAreas = favoriteAreas.filter(a => a !== area);
    const updatedFavorites = updatedAreas.filter(a => a !== homeCity);
    localStorage.setItem(FAVORITE_AREAS_KEY, JSON.stringify(updatedFavorites));
    setFavoriteAreas(updatedAreas);
    setLimitMessage('');
  };
  
  const now = new Date();
  
  
  console.log('All matches:', matches);
  console.log('Favorite areas:', favoriteAreas);
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
    if (!selectedArea) return true; // no area selected -> show all (per requirements)

    const matchAreaRaw = (match && (match.area || '')) as string;
    const matchArea = matchAreaRaw ? normalizeAreaName(matchAreaRaw) : '';

    // Include matches missing an area (do not filter them out)
    if (!matchArea) return true;

    return matchArea === normalizeAreaName(selectedArea);
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
                  className={`area-pill ${area === homeCity ? 'area-pill-home' : 'area-pill-active'} ${normalizeAreaName(area) === selectedArea ? 'area-pill-selected' : ''}`}
                  disabled={area === homeCity}
                  onClick={() => {
                    if (area === homeCity) return;
                    const normalized = normalizeAreaName(area);
                    const newSelection = selectedArea === normalized ? '' : normalized;
                    setSelectedArea(newSelection);
                    if (newSelection) {
                      localStorage.setItem(SELECTED_AREA_KEY, newSelection);
                    } else {
                      localStorage.removeItem(SELECTED_AREA_KEY);
                    }
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
