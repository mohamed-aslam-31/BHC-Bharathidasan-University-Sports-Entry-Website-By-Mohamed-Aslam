import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X, Clock, CheckCircle, XCircle, RotateCcw, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { selfRegVerify, selfRegOptions, selfRegReapply } from '../api';

/* ── Read-only searchable combo ─────────────────────────────────────────────── */
function ComboBox({ value, onChange, options, placeholder, error }) {
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

  const filtered = search ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm text-left bg-slate-50 dark:bg-gray-700 transition-colors
          ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'}
          ${open ? 'ring-2 ring-blue-500/30 border-blue-500' : ''}`}>
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
          {value || placeholder}
        </span>
        <span className="flex items-center gap-0.5 flex-shrink-0">
          {value && (
            <span onMouseDown={e => { e.stopPropagation(); onChange(''); setSearch(''); }}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input ref={sRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400" />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-xs text-gray-400 text-center py-4">No options found</p>
              : filtered.map(opt => (
                <button key={opt} type="button"
                  onMouseDown={e => { e.preventDefault(); onChange(opt); setSearch(''); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors
                    ${value === opt
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                  {opt}
                </button>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}

const CONTACT = 'Department of Physical Education, Bishop Heber College';

/* ── Status screens ─────────────────────────────────────────────────────────── */
function PendingScreen({ onBack }) {
  return (
    <div className="w-full max-w-md bg-slate-50 dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-8 text-center">
      <div className="w-14 h-14 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Submission Pending</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        Your proforma has been submitted and is <strong>still pending for verification</strong>.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">
        If you need any assistance, please contact:
      </p>
      <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mt-1">{CONTACT}</p>
      <button onClick={onBack} className="mt-6 text-xs text-gray-400 dark:text-gray-500 hover:underline">← Back</button>
    </div>
  );
}

function ApprovedScreen({ onBack }) {
  return (
    <div className="w-full max-w-md bg-slate-50 dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-8 text-center">
      <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Successfully Verified!</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
        You have been <strong>successfully verified</strong>. Your registration is complete.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">
        If you need any help, please contact:
      </p>
      <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mt-1">{CONTACT}</p>
      <button onClick={onBack} className="mt-6 text-xs text-gray-400 dark:text-gray-500 hover:underline">← Back</button>
    </div>
  );
}

function RejectedScreen({ rejectionReason, form, onBack }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleReapply = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await selfRegReapply({
        rollNo: form.rollNo,
        nameOfGame: form.nameOfGame,
        year: form.year,
        reapplyReason: '',
      });
      // Store access data + existing student data for the form
      sessionStorage.setItem('bhc_self_reg', JSON.stringify({ ...form, _ts: Date.now() }));
      sessionStorage.setItem('bhc_self_reg_reapply', JSON.stringify({
        studentId: res.data.studentId,
        studentData: res.data.studentData,
        reapplyReason: '',
      }));
      navigate('/self-register/form');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit reapply request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-50 dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-8">
      <div className="text-center mb-5">
        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-7 h-7 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Submission Rejected</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your previous submission was rejected.</p>
      </div>

      {rejectionReason && (
        <div className="mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-1">Reason from admin</p>
          <p className="text-sm text-red-800 dark:text-red-300">{rejectionReason}</p>
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
        You may reapply to submit a new form with updated information.
      </p>

      <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide mb-1">Note</p>
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Before reapplying, you need to upload all 4 documents again (Aadhaar, ID Card, Marksheet, and Fees Receipt).
        </p>
      </div>

      <button
        onClick={handleReapply}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium text-sm transition-colors"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
          : <><RotateCcw className="w-4 h-4" /> Reapply</>}
      </button>
      {error && <p className="mt-2 text-xs text-red-500 text-center">{error}</p>}

      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">Need help? Contact:</p>
        <p className="text-xs font-medium text-blue-700 dark:text-blue-400">{CONTACT}</p>
      </div>
      <button onClick={onBack} className="mt-4 w-full text-xs text-gray-400 dark:text-gray-500 hover:underline">← Back</button>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function SelfRegPage() {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const [form, setForm]       = useState({ rollNo: '', nameOfGame: '', year: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [options, setOptions]   = useState({ game: [], year: [] });
  const [screen, setScreen]     = useState('form'); // 'form' | 'pending' | 'approved' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    selfRegOptions()
      .then(r => setOptions({ game: r.data.game || [], year: r.data.year || [] }))
      .catch(() => {});
  }, []);

  const validate = () => {
    const e = {};
    if (!form.rollNo.trim())    e.rollNo    = 'Roll number is required';
    else if (!/^\d{9,12}$/.test(form.rollNo)) e.rollNo = 'Enter a valid roll number (9–12 digits)';
    if (!form.nameOfGame)       e.nameOfGame = 'Name of the Game is required';
    if (!form.year)             e.year       = 'Academic Year is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await selfRegVerify({ rollNo: form.rollNo, nameOfGame: form.nameOfGame, year: form.year });
      const data = res.data;
      if (data.status === 'pending') { setScreen('pending'); return; }
      if (data.status === 'approved') { setScreen('approved'); return; }
      if (data.status === 'rejected') {
        setRejectionReason(data.rejectionReason || '');
        setScreen('rejected');
        return;
      }
      // success: true — proceed to form
      sessionStorage.setItem('bhc_self_reg', JSON.stringify({ ...form, _ts: Date.now() }));
      sessionStorage.removeItem('bhc_self_reg_reapply');
      navigate('/self-register/form');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => { setScreen('form'); setApiError(''); };

  if (screen === 'pending')  return <PageShell><PendingScreen  onBack={handleBack} /></PageShell>;
  if (screen === 'approved') return <PageShell><ApprovedScreen onBack={handleBack} /></PageShell>;
  if (screen === 'rejected') return <PageShell><RejectedScreen rejectionReason={rejectionReason} form={form} onBack={handleBack} /></PageShell>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-slate-50 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 flex flex-col items-center justify-center px-2 py-6 sm:px-4 sm:py-10">
      {/* Theme toggle */}
      <button onClick={toggleTheme}
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-slate-100 dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:scale-105 transition-transform z-50">
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-slate-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 sm:mb-4 logo-glow ring-2 ring-indigo-300/60 dark:ring-indigo-500/40">
          <img src="/pe-logo.png" alt="Department of Physical Education" className="w-13 h-13 sm:w-20 sm:h-20 object-contain rounded-full" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">BHC Sports Entry</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Bharathidasan University — Student Self Registration</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-slate-50 dark:bg-gray-800 rounded-2xl shadow-xl border border-slate-200 dark:border-gray-700 p-4 sm:p-8">
        <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white mb-1">Verify Your Access</h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 sm:mb-6">Enter your details below. Your admin must grant access before you can register.</p>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-400">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Roll Number */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Roll Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.rollNo}
              onChange={e => setForm(f => ({ ...f, rollNo: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
              placeholder="Enter your roll number"
              className={`w-full px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl border text-xs sm:text-sm outline-none transition-colors bg-slate-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                ${errors.rollNo
                  ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50'}`}
            />
            {errors.rollNo && <p className="mt-1 text-xs text-red-500">{errors.rollNo}</p>}
          </div>

          {/* Name of the Game */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name of the Game <span className="text-red-500">*</span>
            </label>
            <ComboBox
              value={form.nameOfGame}
              onChange={v => setForm(f => ({ ...f, nameOfGame: v }))}
              options={options.game}
              placeholder="Select your game"
              error={errors.nameOfGame}
            />
            {errors.nameOfGame && <p className="mt-1 text-xs text-red-500">{errors.nameOfGame}</p>}
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Academic Year <span className="text-red-500">*</span>
            </label>
            <ComboBox
              value={form.year}
              onChange={v => setForm(f => ({ ...f, year: v }))}
              options={options.year}
              placeholder="Select academic year"
              error={errors.year}
            />
            {errors.year && <p className="mt-1 text-xs text-red-500">{errors.year}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
            ) : 'Verify & Continue'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">© 2026 · Bishop Heber College · Department of Physical Education</p>
    </div>
  );
}

function PageShell({ children }) {
  const { dark, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 flex flex-col items-center justify-center px-2 py-6 sm:px-4 sm:py-10">
      <button onClick={toggleTheme}
        className="fixed top-4 right-4 p-2.5 rounded-xl bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:scale-105 transition-transform z-50">
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <div className="text-center mb-5 sm:mb-8">
        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 sm:mb-4 logo-glow ring-2 ring-indigo-300/60 dark:ring-indigo-500/40">
          <img src="/pe-logo.png" alt="Department of Physical Education" className="w-13 h-13 sm:w-20 sm:h-20 object-contain rounded-full" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">BHC Sports Entry</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Bharathidasan University — Student Self Registration</p>
      </div>
      {children}
      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">© 2026 · Bishop Heber College · Department of Physical Education</p>
    </div>
  );
}
