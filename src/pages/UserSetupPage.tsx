import { useState, type FormEvent, useEffect } from 'react';
import { normalizeArea } from '../utils/normalizeArea';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../types';
import './UserSetupPage.css';
import InstallHelpOverlay from '../components/InstallHelpOverlay';
import { useMatches } from '../contexts/MatchContext';

const FAVORITE_AREAS_KEY = 'grus-gras-favorite-areas';

export default function UserSetupPage() {
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [step, setStep] = useState<'name' | 'city'>('name');
  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  const { currentUser, setCurrentUser, setSelectedArea } = useMatches();

  // If there's no authenticated persistent user, redirect to /auth
  useEffect(() => {
    if (!currentUser) {
      try { console.info('[setup] no currentUser, redirecting to /auth'); } catch (e) {}
      navigate('/auth', { replace: true });
    } else {
      // Pre-fill fields from existing user profile when available
      if (currentUser.name) setName(currentUser.name);
      if (currentUser.homeCity) setHomeCity(currentUser.homeCity);
    }
  }, [currentUser, navigate]);

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('city');
  };

  const handleCitySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!homeCity.trim()) return;

    if (!currentUser) {
      try { console.error('[setup] cannot save setup without authenticated user'); } catch (e) {}
      navigate('/auth', { replace: true });
      return;
    }

    const prevHome = currentUser.homeCity || '';

    const updatedUser: User = {
      ...currentUser,
      name: name.trim() || currentUser.name,
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

    navigate(from, { replace: true });
  };

  return (
    <div className="user-setup-page">
      <div className="user-setup-container">
        <div className="user-setup-content">
          <div className="user-setup-icon">⚽</div>

          {step === 'name' && (
            <>
              <h1 className="user-setup-headline">Välkommen till Grus & Gräs</h1>
              <p className="user-setup-description">
                Hitta och skapa matcher när du vill. Spela en seriös match, träna lite, eller bara ha kul med bollen. Först behöver vi bara veta vad vi ska kalla dig.
              </p>

              <form onSubmit={handleNameSubmit} className="user-setup-form">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ditt namn"
                  className="user-setup-input"
                  autoFocus
                  maxLength={50}
                  required
                />

                <button
                  id="install-app-link"
                  type="button"
                  className="install-inline-link"
                  onClick={() => setShowInstallHelp(true)}
                  aria-label="Install app help"
                >
                  Install app
                </button>

                <button
                  type="submit"
                  className="user-setup-button"
                  disabled={!name.trim()}
                >
                  Fortsätt
                </button>
              </form>
            </>
          )}

          {step === 'city' && (
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
                  disabled={!homeCity.trim()}
                >
                  Fortsätt
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {showInstallHelp && <InstallHelpOverlay onClose={() => setShowInstallHelp(false)} />}
    </div>
  );
}
