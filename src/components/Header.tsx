import { useState, useEffect, useRef } from 'react';
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
  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!showMenu) return;

    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (menuRef.current && !menuRef.current.contains(target) && buttonRef.current && !buttonRef.current.contains(target)) {
        setShowMenu(false);
        buttonRef.current?.focus();
      }
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowMenu(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showMenu]);

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
            ref={buttonRef}
            className="user-button" 
            onClick={() => setShowMenu(!showMenu)}
            aria-haspopup="true"
            aria-expanded={showMenu}
            title={user?.username || 'Användare'}
          >
            {getInitials()}
          </button>
          {showMenu && (
            <div ref={menuRef} className="user-menu" role="dialog" aria-label="Användarmeny">
              <button
                className="user-menu-close"
                aria-label="Stäng meny"
                onClick={() => { setShowMenu(false); buttonRef.current?.focus(); }}
              >
                ×
              </button>
              <div className="user-menu-header">
                <div className="user-menu-name">{user?.username || 'Användare'}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>


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
