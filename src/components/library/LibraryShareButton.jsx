import React, { useState } from 'react';
import { Share2, Check, Link } from 'lucide-react';

export default function LibraryShareButton({ username, isPublic }) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    if (!username) return;
    const url = `${window.location.origin}/u/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  if (!username || !isPublic) return null;

  return (
    <button
      onClick={copyLink}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all"
      style={{
        background: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-card)',
        color: copied ? '#10b981' : 'var(--text-secondary)',
        border: `1px solid ${copied ? '#10b981' : 'var(--lx-border)'}`,
      }}
      title="Copy shareable link to your library"
    >
      {copied ? <Check size={13} /> : <Share2 size={13} />}
      {copied ? 'Copied!' : 'Share Library'}
    </button>
  );
}