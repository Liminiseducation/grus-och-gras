import { useEffect, useRef, useState } from 'react';
import './InstallHint.css';

// LocalStorage key for dismissal
const DISMISS_KEY = 'pwa-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallHint() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [available, setAvailable] = useState(false);
  const [visible, setVisible] = useState(false);

  const isDismissed = () => !!localStorage.getItem(DISMISS_KEY);

  const isInstalled = () => {
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (navigator as any).standalone;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (isInstalled() || isDismissed()) return;

    function onBeforeInstall(e: Event) {
      const ev = e as BeforeInstallPromptEvent;
      // Prevent the default mini-infobar from appearing on mobile
      if (ev && ev.preventDefault) ev.preventDefault();
      deferredPrompt.current = ev;
      setAvailable(true);
      setVisible(true);
    }

    function onAppInstalled() {
      // App installed — don't show again
      localStorage.setItem(DISMISS_KEY, '1');
      setVisible(false);
      setAvailable(false);
      deferredPrompt.current = null;
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
    window.addEventListener('appinstalled', onAppInstalled as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', onAppInstalled as EventListener);
    };
  }, []);

  if (!available || !visible) return null;

  const handleInstall = async () => {
    const ev = deferredPrompt.current;
    if (!ev) return;
    try {
      await ev.prompt();
      const choice = await ev.userChoice;
      // If user dismissed the system prompt, don't nag again
      if (choice && choice.outcome !== 'accepted') {
        localStorage.setItem(DISMISS_KEY, '1');
      } else {
        // accepted — mark dismissed so we don't show UI again
        localStorage.setItem(DISMISS_KEY, '1');
      }
    } catch (e) {
      // ignore errors
    } finally {
      setVisible(false);
      deferredPrompt.current = null;
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
    deferredPrompt.current = null;
  };

  return (
    <div className="install-hint" role="dialog" aria-label="Install app hint">
      <button className="install-hint-install" onClick={handleInstall}>Install app</button>
      <button className="install-hint-close" aria-label="Dismiss" onClick={handleDismiss}>✕</button>
    </div>
  );
}
