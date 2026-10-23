import React from 'react';
import MusicCard from './MusicCard';

export default function MusicGrid({ tracks, onSave, savedIds }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
      {tracks.map((t, i) => (
        <MusicCard
          key={t.audiodb_id || i}
          track={t}
          onSave={onSave}
          isSaved={savedIds.includes(`audiodb-${t.audiodb_id}`)}
        />
      ))}
    </div>
  );
}