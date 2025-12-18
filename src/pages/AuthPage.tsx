import { useNavigate } from 'react-router-dom';
import './UserSetupPage.css';

export default function AuthPage() {
  // Show a simple choice screen linking to dedicated login/register pages
  const navigate = useNavigate();

  return (
    <div className="user-setup-page">
      <div className="user-setup-container">
        <div className="user-setup-content">
          <div className="user-setup-icon">⚽</div>
          <h1 className="user-setup-headline">Grus & Gräs</h1>
          <p className="user-setup-sub">Välj hur du vill fortsätta</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <button type="button" onClick={() => navigate('/auth/login')} className="user-setup-button">Logga in</button>
            <button type="button" onClick={() => navigate('/auth/register')} className="user-setup-button">Skapa konto</button>
          </div>
        </div>
      </div>
    </div>
  );
}
