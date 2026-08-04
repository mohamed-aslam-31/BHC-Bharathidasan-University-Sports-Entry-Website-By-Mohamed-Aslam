import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import {
  getPendingStudents, approveStudent, rejectStudent,
  getSelfRegAccess, createSelfRegAccess, deleteSelfRegAccess, getOptions, addOption,
} from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CheckCircle, XCircle, Eye, Clock, RefreshCw,
  Plus, Trash2, ChevronDown, X, Link2,
} from 'lucide-react';

/* ── Tab button ─────────────────────────────────────────────────────────────── */
function TabButton({ active, onClick, children, count }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}>
      {children}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>{count}</span>
      )}
    </button>
  );
}

/* ── Combo with add support for access form ─────────────────────────────────── */
function SmallCombo({ value, onChange, options, placeholder, error, onAddOption }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref  = useRef(null);
  const sRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => { if (open) setTimeout(() => sRef.current?.focus(), 0); }, [open]);

  const filtered   = search ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;
  const trimmed    = search.trim();
  const exactMatch = options.some(o => o.toLowerCase() === trimmed.toLowerCase());
  const showAdd    = onAddOption && trimmed.length >= 1 && !exactMatch;

  const select = (opt) => { onChange(opt); setSearch(''); setOpen(false); };

  const handleAdd = () => {
    if (!trimmed) return;
    onAddOption(trimmed);
    select(trimmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setSearch(''); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) select(filtered[0]);
      else if (showAdd) handleAdd();
    }
  };

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-sm text-left bg-white dark:bg-gray-800 transition-colors
          ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}
          ${open ? 'ring-2 ring-blue-500/30 border-blue-500' : ''}`}>
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 text-xs'}>
          {value || placeholder}
        </span>
        <span className="flex items-center gap-0.5">
          {value && (
            <span onMouseDown={e => { e.stopPropagation(); onChange(''); }} className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Clear">
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input ref={sRef} type="text" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={onAddOption ? 'Search or type to add…' : 'Search…'}
              className="w-full text-xs px-2 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400" />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && !showAdd && (
              <p className="text-xs text-gray-400 text-center py-3">No options found</p>
            )}
            {filtered.map(opt => (
              <button key={opt} type="button"
                onMouseDown={e => { e.preventDefault(); select(opt); }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors
                  ${value === opt ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                {opt}
              </button>
            ))}
            {showAdd && (
              <button type="button"
                onMouseDown={e => { e.preventDefault(); handleAdd(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-gray-800 transition-colors">
                <Plus className="w-3 h-3 flex-shrink-0" />
                Add &ldquo;{trimmed}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const { addToast } = useToast();
  const [tab, setTab]               = useState('pending');
  const [pending, setPending]       = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [rejectTarget, setRejectTarget]     = useState(null);

  // Access management state
  const [accessList, setAccessList]         = useState([]);
  const [loadingAccess, setLoadingAccess]   = useState(false);
  const [deleteAccessTarget, setDeleteAccessTarget] = useState(null);
  const [newAccess, setNewAccess]           = useState({ rollNo: '', nameOfGame: '', year: '' });
  const [accessErrors, setAccessErrors]     = useState({});
  const [savingAccess, setSavingAccess]     = useState(false);
  const [gameOptions, setGameOptions]       = useState([]);
  const [yearOptions, setYearOptions]       = useState([]);

  // Build the public self-register URL
  const selfRegUrl = `${window.location.origin}/self-register`;

  const fetchPending = async () => {
    try {
      setLoadingPending(true);
      const res = await getPendingStudents();
      setPending(res.data);
    } catch {
      addToast('Failed to load pending students', 'error');
    } finally {
      setLoadingPending(false);
    }
  };

  const fetchAccess = async () => {
    try {
      setLoadingAccess(true);
      const [accessRes, optsRes] = await Promise.all([
        getSelfRegAccess(),
        getOptions(),
      ]);
      setAccessList(accessRes.data);
      setGameOptions(optsRes.data.game || []);
      setYearOptions(optsRes.data.year || []);
    } catch {
      addToast('Failed to load access list', 'error');
    } finally {
      setLoadingAccess(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);
  useEffect(() => { if (tab === 'access') fetchAccess(); }, [tab]);

  /* ── Pending actions ── */
  const handleApprove = async (id) => {
    try {
      await approveStudent(id);
      addToast('Student approved');
      setPending(p => p.filter(s => s._id !== id));
    } catch {
      addToast('Failed to approve student', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await rejectStudent(rejectTarget);
      addToast('Student rejected and removed');
      setPending(p => p.filter(s => s._id !== rejectTarget));
      setRejectTarget(null);
    } catch {
      addToast('Failed to reject student', 'error');
      setRejectTarget(null);
    }
  };

  /* ── Access management actions ── */
  const validateAccess = () => {
    const e = {};
    if (!newAccess.rollNo.trim())  e.rollNo    = 'Required';
    else if (!/^\d{9,12}$/.test(newAccess.rollNo)) e.rollNo = '9–12 digits';
    if (!newAccess.nameOfGame)     e.nameOfGame = 'Required';
    if (!newAccess.year)           e.year       = 'Required';
    setAccessErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreateAccess = async (e) => {
    e.preventDefault();
    if (!validateAccess()) return;
    setSavingAccess(true);
    try {
      const res = await createSelfRegAccess({
        rollNo: newAccess.rollNo,
        nameOfGame: newAccess.nameOfGame,
        year: newAccess.year,
      });
      setAccessList(prev => [res.data, ...prev]);
      setNewAccess({ rollNo: '', nameOfGame: '', year: '' });
      setAccessErrors({});
      addToast('Access granted successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create access', 'error');
    } finally {
      setSavingAccess(false);
    }
  };

  const handleDeleteAccess = async () => {
    try {
      await deleteSelfRegAccess(deleteAccessTarget);
      setAccessList(prev => prev.filter(a => a._id !== deleteAccessTarget));
      addToast('Access revoked');
      setDeleteAccessTarget(null);
    } catch {
      addToast('Failed to revoke access', 'error');
      setDeleteAccessTarget(null);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(selfRegUrl).then(() => addToast('Link copied to clipboard', 'success'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage student approvals and self-registration access</p>
        </div>
        <button onClick={tab === 'pending' ? fetchPending : fetchAccess}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <TabButton active={tab === 'pending'} onClick={() => setTab('pending')} count={pending.length}>
          <Clock className="w-4 h-4" /> Pending Approvals
        </TabButton>
        <TabButton active={tab === 'access'} onClick={() => setTab('access')}>
          <Link2 className="w-4 h-4" /> Self-Register Access
        </TabButton>
      </div>

      {/* ── Pending Approvals tab ── */}
      {tab === 'pending' && (
        <div className="card overflow-hidden">
          {loadingPending ? (
            <div className="py-16 flex justify-center"><LoadingSpinner text="Loading pending…" /></div>
          ) : pending.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle className="w-12 h-12 text-green-300 dark:text-green-700 mx-auto mb-3" />
              <p className="font-medium text-gray-500 dark:text-gray-400">All caught up!</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No pending submissions to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    {['Roll No', 'Name', "Father's Name", 'DOB', 'Department', 'Game', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pending.map(s => (
                    <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">#{s.rollNo}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">{s.nameOfTheSportsperson?.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{s.nameOfTheSportsperson}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{s.fathersName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[140px] truncate">{s.nameOfThePresentClass || s.presentClass || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-medium whitespace-nowrap">{s.nameOfTheGame}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link to={`/students/${s._id}/view`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleApprove(s._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Approve">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRejectTarget(s._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Reject">
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Self-Register Access tab ── */}
      {tab === 'access' && (
        <div className="space-y-5">
          {/* Self-reg link card */}
          <div className="card p-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600" /> Public Registration Link
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 break-all">
                {selfRegUrl}
              </code>
              <button onClick={copyLink}
                className="btn-secondary text-xs px-3 py-2 flex items-center gap-1.5 flex-shrink-0">
                Copy Link
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Share this link with students. They must match an access entry below to proceed.</p>
          </div>

          {/* Grant new access */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Grant New Access</h3>
            <form onSubmit={handleCreateAccess}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                {/* Roll Number */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    Roll Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text" inputMode="numeric"
                      value={newAccess.rollNo}
                      onChange={e => setNewAccess(a => ({ ...a, rollNo: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                      placeholder="e.g. 225113664"
                      className={`w-full px-3 py-2 pr-8 text-sm rounded-xl border outline-none bg-white dark:bg-gray-800 dark:text-white
                        ${accessErrors.rollNo ? 'border-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/40'}`}
                    />
                    {newAccess.rollNo && (
                      <button type="button"
                        onClick={() => setNewAccess(a => ({ ...a, rollNo: '' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Clear">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {accessErrors.rollNo && <p className="mt-0.5 text-xs text-red-500">{accessErrors.rollNo}</p>}
                </div>

                {/* Name of Game */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    Name of Game <span className="text-red-500">*</span>
                  </label>
                  <SmallCombo
                    value={newAccess.nameOfGame}
                    onChange={v => setNewAccess(a => ({ ...a, nameOfGame: v }))}
                    options={gameOptions}
                    placeholder="Select or add game"
                    error={accessErrors.nameOfGame}
                    onAddOption={async (val) => {
                      try {
                        await addOption({ key: 'game', value: val });
                        setGameOptions(prev => [...prev, val]);
                      } catch { /* already exists or error — ignore */ }
                    }}
                  />
                  {accessErrors.nameOfGame && <p className="mt-0.5 text-xs text-red-500">{accessErrors.nameOfGame}</p>}
                </div>

                {/* Academic Year */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">
                    Academic Year <span className="text-red-500">*</span>
                  </label>
                  <SmallCombo
                    value={newAccess.year}
                    onChange={v => setNewAccess(a => ({ ...a, year: v }))}
                    options={yearOptions}
                    placeholder="Select or add year"
                    error={accessErrors.year}
                    onAddOption={async (val) => {
                      try {
                        await addOption({ key: 'year', value: val });
                        setYearOptions(prev => [...prev, val]);
                      } catch { /* already exists or error — ignore */ }
                    }}
                  />
                  {accessErrors.year && <p className="mt-0.5 text-xs text-red-500">{accessErrors.year}</p>}
                </div>
              </div>
              <button type="submit" disabled={savingAccess}
                className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                {savingAccess
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  : <><Plus className="w-4 h-4" /> Grant Access</>
                }
              </button>
            </form>
          </div>

          {/* Access list */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Granted Access</h3>
              <p className="text-xs text-gray-400 mt-0.5">Students matching these entries can use the registration link</p>
            </div>
            {loadingAccess ? (
              <div className="py-10 flex justify-center"><LoadingSpinner text="Loading…" /></div>
            ) : accessList.length === 0 ? (
              <div className="py-12 text-center">
                <Link2 className="w-10 h-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No access entries yet. Grant access above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                      {['Roll No', 'Game', 'Year', 'Granted On', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {accessList.map(a => (
                      <tr key={a._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{a.rollNo}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">{a.nameOfGame}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{a.year}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(a.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => setDeleteAccessTarget(a._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Revoke access">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject Student"
        message="This student's form will be permanently deleted. This action cannot be undone."
        confirmLabel="Reject & Delete"
        confirmClass="btn-danger"
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteAccessTarget}
        title="Revoke Access"
        message="This student will no longer be able to use the self-registration link for this game and year."
        confirmLabel="Revoke"
        confirmClass="btn-danger"
        onConfirm={handleDeleteAccess}
        onCancel={() => setDeleteAccessTarget(null)}
      />
    </div>
  );
}
