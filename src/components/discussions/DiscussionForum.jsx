import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertTriangle, Eye, Send, UserCircle, Flag, Ban } from 'lucide-react';
import { Link } from 'react-router-dom';

import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import ReportContentModal from '@/components/safety/ReportContentModal';
import BlockUserModal from '@/components/safety/BlockUserModal';

function DiscussionItem({ p, user, revealedIds, setRevealedIds }) {
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  return (
    <div className="lx-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
          {(p.username || p.user_email)?.[0]?.toUpperCase()}
        </div>
        {p.username ? (
          <Link to={`/u/${p.username}`} className="text-sm font-medium hover:underline" style={{ color: 'var(--text-primary)' }}>
            @{p.username}
          </Link>
        ) : (
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{p.user_email?.split('@')[0]}</span>
        )}
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

      {user && p.user_email !== user.email && (
        <div className="flex items-center gap-3 mt-2">
          <button onClick={() => setShowReport(true)} className="flex items-center gap-0.5 text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <Flag size={10} /> Report
          </button>
          <button onClick={() => setShowBlock(true)} className="flex items-center gap-0.5 text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
            <Ban size={10} /> Block
          </button>
        </div>
      )}
      {showReport && (
        <ReportContentModal
          contentType="discussion"
          contentId={p.id}
          contentSnapshot={p.content}
          reportedUserEmail={p.user_email}
          reportedUsername={p.username}
          onClose={() => setShowReport(false)}
        />
      )}
      {showBlock && (
        <BlockUserModal
          blockedEmail={p.user_email}
          blockedUsername={p.username}
          onClose={() => setShowBlock(false)}
        />
      )}
    </div>
  );
}

export default function DiscussionForum({ bookId, bookTitle }) {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [posting, setPosting] = useState(false);
  const [revealedIds, setRevealedIds] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [blockedEmails, setBlockedEmails] = useState([]);

  useEffect(() => {
    loadPosts();
    if (user?.email) {
      loadProfile();
      loadBlocked();
    }
  }, [bookId, user]);

  async function loadPosts() {
    setLoadError(false);
    const p = await base44.entities.Discussion.filter({ book_id: bookId }, '-created_date', 30);
    setPosts(p);
  }

  async function loadBlocked() {
    try {
      const blocks = await base44.entities.UserBlock.filter({ blocker_email: user.email });
      setBlockedEmails(blocks.map(b => b.blocked_email));
    } catch (e) {}
  }

  async function loadProfile() {
    const p = await base44.entities.UserProfile.filter({ user_email: user.email });
    if (p[0]) setUserProfile(p[0]);
  }

  async function post() {
    if (!content.trim() || !userProfile?.username) return;
    setPosting(true);
    const newPost = await base44.entities.Discussion.create({
      user_email: user.email,
      username: userProfile.username,
      book_id: bookId,
      book_title: bookTitle,
      content: content.trim(),
      has_spoilers: hasSpoilers,
    });
    setPosts(prev => [newPost, ...prev]);
    // Trigger AI taste analysis (fire-and-forget)
    base44.functions.invoke('analyzeUserActivity', {
      user_email: user.email,
      activity_type: 'discussion',
      content: content.trim(),
      book_title: bookTitle,
    }).catch(() => {});
    setContent('');
    setHasSpoilers(false);
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

      {isAuthenticated && !userProfile?.username && (
        <div className="mb-5 p-4 rounded-lg flex items-center gap-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <UserCircle size={18} style={{ color: 'var(--lx-accent)', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Set a username to join the discussion</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>You need a username before you can post.</p>
          </div>
          <Link to="/profile" className="lx-btn-primary text-xs py-1.5">Set Username</Link>
        </div>
      )}

      <div className="space-y-3">
        {posts.filter(p => !blockedEmails.includes(p.user_email)).map(p => (
          <DiscussionItem key={p.id} p={p} user={user} revealedIds={revealedIds} setRevealedIds={setRevealedIds} />
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