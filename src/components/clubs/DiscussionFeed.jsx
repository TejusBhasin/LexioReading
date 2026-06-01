import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Send, Image, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DiscussionFeed({ club, user, isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    loadPosts();
    loadUsername();
  }, [club.id]);

  async function loadUsername() {
    if (!user?.email) return;
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      if (profiles[0]?.username) setUsername(profiles[0].username);
      else setUsername(user.email.split('@')[0]);
    } catch (e) {
      setUsername(user?.email?.split('@')[0] || 'reader');
    }
  }

  async function loadPosts() {
    setLoading(true);
    try {
      const all = await base44.entities.ClubPost.filter({ club_id: club.id }, '-created_date', 50);
      setPosts(all);
    } catch (e) {}
    setLoading(false);
  }

  async function submitPost() {
    if (!content.trim() || posting || !user) return;
    setPosting(true);
    const post = await base44.entities.ClubPost.create({
      club_id: club.id,
      user_email: user.email,
      username: username || user.email.split('@')[0],
      content: content.trim(),
      likes: [],
    });
    setPosts(prev => [post, ...prev]);
    setContent('');
    setPosting(false);
  }

  async function toggleLike(post) {
    if (!user?.email) return;
    const liked = post.likes?.includes(user.email);
    const newLikes = liked
      ? post.likes.filter(e => e !== user.email)
      : [...(post.likes || []), user.email];
    await base44.entities.ClubPost.update(post.id, { likes: newLikes });
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes } : p));
  }

  async function deletePost(post) {
    if (!confirm('Delete this post?')) return;
    await base44.entities.ClubPost.delete(post.id);
    setPosts(prev => prev.filter(p => p.id !== post.id));
  }

  const canDelete = (post) => isAdmin || post.user_email === user?.email;

  return (
    <div className="space-y-5">
      {/* Compose */}
      {user && (
        <div className="lx-card p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
              {(username || user.email)[0]?.toUpperCase()}
            </div>
            <div className="flex-1">
              <textarea
                className="lx-input text-sm resize-none w-full"
                rows={3}
                placeholder="Share your thoughts with the club..."
                value={content}
                onChange={e => setContent(e.target.value)}
              />
              <div className="flex justify-end mt-2">
                <button onClick={submitPost} disabled={!content.trim() || posting} className="lx-btn-primary text-sm">
                  <Send size={13} /> {posting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="lx-card p-5 h-28 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="lx-card p-10 text-center">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        posts.map(post => {
          const liked = post.likes?.includes(user?.email);
          const canDel = canDelete(post);
          return (
            <div key={post.id} className="lx-card p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', border: '1px solid var(--lx-border)' }}>
                    {(post.username || post.user_email)[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>@{post.username || post.user_email.split('@')[0]}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(post.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {canDel && (
                  <button onClick={() => deletePost(post)} className="p-1 rounded hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>

              {/* Content */}
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>{post.content}</p>

              {post.image_url && (
                <img src={post.image_url} alt="" className="rounded-lg w-full object-cover mb-4" style={{ maxHeight: 300 }} />
              )}

              {post.book_title && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-elevated)' }}>
                  <BookOpen size={13} style={{ color: 'var(--lx-accent)' }} />
                  <span style={{ color: 'var(--text-secondary)' }}>{post.book_title}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                <button onClick={() => toggleLike(post)} className="flex items-center gap-1.5 text-sm transition-all"
                  style={{ color: liked ? '#f43f5e' : 'var(--text-muted)' }}>
                  <Heart size={15} fill={liked ? '#f43f5e' : 'none'} />
                  <span>{post.likes?.length || 0}</span>
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}