import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

// Legacy protected route wrapper — do not perform navigation here; instead
// render a blocking message when auth state is not satisfied. The app-level
// router should be the single source of truth for onboarding/routing.
export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: 24 }}>Laddar…</div>;
  }

  if (!user) {
    return <div style={{ padding: 24 }}>Du måste vara inloggad för att se denna sida.</div>;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <div style={{ padding: 24 }}>Åtkomst nekad — administratör krävs.</div>;
  }

  return <>{children}</>;
}
