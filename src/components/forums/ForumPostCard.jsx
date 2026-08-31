import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp, ArrowDown, MessageCircle, Image, Flag, Ban } from 'lucide-react';
import ReportContentModal from '@/components/safety/ReportContentModal';
import BlockUserModal from '@/components/safety/BlockUserModal';
import AuthorTag from '@/components/ui/AuthorTag';
import useVerifiedAuthors from '@/hooks/useVerifiedAuthors';

export default function ForumPostCard({ post, user, onVote, onClick }) {
  const [showReport, setShowReport] = useState(false);
  const [showBlock, setShowBlock] = useState(false);
  const myVote = user ? (post.voted_by || []).find(v => v.startsWith(user.email + ':')) : null;
  const voted = myVote ? myVote.split(':')[1] : null;
  const score = (post.upvotes || 0) - (post.downvotes || 0);
  const verifiedMap = useVerifiedAuthors();

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
            <AuthorTag email={post.author_email} username={post.author_username} verifiedMap={verifiedMap} prefix="u/" className="font-bold hover:underline" style={{ color: 'var(--lx-accent)' }} />
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
            {user && post.author_email !== user.email && (
              <>
                <button onClick={e => { e.stopPropagation(); setShowReport(true); }} className="flex items-center gap-0.5 hover:opacity-80" title="Report">
                  <Flag size={11} /> Report
                </button>
                <button onClick={e => { e.stopPropagation(); setShowBlock(true); }} className="flex items-center gap-0.5 hover:opacity-80" title="Block user">
                  <Ban size={11} /> Block
                </button>
              </>
            )}
          </div>
        </div>

        {/* Thumbnail */}
        {post.image_url && (
          <div className="flex-shrink-0 hidden sm:block">
            <img src={post.image_url} alt="thumb" className="w-20 h-16 object-cover rounded-lg" />
          </div>
        )}
      </div>
      {showReport && (
        <ReportContentModal
          contentType="forum_post"
          contentId={post.id}
          contentSnapshot={`${post.title}\n\n${post.content}`}
          reportedUserEmail={post.author_email}
          reportedUsername={post.author_username}
          onClose={() => setShowReport(false)}
        />
      )}
      {showBlock && (
        <BlockUserModal
          blockedEmail={post.author_email}
          blockedUsername={post.author_username}
          onClose={() => setShowBlock(false)}
        />
      )}
    </div>
  );
}