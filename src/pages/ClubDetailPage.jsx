import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Users, Trophy, BookOpen, MessageSquare, X, Trash2, Eye, EyeOff, Key } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ClubMembers from '@/components/clubs/ClubMembers';
import ClubChat from '@/components/clubs/ClubChat';
import LoggingClubDashboard from '@/components/clubs/LoggingClubDashboard';
import ClubLeaderboard from '@/components/clubs/ClubLeaderboard';
import BookClubChains from '@/components/clubs/BookClubChains';

export default function ClubDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [schedules, setSchedules] = useState([]);
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
        setClub(clubs[0]);
        setSettingsForm({
          name: clubs[0].name,
          description: clubs[0].description || '',
          current_book_title: clubs[0].current_book_title || '',
          is_visible: clubs[0].is_visible !== false,
          allow_chat: clubs[0].allow_chat !== false,
        });
        const [m, s] = await Promise.all([
          base44.entities.ClubMemberTracking.filter({ club_id: id }),
          base44.entities.BookClubSchedule.filter({ club_id: id }),
        ]);
        setMembers(m);
        setSchedules(s);
      }
    } catch (e) {}
    setLoading(false);
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
          user_email: email, type: 'club_new_book',
          title: `${club.name} started a new book`,
          body: settingsForm.current_book_title,
          link: `/club/${club.id}`, group_key: club.id, is_read: false,
        })));
      }
    }
    setSaving(false);
    setShowSettings(false);
  }

  async function deleteClub() {
    if (!confirm('Are you sure you want to delete this club? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await base44.entities.ReadingClub.delete(club.id);
      navigate('/clubs');
    } catch (e) {}
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <button onClick={() => navigate(-1)} className="lx-btn-ghost text-sm mb-6 py-1.5 px-3">
        <ArrowLeft size={14} /> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{club.name}</h1>
            <span className="text-2xl">
              {club.club_type === 'administrative' ? '👥' : club.club_type === 'collaborative' ? '📚' : club.club_type === 'logging' ? '📊' : '💬'}
            </span>
            {!club.is_visible && <Key size={14} style={{ color: 'var(--lx-accent)' }} />}
          </div>
          {club.description && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{club.description}</p>}
          {club.join_code && isAdmin && (
            <p className="text-xs mt-1 font-mono" style={{ color: 'var(--lx-accent)' }}>Join code: {club.join_code}</p>
          )}
        </div>
        {isAdmin && (
          <button onClick={() => setShowSettings(true)} className="lx-btn-ghost text-sm">
            <Settings size={14} /> Settings
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="lx-card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Members</p>
          <p className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{club.member_count || 1}</p>
        </div>
        <div className="lx-card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Type</p>
          <p className="text-sm font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{club.club_type}</p>
        </div>
        <div className="lx-card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Current Book</p>
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{club.current_book_title || 'None'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'members', label: 'Members', icon: Users },
          ...(club.allow_chat !== false ? [{ id: 'chat', label: 'Chat', icon: MessageSquare }] : []),
          ...(club.club_type !== 'discussion' && club.club_type !== 'logging' ? [{ id: 'leaderboard', label: 'Leaderboard', icon: Trophy }] : []),
          ...(club.club_type === 'collaborative' ? [{ id: 'chains', label: 'Discussion Chains', icon: MessageSquare }] : []),
          ...(club.club_type === 'logging' && isAdmin ? [{ id: 'dashboard', label: 'Log Dashboard', icon: BookOpen }] : []),
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all"
            style={{ background: tab === t.id ? 'var(--lx-accent)' : 'var(--bg-card)', color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${tab === t.id ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="lx-card p-6 space-y-6">
          {club.current_book_title && (
            <div>
              <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Currently Reading</h3>
              <div className="flex items-center gap-4">
                <BookOpen size={32} style={{ color: 'var(--lx-accent)' }} />
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{club.current_book_title}</p>
                  {schedules.length > 0 && (
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{schedules[0].chapters?.length || 0} chapters</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {club.genres?.length > 0 && (
            <div>
              <h3 className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Genres</h3>
              <div className="flex flex-wrap gap-2">
                {club.genres.map(g => (
                  <span key={g} className="text-sm px-3 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>{g}</span>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-4">
            {isMember && !isAdmin && (
              <button onClick={leaveClub} className="lx-btn-ghost text-sm">Leave Club</button>
            )}
          </div>
        </div>
      )}

      {tab === 'chat' && <ClubChat club={club} user={user} />}
      {tab === 'members' && <ClubMembers club={club} members={members} isAdmin={isAdmin} />}
      {tab === 'dashboard' && club.club_type === 'logging' && <LoggingClubDashboard club={club} members={members} isAdmin={isAdmin} />}
      {tab === 'overview' && club.club_type === 'logging' && !isAdmin && <LoggingClubDashboard club={club} members={members} isAdmin={false} />}
      {tab === 'leaderboard' && <ClubLeaderboard club={club} members={members} />}
      {tab === 'chains' && <BookClubChains club={club} schedule={schedules[0]} user={user} />}

      {/* Settings Modal */}
      {showSettings && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-xl p-6 max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
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
                <textarea className="lx-input text-sm resize-none" rows={3} value={settingsForm.description || ''} onChange={e => setSettingsForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-muted)' }}>Current Book Title</label>
                <input className="lx-input text-sm" placeholder="e.g. Dune" value={settingsForm.current_book_title || ''} onChange={e => setSettingsForm(f => ({ ...f, current_book_title: e.target.value }))} />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Visible to everyone</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Show in public club listing</p>
                </div>
                <button onClick={() => setSettingsForm(f => ({ ...f, is_visible: !f.is_visible }))}
                  className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: settingsForm.is_visible ? 'var(--lx-accent)' : 'var(--lx-border)' }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: settingsForm.is_visible ? '22px' : '2px' }} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Allow chat</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Members can discuss</p>
                </div>
                <button onClick={() => setSettingsForm(f => ({ ...f, allow_chat: !f.allow_chat }))}
                  className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
                  style={{ background: settingsForm.allow_chat ? 'var(--lx-accent)' : 'var(--lx-border)' }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: settingsForm.allow_chat ? '22px' : '2px' }} />
                </button>
              </div>

              {club.join_code && (
                <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Join Code</p>
                  <p className="font-mono font-bold text-lg" style={{ color: 'var(--lx-accent)' }}>{club.join_code}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Share this code to invite members</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button onClick={saveSettings} disabled={saving} className="lx-btn-primary flex-1 justify-center text-sm">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              <div className="pt-2 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                <button onClick={deleteClub} disabled={deleting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-all"
                  style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.3)' }}>
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