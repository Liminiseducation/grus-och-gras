import { useState, type FormEvent, useEffect } from 'react';
import { normalizeArea } from '../utils/normalizeArea';
import type { User } from '../types';
import './UserSetupPage.css';
import InstallHelpOverlay from '../components/InstallHelpOverlay';
import { useMatches } from '../contexts/MatchContext';
import { supabase } from '../lib/supabase';

const FAVORITE_AREAS_KEY = 'grus-gras-favorite-areas';

export default function UserSetupPage() {
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [homeCity, setHomeCity] = useState('');
  const { currentUser, setCurrentUser, /* setSelectedArea, */ authInitialized } = useMatches();
  // Wait for auth initialization. App-level gate will handle redirecting to /auth
  useEffect(() => {
    if (!authInitialized) return;
    // Pre-fill home city from existing user profile when available
    if (currentUser?.homeCity) setHomeCity(currentUser.homeCity);
  }, [authInitialized, currentUser]);

  const handleCitySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!homeCity.trim()) return;

    // Do nothing if the authenticated user isn't ready yet
    if (!currentUser) {
      try { console.warn('[setup] submit ignored: currentUser not ready'); } catch (e) {}
      return;
    }

    const updatedUser: User = {
      ...currentUser,
      homeCity: homeCity.trim(),
    };

    if (!currentUser) return;

    try {
      // Try updating both common user/profile tables so this works for both
      // the simple `users` table and Supabase `profiles` table.
      supabase.from('profiles').update({ home_city: updatedUser.homeCity }).eq('id', currentUser.id).then(() => {}).catch(() => {});
      supabase.from('users').update({ home_city: updatedUser.homeCity }).eq('id', currentUser.id).then(() => {}).catch(() => {});
    } catch (e) {
      console.warn('Could not persist homeCity to backend:', e);
    }

    // Persist user via context setter (updates in-memory state and localStorage)
    setCurrentUser(updatedUser);
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
                disabled={!homeCity.trim() || !currentUser || !authInitialized}
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
