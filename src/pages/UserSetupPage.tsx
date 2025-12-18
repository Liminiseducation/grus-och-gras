import { useState, type FormEvent, useEffect } from 'react';
import { normalizeArea } from '../utils/normalizeArea';
import { useNavigate } from 'react-router-dom';
import type { User } from '../types';
import './UserSetupPage.css';
import InstallHelpOverlay from '../components/InstallHelpOverlay';
import { useMatches } from '../contexts/MatchContext';

const FAVORITE_AREAS_KEY = 'grus-gras-favorite-areas';

export default function UserSetupPage() {
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [homeCity, setHomeCity] = useState('');
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, setSelectedArea, authInitialized } = useMatches();

  // Wait for auth initialization. If initialized and no user, redirect to /auth.
  useEffect(() => {
    if (!authInitialized) return;
    if (!currentUser) {
      try { console.info('[setup] no currentUser after init, redirecting to /auth'); } catch (e) {}
      navigate('/auth', { replace: true });
      return;
    }
    // Pre-fill home city from existing user profile when available
    if (currentUser.homeCity) setHomeCity(currentUser.homeCity);
  }, [authInitialized, currentUser, navigate]);

  const handleCitySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!homeCity.trim()) return;

    // Do nothing if the authenticated user isn't ready yet
    if (!currentUser) {
      try { console.warn('[setup] submit ignored: currentUser not ready'); } catch (e) {}
      return;
    }

    const prevHome = currentUser.homeCity || '';

    const updatedUser: User = {
      ...currentUser,
      // Use username as the canonical display name; store home city here
      homeCity: homeCity.trim(),
    };

    // Persist user via context setter (which also updates localStorage)
    setCurrentUser(updatedUser);

    // Update favorites: remove previous home city and ensure new homeCity is first
    try {
      const favJson = localStorage.getItem(FAVORITE_AREAS_KEY);
      const storedFavorites: string[] = favJson ? JSON.parse(favJson) : [];
      const cleaned = storedFavorites.filter(a => normalizeArea(a) !== normalizeArea(prevHome));
      if (updatedUser.homeCity && !cleaned.some(a => normalizeArea(a) === normalizeArea(updatedUser.homeCity))) cleaned.unshift(updatedUser.homeCity);
      localStorage.setItem(FAVORITE_AREAS_KEY, JSON.stringify(cleaned));
    } catch (e) {
      // ignore
    }

    // Set selected area to the user's home city so onboarding completes
    try {
      const normalized = normalizeArea(updatedUser.homeCity || '');
      setSelectedArea(normalized);
    } catch (e) {
      // ignore
    }

    // Navigate to main app view (matches). Use root to avoid redirect loops.
    navigate('/', { replace: true });
  };

  return (
    <div className="user-setup-page">
      <div className="user-setup-container">
        <div className="user-setup-content">
          <div className="user-setup-icon">⚽</div>

          <>
            <h1 className="user-setup-headline">Vilken stad eller ort bor du i?</h1>
            <p className="user-setup-description">
              Vi visar matcher nära dig först
            </p>

            <form onSubmit={handleCitySubmit} className="user-setup-form">
              <input
                type="text"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                placeholder="t.ex. Lerum, Rydsgård, Floda"
                className="user-setup-input"
                autoFocus
                maxLength={50}
                required
              />

              <button
                type="submit"
                className="user-setup-button"
                disabled={!homeCity.trim() || !currentUser}
              >
                Fortsätt
              </button>
            </form>
          </>
        </div>
      </div>
      {showInstallHelp && <InstallHelpOverlay onClose={() => setShowInstallHelp(false)} />}
    </div>
  );
}
