import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Send, BookOpen, MessageCircle, ChevronDown, ChevronUp, Flag, Ban, ThumbsUp, Smile, Bookmark, Pin, Clock, Flame } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { base44 } from '@/api/base44Client';
import ReportContentModal from '@/components/safety/ReportContentModal';
import BlockUserModal from '@/components/safety/BlockUserModal';
import AuthorTag from '@/components/ui/AuthorTag';
import useVerifiedAuthors from '@/hooks/useVerifiedAuthors';

const REACTIONS = [
  { key: 'likes', icon: ThumbsUp, color: '#3b82f6', label: 'Like' },
  { key: 'hearts', icon: Heart, color: '#f43f5e', label: 'Heart' },
  { key: 'laughs', icon: Smile, color: '#eab308', label: 'Laugh' },
  { key: 'bookmarks', icon: Bookmark, color: 'var(--lx-accent)', label: 'Bookmark' },
];

function PostReplies({ post, user, myUsername, isAdmin }) {
  const [replies, setReplies] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const verifiedMap = useVerifiedAuthors();

  useEffect(() => {
    base44.entities.ClubPostReply.filter({ post_id: post.id }, 'created_date', 50)
      .then(r => { setReplies(r); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [post.id]);

  async function sendReply() {
    if (!replyText.trim() || sending || !user) return;
    setSending(true);
    const r = await base44.entities.ClubPostReply.create({ post_id: post.id, club_id: post.club_id, user_email: user.email, username: myUsername || 'Reader', content: replyText.trim() });
    setReplies(prev => [...prev, r]);
    setReplyText('');
    setSending(false);
  }

  async function deleteReply(reply) {
    await base44.entities.ClubPostReply.delete(reply.id);
    setReplies(prev => prev.filter(r => r.id !== reply.id));
  }

  if (!loaded) return <div className="px-4 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>Loading replies...</div>;

  return (
    <div className="mt-3 border-t pt-3 space-y-3" style={{ borderColor: 'var(--lx-border)' }}>
      {replies.map(r => <ReplyItem key={r.id} r={r} user={user} canDelete={isAdmin || r.user_email === user?.email} onDelete={() => deleteReply(r)} verifiedMap={verifiedMap} />)}
      {user && (
        <div className="flex gap-2 items-center mt-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>{(myUsername || 'R')[0]?.toUpperCase()}</div>
          <input className="flex-1 text-sm px-3 py-1.5 rounded-lg outline-none" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)', color: 'var(--text-primary)' }} placeholder="Write a reply..." value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()} />
          <button onClick={sendReply} disabled={!replyText.trim() || sending} className="p-1.5 rounded-lg flex-shrink-0" style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)', opacity: !replyText.trim() || sending ? 0.5 : 1 }}><Send size={13} /></button>
        </div>
      )}
    </div>
  );
}

function ReplyItem({ r, user, canDelete, onDelete, verifiedMap }) {
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', border: '1px solid var(--lx-border)' }}>{(r.username || 'R')[0]?.toUpperCase()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {r.username ? <AuthorTag email={r.user_email} username={r.username} verifiedMap={verifiedMap} prefix="@" className="text-xs font-bold hover:underline" style={{ color: 'var(--text-primary)' }} /> : <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Reader</span>}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(r.created_date).toLocaleDateString()}</span>
          {user && r.user_email !== user.email && (<><button onClick={() => setShowReport(true)} className="text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }}><Flag size={9} /></button><button onClick={() => setShowBlock(true)} className="text-xs hover:opacity-80" style={{ color: 'var(--text-muted)' }}><Ban size={9} /></button></>)}
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.content}</p>
      </div>
      {canDelete && <button onClick={onDelete} className="p-1 flex-shrink-0 hover:opacity-70" style={{ color: 'var(--text-muted)' }}><Trash2 size={11} /></button>}
      {showReport && <ReportContentModal contentType="club_post" contentId={r.id} contentSnapshot={r.content} reportedUserEmail={r.user_email} reportedUsername={r.username} onClose={() => setShowReport(false)} />}
      {showBlock && <BlockUserModal blockedEmail={r.user_email} blockedUsername={r.username} onClose={() => setShowBlock(false)} />}
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
  const [sortBy, setSortBy] = useState('newest');
  const verifiedMap = useVerifiedAuthors();

  useEffect(() => { loadPosts(); loadUsername(); }, [club.id]);

  async function loadUsername() {
    if (!user?.email) return;
    try { const profiles = await base44.entities.UserProfile.filter({ user_email: user.email }); setUsername(profiles[0]?.username || 'Reader'); } catch (e) { setUsername('Reader'); }
  }

  async function loadPosts() {
    setLoading(true);
    try { const all = await base44.entities.ClubPost.filter({ club_id: club.id }, '-created_date', 50); setPosts(all); } catch (e) {}
    setLoading(false);
  }

  async function submitPost() {
    if (!content.trim() || posting || !user) return;
    setPosting(true);
    const post = await base44.entities.ClubPost.create({ club_id: club.id, user_email: user.email, username: username || 'Reader', content: content.trim(), likes: [] });
    setPosts(prev => [post, ...prev]);
    setContent('');
    setPosting(false);
  }

  async function toggleReaction(post, reactionKey) {
    if (!user?.email) return;
    const current = post[reactionKey] || [];
    const has = current.includes(user.email);
    const newList = has ? current.filter(e => e !== user.email) : [...current, user.email];
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, [reactionKey]: newList } : p));
    await base44.entities.ClubPost.update(post.id, { [reactionKey]: newList });
  }

  async function togglePin(post) {
    const newPinned = !post.pinned;
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, pinned: newPinned } : p));
    await base44.entities.ClubPost.update(post.id, { pinned: newPinned });
  }

  async function deletePost(post) {
    if (!confirm('Delete this post?')) return;
    await base44.entities.ClubPost.delete(post.id);
    setPosts(prev => prev.filter(p => p.id !== post.id));
  }

  const canDelete = (post) => isAdmin || post.user_email === user?.email;
  function toggleReplies(postId) { setOpenReplies(prev => ({ ...prev, [postId]: !prev[postId] })); }

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === 'top') {
      const aScore = (a.likes?.length || 0) + (a.hearts?.length || 0) + (a.laughs?.length || 0);
      const bScore = (b.likes?.length || 0) + (b.hearts?.length || 0) + (b.laughs?.length || 0);
      return bScore - aScore;
    }
    return new Date(b.created_date) - new Date(a.created_date);
  });

  return (
    <div className="space-y-4">
      {user && (
        <div className="lx-card p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'var(--lx-accent)', color: 'var(--bg-primary)' }}>{(username || user.email)[0]?.toUpperCase()}</div>
            <div className="flex-1">
              <textarea className="lx-input text-sm resize-none w-full" rows={3} placeholder="Share your thoughts... (Markdown supported)" value={content} onChange={e => setContent(e.target.value)} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Markdown supported</span>
                <button onClick={submitPost} disabled={!content.trim() || posting} className="lx-btn-primary text-sm"><Send size={13} /> {posting ? 'Posting...' : 'Post'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort */}
      {posts.length > 1 && (
        <div className="flex items-center gap-2">
          {[
            { id: 'newest', label: 'Newest', icon: Clock },
            { id: 'top', label: 'Top', icon: Flame },
          ].map(opt => (
            <button key={opt.id} onClick={() => setSortBy(opt.id)} className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-all" style={{ background: sortBy === opt.id ? 'var(--lx-accent)' : 'var(--bg-card)', color: sortBy === opt.id ? 'var(--bg-primary)' : 'var(--text-secondary)', border: `1px solid ${sortBy === opt.id ? 'var(--lx-accent)' : 'var(--lx-border)'}` }}>
              <opt.icon size={12} /> {opt.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="lx-card p-5 h-28 animate-pulse" />)}</div>
      ) : sortedPosts.length === 0 ? (
        <div className="lx-card p-10 text-center">
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-muted)' }}>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        sortedPosts.map(post => {
          const repliesOpen = openReplies[post.id];
          return (
            <div key={post.id} className="lx-card p-4 md:p-5" style={post.pinned ? { borderColor: 'var(--lx-accent)' } : {}}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', border: '1px solid var(--lx-border)' }}>{(post.username || 'R')[0]?.toUpperCase()}</div>
                  <div>
                    {post.username ? <AuthorTag email={post.user_email} username={post.username} verifiedMap={verifiedMap} prefix="@" className="text-sm font-bold hover:underline" style={{ color: 'var(--text-primary)' }} /> : <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Reader</p>}
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(post.created_date).toLocaleDateString()}</p>
                  </div>
                  {post.pinned && <Pin size={12} style={{ color: 'var(--lx-accent)' }} />}
                </div>
                <div className="flex items-center gap-1">
                  {isAdmin && <button onClick={() => togglePin(post)} className="p-1 rounded hover:opacity-70" style={{ color: post.pinned ? 'var(--lx-accent)' : 'var(--text-muted)' }} title="Pin"><Pin size={13} /></button>}
                  {canDelete(post) && <button onClick={() => deletePost(post)} className="p-1 rounded hover:opacity-70" style={{ color: 'var(--text-muted)' }}><Trash2 size={13} /></button>}
                </div>
              </div>

              <div className="text-sm leading-relaxed mb-3 prose prose-sm" style={{ color: 'var(--text-primary)' }}>
                <ReactMarkdown>{post.content}</ReactMarkdown>
              </div>

              {post.image_url && <img src={post.image_url} alt="" className="rounded-lg w-full object-cover mb-3" style={{ maxHeight: 300 }} />}
              {post.book_title && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-elevated)' }}>
                  <BookOpen size={13} style={{ color: 'var(--lx-accent)' }} /><span style={{ color: 'var(--text-secondary)' }}>{post.book_title}</span>
                </div>
              )}

              {/* Reaction bar */}
              <div className="flex items-center gap-1 pt-2 border-t" style={{ borderColor: 'var(--lx-border)' }}>
                {REACTIONS.map(({ key, icon: Icon, color, label }) => {
                  const list = post[key] || [];
                  const active = list.includes(user?.email);
                  return (
                    <button key={key} onClick={() => toggleReaction(post, key)} className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all hover:bg-opacity-80" style={{ color: active ? color : 'var(--text-muted)', background: active ? `${color}15` : 'transparent' }} title={label}>
                      <Icon size={14} fill={active ? color : 'none'} />
                      {list.length > 0 && <span>{list.length}</span>}
                    </button>
                  );
                })}
                <div className="flex-1" />
                <button onClick={() => toggleReplies(post.id)} className="flex items-center gap-1.5 text-xs transition-all" style={{ color: repliesOpen ? 'var(--lx-accent)' : 'var(--text-muted)' }}>
                  <MessageCircle size={14} /> Reply {repliesOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
                {user && post.user_email !== user.email && (
                  <ReportBlockButtons post={post} />
                )}
              </div>

              {repliesOpen && <PostReplies post={post} user={user} myUsername={username} isAdmin={isAdmin} />}
            </div>
          );
        })
      )}
    </div>
  );
}

function ReportBlockButtons({ post }) {
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  return (
    <>
      <button onClick={() => setShowReport(true)} className="p-1 hover:opacity-80" style={{ color: 'var(--text-muted)' }}><Flag size={12} /></button>
      <button onClick={() => setShowBlock(true)} className="p-1 hover:opacity-80" style={{ color: 'var(--text-muted)' }}><Ban size={12} /></button>
      {showReport && <ReportContentModal contentType="club_post" contentId={post.id} contentSnapshot={post.content} reportedUserEmail={post.user_email} reportedUsername={post.username} onClose={() => setShowReport(false)} />}
      {showBlock && <BlockUserModal blockedEmail={post.user_email} blockedUsername={post.username} onClose={() => setShowBlock(false)} />}
    </>
  );
}