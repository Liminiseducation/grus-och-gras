import { useState } from 'react';
import type { User } from '../types';
import './Header.css';
import InstallHelpOverlay from './InstallHelpOverlay';
import { useMatches } from '../contexts/MatchContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const { currentUser, setCurrentUser } = useMatches();
  const navigate = useNavigate();
  const [showChangeCity, setShowChangeCity] = useState(false);
  const [cityInput, setCityInput] = useState('');

  const user: User | null = currentUser || null;

  const handleClearUser = () => {
    // Clearing user logs out to auth; persistent user removed
    setCurrentUser(null);
  };

  const getInitials = () => {
    // Use the first character of the username (uppercase). Fallback to 'U'.
    try {
      const uname = user?.username;
      if (uname && typeof uname === 'string' && uname.trim().length > 0) {
        return uname.trim().charAt(0).toUpperCase();
      }
    } catch (e) {
      // ignore
    }
    return 'U';
  };

  return (
    <>
    <header className="app-header">
      <div className="header-content">
        <div className="header-text">
          <h1 className="app-name">Grus & Gräs</h1>
          <p className="app-tagline">Hitta match. Spela boll.</p>
          <button className="global-install-link" onClick={() => setShowInstallHelp(true)}>Installera appen</button>
          {user?.role === 'admin' && (
            <button className="admin-link" onClick={() => navigate('/admin')} style={{ marginLeft: 12 }}>Admin</button>
          )}
        </div>
        <div className="user-menu-container">
          <button 
            className="user-button" 
            onClick={() => setShowMenu(!showMenu)}
            title={user?.username || 'Användare'}
          >
            {getInitials()}
          </button>
          {showMenu && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-menu-name">{user?.username || 'Användare'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
                <button className="user-menu-logout" onClick={() => setShowChangeCity(!showChangeCity)}>
                  Byt stad
                </button>

                {showChangeCity && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Ange stad eller ort"
                      style={{ padding: '6px 8px', borderRadius: 4, border: '1px solid #ddd' }}
                    />
                    <button
                      onClick={async () => {
                        if (!cityInput.trim() || !currentUser) return;
                        const updated = { ...currentUser, homeCity: cityInput.trim() };
                        try {
                          // Persist to both common tables if present; best-effort
                          await supabase.from('profiles').update({ home_city: updated.homeCity }).eq('id', currentUser.id);
                        } catch (e) {
                          // ignore
                        }
                        try {
                          await supabase.from('users').update({ home_city: updated.homeCity }).eq('id', currentUser.id);
                        } catch (e) {
                          // ignore
                        }
                        setCurrentUser(updated);
                        setShowChangeCity(false);
                        setShowMenu(false);
                      }}
                    >
                      Spara
                    </button>
                    <button onClick={() => setShowChangeCity(false)}>Avbryt</button>
                  </div>
                )}

                <button className="user-menu-logout" onClick={handleClearUser}>
                  Logga ut
                </button>
              </div>
              
            </div>
          )}
        </div>
      </div>
    </header>
    {showInstallHelp && <InstallHelpOverlay onClose={() => setShowInstallHelp(false)} />}
    </>
  );
}
