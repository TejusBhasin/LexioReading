import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowLeft, BookOpen, FileDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function mapStatus(exclusiveShelf) {
  if (exclusiveShelf === 'read') return 'finished';
  if (exclusiveShelf === 'currently-reading') return 'reading';
  return 'want_to_read';
}

function parseGoodreadsCSV(text, userEmail) {
  const rows = parseCSV(text.trim());
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  const idx = (name) => headers.indexOf(name);
  const I = {
    title: idx('Title'), author: idx('Author'), rating: idx('My Rating'),
    dateRead: idx('Date Read'), dateAdded: idx('Date Added'),
    shelf: idx('Exclusive Shelf'), shelves: idx('Bookshelves'),
    review: idx('My Review'), bookId: idx('Book Id'),
  };
  return rows.slice(1).filter(r => r.length > 3 && r[I.title]).map(r => {
    const get = (i) => (i >= 0 && r[i] ? r[i].trim() : '');
    const rating = parseInt(get(I.rating)) || null;
    const shelves = get(I.shelves).split(',').map(s => s.trim()).filter(Boolean);
    return {
      user_email: userEmail,
      book_id: get(I.bookId) || `gr-${Math.random().toString(36).slice(2)}`,
      book_title: get(I.title),
      book_author: get(I.author),
      book_cover: '',
      status: mapStatus(get(I.shelf)),
      rating: rating && rating > 0 ? rating : undefined,
      notes: get(I.review) || undefined,
      tags: shelves.length ? shelves : undefined,
      date_added: get(I.dateAdded) || new Date().toISOString().split('T')[0],
      date_finished: get(I.dateRead) || undefined,
    };
  });
}

