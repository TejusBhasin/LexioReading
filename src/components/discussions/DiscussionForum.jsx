import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Eye, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function DiscussionForum({ bookId, bookTitle }) {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [posting, setPosting] = useState(false);
  const [revealedIds, setRevealedIds] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    loadPosts();
    if (user?.email) loadProfile();
  }, [bookId, user]);

  async function loadPosts() {
    try {
      const p = await base44.entities.Discussion.filter({ book_id: bookId }, '-created_date', 30);
      setPosts(p);
    } catch (e) {}
  }

  async function loadProfile() {
    try {
      const p = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (p[0]) setUserProfile(p[0]);
    } catch (e) {}
  }

  async function post() {
    if (!content.trim() || !userProfile?.username) return;
    setPosting(true);
    try {
      const newPost = await base44.entities.Discussion.create({
        user_email: user.email,
        username: userProfile.username,
        book_id: bookId,
        book_title: bookTitle,
        content: content.trim(),
        has_spoilers: hasSpoilers,
      });
      setPosts(prev => [newPost, ...prev]);
      setContent('');
      setHasSpoilers(false);
    } catch (e) {}
    setPosting(false);
  }

  return (
    <div>
      <h2 className="font-display text-lg font-bold flex items-center gap-2 mb-4" style={{ color: 'var(--text-primary)' }}>
        <MessageSquare size={16} style={{ color: 'var(--lx-accent)' }} />
        Discussion
        {posts.length > 0 && <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>({posts.length})</span>}
      </h2>

      {isAuthenticated && userProfile?.username && (
        <div className="mb-5 p-4 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <textarea
            className="lx-input resize-none mb-2"
            rows={3}
            placeholder="Join the discussion..."
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={hasSpoilers} onChange={e => setHasSpoilers(e.target.checked)} />
              Contains spoilers
            </label>
            <button onClick={post} disabled={!content.trim() || posting} className="lx-btn-primary text-sm py-1.5">
              <Send size={13} /> {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          <a href="/login" style={{ color: 'var(--lx-accent)' }}>Sign in</a> to join the discussion.
        </p>
      )}

      <div className="space-y-3">
        {posts.map(p => (
          <div key={p.id} className="lx-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
                {(p.username || p.user_email)?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {p.username || p.user_email}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {new Date(p.created_date).toLocaleDateString()}
              </span>
            </div>

            {p.has_spoilers && !revealedIds.includes(p.id) ? (
              <div className="rounded p-2 flex items-center justify-between"
                style={{ background: 'rgba(245,166,35,0.1)', border: '1px solid rgba(245,166,35,0.3)' }}>
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--lx-accent)' }}>
                  <AlertTriangle size={12} /> Spoiler
                </span>
                <button onClick={() => setRevealedIds(prev => [...prev, p.id])}
                  className="text-xs flex items-center gap-1 px-2 py-0.5 rounded"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                  <Eye size={10} /> Reveal
                </button>
              </div>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{p.content}</p>
            )}
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No discussions yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}