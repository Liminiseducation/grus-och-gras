import { useMatches } from '../contexts/MatchContext';

interface UserGateProps {
  children: React.ReactNode;
}

// No-op wrapper. App.tsx makes routing/onboarding decisions centrally.
export default function UserGate({ children }: UserGateProps) {
  useMatches();
  return <>{children}</>;
}
