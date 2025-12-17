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
        <h3>Installera appen</h3>
        <div style={{textAlign:'left', marginBottom:8}}>
          <strong>iPhone (Safari)</strong>
          <div style={{fontSize:13, color:'#333'}}>Tryck på dela-ikonen (fyrkant med pil uppåt) och välj 'Lägg till på hemskärmen'.</div>
        </div>

        <div style={{textAlign:'left', marginBottom:8}}>
          <strong>Chrome (dator eller Android)</strong>
          <div style={{fontSize:13, color:'#333'}}>Använd installera-ikonen i adressfältet eller välj 'Installera app' i webbläsarens meny.</div>
        </div>

        <div className="install-help-actions">
          <button className="install-help-close" onClick={onClose}>Stäng</button>
        </div>
      </div>
    </div>
  );
}
