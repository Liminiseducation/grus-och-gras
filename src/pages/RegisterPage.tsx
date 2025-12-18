import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMatches } from '../contexts/MatchContext';
import './RegisterPage.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { setCurrentUser } = useMatches();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken');
      return;
    }

    setLoading(true);

    try {
      const res = await signUp(email, password, name);
      if (res.error) {
        setError(res.error.message);
      } else {
        // If profile info was returned, set app-level currentUser using same shape as login
        const profile = (res as any).profile;
        const userObj = profile
          ? { id: profile.id, username: profile.name || profile.email || undefined, role: profile.role || 'user', homeCity: profile.home_city || undefined }
          : null;

        if (userObj) {
          setCurrentUser(userObj);
        }

        // Successfully registered - App root will show setup or app based on user.homeCity
      }
    } catch (err) {
      setError('Ett oväntat fel inträffade. Försök igen.');
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
            <label htmlFor="name">Namn</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Ditt namn"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-post</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="din@epost.se"
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
              autoComplete="new-password"
              placeholder="Minst 6 tecken"
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Bekräfta lösenord</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="Upprepa lösenordet"
              minLength={6}
            />
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? 'Skapar konto...' : 'Skapa konto'}
          </button>

          <p className="register-footer">
            Har du redan ett konto?{' '}
            <Link to="/login" className="register-link">
              Logga in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
