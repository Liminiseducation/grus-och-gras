import { useState } from 'react';
import './AppLayout.css';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="app-layout">
      <div className="app-container">
        {children}
        <footer className="app-footer">
        </footer>
      </div>
    </div>
  );
}
