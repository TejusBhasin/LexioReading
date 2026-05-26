import React, { useState, useEffect } from 'react';
import { Search, Plus, TrendingUp, Clock, Flame } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ForumPostCard from '@/components/forums/ForumPostCard';
import NewPostModal from '@/components/forums/NewPostModal';
import PostDetailPage from '@/components/forums/PostDetailPage';

const SORT_OPTIONS = [
  { value: 'hot', label: 'Hot', icon: Flame },
  { value: 'new', label: 'New', icon: Clock },
  { value: 'top', label: 'Top', icon: TrendingUp },
];

export default function ForumsPage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('hot');
  const [activeTag, setActiveTag] = useState(null);
  const [showNewPost, setShowNewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [popularTags, setPopularTags] = useState([]);

  useEffect(() => {
    loadPosts();
    if (user?.email) loadUserProfile();
  }, [user]);

  async function loadUserProfile() {
    const p = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (p[0]) setUserProfile(p[0]);
  }

  async function loadPosts() {
    setLoading(true);
    const all = await base44.entities.ForumPost.list('-created_date', 100);
    setPosts(all);
    // Compute popular tags
    const tagCounts = {};
    all.forEach(p => (p.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
    const sorted = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t);
    setPopularTags(sorted);
    setLoading(false);
  }

  async function handleVote(post, dir) {
    if (!user) return;
    const key = `${user.email}:${dir}`;
    const otherDir = dir === 'up' ? 'down' : 'up';
    const otherKey = `${user.email}:${otherDir}`;
    const voted_by = post.voted_by || [];
    const alreadyVoted = voted_by.includes(key);
    const hadOther = voted_by.includes(otherKey);
    const newVotedBy = voted_by.filter(v => !v.startsWith(user.email + ':')).concat(alreadyVoted ? [] : [key]);
    const delta = alreadyVoted ? -1 : 1;

    const updated = {
      ...post,
      voted_by: newVotedBy,
      upvotes: (post.upvotes || 0) + (dir === 'up' ? delta : hadOther ? -1 : 0),
      downvotes: (post.downvotes || 0) + (dir === 'down' ? delta : hadOther ? -1 : 0),
    };

    await base44.entities.ForumPost.update(post.id, {
      voted_by: newVotedBy,
      upvotes: updated.upvotes,
      downvotes: updated.downvotes,
    });

    setPosts(prev => prev.map(p => p.id === post.id ? updated : p));
    if (selectedPost?.id === post.id) setSelectedPost(updated);
  }

  function getScore(p) { return (p.upvotes || 0) - (p.downvotes || 0); }

  function getSortedFiltered() {
    let result = posts;

    // Tag filter
    if (activeTag) result = result.filter(p => (p.tags || []).includes(activeTag));

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        (p.tags || []).some(t => t.includes(q)) ||
        (p.author_username || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (sort === 'new') return [...result].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    if (sort === 'top') return [...result].sort((a, b) => getScore(b) - getScore(a));
    // Hot = score + recency
    return [...result].sort((a, b) => {
      const ageA = (Date.now() - new Date(a.created_date)) / 3600000;
      const ageB = (Date.now() - new Date(b.created_date)) / 3600000;
      return (getScore(b) / (ageB + 2)) - (getScore(a) / (ageA + 2));
    });
  }

  const filtered = getSortedFiltered();

  if (selectedPost) {
    return (
      <PostDetailPage
        post={selectedPost}
        user={user}
        userProfile={userProfile}
        onBack={() => setSelectedPost(null)}
        onVotePost={handleVote}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-8">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Forums</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>A place for readers to talk about anything</p>
        </div>
        {isAuthenticated && (
          <button onClick={() => setShowNewPost(true)} className="lx-btn-primary">
            <Plus size={15} /> New Post
          </button>
        )}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="lx-input pl-9"
            placeholder=""
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {SORT_OPTIONS.map(({ value, label, icon: SortIcon }) => (
            <button key={value} onClick={() => setSort(value)}
              className="flex items-center gap-1.5 px-3 py-2 rounded text-sm font-medium transition-all"
              style={{
                background: sort === value ? 'var(--lx-accent)' : 'var(--bg-card)',
                color: sort === value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                border: `1px solid ${sort === value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
              }}>
              <SortIcon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          <button onClick={() => setActiveTag(null)}
            className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
            style={{
              background: !activeTag ? 'var(--lx-accent)' : 'var(--bg-card)',
              color: !activeTag ? 'var(--bg-primary)' : 'var(--text-muted)',
              border: '1px solid var(--lx-border)',
            }}>All</button>
          {popularTags.map(t => (
            <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
              className="px-2.5 py-1 rounded text-xs font-semibold transition-all"
              style={{
                background: activeTag === t ? 'var(--lx-accent)' : 'var(--bg-card)',
                color: activeTag === t ? 'var(--bg-primary)' : 'var(--text-muted)',
                border: '1px solid var(--lx-border)',
              }}>#{t}</button>
          ))}
        </div>
      )}

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-lg" style={{ background: 'var(--bg-card)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>No posts found</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            {search || activeTag ? 'Try a different search or tag.' : 'Be the first to post something!'}
          </p>
          {isAuthenticated && (
            <button onClick={() => setShowNewPost(true)} className="lx-btn-primary">
              <Plus size={15} /> Create First Post
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(post => (
            <ForumPostCard
              key={post.id}
              post={post}
              user={user}
              onVote={handleVote}
              onClick={() => setSelectedPost(post)}
            />
          ))}
        </div>
      )}

      {/* New Post Modal */}
      {showNewPost && (
        <NewPostModal
          user={user}
          userProfile={userProfile}
          onClose={() => setShowNewPost(false)}
          onCreated={() => { setShowNewPost(false); loadPosts(); }}
        />
      )}
    </div>
  );
}