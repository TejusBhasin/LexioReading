import React, { useState, useEffect } from 'react';
import { Users, Plus, BookOpen, Lock, Globe, X, Search } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';

export default function ClubsPage() {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', genre: '', is_public: true });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadClubs();
  }, [user]);

  async function loadClubs() {
    setLoading(true);
    try {
      const all = await base44.entities.ReadingClub.filter({ is_public: true }, '-created_date', 30);
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
      const club = await base44.entities.ReadingClub.create({
        ...form,
        creator_email: user.email,
        member_count: 1,
        member_emails: [user.email],
      });
      setMyClubs(prev => [club, ...prev]);
      setClubs(prev => [club, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', genre: '', is_public: true });
    } catch (e) {}
    setCreating(false);
  }

  async function joinClub(club) {
    if (!user) return;
    if (club.member_emails?.includes(user.email)) return;
    try {
      const updated = await base44.entities.ReadingClub.update(club.id, {
        member_emails: [...(club.member_emails || []), user.email],
        member_count: (club.member_count || 0) + 1,
      });
      setClubs(prev => prev.map(c => c.id === club.id ? updated : c));
      setMyClubs(prev => [...prev, updated]);
    } catch (e) {}
  }

  const filtered = clubs.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.genre?.toLowerCase().includes(search.toLowerCase())
  );

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
          placeholder="Search clubs by name or genre..."
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
            <p className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>No clubs yet</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Be the first to create a reading club!</p>
            {isAuthenticated && (
              <button onClick={() => setShowCreate(true)} className="lx-btn-primary text-sm">Create the first club</button>
            )}
          </div>
        )}
      </section>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create Reading Club</h2>
              <button onClick={() => setShowCreate(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Club Name *</label>
                <input className="lx-input" placeholder="e.g. Sci-Fi Enthusiasts" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea className="lx-input resize-none" rows={3} placeholder="What's this club about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Genre Focus</label>
                <input className="lx-input" placeholder="e.g. Science Fiction, Mystery..." value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                  className="flex items-center gap-2 text-sm px-3 py-2 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--lx-border)' }}
                >
                  {form.is_public ? <Globe size={14} /> : <Lock size={14} />}
                  {form.is_public ? 'Public' : 'Private'}
                </button>
              </div>
              <button onClick={createClub} disabled={creating || !form.name.trim()} className="lx-btn-primary w-full justify-center">
                {creating ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClubCard({ club, userEmail, onJoin, isMember }) {
  return (
    <div className="lx-card p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {club.is_public ? <Globe size={12} style={{ color: 'var(--text-muted)' }} /> : <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
            {club.genre && (
              <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>
                {club.genre}
              </span>
            )}
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
            <span className="text-xs px-3 py-1 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>Joined ✓</span>
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