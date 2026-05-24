import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, BookOpen, Star, UserPlus, UserCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ReviewCard from '@/components/reviews/ReviewCard';

export default function UserPublicProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [library, setLibrary] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [username, user]);

  async function load() {
    setLoading(true);
    try {
      const p = await base44.entities.UserProfile.filter({ username });
      if (!p[0]) { setLoading(false); return; }
      setProfile(p[0]);

      const [lib, revs] = await Promise.all([
        p[0].show_library ? base44.entities.UserLibrary.filter({ user_email: p[0].user_email }) : Promise.resolve([]),
        p[0].show_reviews ? base44.entities.Review.filter({ user_email: p[0].user_email }, '-created_date', 10) : Promise.resolve([]),
      ]);
      setLibrary(lib);
      setReviews(revs);

      if (user?.email) {
        const follow = await base44.entities.UserFollow.filter({ follower_email: user.email, following_email: p[0].user_email });
        setIsFollowing(follow.length > 0);
      }
    } catch (e) {}
    setLoading(false);
  }

  async function toggleFollow() {
    if (!user || !profile) return;
    if (isFollowing) {
      const existing = await base44.entities.UserFollow.filter({ follower_email: user.email, following_email: profile.user_email });
      if (existing[0]) await base44.entities.UserFollow.delete(existing[0].id);
      setIsFollowing(false);
    } else {
      await base44.entities.UserFollow.create({ follower_email: user.email, following_email: profile.user_email });
      setIsFollowing(true);
    }
  }

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!profile) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <User size={36} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
      <p style={{ color: 'var(--text-muted)' }}>User not found.</p>
    </div>
  );

  const stats = {
    total: library.length,
    finished: library.filter(b => b.status === 'finished').length,
    reading: library.filter(b => b.status === 'reading').length,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
            {profile.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>@{profile.username}</h1>
            {profile.bio && <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{profile.bio}</p>}
          </div>
        </div>
        {user && user.email !== profile.user_email && (
          <button onClick={toggleFollow} className={isFollowing ? 'lx-btn-ghost text-sm' : 'lx-btn-primary text-sm'}>
            {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
          </button>
        )}
      </div>

      {/* Stats */}
      {profile.show_stats && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Total', value: stats.total },
            { label: 'Finished', value: stats.finished },
            { label: 'Reading', value: stats.reading },
          ].map(s => (
            <div key={s.label} className="lx-card p-4 text-center">
              <div className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Library */}
      {profile.show_library && library.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
            <BookOpen size={16} style={{ color: 'var(--lx-accent)' }} /> Library
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {library.slice(0, 10).map(b => b.book_cover ? (
              <img key={b.id} src={b.book_cover} alt={b.book_title} className="w-full rounded" style={{ aspectRatio: '2/3', objectFit: 'cover' }} />
            ) : (
              <div key={b.id} className="rounded flex items-center justify-center p-2 text-center"
                style={{ aspectRatio: '2/3', background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.book_title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {profile.show_reviews && reviews.length > 0 && (
        <div>
          <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
            <Star size={16} style={{ color: 'var(--lx-accent)' }} /> Reviews
          </h2>
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id}>
                <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{r.book_title}</p>
                <ReviewCard review={r} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}