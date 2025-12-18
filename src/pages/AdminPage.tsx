import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useMatches } from '../contexts/MatchContext';
import { useNavigate } from 'react-router-dom';

export default function AdminPage() {
  const { matches, refreshMatches, currentUser } = useMatches();
  const navigate = useNavigate();
  const [matchFilter, setMatchFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch users:', error);
        return;
      }
      setUsers(data || []);
    } catch (err) {
      console.error('Unexpected error fetching users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const doDeleteMatch = async (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Endast administratörer kan ta bort matcher.');
      return;
    }
    if (!confirm('Radera match? Detta går inte att ångra.')) return;
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete match:', error);
      alert('Kunde inte radera matchen.');
      return;
    }
    await refreshMatches();
    fetchUsers();
  };

  const doDeleteUser = async (id: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Endast administratörer kan ta bort användare.');
      return;
    }
    if (!confirm('Radera användare? Detta går inte att ångra.')) return;
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete user:', error);
      alert('Kunde inte radera användaren.');
      return;
    }
    await fetchUsers();
  };

  const filteredMatches = matches.filter(m => {
    if (!matchFilter) return true;
    const q = matchFilter.toLowerCase();
    return (m.title || '').toLowerCase().includes(q) || (m.area || '').toLowerCase().includes(q) || (m.city || '').toLowerCase().includes(q);
  });

  const filteredUsers = users.filter(u => {
    if (!userFilter) return true;
    const q = userFilter.toLowerCase();
    return (u.username || '').toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q) || (u.id || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => navigate('/')} style={{ padding: '6px 10px' }}>Tillbaka</button>
        <h1 style={{ margin: 0 }}>Admin</h1>
        <div />
      </div>

      <section style={{ marginBottom: 24 }}>
        <h2>Matcher</h2>
        <input placeholder="Sök matcher..." value={matchFilter} onChange={(e) => setMatchFilter(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          {filteredMatches.map(m => (
            <div key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
              <div style={{ flex: 1 }}>
                <div><strong>{m.title}</strong></div>
                <div style={{ fontSize: 12 }}>{m.area} {m.city ? `— ${m.city}` : ''}</div>
              </div>
              <div>
                <button onClick={() => doDeleteMatch(m.id)}>Radera</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>Användare</h2>
        <input placeholder="Sök användare..." value={userFilter} onChange={(e) => setUserFilter(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          {loadingUsers ? <div>Laddar...</div> : filteredUsers.map(u => (
            <div key={u.id} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: 8, borderBottom: '1px solid #eee' }}>
              <div style={{ flex: 1 }}>
                <div><strong>{u.username || u.name}</strong> <small style={{ color: '#666' }}>{u.role}</small></div>
                <div style={{ fontSize: 12 }}>{u.id}</div>
              </div>
              <div>
                <button onClick={() => doDeleteUser(u.id)}>Radera</button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
