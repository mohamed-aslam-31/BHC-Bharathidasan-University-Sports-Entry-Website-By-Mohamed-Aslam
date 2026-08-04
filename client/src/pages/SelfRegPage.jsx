import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronDown, X } from 'lucide-react';
import { selfRegVerify, selfRegOptions } from '../api';

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
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm text-left bg-white dark:bg-gray-700 transition-colors
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
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
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

/* ── Main page ──────────────────────────────────────────────────────────────── */
export default function SelfRegPage() {
  const navigate = useNavigate();
  const [form, setForm]       = useState({ rollNo: '', nameOfGame: '', year: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [options, setOptions]   = useState({ game: [], year: [] });

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
      await selfRegVerify({ rollNo: form.rollNo, nameOfGame: form.nameOfGame, year: form.year });
      // Store access data in sessionStorage so the form page can read it
      sessionStorage.setItem('bhc_self_reg', JSON.stringify(form));
      navigate('/self-register/form');
    } catch (err) {
      setApiError(err.response?.data?.error || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 flex flex-col items-center justify-center px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">BHC Sports Entry</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bharathidasan University — Student Self Registration</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Verify Your Access</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Enter your details below. Your admin must grant access before you can register.</p>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-sm text-red-700 dark:text-red-400">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Roll Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Roll Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={form.rollNo}
              onChange={e => setForm(f => ({ ...f, rollNo: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
              placeholder="Enter your roll number"
              className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500
                ${errors.rollNo
                  ? 'border-red-400 focus:ring-2 focus:ring-red-300'
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50'}`}
            />
            {errors.rollNo && <p className="mt-1 text-xs text-red-500">{errors.rollNo}</p>}
          </div>

          {/* Name of the Game */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
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
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying…</>
            ) : 'Verify & Continue'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">© {new Date().getFullYear()} Bharathidasan University · Sports Division</p>
    </div>
  );
}
