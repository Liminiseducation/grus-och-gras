import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { MatchProvider, useMatches } from './contexts/MatchContext';
import AppLayout from './components/AppLayout';
import UserSetupPage from './pages/UserSetupPage';
import AuthPage from './pages/AuthPage';
import AdminPage from './pages/AdminPage';
import AdminGate from './components/AdminGate';
import MatchListPage from './pages/MatchListPage';
import CreateMatchPage from './pages/CreateMatchPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import './lib/supabase';
import './App.css';

function InnerRouter() {
  const { authInitialized, currentUser } = useMatches();

  if (!authInitialized) {
    return <div className="loading">Laddar…</div>;
  }

  if (!currentUser) {
    // No authenticated user — show Auth screen
    return <AuthPage />;
  }

  const hasHomeCity = typeof currentUser?.homeCity === 'string' && currentUser?.homeCity.trim().length > 0;

  if (!hasHomeCity) {
    return <UserSetupPage />;
  }

  // Authenticated and area selected → main application router
  return (
    <Router>
      <Routes>
        <Route path="/admin" element={<AdminGate><AppLayout><AdminPage /></AppLayout></AdminGate>} />
        <Route path="/create" element={<AppLayout><CreateMatchPage /></AppLayout>} />
        <Route path="/match/:id" element={<AppLayout><MatchDetailsPage /></AppLayout>} />
        <Route path="/" element={<AppLayout><MatchListPage /></AppLayout>} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <MatchProvider>
      <InnerRouter />
    </MatchProvider>
  );
}

export default App;
