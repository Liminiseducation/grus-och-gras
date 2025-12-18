import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MatchProvider, useMatches } from './contexts/MatchContext';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/AppLayout';
import UserSetupPage from './pages/UserSetupPage';
import AuthPage from './pages/AuthPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import AdminGate from './components/AdminGate';
import MatchListPage from './pages/MatchListPage';
import CreateMatchPage from './pages/CreateMatchPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import './lib/supabase';
import './App.css';

function InnerRouter() {
  const { authInitialized, currentUser } = useMatches();

  function RequireAuthAndCity({ children }: { children: React.ReactNode }) {
    if (!authInitialized) {
      return <div className="loading">Laddar…</div>;
    }

    if (!currentUser) {
      return <Navigate to="/auth" replace />;
    }

    const hasHomeCity = typeof currentUser?.homeCity === 'string' && currentUser?.homeCity.trim().length > 0;
    if (!hasHomeCity) {
      return <UserSetupPage />;
    }

    return <>{children}</>;
  }

  // Define all routes; auth routes are always available, app routes wrapped by RequireAuthAndCity
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      <Route path="/admin" element={<RequireAuthAndCity><AdminGate><AppLayout><AdminPage /></AppLayout></AdminGate></RequireAuthAndCity>} />
      <Route path="/create" element={<RequireAuthAndCity><AppLayout><CreateMatchPage /></AppLayout></RequireAuthAndCity>} />
      <Route path="/match/:id" element={<RequireAuthAndCity><AppLayout><MatchDetailsPage /></AppLayout></RequireAuthAndCity>} />
      <Route path="/" element={<RequireAuthAndCity><AppLayout><MatchListPage /></AppLayout></RequireAuthAndCity>} />

      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <MatchProvider>
          <InnerRouter />
        </MatchProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
