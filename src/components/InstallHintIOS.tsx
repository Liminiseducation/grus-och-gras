import { useEffect, useState } from 'react';
import './InstallHintIOS.css';

const DISMISS_KEY = 'pwa-ios-dismissed';

function isIosBrowser() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || '';
  const platform = navigator.platform || '';
  const isiOSPlatform = /iP(hone|od|ad)/.test(platform);
  const isiOSUA = /iP(hone|od|ad)/.test(ua);
  // Recent iPadOS reports as MacIntel; detect touch-capable Mac UA as iPad
  const isTouchMac = /Macintosh/.test(ua) && 'ontouchend' in document;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS|Chrome/.test(ua);
  return (isiOSPlatform || isiOSUA || isTouchMac) && isSafari;
}

function isStandalone() {
  try {
    const mm = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || false;
    const navStandalone = (navigator as any).standalone === true;
    return mm || navStandalone;
  } catch (e) {
    return false;
  }
}

export default function InstallHintIOS() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const detectedIos = isIosBrowser();
      const standaloneMode = isStandalone();
      const dismissed = !!localStorage.getItem(DISMISS_KEY);
      console.log('InstallHintIOS decision', { detectedIos, standaloneMode, dismissed });
      if (!detectedIos) return;
      if (standaloneMode) return;
      if (dismissed) return;
      // show after small delay so it feels non-intrusive
      const t = window.setTimeout(() => setVisible(true), 600);
      return () => window.clearTimeout(t);
    } catch (e) {
      // ignore
    }
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="install-ios-hint" role="note" aria-label="Install on iOS help">
      <div className="install-ios-content">
        <span className="share-icon" aria-hidden>
          {/* simple share icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3v10" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 7l4-4 4 4" stroke="#0b6b4f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="11" width="16" height="9" rx="2" stroke="#0b6b4f" strokeWidth="1.6"/></svg>
        </span>
        <div className="install-ios-text">Tap the Share icon and choose «Add to Home Screen» to install the app.</div>
      </div>
      <button className="install-ios-dismiss" onClick={handleDismiss} aria-label="Dismiss">✕</button>
    </div>
  );
}
