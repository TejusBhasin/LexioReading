import React, { useState, useEffect } from 'react';
import { Loader2, GraduationCap, Users, Search, ChevronRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SchoolDetailModal from '@/components/admin/SchoolDetailModal';

export default function AllSchoolsView() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => { loadSchools(); }, []);

  async function loadSchools() {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('adminSchoolView', { action: 'list_schools' });
      setSchools(res.data?.schools || []);
    } catch (e) {}
    setLoading(false);
  }

  const filtered = schools.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.creator_email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap size={20} style={{ color: 'var(--lx-accent)' }} />
        <div>
          <h2 className="font-display text-lg font-bold" style={{ color: 'var(--text-primary)' }}>All Schools</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{schools.length} school(s) on Lexio</p>
        </div>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input className="lx-input text-sm pl-9" placeholder="Search by name or creator..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--lx-accent)' }} /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>No schools found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map(s => (
            <button key={s.id} onClick={() => setSelectedId(s.id)}
              className="w-full lx-card p-4 flex items-center gap-3 hover:border-[var(--lx-accent)] transition-colors text-left">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.theme_primary || 'var(--lx-accent)', color: '#000' }}>
                <GraduationCap size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{s.name}</p>
                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{s.creator_email}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Users size={12} /> {s.member_count}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedId && <SchoolDetailModal schoolId={selectedId} onClose={() => { setSelectedId(null); loadSchools(); }} />}
    </div>
  );
}