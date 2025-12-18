import { useState } from 'react';
import type { User } from '../types';
import './Header.css';
import InstallHelpOverlay from './InstallHelpOverlay';
import { useMatches } from '../contexts/MatchContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const { currentUser, setCurrentUser } = useMatches();
  const navigate = useNavigate();

  const user: User | null = currentUser || null;

  const handleClearUser = () => {
    // Clearing user logs out to auth; persistent user removed
    setCurrentUser(null);
    navigate('/auth', { replace: true });
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
              <button className="user-menu-logout" onClick={handleClearUser}>
                Byt namn
              </button>
              
            </div>
          )}
        </div>
      </div>
    </header>
    {showInstallHelp && <InstallHelpOverlay onClose={() => setShowInstallHelp(false)} />}
    </>
  );
}
