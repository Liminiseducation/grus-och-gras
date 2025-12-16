import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MatchProvider } from './contexts/MatchContext';
import UserGate from './components/UserGate';
import AppLayout from './components/AppLayout';
import UserSetupPage from './pages/UserSetupPage';
import MatchListPage from './pages/MatchListPage';
import CreateMatchPage from './pages/CreateMatchPage';
import MatchDetailsPage from './pages/MatchDetailsPage';
import './App.css';

function App() {
  return (
    <Router>
      <MatchProvider>
        <Routes>
          {/* User setup route - no gate */}
          <Route path="/setup" element={<UserSetupPage />} />
          
          {/* Main app routes - protected by UserGate */}
          <Route
            path="/"
            element={
              <UserGate>
                <AppLayout>
                  <MatchListPage />
                </AppLayout>
              </UserGate>
            }
          />
          <Route
            path="/create"
            element={
              <UserGate>
                <AppLayout>
                  <CreateMatchPage />
                </AppLayout>
              </UserGate>
            }
          />
          <Route
            path="/match/:id"
            element={
              <UserGate>
                <AppLayout>
                  <MatchDetailsPage />
                </AppLayout>
              </UserGate>
            }
          />
        </Routes>
      </MatchProvider>
    </Router>
  );
}

export default App;
