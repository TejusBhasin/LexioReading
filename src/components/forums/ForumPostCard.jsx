import React from 'react';
import { ArrowUp, ArrowDown, MessageCircle, Image } from 'lucide-react';

export default function ForumPostCard({ post, user, onVote, onClick }) {
  const myVote = user ? (post.voted_by || []).find(v => v.startsWith(user.email + ':')) : null;
  const voted = myVote ? myVote.split(':')[1] : null;
  const score = (post.upvotes || 0) - (post.downvotes || 0);

  return (
    <div
      className="rounded-lg p-4 cursor-pointer transition-all hover:border-opacity-80"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Vote column */}
        <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onVote(post, 'up')}
            className="p-1 rounded transition-all hover:opacity-80"
            style={{ color: voted === 'up' ? 'var(--lx-accent)' : 'var(--text-muted)', background: voted === 'up' ? 'var(--bg-elevated)' : 'transparent' }}
          >
            <ArrowUp size={16} />
          </button>
          <span className="text-xs font-bold" style={{ color: score > 0 ? 'var(--lx-accent)' : score < 0 ? '#f87171' : 'var(--text-muted)' }}>
            {score}
          </span>
          <button
            onClick={() => onVote(post, 'down')}
            className="p-1 rounded transition-all hover:opacity-80"
            style={{ color: voted === 'down' ? '#f87171' : 'var(--text-muted)', background: voted === 'down' ? 'rgba(248,113,113,0.1)' : 'transparent' }}
          >
            <ArrowDown size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="font-bold" style={{ color: 'var(--lx-accent)' }}>u/{post.author_username}</span>
            <span>·</span>
            <span>{new Date(post.created_date).toLocaleDateString()}</span>
            {post.image_url && <><span>·</span><span className="flex items-center gap-0.5"><Image size={11} /> img</span></>}
          </div>
          <h3 className="font-bold text-base mb-1.5 line-clamp-2" style={{ color: 'var(--text-primary)' }}>{post.title}</h3>
          <p className="text-sm line-clamp-2 mb-2.5" style={{ color: 'var(--text-secondary)' }}>{post.content}</p>

          {(post.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {post.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded text-xs"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--lx-border)' }}>
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <MessageCircle size={13} /> {post.comment_count || 0} comments
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        {post.image_url && (
          <div className="flex-shrink-0 hidden sm:block">
            <img src={post.image_url} alt="thumb" className="w-20 h-16 object-cover rounded-lg" />
          </div>
        )}
      </div>
    </div>
  );
}