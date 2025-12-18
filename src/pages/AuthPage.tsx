import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMatches } from '../contexts/MatchContext';
import { supabase } from '../lib/supabase';
import { hashPassword, verifyPassword } from '../utils/password';
import './UserSetupPage.css';

const USER_STORAGE_KEY = 'grus-gras-user';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  const { setCurrentUser } = useMatches();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Användarnamn och lösenord krävs');
      return;
    }
    setLoading(true);
    try {
      const usernameClean = username.trim();
      // Check if username exists
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('username', usernameClean)
        .maybeSingle();

      if (existing) {
        setError('Användarnamnet är upptaget');
        setLoading(false);
        return;
      }

      const password_hash = await hashPassword(password);

      const { data, error } = await supabase
        .from('users')
        .insert([{ username: usernameClean, password_hash, created_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        const msg = error.message || 'Kunde inte skapa användaren';
        const details = (error as any).details ? ` (${(error as any).details})` : '';
        setError(msg + details);
        setLoading(false);
        return;
      }

      // Persist minimal user info locally and update app state
      const stored = { id: data.id, username: data.username, role: (data.role || 'user') };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(stored));
      setCurrentUser({ id: data.id, username: data.username, role: (data.role || 'user') });
      // Log the successful registration and navigation
      try { console.info('[auth] registered user, id saved:', data.id); } catch (e) {}
      navigate('/setup', { replace: true });
    } catch (err) {
      console.error(err);
      setError('Ett oväntat fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Användarnamn och lösenord krävs');
      return;
    }
    setLoading(true);
    try {
      const usernameClean = username.trim();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', usernameClean)
        .maybeSingle();

      if (error) {
        console.error('Supabase select error:', error);
        const emsg = error.message || 'Kunde inte läsa användare';
        setError(emsg + ((error as any).details ? ` (${(error as any).details})` : ''));
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Felaktigt användarnamn eller lösenord');
        setLoading(false);
        return;
      }

      const ok = await verifyPassword(data.password_hash, password);
      if (!ok) {
        setError('Felaktigt användarnamn eller lösenord');
        setLoading(false);
        return;
      }

      const stored = { id: data.id, username: data.username, role: (data.role || 'user') };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(stored));
      setCurrentUser({ id: data.id, username: data.username, role: (data.role || 'user') });
      try { console.info('[auth] login successful, id saved:', data.id); } catch (e) {}
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError('Ett oväntat fel uppstod');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-setup-page">
      <div className="user-setup-container">
        <div className="user-setup-content">
          <div className="user-setup-icon">⚽</div>
          <h1 className="user-setup-headline">Grus & Gräs — konto</h1>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button onClick={() => setMode('login')} disabled={mode === 'login'} className="user-setup-button">Logga in</button>
            <button onClick={() => setMode('register')} disabled={mode === 'register'} className="user-setup-button">Skapa konto</button>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="user-setup-form">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Användarnamn"
              className="user-setup-input"
              autoFocus
              maxLength={50}
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lösenord"
              className="user-setup-input"
              maxLength={200}
              required
            />

            {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

            <button type="submit" className="user-setup-button" disabled={loading}>
              {mode === 'login' ? 'Logga in' : 'Skapa konto'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
