import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, X, FileText, Check, AlertCircle } from 'lucide-react';
import { Note } from './types';

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal / Form state for Create & Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch all notes (with optional search)
  const fetchNotes = async (searchQuery = '') => {
    setIsLoading(true);
    try {
      const url = searchQuery ? `/api/notes?search=${encodeURIComponent(searchQuery)}` : '/api/notes';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes(search);
  }, [search]);

  // Open modal for Creating a new note
  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Editing an existing note
  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setFormTitle(note.title);
    setFormContent(note.content);
    setFormError('');
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setFormTitle('');
    setFormContent('');
    setFormError('');
  };

  // Handle Form Submit (Create or Update)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() && !formContent.trim()) {
      setFormError('Please enter a title or note content.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingNote) {
        // UPDATE existing note
        const res = await fetch(`/api/notes/${editingNote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
          }),
        });
        if (!res.ok) throw new Error('Failed to update note');
        const updated = await res.json();
        setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      } else {
        // CREATE new note
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            content: formContent,
          }),
        });
        if (!res.ok) throw new Error('Failed to create note');
        const created = await res.json();
        setNotes((prev) => [created, ...prev]);
      }
      handleCloseModal();
    } catch (err) {
      console.error(err);
      setFormError('Failed to save note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setDeletingId(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete note');
    }
  };

  // Format date nicely
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 font-display">Notes</h1>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-slate-100/70 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Create Button */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Note</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {isLoading ? (
          // Skeleton loader
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs animate-pulse space-y-3"
              >
                <div className="h-5 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          // Empty state
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              {search ? 'No notes matching your search' : 'No notes yet'}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              {search
                ? `Couldn't find any notes matching "${search}". Try another keyword or clear the search.`
                : 'Get started by creating your very first note.'}
            </p>
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Your First Note</span>
              </button>
            )}
          </div>
        ) : (
          // Notes Grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2 leading-snug line-clamp-2">
                    {note.title}
                  </h3>
                  <p className="text-sm text-slate-600 whitespace-pre-line line-clamp-6 leading-relaxed mb-4">
                    {note.content || <span className="italic text-slate-400">No content</span>}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">{formatDate(note.updatedAt)}</span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(note)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit note"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingId(note.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">
                {editingNote ? 'Edit Note' : 'Create Note'}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Note Title..."
                  autoFocus
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Content
                </label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write your note content here..."
                  rows={6}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all resize-y"
                />
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingNote ? 'Save Changes' : 'Create Note'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">Delete Note</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this note? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
