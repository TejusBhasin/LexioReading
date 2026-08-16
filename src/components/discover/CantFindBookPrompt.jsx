import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookPlus, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const STATUS_OPTIONS = [
  { value: 'want_to_read', label: 'Want to Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'finished', label: 'Finished' },
];

export default function CantFindBookPrompt({ onAdded }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('');
  const [status, setStatus] = useState('want_to_read');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!title.trim() || !author.trim()) return;
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    try {
      const bookId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await base44.entities.UserLibrary.create({
        user_email: user.email,
        book_id: bookId,
        book_title: title.trim(),
        book_author: author.trim(),
        book_cover: '',
        page_count: pages ? Number(pages) : null,
        status,
        date_added: new Date().toISOString(),
      });
      setDone(true);
      setTitle(''); setAuthor(''); setPages('');
      setTimeout(() => { setDone(false); setOpen(false); }, 1500);
      if (onAdded) onAdded(bookId);
    } catch (e) {}
    setSaving(false);
  }

  if (!open) {
    return (
      <div className="mt-8 text-center">
        <button onClick={() => setOpen(true)} className="text-sm transition-colors hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}>
          Can't find the book you're looking for?
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="lx-card p-5 max-w-md mx-auto text-left">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BookPlus size={16} style={{ color: 'var(--lx-accent)' }} /> Add a book manually
          </h3>
          <button onClick={() => setOpen(false)} className="transition-opacity hover:opacity-60">
            <X size={16} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2" style={{ background: 'var(--lx-accent)' }}>
              <Check size={20} style={{ color: 'var(--bg-primary)' }} />
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Added to your library!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Title</label>
              <input className="lx-input text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Book title" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Author</label>
              <input className="lx-input text-sm" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Author name" />
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--text-muted)' }}>Number of pages</label>
              <input type="number" min="0" className="lx-input text-sm" value={pages} onChange={e => setPages(e.target.value)} placeholder="e.g. 320" />
            </div>
            <div>
              <label className="text-xs mb-2 block" style={{ color: 'var(--text-muted)' }}>Add to list</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setStatus(opt.value)}
                    className="text-xs px-3 py-1.5 rounded font-medium transition-all"
                    style={{
                      background: status === opt.value ? 'var(--lx-accent)' : 'var(--bg-elevated)',
                      color: status === opt.value ? 'var(--bg-primary)' : 'var(--text-secondary)',
                      border: `1px solid ${status === opt.value ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={submit} disabled={!title.trim() || !author.trim() || saving} className="lx-btn-primary w-full justify-center text-sm">
              {saving ? 'Adding...' : 'Add to My Library'}
            </button>
            <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
              Manual entries can be tracked on your lists but can't be reviewed or discussed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}