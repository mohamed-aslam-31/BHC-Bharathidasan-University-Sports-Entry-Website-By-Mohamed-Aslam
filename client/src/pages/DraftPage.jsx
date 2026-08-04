import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDrafts, deleteDraft, clearAllDrafts, completionPercent, draftFileCount } from '../utils/drafts';
import { deleteDraftFiles } from '../api';
import { FileText, Trash2, ArrowRight, Clock, AlertTriangle, BookOpen, Paperclip } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function ProgressBar({ pct }) {
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-1.5 rounded-full transition-all ${
          pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400'
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function CircleCheckbox({ checked, onChange, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onChange}
      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-colors flex items-center justify-center
        ${checked
          ? 'bg-blue-600 border-blue-600'
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }`}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

export default function DraftPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts]                   = useState([]);
  const [selected, setSelected]               = useState(new Set());
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [confirmDelete, setConfirmDelete]     = useState(null);   // single draft id
  const [confirmBulk, setConfirmBulk]         = useState(false);  // bulk delete confirm

  useEffect(() => {
    setDrafts(getDrafts());
  }, []);

  /* ── selection helpers ─────────────────────────────── */
  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === drafts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(drafts.map((d) => d.id)));
    }
  };

  const allSelected  = drafts.length > 0 && selected.size === drafts.length;
  const someSelected = selected.size > 0;

  /* ── delete helpers ────────────────────────────────── */
  const deleteDraftById = (id) => {
    const draft = drafts.find((d) => d.id === id);
    if (draft?.serverFiles) {
      const paths = Object.values(draft.serverFiles).filter(Boolean);
      if (paths.length) deleteDraftFiles(paths).catch(() => {});
    }
    deleteDraft(id);
  };

  const handleDelete = (id) => {
    deleteDraftById(id);
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setDrafts(getDrafts());
    setConfirmDelete(null);
  };

  const handleBulkDelete = () => {
    for (const id of selected) deleteDraftById(id);
    setDrafts(getDrafts());
    setSelected(new Set());
    setConfirmBulk(false);
  };

  const handleClearAll = () => {
    for (const draft of drafts) {
      if (draft.serverFiles) {
        const paths = Object.values(draft.serverFiles).filter(Boolean);
        if (paths.length) deleteDraftFiles(paths).catch(() => {});
      }
    }
    clearAllDrafts();
    setDrafts([]);
    setSelected(new Set());
    setConfirmClearAll(false);
  };

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Drafts
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Incomplete student forms saved locally on this device
          </p>
        </div>
        {drafts.length > 0 && (
          <div className="flex items-center gap-2">
            {someSelected && (
              <button
                type="button"
                onClick={() => setConfirmBulk(true)}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete selected ({selected.size})
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmClearAll(true)}
              className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {drafts.length === 0 && (
        <div className="card p-12 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
            <FileText className="w-7 h-7 text-gray-400" />
          </div>
          <div>
            <p className="font-medium text-gray-700 dark:text-gray-300">No drafts saved</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Start filling in a student form and save it as a draft to continue later.
            </p>
          </div>
          <button
            onClick={() => navigate('/students/new')}
            className="btn-primary text-sm px-5"
          >
            Add New Student
          </button>
        </div>
      )}

      {/* Select-all row */}
      {drafts.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <CircleCheckbox
            checked={allSelected}
            onChange={toggleSelectAll}
            title={allSelected ? 'Deselect all' : 'Select all'}
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {someSelected
              ? `${selected.size} of ${drafts.length} selected`
              : 'Select all'}
          </span>
        </div>
      )}

      {/* Draft list */}
      {drafts.length > 0 && (
        <div className="space-y-3">
          {drafts.map((draft) => {
            const pct      = completionPercent(draft.form);
            const name     = draft.form?.studentName?.trim() || 'Untitled Student';
            const year     = draft.form?.year || '—';
            const game     = draft.form?.nameOfTheGame || '—';
            const roll     = draft.form?.rollNo || '—';
            const nDocs    = draftFileCount(draft);
            const isChecked = selected.has(draft.id);

            return (
              <div
                key={draft.id}
                className={`card p-5 flex flex-col gap-3 transition-colors
                  ${isChecked
                    ? 'border-blue-400 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-900/10'
                    : 'hover:border-blue-200 dark:hover:border-blue-700'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Circle checkbox + name */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="pt-0.5">
                      <CircleCheckbox
                        checked={isChecked}
                        onChange={() => toggleSelect(draft.id)}
                        title={isChecked ? 'Deselect' : 'Select'}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                        {year !== '—' && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{year}</span>
                        )}
                        {game !== '—' && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">{game}</span>
                        )}
                        {roll !== '—' && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">Roll: {roll}</span>
                        )}
                        {nDocs > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            <Paperclip className="w-3 h-3" />
                            {nDocs} doc{nDocs !== 1 ? 's' : ''} saved
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(draft.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/students/new', { state: { draftId: draft.id } })}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                    >
                      Resume
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {pct}% complete
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(draft.updatedAt)}
                    </span>
                  </div>
                  <ProgressBar pct={pct} />
                </div>

                {/* Single delete confirm inline */}
                {confirmDelete === draft.id && (
                  <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      Delete this draft? This cannot be undone.
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(draft.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bulk delete confirm modal */}
      {confirmBulk && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Delete {selected.size} draft{selected.size !== 1 ? 's' : ''}?
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  The selected draft{selected.size !== 1 ? 's' : ''} and any uploaded documents will be permanently deleted. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmBulk(false)}
                className="btn-secondary text-sm px-5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear all confirm modal */}
      {confirmClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Clear all drafts?</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  All {drafts.length} saved draft{drafts.length !== 1 ? 's' : ''} will be permanently deleted. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                className="btn-secondary text-sm px-5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear all
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
