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

// Automatic iOS hint removed. Keep a harmless no-op export for compatibility.
export default function InstallHintIOS() { return null; }
