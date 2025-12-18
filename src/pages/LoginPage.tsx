import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMatches } from '../contexts/MatchContext';
import { supabase } from '../lib/supabase';
import { verifyPassword } from '../utils/password';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCurrentUser } = useMatches();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    console.info('[login] submit', { username, password });
    if (!username.trim()) {
      setError('Ange användarnamn');
      return;
    }
    setLoading(true);
    try {
      const uname = username.trim();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', uname)
        .maybeSingle();

      console.info('[login] db lookup result', { data, error });

      if (error) {
        console.error('Supabase select error:', error);
        setError('Kunde inte läsa användare');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Felaktigt användarnamn eller lösenord');
        setLoading(false);
        return;
      }

      const ok = await verifyPassword(data.password_hash || '', password);
      console.info('[login] password verify', ok);
      if (!ok) {
        setError('Felaktigt användarnamn eller lösenord');
        setLoading(false);
        return;
      }

      const userObj = { id: data.id, username: data.username, role: data.role || 'user', homeCity: data.home_city || undefined };
      setCurrentUser(userObj);
      console.info('[login] setCurrentUser', userObj);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Ett oväntat fel inträffade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Grus & Gräs</h1>
          <p className="login-tagline">Hitta match. Spela boll.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <h2>Logga in</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Användarnamn</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Användarnamn"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Lösenord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Lösenord"
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Loggar in...' : 'Logga in'}
          </button>

          <p className="login-footer">
            Har du inget konto?{' '}
            <Link to="/auth/register" className="login-link">
              Skapa konto
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
