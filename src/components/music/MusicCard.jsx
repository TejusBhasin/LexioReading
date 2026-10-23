import React from 'react';
import { Plus, BookmarkCheck, Music as MusicIcon } from 'lucide-react';

export default function MusicCard({ track, onSave, isSaved }) {
  const title = track.title;

  return (
    <div className="lx-card group flex flex-col overflow-hidden" style={{ minWidth: 0 }}>
      <div className="relative overflow-hidden w-full" style={{ paddingBottom: '100%' }}>
        {track.cover_image ? (
          <img
            src={track.cover_image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-center p-3"
            style={{ background: 'var(--bg-elevated)' }}
          >
            <span className="font-display text-sm font-bold leading-tight" style={{ color: 'var(--lx-accent)' }}>
              {title}
            </span>
          </div>
        )}
        {/* Purple music chip to indicate a track */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ background: '#7c3aed', boxShadow: '0 2px 10px rgba(0,0,0,0.55)' }}
          >
            <MusicIcon size={20} fill="white" style={{ color: 'white' }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-2.5 gap-1 min-h-0">
        <h3 className="font-bold text-xs leading-snug line-clamp-2" style={{ color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
          {track.artist}{track.album ? ` · ${track.album}` : ''}
        </p>

        {onSave && (
          <button
            onClick={(e) => { e.preventDefault(); onSave(track); }}
            className="mt-auto pt-2 flex items-center gap-1 text-xs font-semibold transition-all"
            style={{ color: isSaved ? 'var(--lx-accent)' : 'var(--text-muted)' }}
          >
            {isSaved ? <BookmarkCheck size={12} /> : <Plus size={12} />}
            {isSaved ? 'Saved' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}