import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowUp, ArrowDown, MessageCircle, Send, CornerDownRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

function VoteButtons({ item, user, onVote, size = 'normal' }) {
  const myVote = user ? (item.voted_by || []).find(v => v.startsWith(user.email + ':')) : null;
  const voted = myVote ? myVote.split(':')[1] : null;
  const s = size === 'small' ? 13 : 16;
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onVote(item, 'up')} className="flex items-center gap-0.5 px-1.5 py-1 rounded transition-all"
        style={{ color: voted === 'up' ? 'var(--lx-accent)' : 'var(--text-muted)', background: voted === 'up' ? 'var(--bg-elevated)' : 'transparent' }}>
        <ArrowUp size={s} />
        <span className="text-xs font-bold">{item.upvotes || 0}</span>
      </button>
      <button onClick={() => onVote(item, 'down')} className="flex items-center gap-0.5 px-1.5 py-1 rounded transition-all"
        style={{ color: voted === 'down' ? '#f87171' : 'var(--text-muted)', background: voted === 'down' ? 'rgba(248,113,113,0.1)' : 'transparent' }}>
        <ArrowDown size={s} />
        <span className="text-xs font-bold">{item.downvotes || 0}</span>
      </button>
    </div>
  );
}

function ReplyBox({ user, postId, parentId, onDone }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit() {
    if (!text.trim()) return;
    setLoading(true);
    await base44.entities.ForumComment.create({
      post_id: postId, parent_id: parentId || null, content: text.trim(),
      author_email: user.email, author_username: user.full_name || user.email.split('@')[0],
      upvotes: 0, downvotes: 0, voted_by: [],
    });
    setLoading(false);
    onDone();
  }
  return (
    <div className="mt-2 flex gap-2">
      <input className="lx-input text-sm flex-1" placeholder="Write a reply..." value={text}
        onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
      <button onClick={submit} disabled={loading || !text.trim()} className="lx-btn-primary px-3 py-1.5">
        <Send size={13} />
      </button>
    </div>
  );
}

