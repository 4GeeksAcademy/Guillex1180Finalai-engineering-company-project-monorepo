'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Note } from '@/lib/types';
import { fetchNotes, createNote, deleteNote } from '@/lib/api';

interface NotesPanelProps {
  recordId: string;
}

export default function NotesPanel({ recordId }: NotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchNotes(recordId);
      setNotes(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudieron cargar las notas. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }, [recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = useCallback(async () => {
    const content = newNote.trim();
    if (!content) return;
    setAddingNote(true);
    setActionError(null);
    try {
      const created = await createNote(recordId, content);
      setNotes((prev) => [...prev, created]);
      setNewNote('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo añadir la nota. Inténtalo de nuevo.');
    } finally {
      setAddingNote(false);
    }
  }, [recordId, newNote]);

  const handleDelete = useCallback(
    async (noteId: string) => {
      setDeletingNoteId(noteId);
      setActionError(null);
      try {
        await deleteNote(recordId, noteId);
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'No se pudo eliminar la nota. Inténtalo de nuevo.');
      } finally {
        setDeletingNoteId(null);
      }
    },
    [recordId],
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Notas internas</h3>
      {actionError && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}

      {/* Add note form */}
      <div className="mb-6">
        <label htmlFor="new-note" className="block text-sm font-medium text-gray-700 mb-1.5">
          Añadir nota
        </label>
        <div className="flex gap-2">
          <textarea
            id="new-note"
            rows={2}
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Escribe una nota después de la llamada o entrevista…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={!newNote.trim() || addingNote}
            className="self-end px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {addingNote ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Notes loading */}
      {loading && (
        <div className="text-center py-6">
          <div className="inline-block w-6 h-6 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" role="status" />
          <p className="text-gray-400 text-sm mt-2">Cargando notas…</p>
        </div>
      )}

      {!loading && loadError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-700">{loadError}</p>
          <button type="button" onClick={() => void load()} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Reintentar</button>
        </div>
      )}

      {/* Empty notes */}
      {!loading && !loadError && notes.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-400 text-sm">No hay notas todavía</p>
          <p className="text-gray-400 text-xs mt-1">Añade una nota después de cada entrevista o llamada</p>
        </div>
      )}

      {/* Notes list */}
      {!loading && !loadError && notes.length > 0 && (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex justify-between items-start gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(note.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <button
                onClick={() => handleDelete(note.id)}
                disabled={deletingNoteId === note.id}
                aria-label={`Eliminar nota: ${note.content.slice(0, 40)}`}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1"
                title="Eliminar nota"
              >
                {deletingNoteId === note.id ? <span className="text-xs">Eliminando…</span> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}