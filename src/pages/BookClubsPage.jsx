import React, { useState, useEffect } from 'react';
import { Users, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function BookClubsPage() {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [myMemberships, setMyMemberships] = useState([]);

  useEffect(() => {
    load();
    if (user?.email) loadMemberships();
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const c = await base44.entities.BookClub.list('-created_date', 30);
      setClubs(c);
    } catch (e) {}
    setLoading(false);
  }

  async function loadMemberships() {
    try {
      const m = await base44.entities.BookClubMember.filter({ user_email: user.email });
      setMyMemberships(m.map(x => x.club_id));
    } catch (e) {}
  }

  async function createClub() {
    if (!name.trim() || !user) return;
    setCreating(true);
    try {
      const club = await base44.entities.BookClub.create({
        name: name.trim(),
        description: description.trim(),
        creator_email: user.email,
        member_count: 1,
        is_public: true,
      });
      await base44.entities.BookClubMember.create({
        club_id: club.id,
        user_email: user.email,
        role: 'admin',
      });
      setClubs(prev => [club, ...prev]);
      setMyMemberships(prev => [...prev, club.id]);
      setShowCreate(false);
      setName('');
      setDescription('');
    } catch (e) {}
    setCreating(false);
  }

  async function joinClub(club) {
    if (!user) return;
    try {
      await base44.entities.BookClubMember.create({
        club_id: club.id,
        user_email: user.email,
        role: 'member',
      });
      await base44.entities.BookClub.update(club.id, { member_count: (club.member_count || 1) + 1 });
      setMyMemberships(prev => [...prev, club.id]);
      setClubs(prev => prev.map(c => c.id === club.id ? { ...c, member_count: (c.member_count || 1) + 1 } : c));
    } catch (e) {}
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Users size={22} style={{ color: 'var(--lx-accent)' }} />
          Book Clubs
        </h1>
        {isAuthenticated && (
          <button onClick={() => setShowCreate(!showCreate)} className="lx-btn-primary text-sm py-1.5">
            <Plus size={14} /> Create Club
          </button>
        )}
      </div>

      {showCreate && (
        <div className="mb-6 p-5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>New Book Club</h3>
            <button onClick={() => setShowCreate(false)} style={{ color: 'var(--text-muted)' }}><X size={16} /></button>
          </div>
          <input className="lx-input mb-3" placeholder="Club name" value={name} onChange={e => setName(e.target.value)} />
          <textarea className="lx-input mb-4 resize-none" rows={2} placeholder="Description (optional)"
            value={description} onChange={e => setDescription(e.target.value)} />
          <button onClick={createClub} disabled={!name.trim() || creating} className="lx-btn-primary">
            {creating ? 'Creating...' : 'Create Club'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl" style={{ background: 'var(--bg-card)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <div className="text-center py-16">
          <Users size={36} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No clubs yet. Create the first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clubs.map(club => {
            const isMember = myMemberships.includes(club.id);
            return (
              <div key={club.id} className="lx-card p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>{club.name}</h3>
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                    <Users size={11} /> {club.member_count || 1}
                  </span>
                </div>
                {club.description && (
                  <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{club.description}</p>
                )}
                {club.current_book_title && (
                  <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                    📖 Currently reading: <span style={{ color: 'var(--lx-accent)' }}>{club.current_book_title}</span>
                  </p>
                )}
                {isAuthenticated && !isMember && (
                  <button onClick={() => joinClub(club)} className="lx-btn-ghost text-xs py-1">Join</button>
                )}
                {isMember && (
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--lx-accent)' }}>
                    ✓ Member
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}