function downloadCSV(filename, rows) {
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = rows.map(r => r.map(escape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  const [user, setUser] = useState(null);
  const [books, setBooks] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [errors, setErrors] = useState(0);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) return;
    setFileName(file.name);
    setDone(false);
    setImported(0);
    setErrors(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseGoodreadsCSV(e.target.result, user?.email || '');
      setBooks(parsed);
    };
    reader.readAsText(file);
  }

  async function doImport() {
    if (!books.length || !user) return;
    setImporting(true);
    let ok = 0, err = 0;
    for (let i = 0; i < books.length; i += 10) {
      const batch = books.slice(i, i + 10);
      await Promise.all(batch.map(async (book) => {
        try {
          await base44.entities.UserLibrary.create({ ...book, user_email: user.email });
          ok++;
        } catch { err++; }
      }));
      setImported(ok);
      setErrors(err);
    }
    setImporting(false);
    setDone(true);
  }

  async function exportLibrary() {
    if (!user) return;
    setExporting('library');
    const items = await base44.entities.UserLibrary.filter({ user_email: user.email }, '-created_date', 500);
    const statusMap = { finished: 'read', reading: 'currently-reading', want_to_read: 'to-read', dropped: 'dropped' };
    const headers = ['Title', 'Author', 'My Rating', 'Exclusive Shelf', 'Date Added', 'Date Finished', 'Bookshelves', 'My Review'];
    const rows = items.map(b => [b.book_title, b.book_author, b.rating || '', statusMap[b.status] || b.status, b.date_added || '', b.date_finished || '', (b.tags || []).join(', '), b.notes || '']);
    downloadCSV('lexio-library.csv', [headers, ...rows]);
    setExporting('');
  }

  async function exportLogs() {
    if (!user) return;
    setExporting('logs');
    const items = await base44.entities.ReadingLog.filter({ user_email: user.email }, '-created_date', 500);
    const headers = ['Book Title', 'Date', 'Pages Read', 'Minutes', 'Mood', 'Notes'];
    const rows = items.map(l => [l.book_title || '', l.log_date || l.created_date?.split('T')[0] || '', l.pages_read || '', l.minutes || '', l.mood || '', l.notes || '']);
    downloadCSV('lexio-reading-logs.csv', [headers, ...rows]);
    setExporting('');
  }

  async function exportQuotes() {
    if (!user) return;
    setExporting('quotes');
    const items = await base44.entities.BookQuote.filter({ user_email: user.email }, '-created_date', 500);
    const headers = ['Book Title', 'Author', 'Quote', 'Page Number', 'Chapter', 'Favorite'];
    const rows = items.map(q => [q.book_title || '', q.book_author || '', q.quote || '', q.page_number || '', q.chapter || '', q.is_favorite ? 'Yes' : 'No']);
    downloadCSV('lexio-quotes.csv', [headers, ...rows]);
    setExporting('');
  }

  async function exportReviews() {
    if (!user) return;
    setExporting('reviews');
    const items = await base44.entities.Review.filter({ user_email: user.email }, '-created_date', 500);
    const headers = ['Book Title', 'Author', 'Rating', 'Review', 'Date'];
    const rows = items.map(r => [r.book_title || '', r.book_author || '', r.rating || '', r.content || r.review || '', r.created_date?.split('T')[0] || '']);
    downloadCSV('lexio-reviews.csv', [headers, ...rows]);
    setExporting('');
  }

  const statusCount = (s) => books.filter(b => b.status === s).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <Link to="/library" className="flex items-center gap-2 text-sm mb-6 hover:opacity-80"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={15} /> Back to Library
      </Link>

      <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
        Import &amp; Export
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Import from Goodreads or export all your Lexio data as CSV files.
      </p>

      {/* Export Section */}
      <div className="rounded-xl p-5 mb-8" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <h2 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Export Your Data</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Download your Lexio data as CSV files — compatible with Goodreads and other apps.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'library', label: 'Library', desc: 'Books, status, ratings', fn: exportLibrary },
            { key: 'logs', label: 'Reading Logs', desc: 'Sessions, pages, moods', fn: exportLogs },
            { key: 'quotes', label: 'Quotes', desc: 'Saved highlights', fn: exportQuotes },
            { key: 'reviews', label: 'Reviews', desc: 'All your reviews', fn: exportReviews },
          ].map(({ key, label, desc, fn }) => (
            <button key={key} onClick={fn} disabled={exporting === key}
              className="flex items-start gap-3 p-3 rounded-lg text-left transition-all hover:opacity-80"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--lx-border)' }}>
              <FileDown size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--lx-accent)' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {exporting === key ? 'Downloading...' : label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Import Section */}
      <h2 className="font-bold text-base mb-4" style={{ color: 'var(--text-primary)' }}>Import from Goodreads</h2>

      <div className="rounded-xl p-5 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>How to export from Goodreads</h3>
        <ol className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <li className="flex gap-2"><span style={{ color: 'var(--lx-accent)' }}>1.</span> Go to <strong style={{ color: 'var(--text-primary)' }}>goodreads.com</strong> and sign in</li>
          <li className="flex gap-2"><span style={{ color: 'var(--lx-accent)' }}>2.</span> Click <strong style={{ color: 'var(--text-primary)' }}>My Books</strong> in the top nav</li>
          <li className="flex gap-2"><span style={{ color: 'var(--lx-accent)' }}>3.</span> Scroll to the bottom-left and click <strong style={{ color: 'var(--text-primary)' }}>Import and Export</strong></li>
          <li className="flex gap-2"><span style={{ color: 'var(--lx-accent)' }}>4.</span> Click <strong style={{ color: 'var(--text-primary)' }}>Export Library</strong> — Goodreads will email you the file</li>
          <li className="flex gap-2"><span style={{ color: 'var(--lx-accent)' }}>5.</span> Download and upload the <strong style={{ color: 'var(--text-primary)' }}>.csv</strong> file below</li>
        </ol>
      </div>

      {!books.length && !done && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => fileRef.current?.click()}
          className="rounded-xl flex flex-col items-center justify-center gap-3 py-14 cursor-pointer transition-all"
          style={{
            border: `2px dashed ${dragging ? 'var(--lx-accent)' : 'var(--lx-border)'}`,
            background: dragging ? 'var(--bg-elevated)' : 'var(--bg-card)',
          }}>
          <Upload size={32} style={{ color: dragging ? 'var(--lx-accent)' : 'var(--text-muted)' }} />
          <div className="text-center">
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Drop your Goodreads CSV here</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>or click to browse</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
        </div>
      )}

      {books.length > 0 && !done && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <div className="flex items-center gap-3 mb-4">
            <FileText size={18} style={{ color: 'var(--lx-accent)' }} />
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{fileName}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{books.length} books found</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Finished', count: statusCount('finished'), color: '#22c55e' },
              { label: 'Reading', count: statusCount('reading'), color: 'var(--lx-accent)' },
              { label: 'Want to Read', count: statusCount('want_to_read'), color: 'var(--text-muted)' },
            ].map(({ label, count, color }) => (
              <div key={label} className="text-center p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                <p className="text-xl font-bold" style={{ color }}>{count}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto mb-4">
            {books.slice(0, 8).map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b last:border-0"
                style={{ borderColor: 'var(--lx-border)' }}>
                <BookOpen size={14} style={{ color: 'var(--lx-accent)', flexShrink: 0 }} />
                <div className="min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{b.book_title}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{b.book_author}</p>
                </div>
                {b.rating && <span className="text-xs flex-shrink-0" style={{ color: 'var(--lx-accent)' }}>★ {b.rating}</span>}
              </div>
            ))}
            {books.length > 8 && (
              <p className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>+{books.length - 8} more books</p>
            )}
          </div>

          {importing && (
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                <span>Importing...</span><span>{imported} / {books.length}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--lx-border)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${(imported / books.length) * 100}%`, background: 'var(--lx-accent)' }} />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => { setBooks([]); setFileName(''); }} className="lx-btn-ghost flex-1 justify-center">Cancel</button>
            <button onClick={doImport} disabled={importing} className="lx-btn-primary flex-1 justify-center">
              {importing ? `Importing... (${imported}/${books.length})` : `Import ${books.length} Books`}
            </button>
          </div>
        </div>
      )}

      {done && (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
          <CheckCircle size={40} className="mx-auto mb-4" style={{ color: '#22c55e' }} />
          <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Import Complete!</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--lx-accent)' }}>{imported}</strong> books imported successfully
          </p>
          {errors > 0 && (
            <p className="text-xs mb-4" style={{ color: '#f87171' }}>
              <AlertCircle size={12} className="inline mr-1" />{errors} failed (duplicates or invalid entries)
            </p>
          )}
          <div className="flex gap-2 justify-center mt-5">
            <button onClick={() => { setBooks([]); setFileName(''); setDone(false); }} className="lx-btn-ghost">Import Another File</button>
            <Link to="/library" className="lx-btn-primary">View My Library</Link>
          </div>
        </div>
      )}
    </div>
  );
}