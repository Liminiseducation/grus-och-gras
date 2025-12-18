import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatches } from '../contexts/MatchContext';
import type { User } from '../types';
import './CreateMatchPage.css';

const suggestedLocations = [
  'Ryasskolan Grusplan',
  'Floda Idrottsplats',
  'Gråbo Skola',
  'Lerum Arena',
  'Stenkullen IP'
];

function CreateMatchPage() {
  const navigate = useNavigate();
  const { addMatch, currentUser } = useMatches();
  
  // Get user's home city from persistent authenticated user
  const user: User | null = currentUser || null;
  const homeCity = user?.homeCity || '';
  
  const [formData, setFormData] = useState({
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
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    console.log('Creating match with data:', formData);
    
    try {
      await addMatch({
        title: formData.title,
        area: formData.area,
        city: formData.city || '',
        date: formData.date,
        time: formData.time,
        maxPlayers: parseInt(formData.maxPlayers),
        surface: formData.surface,
        hasBall: formData.hasBall,
        requiresFootballShoes: formData.requiresFootballShoes,
        playStyle: formData.playStyle || undefined,
        description: formData.description || undefined,
      }, user?.id, user?.name);
      
      console.log('Match created, navigating to home');
      navigate('/');
    } catch (err: any) {
      console.error('Failed to create match:', err);
      const msg = err?.message || String(err) || 'Kunde inte skapa matchen.';
      alert(`Kunde inte skapa matchen: ${msg}`);
    }
  };

  const handleLocationChipClick = (location: string) => {
    setFormData(prev => ({ ...prev, title: location }));
  };

  return (
    <div className="create-match-page">
      <header className="create-header">
        <button onClick={() => navigate(-1)} className="back-button">
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
              onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="T.ex. Vasaparken Plan 2"
              required
            />
          </div>

          <div className="location-chips">
            {suggestedLocations.map((location) => (
              <button
                key={location}
                type="button"
                className="location-chip"
                onClick={() => handleLocationChipClick(location)}
              >
                {location}
              </button>
            ))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, playStyle: e.target.value as '' | 'spontanspel' | 'träning' | 'match' }))}
            >
              <option value="">Ingen vald</option>
              <option value="spontanspel">Spontanspel</option>
              <option value="träning">Träning</option>
              <option value="match">Match</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="maxPlayers" className="field-label">
              Antal spelare
            </label>
            <select
              id="maxPlayers"
              name="maxPlayers"
              className="select-input"
              value={formData.maxPlayers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxPlayers: e.target.value }))}
              required
            >
              <option value="6">6 spelare (3 mot 3)</option>
              <option value="8">8 spelare (4 mot 4)</option>
              <option value="10">10 spelare (5 mot 5)</option>
              <option value="12">12 spelare (6 mot 6)</option>
              <option value="14">14 spelare (7 mot 7)</option>
              <option value="16">16 spelare (8 mot 8)</option>
            </select>
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
              onChange={(e) => setFormData(prev => ({ ...prev, surface: e.target.value as 'Grus' | 'Konstgräs' | 'Naturgräs' | 'Asfalt' }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, hasBall: e.target.checked }))}
              className="checkbox-input"
            />
            <span className="checkbox-label">Jag tar med boll</span>
          </label>

          <div className="checkbox-field-wrapper">
            <label className={`checkbox-field ${(formData.surface === 'Konstgräs' || formData.surface === 'Naturgräs') && !formData.requiresFootballShoes ? 'checkbox-field-suggested' : ''}`}>
              <input
                type="checkbox"
                name="requiresFootballShoes"
                checked={formData.requiresFootballShoes}
                onChange={(e) => setFormData(prev => ({ ...prev, requiresFootballShoes: e.target.checked }))}
                className="checkbox-input"
              />
              <span className="checkbox-label">Jag tar med fotbollsskor</span>
            </label>
            {(formData.surface === 'Konstgräs' || formData.surface === 'Naturgräs') && !formData.requiresFootballShoes && (
              <p className="checkbox-suggestion">💡 Rekommenderas för {formData.surface.toLowerCase()}</p>
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
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="T.ex. Avslappnad match, alla nivåer välkomna!"
              rows={3}
            />
          </div>
        </section>

        <button type="submit" className="submit-button">
          Starta matchen
        </button>
      </form>
    </div>
  );
}

export default CreateMatchPage;
