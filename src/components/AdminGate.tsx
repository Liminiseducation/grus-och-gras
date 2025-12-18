import { useMatches } from '../contexts/MatchContext';

interface AdminGateProps {
  children: React.ReactNode;
}

// AdminGate no longer performs navigation. App-level routing decides what
// to render; AdminGate simply blocks rendering for non-admins.
export default function AdminGate({ children }: AdminGateProps) {
  const { authInitialized, currentUser } = useMatches();

  if (!authInitialized) return <div>Laddar…</div>;
  if (!currentUser) return <div>Endast administratörer kan se denna sida.</div>;
  if (currentUser.role !== 'admin') return <div>Endast administratörer kan se denna sida.</div>;

  return <>{children}</>;
}
