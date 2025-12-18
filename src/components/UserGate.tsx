import { Navigate, useLocation } from 'react-router-dom';
import { useMatches } from '../contexts/MatchContext';

interface UserGateProps {
  children: React.ReactNode;
}

export default function UserGate({ children }: UserGateProps) {
  const location = useLocation();
  // Use match context to determine if an area has been selected and to read current user
  const { selectedArea, currentUser } = useMatches();

  // Log routing decision
  try {
    // eslint-disable-next-line no-console
    console.info('[route] currentUser:', currentUser, 'selectedArea:', selectedArea);
  } catch (e) {
    // ignore
  }

  // If no persistent currentUser, send to auth (login/register)
  if (!currentUser) {
    // eslint-disable-next-line no-console
    console.info('[route] navigating to /auth (no currentUser)');
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  // If user exists but hasn't selected an area yet, require onboarding
  if (!selectedArea) {
    // eslint-disable-next-line no-console
    console.info('[route] navigating to /setup (no selectedArea)');
    return <Navigate to="/setup" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
