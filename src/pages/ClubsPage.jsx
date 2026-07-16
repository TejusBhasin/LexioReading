import React, { useState, useEffect } from 'react';
import { Users, Plus, BookOpen, Lock, Globe, X, Search, Eye, EyeOff, Key, Flame, Sparkles, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { searchBooks } from '@/lib/googleBooks';
import { getIsolationFilter } from '@/lib/schoolIsolation';

export default function ClubsPage() {
  const { user, isAuthenticated } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', genres: [], club_type: 'discussion', is_visible: true, join_code: '', allow_chat: true, tracking_fields: [], club_focus: 'book' });
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [bookSearch, setBookSearch] = useState('');
  const [bookSearchResults, setBookSearchResults] = useState([]);
  const [bookSearching, setBookSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isolation, setIsolation] = useState(null);

  useEffect(() => { loadClubs(); }, [user]);

  async function loadClubs() {
    setLoading(true);
    try {
      let all = await base44.entities.ReadingClub.filter({ is_visible: true }, '-created_date', 50);
      if (user?.email) {
        const iso = await getIsolationFilter(user.email);
        if (iso) {
          setIsolation(iso);
          all = all.filter(c => iso.memberEmails.includes(c.creator_email));
        }
      }
      setClubs(all);
      if (user?.email) {
        const mine = await base44.entities.ReadingClub.filter({ creator_email: user.email });
        setMyClubs(mine);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function searchForBook() {
    if (!bookSearch.trim()) return;
    setBookSearching(true);
    const results = await searchBooks(bookSearch, 6).catch(() => []);
    setBookSearchResults(results.filter(b => b.cover_image));
    setBookSearching(false);
  }

  async function createClub() {
    if (!form.name.trim() || !user || !selectedBook) return;
    setCreating(true);
    try {
      const code = !form.is_visible ? 'CLUB' + Math.random().toString(36).slice(2, 8).toUpperCase() : '';
      const club = await base44.entities.ReadingClub.create({ ...form, join_code: code, creator_email: user.email, member_count: 1, member_emails: [user.email], current_book_id: selectedBook.google_books_id || selectedBook.id, current_book_title: selectedBook.title });
      setMyClubs(prev => [club, ...prev]);
      if (form.is_visible) setClubs(prev => [club, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '', genres: [], club_type: 'discussion', is_visible: true, join_code: '', allow_chat: true, tracking_fields: [], club_focus: 'book' });
      setSelectedBook(null); setBookSearch(''); setBookSearchResults([]);
    } catch (e) {}
    setCreating(false);
  }

  async function joinClubByCode() {
    if (!joinCode.trim() || !user) return;
    try {
      const clubs = await base44.entities.ReadingClub.filter({ join_code: joinCode.toUpperCase() });
      if (clubs.length === 0) { alert('Club code not found'); return; }
      const club = clubs[0];
      if (club.member_emails?.includes(user.email)) { alert('Already a member'); return; }
      const res = await base44.functions.invoke('joinClub', { club_id: club.id });
      if (res.data?.error) throw new Error(res.data.error);
      const updated = res.data?.club || club;
      setMyClubs(prev => [...prev.filter(c => c.id !== updated.id), updated]);
      setJoinCode(''); setShowJoinModal(false);
    } catch (e) { alert('Error joining club'); }
  }

  async function joinClub(club) {
    if (!user) return;
    if (club.member_emails?.includes(user.email)) return;
    if (club.club_type === 'administrative' && club.join_code) { setShowJoinModal(true); return; }
    try {
      const res = await base44.functions.invoke('joinClub', { club_id: club.id });
      if (res.data?.error) throw new Error(res.data.error);
      const updated = res.data?.club || club;
      setClubs(prev => prev.map(c => c.id === club.id ? updated : c));
      setMyClubs(prev => [...prev.filter(c => c.id !== updated.id), updated]);
    } catch (e) {}
  }

  const filtered = clubs.filter(c => {
    const query = search.toLowerCase();
    return c.join_code === search.toUpperCase() || c.name?.toLowerCase().includes(query) || c.genres?.some(g => g.toLowerCase().includes(query));
  });
  const trending = [...clubs].sort((a, b) => (b.member_count || 0) - (a.member_count || 0)).slice(0, 6);
  const newest = [...clubs].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 6);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Users size={24} style={{ color: 'var(--lx-accent)' }} /> Reading Clubs</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Join or create reading communities</p>
        </div>
        {isAuthenticated && (
          <div className="flex gap-2">
            <button onClick={() => setShowJoinModal(true)} className="lx-btn-ghost text-sm"><Key size={14} /> Join</button>
            <button onClick={() => setShowCreate(true)} className="lx-btn-primary text-sm"><Plus size={14} /> Create</button>
          </div>
        )}
      </div>

      {isolation && (
        <div className="mb-6 p-3 rounded-lg flex items-center gap-2" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <Lock size={14} style={{ color: '#818cf8' }} />
          <p className="text-xs" style={{ color: '#818cf8' }}>Content isolation is active for {isolation.schoolName}. You're only seeing clubs from your school.</p>
        </div>
      )}

      {myClubs.length > 0 && (
        <section className="mb-8">
          <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><BookOpen size={18} style={{ color: 'var(--lx-accent)' }} /> My Clubs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{myClubs.map(club => <ClubCard key={club.id} club={club} userEmail={user?.email} onJoin={joinClub} isMember />)}</div>
        </section>
      )}

      <div className="relative mb-6">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input className="lx-input pl-9" placeholder="Search by name, genre, or code..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {search ? (
        <section>
          <h2 className="font-display text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Search Results</h2>
          {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="lx-card h-40 animate-pulse" />)}</div>
           : filtered.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filtered.map(club => <ClubCard key={club.id} club={club} userEmail={user?.email} onJoin={joinClub} isMember={club.member_emails?.includes(user?.email)} />)}</div>
           : <div className="lx-card p-10 text-center"><p style={{ color: 'var(--text-muted)' }}>No clubs found</p></div>}
        </section>
      ) : (
        <>
          <section className="mb-8">
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Flame size={18} style={{ color: 'var(--lx-accent)' }} /> Most Active</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{trending.map(club => <ClubCard key={club.id} club={club} userEmail={user?.email} onJoin={joinClub} isMember={club.member_emails?.includes(user?.email)} />)}</div>
          </section>
          <section>
            <h2 className="font-display text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><Sparkles size={18} style={{ color: 'var(--lx-accent)' }} /> New Clubs</h2>
            {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i => <div key={i} className="lx-card h-40 animate-pulse" />)}</div>
             : newest.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{newest.map(club => <ClubCard key={club.id} club={club} userEmail={user?.email} onJoin={joinClub} isMember={club.member_emails?.includes(user?.email)} />)}</div>
             : <div className="lx-card p-10 text-center"><Users size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} /><p className="mb-2 font-medium" style={{ color: 'var(--text-primary)' }}>No clubs yet</p><p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Be the first to create one!</p>{isAuthenticated && <button onClick={() => setShowCreate(true)} className="lx-btn-primary text-sm">Create a club</button>}</div>}
          </section>
        </>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-xl p-6 my-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-5"><h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Create Reading Club</h2><button onClick={() => setShowCreate(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button></div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Club Focus</label>
                <div className="flex gap-2">{['book', 'series'].map(f => <button key={f} onClick={() => setForm(ff => ({ ...ff, club_focus: f }))} className="flex-1 py-2 rounded text-sm font-medium capitalize" style={{ background: form.club_focus === f ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: form.club_focus === f ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${form.club_focus === f ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>{f === 'book' ? '📖 Single Book' : '📚 Series'}</button>)}</div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>{form.club_focus === 'series' ? 'Search for Series (select 1st book) *' : 'Search for Book *'}</label>
                {selectedBook ? (
                  <div className="flex items-center gap-3 p-2 rounded" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-accent)' }}>
                    {selectedBook.cover_image && <img src={selectedBook.cover_image} alt="" className="w-8 h-11 object-cover rounded flex-shrink-0" />}
                    <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{selectedBook.title}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedBook.author}</p></div>
                    <button onClick={() => { setSelectedBook(null); setBookSearchResults([]); }} style={{ color: 'var(--text-muted)' }}><X size={14} /></button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2"><input className="lx-input flex-1 text-sm" placeholder="Search..." value={bookSearch} onChange={e => setBookSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchForBook()} /><button onClick={searchForBook} disabled={bookSearching} className="lx-btn-primary px-3 text-sm">{bookSearching ? '...' : <Search size={14} />}</button></div>
                    {bookSearchResults.length > 0 && <div className="max-h-44 overflow-y-auto space-y-1 rounded" style={{ border: '1px solid var(--lx-border)' }}>{bookSearchResults.map(b => <button key={b.google_books_id || b.title} onClick={() => { setSelectedBook(b); setBookSearchResults([]); }} className="w-full flex items-center gap-2 p-2 text-left" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--lx-border)' }}><>{b.cover_image && <img src={b.cover_image} alt="" className="w-7 h-10 object-cover rounded flex-shrink-0" />}<div className="min-w-0"><p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{b.title}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.author}</p></div></></button>)}</div>}
                  </div>
                )}
              </div>
              <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Club Name *</label><input className="lx-input" placeholder="e.g. Scythe Fans" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Description</label><textarea className="lx-input resize-none" rows={2} placeholder="What's this club about?" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div><label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Club Type</label><select className="lx-input" value={form.club_type} onChange={e => setForm(f => ({ ...f, club_type: e.target.value }))} style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', cursor: 'pointer' }}><option value="discussion">Discussion</option><option value="collaborative">Collaborative</option><option value="administrative">Administrative</option><option value="logging">Logging</option></select></div>
              <div className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--bg-elevated)' }}><span className="text-xs" style={{ color: 'var(--text-primary)' }}>Visible to all</span><button onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>{form.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}</button></div>
              {!selectedBook && <p className="text-xs" style={{ color: '#f87171' }}>⚠ Select a book to create a club.</p>}
              <button onClick={createClub} disabled={creating || !form.name.trim() || !selectedBook} className="lx-btn-primary w-full justify-center text-sm">{creating ? 'Creating...' : 'Create Club'}</button>
            </div>
          </div>
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-xs rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Enter Club Code</h2><button onClick={() => setShowJoinModal(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button></div>
            <input className="lx-input mb-4 uppercase" placeholder="e.g. CLUB1A2B3C" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} />
            <button onClick={joinClubByCode} className="lx-btn-primary w-full justify-center text-sm">Join Club</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClubCard({ club, userEmail, onJoin, isMember }) {
  const banner = club.banner_image || club.cover_image;
  const typeEmoji = club.club_type === 'administrative' ? '👥' : club.club_type === 'collaborative' ? '📚' : club.club_type === 'logging' ? '📊' : '💬';
  return (
    <Link to={`/club/${club.id}`} className="lx-card overflow-hidden flex flex-col group transition-all hover:border-[var(--lx-accent)]">
      <div className="h-20 overflow-hidden relative" style={{ background: 'var(--bg-elevated)' }}>
        {banner ? <img src={banner} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, var(--lx-accent), var(--bg-secondary))' }} />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, var(--bg-card) 0%, transparent 60%)' }} />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2 -mt-6 relative">
        <div className="flex items-end gap-2 mb-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-card)', border: '2px solid var(--bg-card)' }}>
            {club.cover_image ? <img src={club.cover_image} alt="" className="w-full h-full object-cover" /> : <span>{typeEmoji}</span>}
          </div>
          <div className="flex flex-wrap gap-1 mb-1">
            {club.genres?.slice(0, 2).map(g => <span key={g} className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>{g}</span>)}
            {!club.is_visible && <Key size={10} style={{ color: 'var(--lx-accent)' }} />}
          </div>
        </div>
        <h3 className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>{club.name}</h3>
        {club.description && <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{club.description}</p>}
        {club.current_book_title && <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}><BookOpen size={11} /> {club.current_book_title}</div>}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Users size={11} /> {club.member_count || 1}</span>
          {isMember ? <span className="text-xs px-3 py-1 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>View →</span>
           : userEmail ? <button onClick={(e) => { e.preventDefault(); onJoin(club); }} className="text-xs px-3 py-1 rounded font-medium" style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>Join</button> : null}
        </div>
      </div>
    </Link>
  );
}