function CommentItem({ comment, user, allComments, onVoteComment, onReply, depth = 0 }) {
  const replies = allComments.filter(c => c.parent_id === comment.id);
  const [replying, setReplying] = useState(false);
  return (
    <div style={{ marginLeft: depth > 0 ? `${Math.min(depth, 3) * 16}px` : '0' }}>
      <div className="py-3" style={{ borderBottom: '1px solid var(--lx-border)' }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold" style={{ color: 'var(--lx-accent)' }}>u/{comment.author_username}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(comment.created_date).toLocaleDateString()}</span>
        </div>
        <p className="text-sm mb-2 leading-relaxed" style={{ color: 'var(--text-primary)' }}>{comment.content}</p>
        <div className="flex items-center gap-3">
          <VoteButtons item={comment} user={user} onVote={onVoteComment} size="small" />
          {user && depth < 3 && (
            <button onClick={() => setReplying(r => !r)} className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--text-muted)' }}>
              <CornerDownRight size={12} /> Reply
            </button>
          )}
        </div>
        {replying && (
          <ReplyBox user={user} postId={comment.post_id} parentId={comment.id}
            onDone={() => { setReplying(false); onReply(); }} />
        )}
      </div>
      {replies.map(r => (
        <CommentItem key={r.id} comment={r} user={user} allComments={allComments}
          onVoteComment={onVoteComment} onReply={onReply} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function PostDetailPage({ post, user, userProfile, onBack, onVotePost }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => { loadComments(); }, [post.id]);

  async function loadComments() {
    setLoadingComments(true);
    const c = await base44.entities.ForumComment.filter({ post_id: post.id }, 'created_date', 200);
    setComments(c);
    setLoadingComments(false);
  }

  async function handleVoteComment(comment, dir) {
    if (!user) return;
    const key = `${user.email}:${dir}`;
    const otherKey = `${user.email}:${dir === 'up' ? 'down' : 'up'}`;
    const voted_by = comment.voted_by || [];
    const alreadyVoted = voted_by.includes(key);
    const hadOther = voted_by.includes(otherKey);
    const newVotedBy = voted_by.filter(v => !v.startsWith(user.email + ':')).concat(alreadyVoted ? [] : [key]);
    const delta = alreadyVoted ? -1 : 1;
    await base44.entities.ForumComment.update(comment.id, {
      voted_by: newVotedBy,
      upvotes: (comment.upvotes || 0) + (dir === 'up' ? delta : hadOther ? -1 : 0),
      downvotes: (comment.downvotes || 0) + (dir === 'down' ? delta : hadOther ? -1 : 0),
    });
    loadComments();
  }

  async function postComment() {
    if (!commentText.trim() || !user) return;
    setPosting(true);
    await base44.entities.ForumComment.create({
      post_id: post.id, parent_id: null,
      content: commentText.trim(),
      author_email: user.email,
      author_username: userProfile?.username || user.full_name || user.email.split('@')[0],
      upvotes: 0, downvotes: 0, voted_by: [],
    });
    await base44.entities.ForumPost.update(post.id, { comment_count: (post.comment_count || 0) + 1 });
    setCommentText('');
    setPosting(false);
    loadComments();
  }

  const topLevelComments = comments.filter(c => !c.parent_id);
  const score = (post.upvotes || 0) - (post.downvotes || 0);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col" style={{ background: 'var(--bg-primary)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Top bar with back button */}
      <div className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--lx-border)' }}>
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--lx-accent)' }}>
          <ArrowLeft size={18} /> Back
        </button>
        <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text-muted)' }}>Forums</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5">
          {/* Post header */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="font-bold" style={{ color: 'var(--lx-accent)' }}>u/{post.author_username}</span>
              <span>·</span>
              <span>{new Date(post.created_date).toLocaleDateString()}</span>
            </div>
            <h1 className="font-display text-xl font-bold mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>{post.title}</h1>
            <div className="prose text-sm mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>
            {post.image_url && (
              <img src={post.image_url} alt="post" className="rounded-lg w-full max-h-96 object-cover mb-3" />
            )}
            {(post.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded text-xs"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--lx-border)' }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 py-2 border-y" style={{ borderColor: 'var(--lx-border)' }}>
              <VoteButtons item={post} user={user} onVote={(_, dir) => onVotePost(post, dir)} />
              <span className="text-xs font-bold" style={{ color: score > 0 ? 'var(--lx-accent)' : score < 0 ? '#f87171' : 'var(--text-muted)' }}>
                {score} points
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                <MessageCircle size={13} /> {post.comment_count || 0} comments
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="mb-4">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              Comments ({topLevelComments.length})
            </h3>
            {loadingComments ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading comments...</p>
            ) : topLevelComments.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first!</p>
            ) : (
              topLevelComments.map(c => (
                <CommentItem key={c.id} comment={c} user={user} allComments={comments}
                  onVoteComment={handleVoteComment} onReply={loadComments} />
              ))
            )}
          </div>

          {/* Bottom spacing so comment input doesn't cover last comment */}
          <div className="h-24" />
        </div>
      </div>

      {/* Fixed comment input at bottom */}
      <div className="flex-shrink-0 border-t px-4 py-3" style={{ borderColor: 'var(--lx-border)', background: 'var(--bg-secondary)', paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))' }}>
        {user ? (
          <div className="flex gap-2 max-w-2xl mx-auto">
            <input
              className="lx-input text-sm flex-1"
              placeholder="Add a comment..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && postComment()}
            />
            <button onClick={postComment} disabled={posting || !commentText.trim()} className="lx-btn-primary px-4 flex-shrink-0">
              <Send size={14} />
            </button>
          </div>
        ) : (
          <p className="text-center text-sm max-w-2xl mx-auto" style={{ color: 'var(--text-muted)' }}>
            <a href="/login" style={{ color: 'var(--lx-accent)' }}>Sign in</a> to comment
          </p>
        )}
      </div>
    </div>
  );
}