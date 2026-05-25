import React, { useState } from 'react';
import { X, Image, Tag, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function NewPostModal({ user, userProfile, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function addTag(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const t = tagInput.trim().toLowerCase().replace(/^#/, '');
      if (t && !tags.includes(t) && tags.length < 5) {
        setTags(prev => [...prev, t]);
      }
      setTagInput('');
    }
  }

  async function submit() {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    let image_url = null;
    if (imageFile) {
      setUploading(true);
      const res = await base44.integrations.Core.UploadFile({ file: imageFile });
      image_url = res.file_url;
      setUploading(false);
    }
    await base44.entities.ForumPost.create({
      title: title.trim(),
      content: content.trim(),
      image_url,
      author_email: user.email,
      author_username: userProfile?.username || user.full_name || user.email.split('@')[0],
      tags,
      upvotes: 0,
      downvotes: 0,
      voted_by: [],
      comment_count: 0,
    });
    setSubmitting(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="w-full max-w-2xl rounded-lg p-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--lx-border)' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text-primary)' }}>New Post</h2>
          <button onClick={onClose}><X size={20} style={{ color: 'var(--text-muted)' }} /></button>
        </div>

        <div className="space-y-4">
          <input
            className="lx-input"
            placeholder="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <textarea
            className="lx-input resize-none"
            placeholder="What's on your mind? (markdown supported)"
            rows={5}
            value={content}
            onChange={e => setContent(e.target.value)}
          />

          {/* Tags */}
          <div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(t => (
                <span key={t} className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                  style={{ background: 'var(--bg-elevated)', color: 'var(--lx-accent)', border: '1px solid var(--lx-border)' }}>
                  #{t}
                  <button onClick={() => setTags(prev => prev.filter(x => x !== t))}><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="relative">
              <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="lx-input pl-8 text-sm"
                placeholder="Add tags (press Enter), e.g. fantasy, sci-fi"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
              />
            </div>
          </div>

          {/* Image */}
          <div>
            {imagePreview ? (
              <div className="relative inline-block">
                <img src={imagePreview} alt="preview" className="max-h-48 rounded-lg object-cover" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute top-1 right-1 p-1 rounded-full" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <X size={12} style={{ color: 'white' }} />
                </button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-sm lx-btn-ghost w-fit">
                <Image size={14} /> Attach Image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={onClose} className="lx-btn-ghost">Cancel</button>
            <button onClick={submit} disabled={submitting || !title.trim() || !content.trim()} className="lx-btn-primary">
              {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}