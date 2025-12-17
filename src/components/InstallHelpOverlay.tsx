import { useEffect } from 'react';
import './InstallHelpOverlay.css';

interface Props { onClose: () => void }

export default function InstallHelpOverlay({ onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="install-help-backdrop" role="dialog" aria-modal="true" aria-label="Install help">
      <div className="install-help-card">
        <h3>Installera på iPhone</h3>
        <p>Öppna i Safari → tryck på dela‑ikonen → välj «Lägg till på hemskärmen».</p>
        <div style={{display:'flex', alignItems:'center', gap:8, marginTop:8}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M12 3v10" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 7l4-4 4 4" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="4" y="11" width="16" height="9" rx="2" stroke="#0b6b4f" strokeWidth="1.6"/>
          </svg>
          <div style={{fontSize:13, color:'#333'}}>Tryck på dela‑ikonen (fyrkant med uppåtpil) i Safari och välj «Lägg till på hemskärmen».</div>
        </div>
        <div className="install-help-actions">
          <button className="install-help-close" onClick={onClose}>Stäng</button>
        </div>
      </div>
    </div>
  );
}
