import { useState } from 'react';
import type { User } from '../types';
import './Header.css';
import InstallHint from './InstallHint';
import InstallHintIOS from './InstallHintIOS';

const USER_STORAGE_KEY = 'grus-gras-user';

export default function Header() {
  const [showMenu, setShowMenu] = useState(false);
  
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  const user: User | null = userJson ? JSON.parse(userJson) : null;

  const handleClearUser = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    window.location.href = '/setup';
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
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
        </div>
        <div className="user-menu-container">
          <button 
            className="user-button" 
            onClick={() => setShowMenu(!showMenu)}
            title={user?.name || 'Användare'}
          >
            {getInitials()}
          </button>
          {showMenu && (
            <div className="user-menu">
              <div className="user-menu-header">
                <div className="user-menu-name">{user?.name || 'Användare'}</div>
              </div>
              <button className="user-menu-logout" onClick={handleClearUser}>
                Byt namn
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
    <InstallHint />
    <InstallHintIOS />
    </>
  );
}
