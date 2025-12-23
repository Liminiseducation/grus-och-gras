import { useState, useEffect } from 'react';
import './CityChangeModal.css';

type Props = {
  open: boolean;
  initialPassword?: string;
  onSubmit: (password: string) => void;
  onClose: () => void;
  errorText?: string | null;
};

export default function PasswordModal({ open, initialPassword = '', onSubmit, onClose, errorText = null }: Props) {
  const [value, setValue] = useState(initialPassword || '');

  useEffect(() => setValue(initialPassword || ''), [initialPassword]);

  if (!open) return null;

  return (
    <div className="city-modal-overlay">
      <div className="city-modal">
        <h3>Privat match</h3>
        <p style={{ marginTop: 0 }}>Ange lösenord för att gå med i matchen</p>
        <input
          className="user-setup-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Lösenord"
          type="password"
          autoFocus
        />

        {errorText && (
          <div className="modal-error" role="alert" aria-live="polite" style={{ marginTop: 8 }}>
            {errorText}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            className="user-setup-button"
            onClick={() => {
              onSubmit(value || '');
            }}
          >
            Gå med
          </button>
          <button className="add-area-button" onClick={onClose}>Avbryt</button>
        </div>
      </div>
    </div>
  );
}
