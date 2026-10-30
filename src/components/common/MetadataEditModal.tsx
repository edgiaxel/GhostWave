import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MetadataEditService } from '../../services/health/MetadataEditService';

export const MetadataEditModal: React.FC = () => {
  const { editTrackModal, setEditTrackModal, updateTrackMetadata } = useApp();

  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    genre: '',
    year: '',
    trackNumber: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editTrackModal) {
      setFormData({
        title: editTrackModal.title || '',
        artist: editTrackModal.artist || '',
        album: editTrackModal.album || '',
        genre: editTrackModal.genre ? editTrackModal.genre.join(', ') : '',
        year: editTrackModal.year ? String(editTrackModal.year) : '',
        trackNumber: editTrackModal.trackNumber ? String(editTrackModal.trackNumber) : '',
      });
      setErrors({});
    }
  }, [editTrackModal]);

  if (!editTrackModal) return null;

  const handleFieldChange = (field: string, value: string) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Live validation
    const validation = MetadataEditService.validate({
      title: updated.title,
      artist: updated.artist,
      album: updated.album,
      year: updated.year ? Number(updated.year) : undefined,
      trackNumber: updated.trackNumber ? Number(updated.trackNumber) : undefined,
    });
    setErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const updates = {
      title: formData.title.trim(),
      artist: formData.artist.trim(),
      album: formData.album.trim(),
      genre: formData.genre
        ? formData.genre.split(',').map((g) => g.trim()).filter(Boolean)
        : [],
      year: formData.year ? parseInt(formData.year, 10) : undefined,
      trackNumber: formData.trackNumber ? parseInt(formData.trackNumber, 10) : undefined,
    };

    const result = await updateTrackMetadata(editTrackModal.id, updates);
    setIsSubmitting(false);

    if (result.success) {
      setEditTrackModal(null);
    } else if (result.error) {
      setErrors({ form: result.error });
    }
  };

  // Preview differences
  const hasChanges =
    formData.title.trim() !== editTrackModal.title ||
    formData.artist.trim() !== editTrackModal.artist ||
    formData.album.trim() !== editTrackModal.album ||
    (formData.year ? parseInt(formData.year, 10) : undefined) !== editTrackModal.year ||
    (formData.trackNumber ? parseInt(formData.trackNumber, 10) : undefined) !== editTrackModal.trackNumber;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-meta-title"
      onClick={() => setEditTrackModal(null)}
    >
      <div
        className="w-full max-w-lg bg-surface-container-high border border-outline-variant/30 rounded-2xl shadow-2xl p-6 flex flex-col gap-5 text-on-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-2xl">edit_note</span>
            <div>
              <h2 id="edit-meta-title" className="text-base font-bold text-on-surface">
                Edit Audio Metadata
              </h2>
              <p className="text-xs text-on-surface-variant truncate max-w-sm">
                {editTrackModal.fileName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditTrackModal(null)}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {errors.form && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              <span>{errors.form}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Title */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label htmlFor="meta-title" className="text-xs font-semibold text-on-surface-variant">
                Track Title <span className="text-primary">*</span>
              </label>
              <input
                id="meta-title"
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className={`bg-surface-container border rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none transition-colors ${
                  errors.title ? 'border-error focus:border-error' : 'border-outline-variant/40 focus:border-primary'
                }`}
              />
              {errors.title && <span className="text-[11px] text-error font-mono">{errors.title}</span>}
            </div>

            {/* Artist */}
            <div className="flex flex-col gap-1">
              <label htmlFor="meta-artist" className="text-xs font-semibold text-on-surface-variant">
                Artist <span className="text-primary">*</span>
              </label>
              <input
                id="meta-artist"
                type="text"
                required
                value={formData.artist}
                onChange={(e) => handleFieldChange('artist', e.target.value)}
                className={`bg-surface-container border rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none transition-colors ${
                  errors.artist ? 'border-error focus:border-error' : 'border-outline-variant/40 focus:border-primary'
                }`}
              />
              {errors.artist && <span className="text-[11px] text-error font-mono">{errors.artist}</span>}
            </div>

            {/* Album */}
            <div className="flex flex-col gap-1">
              <label htmlFor="meta-album" className="text-xs font-semibold text-on-surface-variant">
                Album
              </label>
              <input
                id="meta-album"
                type="text"
                value={formData.album}
                onChange={(e) => handleFieldChange('album', e.target.value)}
                className="bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Genre */}
            <div className="flex flex-col gap-1">
              <label htmlFor="meta-genre" className="text-xs font-semibold text-on-surface-variant">
                Genre <span className="text-outline font-normal">(comma-separated)</span>
              </label>
              <input
                id="meta-genre"
                type="text"
                value={formData.genre}
                onChange={(e) => handleFieldChange('genre', e.target.value)}
                placeholder="Synthwave, Darkwave"
                className="bg-surface-container border border-outline-variant/40 rounded-xl px-3.5 py-2 text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Year & Track Number */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="meta-year" className="text-xs font-semibold text-on-surface-variant">
                  Year
                </label>
                <input
                  id="meta-year"
                  type="number"
                  placeholder="2026"
                  value={formData.year}
                  onChange={(e) => handleFieldChange('year', e.target.value)}
                  className={`bg-surface-container border rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none transition-colors ${
                    errors.year ? 'border-error focus:border-error' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label htmlFor="meta-trackno" className="text-xs font-semibold text-on-surface-variant">
                  Track #
                </label>
                <input
                  id="meta-trackno"
                  type="number"
                  placeholder="1"
                  value={formData.trackNumber}
                  onChange={(e) => handleFieldChange('trackNumber', e.target.value)}
                  className={`bg-surface-container border rounded-xl px-3 py-2 text-xs text-on-surface focus:outline-none transition-colors ${
                    errors.trackNumber ? 'border-error focus:border-error' : 'border-outline-variant/40 focus:border-primary'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Change Preview */}
          {hasChanges && (
            <div className="p-3 bg-surface-container rounded-xl border border-primary/20 flex flex-col gap-1 text-[11px]">
              <span className="font-semibold text-primary uppercase tracking-wider text-[10px]">
                Pending Diff Preview
              </span>
              {formData.title.trim() !== editTrackModal.title && (
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-outline">Title:</span>
                  <span className="line-through text-error">{editTrackModal.title}</span>
                  <span className="text-secondary">&rarr; {formData.title.trim()}</span>
                </div>
              )}
              {formData.artist.trim() !== editTrackModal.artist && (
                <div className="flex items-center gap-1.5 font-mono">
                  <span className="text-outline">Artist:</span>
                  <span className="line-through text-error">{editTrackModal.artist}</span>
                  <span className="text-secondary">&rarr; {formData.artist.trim()}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline-variant/20">
            <button
              type="button"
              onClick={() => setEditTrackModal(null)}
              className="px-4 py-2 text-xs font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).length > 0 || !hasChanges}
              className="px-5 py-2 bg-primary text-on-primary font-semibold text-xs rounded-lg hover:opacity-90 disabled:opacity-40 transition-colors shadow-sm"
            >
              Save Metadata
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
