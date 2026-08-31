import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, BookOpen, Star, UserPlus, UserCheck, MessageSquare, Heart, BookMarked, Clock, CheckCircle, Bookmark } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ReviewCard from '@/components/reviews/ReviewCard';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

const TABS = ['Library', 'Reviews', 'Posts', 'Comments'];

export default function UserPublicProfilePage() {
  const { username } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [library, setLibrary] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [clubPosts, setClubPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Library');
  const [libraryFilter, setLibraryFilter] = useState('all');

  useEffect(() => { load(); }, [username, user]);

  async function load() {
    setLoading(true);
    try {
      const lc = (username || '').toLowerCase();
      let p = await base44.entities.UserProfile.filter({ username: lc });
      // Case-insensitive fallback so links with any casing still resolve.
      if (!p[0]) {
        const all = await base44.entities.UserProfile.list('-created_date', 200);
        p = all.filter(prof => prof.username && prof.username.toLowerCase() === lc);
      }
      if (!p[0]) { setLoading(false); return; }
      setProfile(p[0]);

      const email = p[0].user_email;

      const isPublic = !!p[0].is_public;
      const [lib, revs, forumPosts, forumComments, cPosts] = await Promise.all([
        isPublic && p[0].show_library ? base44.entities.UserLibrary.filter({ user_email: email }, '-created_date', 100) : Promise.resolve([]),
        isPublic && p[0].show_reviews ? base44.entities.Review.filter({ user_email: email }, '-created_date', 20) : Promise.resolve([]),
        isPublic ? base44.entities.ForumPost.filter({ author_email: email }, '-created_date', 20) : Promise.resolve([]),
        isPublic ? base44.entities.ForumComment.filter({ author_email: email }, '-created_date', 20) : Promise.resolve([]),
        isPublic ? base44.entities.ClubPost.filter({ user_email: email }, '-created_date', 20) : Promise.resolve([]),
      ]);

      setLibrary(lib);
      setReviews(revs);
      setPosts(forumPosts);
      setComments(forumComments);
      setClubPosts(cPosts);

      if (user?.email) {
        const follow = await base44.entities.UserFollow.filter({ follower_email: user.email, following_email: email });
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
    <div className="max-w-4xl mx-auto px-4 py-12 flex justify-center">
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!profile || !profile.is_public) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <User size={36} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
      <p className="font-medium mb-1" style={{ color: 'var(--text-primary)' }}>User not found</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This profile is private or doesn't exist.</p>
    </div>
  );

  const stats = {
    total: library.length,
    finished: library.filter(b => b.status === 'finished').length,
    reading: library.filter(b => b.status === 'reading').length,
    want: library.filter(b => b.status === 'want_to_read').length,
    avgRating: (() => {
      const rated = reviews.filter(r => r.rating);
      return rated.length ? (rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(1) : null;
    })(),
  };

  const filteredLibrary = libraryFilter === 'all' ? library : library.filter(b => b.status === libraryFilter);
  const allComments = [...comments, ...clubPosts];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Profile Header */}
      <div className="lx-card p-6 mb-6" style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
              style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
              {profile.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                {profile.is_verified ? (profile.verified_real_name || profile.username || 'Verified User') : `@${profile.username}`}
                {profile.is_verified && <VerifiedBadge size={18} />}
              </h1>
              {profile.is_verified ? (
                <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>Verified identity</p>
              ) : profile.show_real_name && profile.display_name && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{profile.display_name}</p>
              )}
              {profile.show_email && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{profile.user_email}</p>
              )}
              {profile.bio && <p className="text-sm mt-1 max-w-md" style={{ color: 'var(--text-secondary)' }}>{profile.bio}</p>}
            </div>
          </div>
          {user && user.email !== profile.user_email && (
            <button onClick={toggleFollow} className={isFollowing ? 'lx-btn-ghost text-sm' : 'lx-btn-primary text-sm'}>
              {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
            </button>
          )}
        </div>

        {/* Stats row */}
        {profile.show_stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t" style={{ borderColor: 'var(--lx-border)' }}>
            {[
              { label: 'Books', value: stats.total, icon: BookOpen },
              { label: 'Finished', value: stats.finished, icon: CheckCircle },
              { label: 'Reading', value: stats.reading, icon: Clock },
              { label: 'Reviews', value: reviews.length, icon: Star },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl font-bold" style={{ color: 'var(--lx-accent)' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--lx-border)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="px-4 py-2.5 text-sm font-medium transition-all relative"
            style={{ color: activeTab === tab ? 'var(--lx-accent)' : 'var(--text-muted)' }}>
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--lx-accent)' }} />
            )}
          </button>
        ))}
      </div>

      {/* Library Tab */}
      {activeTab === 'Library' && (
        <div>
          {profile.show_library ? (
            <>
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'reading', label: 'Reading' },
                  { key: 'finished', label: 'Finished' },
                  { key: 'want_to_read', label: 'Want to Read' },
                  { key: 'dropped', label: 'Dropped' },
                ].map(f => (
                  <button key={f.key} onClick={() => setLibraryFilter(f.key)}
                    className="text-xs px-3 py-1.5 rounded font-medium transition-all"
                    style={{
                      background: libraryFilter === f.key ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                      color: libraryFilter === f.key ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${libraryFilter === f.key ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
              {filteredLibrary.length === 0 ? (
                <div className="lx-card p-8 text-center">
                  <BookOpen size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No books here yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {filteredLibrary.map(b => (
                    <Link key={b.id} to={`/book/${b.book_id}`} className="group">
                      {b.book_cover ? (
                        <img src={b.book_cover} alt={b.book_title}
                          className="w-full rounded-lg transition-transform group-hover:scale-105"
                          style={{ aspectRatio: '2/3', objectFit: 'cover' }} />
                      ) : (
                        <div className="rounded-lg flex items-center justify-center p-2 text-center"
                          style={{ aspectRatio: '2/3', background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.book_title}</span>
                        </div>
                      )}
                      {b.rating > 0 && (
                        <div className="flex items-center justify-center gap-0.5 mt-1">
                          {Array.from({ length: b.rating }).map((_, i) => (
                            <Star key={i} size={8} fill="var(--lx-accent)" style={{ color: 'var(--lx-accent)' }} />
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="lx-card p-8 text-center">
              <BookMarked size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>This user's library is private.</p>
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'Reviews' && (
        <div>
          {profile.show_reviews && reviews.length > 0 ? (
            <div className="space-y-3">
              {reviews.map(r => (
                <div key={r.id}>
                  {r.book_title && (
                    <Link to={`/book/${r.book_id}`} className="text-xs mb-1.5 flex items-center gap-1 hover:underline" style={{ color: 'var(--lx-accent)' }}>
                      <BookOpen size={11} /> {r.book_title}
                    </Link>
                  )}
                  <ReviewCard review={r} />
                </div>
              ))}
            </div>
          ) : (
            <div className="lx-card p-8 text-center">
              <Star size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No reviews yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'Posts' && (
        <div>
          {posts.length === 0 && clubPosts.length === 0 ? (
            <div className="lx-card p-8 text-center">
              <MessageSquare size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No posts yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.map(p => (
                <div key={p.id} className="lx-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }}>Forum</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(p.created_date).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{p.title}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Star size={11} /> {(p.upvotes || 0) - (p.downvotes || 0)}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={11} /> {p.comment_count || 0}</span>
                  </div>
                </div>
              ))}
              {clubPosts.map(p => (
                <div key={p.id} className="lx-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Club Post</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(p.created_date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.content}</p>
                  {p.book_title && (
                    <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <BookOpen size={11} /> {p.book_title}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Heart size={11} /> {p.likes?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'Comments' && (
        <div>
          {comments.length === 0 ? (
            <div className="lx-card p-8 text-center">
              <MessageSquare size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="lx-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Comment</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(c.created_date).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{c.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1"><Star size={11} /> {(c.upvotes || 0) - (c.downvotes || 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}