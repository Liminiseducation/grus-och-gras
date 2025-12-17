import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { User } from '../types';
import './UserSetupPage.css';
import InstallHelpOverlay from '../components/InstallHelpOverlay';

const USER_STORAGE_KEY = 'grus-gras-user';

function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function UserSetupPage() {
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [step, setStep] = useState<'name' | 'city'>('name');
  const [name, setName] = useState('');
  const [homeCity, setHomeCity] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep('city');
  };

  const handleCitySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!homeCity.trim()) return;
    
    const user: User = {
      id: generateUserId(),
      name: name.trim(),
      homeCity: homeCity.trim(),
    };

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
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
