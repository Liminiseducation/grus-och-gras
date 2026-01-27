import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatches } from '../contexts/MatchContext';
import type { User } from '../types';
import './CreateMatchPage.css';

// Predefined location suggestions removed for public/native release.

type CreateMatchFormState = {
  title: string;
  area: string;
  city: string;
  date: string;
  time: string;
  maxPlayers: string;
  surface: 'Grus' | 'Konstgräs' | 'Naturgräs' | 'Asfalt';
  hasBall: boolean;
  requiresFootballShoes: boolean;
  playStyle: '' | 'spontanspel' | 'träning' | 'match';
  description: string;
  privateMatch?: boolean;
  password?: string;
  ageGroup: '' | '6_9' | '10_12' | '13_15' | '16_18' | '18_plus' | 'all';
  refereeStatus: '' | 'none' | 'needed' | 'contacted' | 'confirmed';
};

function CreateMatchPage() {
  const navigate = useNavigate();
  const { addMatch, currentUser, joinMatch } = useMatches();

  const user: User | null = currentUser || null;
  const homeCity = user?.homeCity || '';

  const STORAGE_KEY = 'createMatchForm';

  const defaultForm: CreateMatchFormState = {
    title: '',
    area: homeCity,
    city: '',
    date: '',
    time: '',
    maxPlayers: '10',
    surface: 'Konstgräs' as 'Grus' | 'Konstgräs' | 'Naturgräs' | 'Asfalt',
    hasBall: false,
    requiresFootballShoes: false,
    playStyle: '' as '' | 'spontanspel' | 'träning' | 'match',
    description: '',
    privateMatch: false,
    password: '',
    ageGroup: '',
    refereeStatus: '',
  };

  const [formData, setFormData] = useState<CreateMatchFormState>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CreateMatchFormState>;
        return { ...defaultForm, ...parsed } as CreateMatchFormState;
      }
    } catch (err) {
      // ignore parse errors
    }
    return defaultForm;
  });
  // For training-specific numeric input: allow empty while typing and
  // represent value as number | null per requirements.
  const [trainingParticipants, setTrainingParticipants] = useState<number | null>(null);

  const [ageGroupTouched, setAgeGroupTouched] = useState<boolean>(false);

  // Persist form to sessionStorage on change so it survives remounts/refreshes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (err) {
      // ignore storage errors
    }
  }, [formData]);

  const clearSavedForm = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Validate age group
    if (!formData.ageGroup) {
      setAgeGroupTouched(true);
      alert('Vänligen välj en åldersgrupp.');
      return;
    }
    // Validate training participants only on submit per requirements
    if (formData.playStyle === 'träning') {
      if (trainingParticipants === null) {
        alert('Ange antal deltagare för träning (min 2).');
        return;
      }
      if (trainingParticipants < 2 || trainingParticipants > 50) {
        alert('Antal deltagare för träning måste vara mellan 2 och 50.');
        return;
      }
    }

    console.log('Creating match with data:', formData);
    
    try {
      const maxPlayersToUse = formData.playStyle === 'träning' ? trainingParticipants ?? parseInt(formData.maxPlayers, 10) : parseInt(formData.maxPlayers, 10);

      const inserted = await addMatch({
        title: formData.title,
        area: formData.area,
        city: formData.city || '',
        date: formData.date,
        time: formData.time,
        maxPlayers: maxPlayersToUse,
        surface: formData.surface,
        hasBall: formData.hasBall,
        requiresFootballShoes: formData.requiresFootballShoes,
        playStyle: formData.playStyle || undefined,
        description: formData.description || undefined,
        ageGroup: formData.ageGroup || undefined,
        refereeStatus: formData.refereeStatus || undefined,
        // Store private flags/password with the match data (dev-only)
        isPrivate: !!formData.privateMatch,
        password: formData.password || undefined,
      }, user?.id, user?.username);
      console.log('Match created, inserted:', inserted);
      if (!inserted || !inserted.id) {
        console.error('CreateMatch: addMatch returned no id:', inserted);
        alert('Match skapades men servern returnerade inget id. Försök uppdatera sidan eller kontakta support.');
        return;
      }
      // Attempt to auto-join the creator so they appear immediately in `match_players`.
      // We prefer the server-side RPC `joinMatch`, but avoid requiring password
      // input for the creator. If `addMatch` already recorded the creator
      // (`creatorInserted`), there's no need to call `joinMatch` and we avoid
      // duplicate joins.
      try {
        if (joinMatch && inserted?.id) {
          const alreadyInserted = (inserted as any).creatorInserted === true;
          if (!alreadyInserted) {
            // If match was created as private, pass the provided password
            // programmatically so the creator is joined without prompting.
            await joinMatch(inserted.id, formData.password || undefined);
          }
        }
      } catch (e) {
        console.warn('Auto-join after create failed (non-fatal):', e);
      }

      // Clear any saved draft now that creation succeeded
      clearSavedForm();
      // Navigate to the newly created match detail so the creator sees membership immediately
      navigate(`/match/${inserted.id}`);
    } catch (err: any) {
      console.error('Failed to create match:', err);
      const msg = ((err as any)?.message) || String(err) || 'Kunde inte skapa matchen.';
      alert(`Kunde inte skapa matchen: ${msg}`);
    }
  };

  // location chip handler removed

  // When user navigates back/cancels, clear the saved draft
  const handleCancel = () => {
    clearSavedForm();
    navigate(-1);
  };

  return (
    <div className="create-match-page">
        <header className="create-header">
        <button onClick={handleCancel} className="back-button">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Tillbaka
        </button>
        <h1 className="create-title">Skapa match</h1>
      </header>

      <form onSubmit={handleSubmit} className="create-form">
        
        <section className="form-section">
          <h2 className="section-heading">Plats</h2>
          
          <div className="form-field">
            <label htmlFor="area" className="field-label">
              Stad eller ort <span className="field-required">*</span>
            </label>
            <input
              type="text"
              id="area"
              name="area"
              className="text-input"
              value={formData.area}
              onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, area: e.target.value }))}
              placeholder="t.ex. Lerum, Floda, Kungälv"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="title" className="field-label">
              Platsnamn
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="text-input"
              value={formData.title}
              onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, title: e.target.value }))}
              placeholder="T.ex. Vasaparken Plan 2"
              required
            />
          </div>

          <div className="form-field">
            <label className="field-label">
              <input
                type="checkbox"
                name="privateMatch"
                checked={!!formData.privateMatch}
                onChange={(e) => setFormData((prev) => ({ ...prev, privateMatch: e.target.checked }))}
                style={{ marginRight: 8 }}
              />
              Privat match
            </label>
            {formData.privateMatch && (
              <input
                type="password"
                id="matchPassword"
                name="matchPassword"
                className="text-input"
                value={formData.password}
                onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="Ange lösenord för privat match"
              />
            )}
          </div>
        </section>

        <section className="form-section">
          <h2 className="section-heading">Tid</h2>
          
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="date" className="field-label">
                Datum
              </label>
              <input
                type="date"
                id="date"
                name="date"
                className="date-input"
                value={formData.date}
                onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="time" className="field-label">
                Tid
              </label>
              <input
                type="time"
                id="time"
                name="time"
                className="time-input"
                value={formData.time}
                onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, time: e.target.value }))}
                required
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h2 className="section-heading">Detaljer</h2>

          <div className="form-field">
            <label htmlFor="playStyle" className="field-label">
              Spelstil (valfritt)
            </label>
            <select
              id="playStyle"
              name="playStyle"
              className="select-input"
              value={formData.playStyle}
              onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, playStyle: e.target.value as '' | 'spontanspel' | 'träning' | 'match' }))}
            >
              <option value="">Ingen vald</option>
              <option value="spontanspel">Spontanspel</option>
              <option value="träning">Träning</option>
              <option value="match">Match</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="ageGroup" className="field-label">
              Åldersgrupp <span className="field-required">*</span>
            </label>
            <select
              id="ageGroup"
              name="ageGroup"
              className="select-input"
              value={formData.ageGroup}
              onChange={(e) => {
                setFormData((prev: CreateMatchFormState) => ({ ...prev, ageGroup: e.target.value as any }));
                setAgeGroupTouched(true);
              }}
              onBlur={() => setAgeGroupTouched(true)}
              required
            >
              <option value="">Välj åldersgrupp</option>
              <option value="6_9">6–9 år</option>
              <option value="10_12">10–12 år</option>
              <option value="13_15">13–15 år</option>
              <option value="16_18">16–18 år</option>
              <option value="18_plus">18+</option>
              <option value="all">Alla åldrar</option>
            </select>
            {ageGroupTouched && !formData.ageGroup && (
              <p className="field-error">Välj en åldersgrupp för att fortsätta.</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="refereeStatus" className="field-label">
              Domare
            </label>
            <select
              id="refereeStatus"
              name="refereeStatus"
              className="select-input"
              value={formData.refereeStatus}
              onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, refereeStatus: e.target.value as any }))}
            >
              <option value="">Ingen vald</option>
              <option value="none">Ingen domare (spontanspel)</option>
              <option value="needed">Domare behövs</option>
              <option value="contacted">Domare är kontaktad</option>
              <option value="confirmed">Domare är klar</option>
            </select>
            <p className="field-helper">Välj referee-status (valfritt)</p>
          </div>

          {/* Player selection: behavior depends on selected `playStyle` */}
          <div className="form-field">
            <label htmlFor="playerSelector" className="field-label">Spelare</label>
            {formData.playStyle === 'träning' ? (
              <div>
                <label htmlFor="maxPlayers" className="field-label">Antal spelare (träning)</label>
                <input
                  id="maxPlayers"
                  name="maxPlayers"
                  type="number"
                  className="text-input"
                  min={2}
                  max={50}
                  value={trainingParticipants ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setTrainingParticipants(null);
                    } else {
                      const n = Number(val);
                      if (!Number.isNaN(n)) setTrainingParticipants(n);
                    }
                  }}
                />
                <p className="field-helper">Ange totalt antal deltagare vid träning.</p>
              </div>
            ) : (
              <select
                id="maxPlayers"
                name="maxPlayers"
                className="select-input"
                value={formData.maxPlayers}
                onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, maxPlayers: e.target.value }))}
                required
              >
                <option value="4">4 spelare (2 mot 2)</option>
                <option value="6">6 spelare (3 mot 3)</option>
                <option value="10">10 spelare (5 mot 5)</option>
                <option value="14">14 spelare (7 mot 7)</option>
                <option value="18">18 spelare (9 mot 9)</option>
                <option value="22">22 spelare (11 mot 11)</option>
              </select>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="surface" className="field-label">
              Underlag
            </label>
            <select
              id="surface"
              name="surface"
              className="select-input"
              value={formData.surface}
              onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, surface: e.target.value as 'Grus' | 'Konstgräs' | 'Naturgräs' | 'Asfalt' }))}
              required
            >
              <option value="Konstgräs">Konstgräs</option>
              <option value="Naturgräs">Naturgräs</option>
              <option value="Grus">Grus</option>
              <option value="Asfalt">Asfalt</option>
            </select>
          </div>

          <label className="checkbox-field">
            <input
              type="checkbox"
              name="hasBall"
              checked={formData.hasBall}
              onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, hasBall: e.target.checked }))}
              className="checkbox-input"
            />
            <span className="checkbox-label">Fotboll finns</span>
          </label>

          <div className="checkbox-field-wrapper">
            <label className={`checkbox-field ${(formData.surface === 'Konstgräs' || formData.surface === 'Naturgräs') && !formData.requiresFootballShoes ? 'checkbox-field-suggested' : ''}`}>
              <input
                type="checkbox"
                name="requiresFootballShoes"
                checked={formData.requiresFootballShoes}
                onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, requiresFootballShoes: e.target.checked }))}
                className="checkbox-input"
              />
              <span className="checkbox-label">Fotbollsskor krävs</span>
            </label>
            {(formData.surface === 'Konstgräs' || formData.surface === 'Naturgräs') && !formData.requiresFootballShoes && (
              <p className="checkbox-suggestion">💡 Rekommenderas för konstgräs</p>
            )}
          </div>
        </section>

        <section className="form-section">
          <h2 className="section-heading">Meddelande (valfritt)</h2>
          
          <div className="form-field">
            <label htmlFor="description" className="field-label">
              Beskriv matchen
            </label>
            <textarea
              id="description"
              name="description"
              className="textarea-input"
              value={formData.description}
              onChange={(e) => setFormData((prev: CreateMatchFormState) => ({ ...prev, description: e.target.value }))}
              placeholder="T.ex. Avslappnad match, alla nivåer välkomna!"
              rows={3}
            />
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="cancel-button" onClick={handleCancel}>Avbryt</button>
          <button type="submit" className="submit-button" disabled={!formData.ageGroup}>Starta matchen</button>
        </div>
      </form>
    </div>
  );
}

export default CreateMatchPage;
