import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMatches } from '../contexts/MatchContext';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../utils/password';
import './RegisterPage.css';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCurrentUser } = useMatches();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const uname = username.trim();
    if (!uname) {
      setError('Ange ett användarnamn');
      return;
    }

    setLoading(true);
    try {
      console.info('[register] submit', { username: uname, hasPassword: !!password });
      // Check if username exists
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('username', uname)
        .maybeSingle();

      console.info('[register] existing', existing);

      if (existing) {
        setError('Användarnamnet är upptaget');
        setLoading(false);
        return;
      }

      const password_hash = await hashPassword(password || '');

      const { data, error: insErr } = await supabase
        .from('users')
        .insert([{ username: uname, password_hash, created_at: new Date().toISOString(), role: 'user' }])
        .select()
        .maybeSingle();

      if (insErr) {
        console.error('Supabase insert error:', insErr);
        setError('Kunde inte skapa användaren');
        setLoading(false);
        return;
      }

      if (data) {
        const userObj = { id: data.id, username: data.username, role: data.role || 'user', homeCity: data.home_city || undefined };
        setCurrentUser(userObj);
        console.info('[register] setCurrentUser', userObj);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      setError('Ett oväntat fel inträffade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-header">
          <h1>Grus & Gräs</h1>
          <p className="register-tagline">Hitta match. Spela boll.</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          <h2>Skapa konto</h2>

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
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Lösenord</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Lösenord (valfritt)"
            />
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>

          <p className="register-footer">
            Har du redan ett konto?{' '}
            <Link to="/auth/login" className="register-link">
              Logga in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
