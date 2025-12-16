import { Navigate, useLocation } from 'react-router-dom';

const USER_STORAGE_KEY = 'grus-gras-user';

interface UserGateProps {
  children: React.ReactNode;
}

export default function UserGate({ children }: UserGateProps) {
  const userJson = localStorage.getItem(USER_STORAGE_KEY);
  const location = useLocation();
  
  if (!userJson) {
    return <Navigate to="/setup" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
