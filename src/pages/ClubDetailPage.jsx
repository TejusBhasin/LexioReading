import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Users, Trophy, BookOpen, MessageSquare, X, Trash2, Key, Pin, Target } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ClubHero from '@/components/clubs/ClubHero';
import ClubMembers from '@/components/clubs/ClubMembers';
import ClubChat from '@/components/clubs/ClubChat';
import LoggingClubDashboard from '@/components/clubs/LoggingClubDashboard';
import ClubLeaderboard from '@/components/clubs/ClubLeaderboard';
import BookClubChains from '@/components/clubs/BookClubChains';
import DiscussionFeed from '@/components/clubs/DiscussionFeed';

export default function ClubDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [postCount, setPostCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadClub(); }, [id, user]);

  async function loadClub() {
    setLoading(true);
    try {
      const clubs = await base44.entities.ReadingClub.filter({ id });
      if (clubs.length > 0) {
        const c = clubs[0];
        setClub(c);
        setSettingsForm({
          name: c.name, description: c.description || '', current_book_title: c.current_book_title || '',
          current_pick_type: c.current_pick_type || 'book',
          is_visible: c.is_visible !== false, allow_chat: c.allow_chat !== false,
          banner_image: c.banner_image || '',           reading_goal: c.reading_goal || null, pinned_announcement: c.pinned_announcement || '',
        });
        const [m, s, posts] = await Promise.all([
          base44.entities.ClubMemberTracking.filter({ club_id: id }),
          base44.entities.BookClubSchedule.filter({ club_id: id }),
          base44.entities.ClubPost.filter({ club_id: id }, '-created_date', 200),
        ]);
        setMembers(m);
        setSchedules(s);
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        setPostCount(posts.filter(p => new Date(p.created_date) > weekAgo).length);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function joinClub() {
    if (!user || !club) return;
    try {
      const res = await base44.functions.invoke('joinClub', { club_id: club.id });
      if (res.data?.club) setClub(res.data.club);
    } catch (e) {}
  }

  async function leaveClub() {
    if (!user || !club) return;
    const updated = await base44.entities.ReadingClub.update(club.id, {
      member_emails: club.member_emails.filter(e => e !== user.email),
      member_count: Math.max(0, (club.member_count || 0) - 1),
    });
    setClub(updated);
    navigate('/clubs');
  }

  async function saveSettings() {
    setSaving(true);
    const bookChanged = settingsForm.current_book_title && settingsForm.current_book_title !== club.current_book_title;
    const updated = await base44.entities.ReadingClub.update(club.id, settingsForm);
    setClub(updated);
    if (bookChanged) {
      const memberEmails = (club.member_emails || []).filter(e => e !== user?.email);
      if (memberEmails.length > 0) {
        base44.entities.Notification.bulkCreate(memberEmails.map(email => ({
          user_email: email, type: 'club_new_book', title: `${club.name} started a new book`,
          body: settingsForm.current_book_title, link: `/club/${club.id}`, group_key: club.id, is_read: false,
        })));
      }
    }
    setSaving(false);
    setShowSettings(false);
  }

  async function deleteClub() {
    if (!confirm('Delete this club? This cannot be undone.')) return;
    setDeleting(true);
    try { await base44.entities.ReadingClub.delete(club.id); navigate('/clubs'); } catch (e) {}
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <p style={{ color: 'var(--text-muted)' }}>Club not found.</p>
        <Link to="/clubs" className="lx-btn-ghost mt-4 inline-flex">← Back to Clubs</Link>
      </div>
    );
  }

  const isAdmin = club.creator_email === user?.email;
  const isMember = club.member_emails?.includes(user?.email);
  const notifKey = `lexio_club_notif_${club.id}`;
  const notifEnabled = localStorage.getItem(notifKey) === 'true';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BookOpen },
    ...(club.club_type === 'discussion' || club.club_type === 'collaborative' ? [{ id: 'discussions', label: 'Discussions', icon: MessageSquare }] : []),
    { id: 'members', label: 'Members', icon: Users },
    ...(club.allow_chat !== false ? [{ id: 'chat', label: 'Chat', icon: MessageSquare }] : []),
    ...(club.club_type !== 'discussion' && club.club_type !== 'logging' ? [{ id: 'leaderboard', label: 'Leaderboard', icon: Trophy }] : []),
    ...(club.club_type === 'collaborative' ? [{ id: 'chains', label: 'Chains', icon: MessageSquare }] : []),
    ...(club.club_type === 'logging' && isAdmin ? [{ id: 'dashboard', label: 'Dashboard', icon: BookOpen }] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto pb-24 md:pb-8">
      <div className="hidden md:flex px-4 pt-4">
        <button onClick={() => navigate(-1)} className="lx-btn-ghost text-sm mb-4 py-1.5 px-3"><ArrowLeft size={14} /> Back</button>
      </div>

      <ClubHero club={club} user={user} isAdmin={isAdmin} isMember={isMember}
        onJoin={joinClub} onLeave={leaveClub}
        onToggleNotif={() => { localStorage.setItem(notifKey, notifEnabled ? 'false' : 'true'); setClub(prev => prev ? { ...prev } : prev); }}
        notifEnabled={notifEnabled} onOpenSettings={() => setShowSettings(true)} />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 px-4 md:px-0">
        <div className="lx-card p-3 md:p-4 text-center">
          <Users size={15} className="mx-auto mb-1" style={{ color: 'var(--lx-accent)' }} />
          <p className="font-display text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{club.member_count || 1}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Members</p>
        </div>
        <div className="lx-card p-3 md:p-4 text-center">
          <MessageSquare size={15} className="mx-auto mb-1" style={{ color: 'var(--lx-accent)' }} />
          <p className="font-display text-lg md:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{postCount}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Posts this week</p>
        </div>
        <div className="lx-card p-3 md:p-4 text-center">
          <BookOpen size={15} className="mx-auto mb-1" style={{ color: 'var(--lx-accent)' }} />
          <p className="font-display text-xs md:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{club.current_book_title || 'None'}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Current Read</p>
        </div>
      </div>

      {club.reading_goal && (
        <div className="px-4 md:px-0 mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Target size={14} style={{ color: 'var(--lx-accent)' }} />
          <span>Reading goal: <strong style={{ color: 'var(--text-primary)' }}>{club.reading_goal} books/month</strong></span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 px-4 md:px-0 sticky top-0 z-10" style={{ background: 'var(--bg-primary)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all"
            style={{ background: tab === t.id ? 'var(--lx-accent)' : 'var(--bg-card)', color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${tab === t.id ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-0">
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="lx-card p-5 space-y-4">
              {club.current_book_title && (
                <div>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Currently Reading</h3>
                  <Link to={(club.current_pick_type || 'book') === 'movie' ? `/movie/${club.current_book_id}` : `/book/${club.current_book_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <BookOpen size={28} style={{ color: 'var(--lx-accent)' }} />
                    <div>
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{club.current_book_title}</p>
                      {schedules.length > 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{schedules[0].chapters?.length || 0} chapters scheduled</p>}
                    </div>
                  </Link>
                </div>
              )}
              {club.genres?.length > 0 && (
                <div>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {club.genres.map(g => <span key={g} className="text-sm px-3 py-1 rounded-full" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{g}</span>)}
                  </div>
                </div>
              )}
              {club.description && (
                <div>
                  <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>About</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{club.description}</p>
                </div>
              )}
            </div>
            {club.club_type === 'discussion' && <DiscussionFeed club={club} user={user} isAdmin={isAdmin} />}
          </div>
        )}
        {tab === 'discussions' && <DiscussionFeed club={club} user={user} isAdmin={isAdmin} />}
        {tab === 'chat' && <ClubChat club={club} user={user} />}
        {tab === 'members' && <ClubMembers club={club} members={members} isAdmin={isAdmin} />}
        {tab === 'dashboard' && club.club_type === 'logging' && <LoggingClubDashboard club={club} members={members} isAdmin={isAdmin} />}
        {tab === 'overview' && club.club_type === 'logging' && !isAdmin && <LoggingClubDashboard club={club} members={members} isAdmin={false} />}
        {tab === 'leaderboard' && <ClubLeaderboard club={club} members={members} />}
        {tab === 'chains' && <BookClubChains club={club} schedule={schedules[0]} user={user} />}
      </div>

      {/* Settings Modal */}
      {showSettings && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-xl p-6 my-8 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Club Settings</h2>
              <button onClick={() => setShowSettings(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Club Name</label>
                <input className="lx-input text-sm" value={settingsForm.name || ''} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Description</label>
                <textarea className="lx-input text-sm resize-none" rows={2} value={settingsForm.description || ''} onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Banner Image URL</label>
                <input className="lx-input text-sm" placeholder="https://..." value={settingsForm.banner_image || ''} onChange={e => setSettingsForm(f => ({ ...f, banner_image: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Current Book Title</label>
                <input className="lx-input text-sm" placeholder="e.g. Dune" value={settingsForm.current_book_title || ''} onChange={e => setSettingsForm(f => ({ ...f, current_book_title: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Current Pick Type</label>
                <div className="flex gap-2">
                  {['book','movie'].map(t => (
                    <button key={t} onClick={() => setSettingsForm(f => ({ ...f, current_pick_type: t }))}
                      className="flex-1 px-3 py-2 rounded text-sm transition-all"
                      style={{ background: settingsForm.current_pick_type === t ? 'var(--lx-accent)' : 'var(--bg-elevated)', color: settingsForm.current_pick_type === t ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${settingsForm.current_pick_type === t ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
                      {t === 'book' ? '📚 Book' : '🎬 Movie'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Reading Goal (books/month)</label>
                <input type="number" className="lx-input text-sm" placeholder="e.g. 4" value={settingsForm.reading_goal ?? ''} onChange={e => setSettingsForm(f => ({ ...f, reading_goal: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Pinned Announcement</label>
                <textarea className="lx-input text-sm resize-none" rows={2} placeholder="Pin an important message..." value={settingsForm.pinned_announcement || ''} onChange={e => setSettingsForm(f => ({ ...f, pinned_announcement: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Visible to everyone</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Show in public listing</p></div>
                <button onClick={() => setSettingsForm(f => ({ ...f, is_visible: !f.is_visible }))} className="w-11 h-6 rounded-full transition-all relative flex-shrink-0" style={{ background: settingsForm.is_visible ? 'var(--lx-accent)' : 'var(--lx-border)' }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: settingsForm.is_visible ? '22px' : '2px' }} />
                </button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Allow chat</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Members can discuss</p></div>
                <button onClick={() => setSettingsForm(f => ({ ...f, allow_chat: !f.allow_chat }))} className="w-11 h-6 rounded-full transition-all relative flex-shrink-0" style={{ background: settingsForm.allow_chat ? 'var(--lx-accent)' : 'var(--lx-border)' }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: settingsForm.allow_chat ? '22px' : '2px' }} />
                </button>
              </div>
              {club.join_code && (
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Join Code</p>
                  <p className="font-mono font-bold text-lg" style={{ color: 'var(--lx-accent)' }}>{club.join_code}</p>
                </div>
              )}
              <button onClick={saveSettings} disabled={saving} className="lx-btn-primary w-full justify-center text-sm">{saving ? 'Saving...' : 'Save Changes'}</button>
              <div className="pt-2 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                <button onClick={deleteClub} disabled={deleting} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-all" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
                  <Trash2 size={14} /> {deleting ? 'Deleting...' : 'Delete Club'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}