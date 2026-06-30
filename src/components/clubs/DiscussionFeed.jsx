import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Send, BookOpen, MessageCircle, ChevronDown, ChevronUp, Flag, Ban } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReportContentModal from '@/components/safety/ReportContentModal';
import BlockUserModal from '@/components/safety/BlockUserModal';

function PostReplies({ post, user, myUsername, isAdmin }) {
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    base44.entities.ClubPostReply.filter({ post_id: post.id }, 'created_date', 50)
      .then(r => { setReplies(r); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [post.id]);

  async function sendReply() {
    if (!replyText.trim() || sending || !user) return;
    setSending(true);
    const r = await base44.entities.ClubPostReply.create({
      post_id: post.id,
      club_id: post.club_id,
      user_email: user.email,
      username: myUsername || user.email.split('@')[0],
      content: replyText.trim(),
    });
    setReplies(prev => [...prev, r]);
    setReplyText('');
    setSending(false);
  }

  async function deleteReply(reply) {
    await base44.entities.ClubPostReply.delete(reply.id);
    setReplies(prev => prev.filter(r => r.id !== reply.id));
  }

  const canDeleteReply = (reply) => isAdmin || reply.user_email === user?.email;

  if (!loaded) return <div className="px-4 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>Loading replies...</div>;

  return (
    <div className="mt-3 border-t pt-3 space-y-3" style={{ borderColor: 'var(--lx-border)' }}>
      {replies.map(r => (
        <ReplyItem key={r.id} r={r} user={user} canDelete={canDeleteReply(r)} onDelete={() => deleteReply(r)} />
      ))}

      {user && (
        <div className="flex gap-2 items-center mt-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>
            {(myUsername || user.email)[0]?.toUpperCase()}
          </div>
          <input
            className="flex-1 text-sm px-3 py-1.5 rounded-lg outline-none"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)', color: 'var(--text-primary)' }}
            placeholder="Write a reply..."
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
          />
          <button onClick={sendReply} disabled={!replyText.trim() || sending}
            className="p-1.5 rounded-lg transition-opacity flex-shrink-0"
            style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)', opacity: !replyText.trim() || sending ? 0.5 : 1 }}>
            <Send size={13} />
          </button>
        </div>
      )}
    </div>
  );
}

function ClubPostReportButtons({ post }) {
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  return (
    <>
      <button onClick={() => setShowReport(true)} className="flex items-center gap-0.5 text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }} title="Report">
        <Flag size={12} /> Report
      </button>
      <button onClick={() => setShowBlock(true)} className="flex items-center gap-0.5 text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }} title="Block">
        <Ban size={12} /> Block
      </button>
      {showReport && (
        <ReportContentModal
          contentType="club_post"
          contentId={post.id}
          contentSnapshot={post.content}
          reportedUserEmail={post.user_email}
          reportedUsername={post.username}
          onClose={() => setShowReport(false)}
        />
      )}
      {showBlock && (
        <BlockUserModal
          blockedEmail={post.user_email}
          blockedUsername={post.username}
          onClose={() => setShowBlock(false)}
        />
      )}
    </>
  );
}

function ReplyItem({ r, user, canDelete, onDelete }) {
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
        style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', border: '1px solid var(--lx-border)' }}>
        {(r.username || r.user_email)[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {r.username ? (
            <Link to={`/u/${r.username}`} className="text-xs font-bold hover:underline" style={{ color: 'var(--text-primary)' }}>@{r.username}</Link>
          ) : (
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{r.user_email?.split('@')[0]}</span>
          )}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(r.created_date).toLocaleDateString()}</span>
          {user && r.user_email !== user.email && (
            <>
              <button onClick={() => setShowReport(true)} className="flex items-center gap-0.5 text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }} title="Report">
                <Flag size={9} /> Report
              </button>
              <button onClick={() => setShowBlock(true)} className="flex items-center gap-0.5 text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }} title="Block">
                <Ban size={9} /> Block
              </button>
            </>
          )}
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.content}</p>
      </div>
      {canDelete && (
        <button onClick={onDelete} className="p-1 flex-shrink-0 hover:opacity-70 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          <Trash2 size={11} />
        </button>
      )}
      {showReport && (
        <ReportContentModal
          contentType="club_post"
          contentId={r.id}
          contentSnapshot={r.content}
          reportedUserEmail={r.user_email}
          reportedUsername={r.username}
          onClose={() => setShowReport(false)}
        />
      )}
      {showBlock && (
        <BlockUserModal
          blockedEmail={r.user_email}
          blockedUsername={r.username}
          onClose={() => setShowBlock(false)}
        />
      )}
    </div>
  );
}

export default function DiscussionFeed({ club, user, isAdmin }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [username, setUsername] = useState('');
  const [openReplies, setOpenReplies] = useState({});

  useEffect(() => {
    loadPosts();
    loadUsername();
  }, [club.id]);

  async function loadUsername() {
    if (!user?.email) return;
    try {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      setUsername(profiles[0]?.username || user.email.split('@')[0]);
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

  function toggleReplies(postId) {
    setOpenReplies(prev => ({ ...prev, [postId]: !prev[postId] }));
  }

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
          {[1, 2, 3].map(i => <div key={i} className="lx-card p-5 h-28 animate-pulse" />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="lx-card p-10 text-center">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        posts.map(post => {
          const liked = post.likes?.includes(user?.email);
          const repliesOpen = openReplies[post.id];
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
                    {post.username ? (
                      <Link to={`/u/${post.username}`} className="text-sm font-bold hover:underline" style={{ color: 'var(--text-primary)' }}>@{post.username}</Link>
                    ) : (
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{post.user_email?.split('@')[0]}</p>
                    )}
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(post.created_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {canDelete(post) && (
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
                <button onClick={() => toggleReplies(post.id)}
                  className="flex items-center gap-1.5 text-sm transition-all"
                  style={{ color: repliesOpen ? 'var(--lx-accent)' : 'var(--text-muted)' }}>
                  <MessageCircle size={15} />
                  <span>Reply</span>
                  {repliesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {user && post.user_email !== user.email && (
                  <ClubPostReportButtons post={post} />
                )}
              </div>

              {/* Replies */}
              {repliesOpen && (
                <PostReplies post={post} user={user} myUsername={username} isAdmin={isAdmin} />
              )}
            </div>
          );
        })
      )}
    </div>
  );
}