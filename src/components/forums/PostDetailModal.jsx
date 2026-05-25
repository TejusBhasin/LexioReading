import React, { useState, useEffect } from 'react';
import { X, ArrowUp, ArrowDown, MessageCircle, Send, CornerDownRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

function VoteButtons({ item, user, onVote, size = 'normal' }) {
  const myVote = user ? (item.voted_by || []).find(v => v.startsWith(user.email + ':')) : null;
  const voted = myVote ? myVote.split(':')[1] : null;
  const s = size === 'small' ? 13 : 16;
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onVote(item, 'up')} className="flex items-center gap-0.5 px-1.5 py-1 rounded transition-all hover:opacity-80"
        style={{ color: voted === 'up' ? 'var(--lx-accent)' : 'var(--text-muted)', background: voted === 'up' ? 'var(--bg-elevated)' : 'transparent' }}>
        <ArrowUp size={s} />
        <span className="text-xs font-bold">{item.upvotes || 0}</span>
      </button>
      <button onClick={() => onVote(item, 'down')} className="flex items-center gap-0.5 px-1.5 py-1 rounded transition-all hover:opacity-80"
        style={{ color: voted === 'down' ? '#f87171' : 'var(--text-muted)', background: voted === 'down' ? 'rgba(248,113,113,0.1)' : 'transparent' }}>
        <ArrowDown size={s} />
        <span className="text-xs font-bold">{item.downvotes || 0}</span>
      </button>
    </div>
  );
}

function CommentItem({ comment, user, allComments, onVoteComment, onReply, depth = 0 }) {
  const replies = allComments.filter(c => c.parent_id === comment.id);
  const [replying, setReplying] = useState(false);
  return (
    <div style={{ marginLeft: depth > 0 ? `${Math.min(depth, 3) * 20}px` : '0' }}>
      <div className="py-3" style={{ borderBottom: depth === 0 ? '1px solid var(--lx-border)' : 'none' }}>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold" style={{ color: 'var(--lx-accent)' }}>u/{comment.author_username}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(comment.created_date).toLocaleDateString()}</span>
        </div>
        <p className="text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{comment.content}</p>
        <div className="flex items-center gap-3">
          <VoteButtons item={comment} user={user} onVote={onVoteComment} size="small" />
          {user && depth < 3 && (
            <button onClick={() => setReplying(r => !r)} className="flex items-center gap-1 text-xs transition-all"
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
      <input className="lx-input text-sm flex-1" placeholder="Write a reply..." value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()} />
      <button onClick={submit} disabled={loading || !text.trim()} className="lx-btn-primary px-3 py-1.5 text-sm">
        <Send size={13} />
      </button>
    </div>
  );
}

export default function PostDetailModal({ post, user, userProfile, onClose, onVotePost }) {
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
    const otherDelta = hadOther ? -1 : 0;
    await base44.entities.ForumComment.update(comment.id, {
      voted_by: newVotedBy,
      upvotes: (comment.upvotes || 0) + (dir === 'up' ? delta : 0) + (dir === 'down' && hadOther ? otherDelta : 0),
      downvotes: (comment.downvotes || 0) + (dir === 'down' ? delta : 0) + (dir === 'up' && hadOther ? otherDelta : 0),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b" style={{ borderColor: 'var(--lx-border)' }}>
          <div className="flex-1 pr-4">
            <h2 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{post.title}</h2>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span style={{ color: 'var(--lx-accent)' }}>u/{post.author_username}</span>
              <span>·</span>
              <span>{new Date(post.created_date).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={onClose}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Post content */}
          <div className="prose text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
          {post.image_url && (
            <img src={post.image_url} alt="post" className="rounded-lg max-h-80 object-cover mb-4 w-full" />
          )}
          {(post.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {post.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--lx-border)' }}>#{t}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3 mb-6">
            <VoteButtons item={post} user={user} onVote={(_, dir) => onVotePost(post, dir)} />
            <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <MessageCircle size={13} /> {post.comment_count || 0} comments
            </span>
          </div>

          {/* Comments */}
          <div className="border-t pt-4" style={{ borderColor: 'var(--lx-border)' }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Comments</h3>
            {loadingComments ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</p>
            ) : topLevelComments.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No comments yet. Be the first!</p>
            ) : (
              topLevelComments.map(c => (
                <CommentItem key={c.id} comment={c} user={user} allComments={comments}
                  onVoteComment={handleVoteComment} onReply={loadComments} />
              ))
            )}
          </div>
        </div>

        {/* Comment input */}
        {user ? (
          <div className="p-4 border-t flex gap-2" style={{ borderColor: 'var(--lx-border)' }}>
            <input className="lx-input text-sm flex-1" placeholder="Add a comment..." value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && postComment()} />
            <button onClick={postComment} disabled={posting || !commentText.trim()} className="lx-btn-primary px-4">
              <Send size={14} />
            </button>
          </div>
        ) : (
          <div className="p-4 border-t text-center text-sm" style={{ borderColor: 'var(--lx-border)', color: 'var(--text-muted)' }}>
            <a href="/login" style={{ color: 'var(--lx-accent)' }}>Sign in</a> to comment
          </div>
        )}
      </div>
    </div>
  );
}