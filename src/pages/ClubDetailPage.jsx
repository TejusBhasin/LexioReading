import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Users, Trophy, BookOpen, MessageSquare, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ClubMembers from '@/components/clubs/ClubMembers';
import ClubLeaderboard from '@/components/clubs/ClubLeaderboard';
import BookClubChains from '@/components/clubs/BookClubChains';

export default function ClubDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [club, setClub] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [tracking, setTracking] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadClub();
  }, [id, user]);

  async function loadClub() {
    setLoading(true);
    try {
      const clubs = await base44.entities.ReadingClub.filter({ id });
      if (clubs.length > 0) {
        setClub(clubs[0]);
        const m = await base44.entities.ClubMemberTracking.filter({ club_id: id });
        setMembers(m);
        const s = await base44.entities.BookClubSchedule.filter({ club_id: id });
        setSchedules(s);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function leaveClub() {
    if (!user || !club) return;
    try {
      const updated = await base44.entities.ReadingClub.update(club.id, {
        member_emails: club.member_emails.filter(e => e !== user.email),
        member_count: Math.max(0, (club.member_count || 0) - 1),
      });
      setClub(updated);
      navigate('/clubs');
    } catch (e) {}
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
            <h1 className="font-display text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {club.name}
            </h1>
            <span className="text-2xl">
              {club.club_type === 'administrative' ? '👥' : club.club_type === 'collaborative' ? '📚' : '💬'}
            </span>
          </div>
          {club.description && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{club.description}</p>
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
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Club Type</p>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{club.club_type}</p>
        </div>
        <div className="lx-card p-4">
          <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Current Book</p>
          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
            {club.current_book_title || 'None'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'members', label: 'Members', icon: Users },
          ...(club.club_type === 'administrative' || club.club_type === 'collaborative' ? [{ id: 'leaderboard', label: 'Leaderboard', icon: Trophy }] : []),
          ...(club.club_type === 'collaborative' ? [{ id: 'chains', label: 'Discussion Chains', icon: MessageSquare }] : []),
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium whitespace-nowrap transition-all"
            style={{
              background: tab === t.id ? 'var(--lx-accent)' : 'var(--bg-card)',
              color: tab === t.id ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.id ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            }}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
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
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      {schedules[0].chapters?.length || 0} chapters to read
                    </p>
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
                  <span key={g} className="text-sm px-3 py-1 rounded" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {isMember && !isAdmin && (
              <button onClick={leaveClub} className="lx-btn-ghost text-sm">
                Leave Club
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'members' && (
        <ClubMembers club={club} members={members} isAdmin={isAdmin} />
      )}

      {tab === 'leaderboard' && (
        <ClubLeaderboard club={club} members={members} />
      )}

      {tab === 'chains' && (
        <BookClubChains club={club} schedule={schedules[0]} user={user} />
      )}

      {/* Settings Modal */}
      {showSettings && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md rounded-xl p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Club Settings</h2>
              <button onClick={() => setShowSettings(false)}><X size={18} style={{ color: 'var(--text-muted)' }} /></button>
            </div>
            <div className="space-y-4">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Admin controls and tracking settings coming soon!</p>
              <button onClick={() => setShowSettings(false)} className="lx-btn-primary w-full text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}