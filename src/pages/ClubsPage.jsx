import React, { useState, useEffect } from 'react';
import { Users, Plus, BookOpen, Lock, Globe, X, Search, Eye, EyeOff, Key, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';

export default function ClubsPage() {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    genres: [],
    club_type: 'discussion',
    is_visible: true,
    join_code: '',
    allow_chat: true,
    tracking_fields: []
  });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    loadClubs();
  }, [user]);

  async function loadClubs() {
    setLoading(true);
    try {
      const all = await base44.entities.ReadingClub.filter({ is_visible: true }, '-created_date', 30);
      setClubs(all);
      if (user?.email) {
        const mine = await base44.entities.ReadingClub.filter({ creator_email: user.email });
        setMyClubs(mine);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function createClub() {
    if (!form.name.trim() || !user) return;
    setCreating(true);
    try {
      const code = !form.is_visible ? 'CLUB' + Math.random().toString(36).slice(2, 8).toUpperCase() : '';
      const club = await base44.entities.ReadingClub.create({
        ...form,
        join_code: code,
        creator_email: user.email,
        member_count: 1,
        member_emails: [user.email],
      });
      setMyClubs(prev => [club, ...prev]);
      if (form.is_visible) setClubs(prev => [club, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', genres: [], club_type: 'discussion', is_visible: true, join_code: '', allow_chat: true, tracking_fields: [] });
    } catch (e) {}
    setCreating(false);
  }

  async function joinClubByCode() {
    if (!joinCode.trim() || !user) return;
    try {
      const clubs = await base44.entities.ReadingClub.filter({ join_code: joinCode.toUpperCase() });
      if (clubs.length === 0) {
        alert('Club code not found');
        return;
      }
      const club = clubs[0];
      if (club.member_emails?.includes(user.email)) {
        alert('Already a member');
        return;
      }
      const updated = await base44.entities.ReadingClub.update(club.id, {
        member_emails: [...(club.member_emails || []), user.email],
        member_count: (club.member_count || 0) + 1,
      });
      setMyClubs(prev => [...prev, updated]);
      setJoinCode('');
      setShowJoinModal(false);
    } catch (e) { alert('Error joining club'); }
  }

  async function joinClub(club) {
    if (!user) return;
    if (club.member_emails?.includes(user.email)) return;
    if (club.club_type === 'administrative' && club.join_code) {
      setShowJoinModal(true);
      return;
    }
    try {
      const updated = await base44.entities.ReadingClub.update(club.id, {
        member_emails: [...(club.member_emails || []), user.email],
        member_count: (club.member_count || 0) + 1,
      });
      setClubs(prev => prev.map(c => c.id === club.id ? updated : c));
      setMyClubs(prev => [...prev, updated]);
    } catch (e) {}
  }

  const filtered = clubs.filter(c => {
    const query = search.toLowerCase();
    const isCodeMatch = search.length > 0 && c.join_code === search.toUpperCase();
    const isNameMatch = c.name?.toLowerCase().includes(query);
    const isGenreMatch = c.genres?.some(g => g.toLowerCase().includes(query));
    return isCodeMatch || isNameMatch || isGenreMatch;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Users size={24} style={{ color: 'var(--lx-accent)' }} />
            Reading Clubs
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Join or create reading communities</p>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowCreate(true)} className="lx-btn-primary text-sm">
            <Plus size={14} /> Create Club
          </button>
        )}
      </div>

      {/* My Clubs */}
      {myClubs.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>My Clubs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myClubs.map(club => (
              <ClubCard key={club.id} club={club} userEmail={user?.email} onJoin={joinClub} isMember />
            ))}
          </div>
        </section>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          className="lx-input pl-9"
          placeholder="Search clubs by name, genre, or code..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* All Clubs */}
      <section>
        <h2 className="font-display text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Public Clubs</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="lx-card p-5 animate-pulse h-36" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(club => (
              <ClubCard
                key={club.id}
                club={club}
                userEmail={user?.email}
                onJoin={joinClub}
                isMember={club.member_emails?.includes(user?.email)}
              />
            ))}
          </div>
        ) : (
          <div className="lx-card p-10 text-center">
            <Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
            <p className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>No clubs found</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Be the first to create a reading club!</p>
            {isAuthenticated && (
              <button onClick={() => setShowCreate(true)} className="lx-btn-primary text-sm">Create the first club</button>
            )}
          </div>
        )}
      </section>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-xl p-6 my-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create Reading Club</h2>
              <button onClick={() => setShowCreate(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Club Name *</label>
                <input className="lx-input" placeholder="e.g. Sci-Fi Enthusiasts" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea className="lx-input resize-none" rows={2} placeholder="What's this club about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Club Type</label>
                <select className="lx-input" value={form.club_type} onChange={e => setForm(f => ({ ...f, club_type: e.target.value }))}
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <option value="discussion">Discussion (No tracking, open chat)</option>
                  <option value="collaborative">Collaborative (Book club with discussion chains)</option>
                  <option value="administrative">Administrative (Track member stats, controlled access)</option>
                  <option value="logging">Logging (See all members' reading logs in a dashboard)</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Visible to all</span>
                <button onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                  {form.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              </div>
              <button onClick={createClub} disabled={creating || !form.name.trim()} className="lx-btn-primary w-full justify-center text-sm">
                {creating ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join by Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-xs rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Enter Club Code</h2>
              <button onClick={() => setShowJoinModal(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <input className="lx-input mb-4 uppercase" placeholder="e.g. CLUB1A2B3C" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} />
            <button onClick={joinClubByCode} className="lx-btn-primary w-full justify-center text-sm">Join Club</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClubCard({ club, userEmail, onJoin, isMember }) {
  const clubTypeIcon = club.club_type === 'administrative' ? '👥' : club.club_type === 'collaborative' ? '📚' : club.club_type === 'logging' ? '📊' : '💬';
  return (
    <div className="lx-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-lg">{clubTypeIcon}</span>
            {club.genres?.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
                {club.genres[0]}
              </span>
            )}
            {!club.is_visible && <Key size={11} style={{ color: 'var(--lx-accent)' }} />}
          </div>
          <h3 className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>{club.name}</h3>
          {club.description && (
            <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{club.description}</p>
          )}
        </div>
      </div>

      {club.current_book_title && (
        <div className="flex items-center gap-2 text-xs px-3 py-2 rounded" style={{ background: 'var(--bg-elevated)' }}>
          <BookOpen size={12} style={{ color: 'var(--lx-accent)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Reading:</span>
          <Link to={`/book/${club.current_book_id}`} className="font-medium truncate" style={{ color: 'var(--lx-accent)' }}>
            {club.current_book_title}
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Users size={11} /> {club.member_count || 1} members
        </span>
        {userEmail ? (
          isMember ? (
            <Link to={`/club/${club.id}`} className="text-xs px-3 py-1 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>View →</Link>
          ) : (
            <button onClick={() => onJoin(club)} className="text-xs px-3 py-1 rounded font-medium transition-all"
              style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
              Join
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}