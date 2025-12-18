import { useState, useEffect } from 'react';
import './CityChangeModal.css';

type Props = {
  open: boolean;
  initialCity?: string;
  onSave: (city: string) => void;
  onClose: () => void;
};

export default function CityChangeModal({ open, initialCity = '', onSave, onClose }: Props) {
  const [value, setValue] = useState(initialCity || '');

  useEffect(() => setValue(initialCity || ''), [initialCity]);

  if (!open) return null;

  return (
    <div className="city-modal-overlay">
      <div className="city-modal">
        <h3>Byt stad</h3>
        <input
          className="user-setup-input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ange stad eller ort"
          autoFocus
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            className="user-setup-button"
            onClick={() => {
              const v = value.trim();
              if (!v) return;
              onSave(v);
            }}
          >
            Spara
          </button>
          <button className="add-area-button" onClick={onClose}>Avbryt</button>
        </div>
      </div>
    </div>
  );
}
