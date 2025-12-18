import { Navigate, useLocation } from 'react-router-dom';
import { useMatches } from '../contexts/MatchContext';

interface AdminGateProps {
  children: React.ReactNode;
}

export default function AdminGate({ children }: AdminGateProps) {
  const location = useLocation();
  const { currentUser } = useMatches();

  if (!currentUser) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (currentUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
