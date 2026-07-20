import React, { useState } from 'react';
import { Download, FileText, BookOpen, RotateCcw, ChevronDown, ChevronUp, List, ArrowLeft } from 'lucide-react';
import { downloadPdf, countWords } from '@/lib/bookCreator';
import { downloadEpub } from '@/lib/epubBuilder';

export default function BookResult({ book, onStartOver, onBackToLibrary }) {
  const [expandedChapter, setExpandedChapter] = useState(0);
  const [includeToc, setIncludeToc] = useState(false);
  const wordCount = countWords(book.chapters);
  const estPages = Math.round(wordCount / 280);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--lx-accent)' }}>
          <BookOpen size={28} style={{ color: 'var(--bg-primary)' }} />
        </div>
        <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{book.title}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>by {book.author}</p>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>{book.chapters.length} chapters</span>
          <span>·</span>
          <span>{wordCount.toLocaleString()} words</span>
          <span>·</span>
          <span>~{estPages} pages</span>
        </div>
      </div>

      {/* TOC toggle */}
      <div className="mb-4 flex items-center justify-center">
        <button onClick={() => setIncludeToc(v => !v)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
          style={{
            background: includeToc ? 'rgba(245,214,35,0.1)' : 'var(--bg-card)',
            border: `1px solid ${includeToc ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            color: includeToc ? 'var(--lx-accent)' : 'var(--text-secondary)',
          }}>
          <List size={15} />
          <span>{includeToc ? 'Table of Contents: Included' : 'Table of Contents: Off'}</span>
        </button>
      </div>

      {/* Download buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button onClick={() => downloadPdf(book.title, book.author, book.chapters, includeToc).catch(() => {})}
          className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)', color: 'var(--lx-accent)' }}>
          <FileText size={24} />
          <span className="text-sm font-bold">Download PDF</span>
        </button>
        <button onClick={() => downloadEpub(book.title, book.author, book.chapters, includeToc).catch(() => {})}
          className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-accent)', color: 'var(--lx-accent)' }}>
          <Download size={24} />
          <span className="text-sm font-bold">Download EPUB</span>
        </button>
      </div>

      {/* Preview */}
      <div className="mb-6">
        <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Preview</h3>
        <div className="space-y-2">
          {book.chapters.map((ch, i) => {
            const expanded = expandedChapter === i;
            return (
              <div key={i} className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
                <button onClick={() => setExpandedChapter(expanded ? -1 : i)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  style={{ color: 'var(--text-primary)' }}>
                  <span className="text-sm font-medium">Chapter {i + 1}: {ch.title}</span>
                  {expanded ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </button>
                {expanded && (
                  <div className="px-4 pb-4 text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)', fontFamily: 'serif', lineHeight: 1.7 }}>
                    {ch.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {onBackToLibrary && (
          <button onClick={onBackToLibrary}
            className="lx-btn-ghost w-full justify-center text-sm">
            <ArrowLeft size={14} /> Back to My Books
          </button>
        )}
        <button onClick={onStartOver}
          className="lx-btn-ghost w-full justify-center text-sm">
          <RotateCcw size={14} /> Create Another Book
        </button>
      </div>
    </div>
  );
}