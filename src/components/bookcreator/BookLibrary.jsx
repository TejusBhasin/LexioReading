import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, Clock, FileText, Loader2, Library } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BookLibrary({ user, onViewBook, onBack }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { if (user?.email) load(); }, [user]);

  async function load() {
    setLoading(true);
    try {
      const list = await base44.entities.CreatedBook.filter({ user_email: user.email }, '-created_date', 50);
      setBooks(list);
    } catch (e) {}
    setLoading(false);
  }

  async function openBook(book) {
    setOpeningId(book.id);
    try {
      const res = await fetch(book.book_file_url);
      const data = await res.json();
      onViewBook(data);
    } catch (e) {}
    setOpeningId(null);
  }

  async function deleteBook(book) {
    if (!confirm(`Delete "${book.title}"? This cannot be undone.`)) return;
    setDeletingId(book.id);
    try {
      await base44.entities.CreatedBook.delete(book.id);
      setBooks(prev => prev.filter(b => b.id !== book.id));
    } catch (e) {}
    setDeletingId(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--lx-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8">
      <div className="flex items-center gap-2 mb-5">
        <Library size={20} style={{ color: 'var(--lx-accent)' }} />
        <h1 className="font-display font-bold text-lg" style={{ color: 'var(--text-primary)' }}>My Books</h1>
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>{books.length} {books.length === 1 ? 'book' : 'books'}</span>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No books yet</p>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Books you create will be saved here for easy re-downloading.</p>
          <button onClick={onBack} className="lx-btn-primary text-sm">Create Your First Book</button>
        </div>
      ) : (
        <div className="space-y-3">
          {books.map(book => {
            const readingTime = Math.round((book.word_count || 0) / 250);
            return (
              <div key={book.id} className="lx-card p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--bg-elevated)' }}>
                  <BookOpen size={18} style={{ color: 'var(--lx-accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{book.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>by {book.author}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
                    {book.genre && <span>{book.genre}</span>}
                    <span>{book.chapter_count} chapters</span>
                    <span>~{book.page_count} pages</span>
                    <span className="flex items-center gap-1"><Clock size={10} /> {readingTime}m read</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openBook(book)} disabled={openingId === book.id}
                    className="p-2 rounded transition-all" style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)' }} title="View & Download">
                    {openingId === book.id ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  </button>
                  <button onClick={() => deleteBook(book)} disabled={deletingId === book.id}
                    className="p-2 rounded transition-all" style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171' }} title="Delete">
                    {deletingId === book.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}