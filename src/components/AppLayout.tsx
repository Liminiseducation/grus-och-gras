import { useState } from 'react';
import './AppLayout.css';
import InstallHelpOverlay from './InstallHelpOverlay';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [showInstallHelp, setShowInstallHelp] = useState(false);

  return (
    <div className="app-layout">
      <div className="app-container">
        {children}
        <footer className="app-footer">
          <button className="footer-install-link" onClick={() => setShowInstallHelp(true)}>Installera på iPhone</button>
        </footer>
        {showInstallHelp && <InstallHelpOverlay onClose={() => setShowInstallHelp(false)} />}
      </div>
    </div>
  );
}
