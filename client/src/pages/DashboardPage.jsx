import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { getStudents, getStudentMeta, deleteStudent, getAdminStats, bulkDeleteStudents } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Plus, Eye, Pencil, Trash2, X,
  Users, CheckCircle, Clock, Trophy, AlertTriangle, Check,
  ChevronDown
} from 'lucide-react';

/* ─── Circular checkbox ───────────────────────────────────────────────────── */
function CircleCheckbox({ checked, indeterminate, onChange }) {
  return (
    <label className="relative flex items-center justify-center cursor-pointer w-5 h-5 flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
        checked || indeterminate
          ? 'bg-blue-600 border-blue-600'
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
      }`}>
        {indeterminate && !checked
          ? <span className="block w-2 h-0.5 bg-white rounded-full" />
          : checked ? <Check className="w-3 h-3 text-white stroke-[3]" /> : null}
      </div>
    </label>
  );
}

/* ─── Multi-select dropdown ───────────────────────────────────────────────── */
function MultiSelect({ label, options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]);
  const clear = (e) => { e.stopPropagation(); onChange([]); setSearch(''); };

  return (
    <div ref={ref} className="relative">
      <label className="label">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input-field flex items-center justify-between gap-2 text-left w-full min-h-[38px] py-1.5"
      >
        <span className="flex-1 min-w-0">
          {value.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500 text-sm">{placeholder || `All ${label}`}</span>
          ) : (
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">{value.length} selected</span>
          )}
        </span>
        <span className="flex items-center gap-1 flex-shrink-0">
          {value.length > 0 && (
            <span onClick={clear} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
            />
          </div>
          <div className="max-h-52 overflow-y-auto multiselect-scroll">
            {filtered.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No options found</p>
            ) : (
              filtered.map(opt => {
                const checked = value.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggle(opt)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${checked ? 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <span className="w-4 flex-shrink-0 flex items-center justify-center">
                      {checked && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[3]" />}
                    </span>
                    <span className={`${checked ? 'text-blue-700 dark:text-blue-300 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>{opt}</span>
                  </button>
                );
              })
            )}
          </div>
          {value.length > 0 && (
            <div className="p-2 border-t border-gray-100 dark:border-gray-800">
              <button type="button" onClick={clear} className="w-full text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 py-1 text-center font-medium">
                Clear all ({value.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

/* ─── Bulk-delete confirmation modal ─────────────────────────────────────── */
function BulkDeleteModal({ students, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Delete {students.length} Student{students.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">The following student records will be permanently deleted:</p>
          <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {students.map((s, i) => (
              <div key={s._id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.nameOfTheSportsperson}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Roll No: <span className="font-mono text-blue-600 dark:text-blue-400">{s.rollNo}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button onClick={onCancel} disabled={loading} className="btn-secondary flex-1 text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete {students.length} Record{students.length !== 1 ? 's' : ''}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SORT OPTIONS ────────────────────────────────────────────────────────── */
const ROWS_OPTIONS = [10, 20, 30, 40, 50, 100];

const GAMES = [
  'CRICKET','FOOTBALL','CHESS','BASKETBALL','VOLLEYBALL','HOCKEY',
  'TABLE TENNIS','BADMINTON','CROSS COUNTRY','FENCING & CYCLE','SWIMMING',
  'ARCHERY','TENNIS','KABADDI','ATHLETICS','KHO - KHO','BEST PHYSIQUE',
  'NETBALL','HANDBALL','BOXING','BALL BADMINTON','YOGASANA','TAEKWONDO','KARATE'
];

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  /* raw data */
  const [allStudents, setAllStudents] = useState([]);
  const [meta, setMeta] = useState({ departments: [], years: [], games: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  /* single delete */
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* bulk */
  const [selected, setSelected] = useState(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  /* filters */
  const [rollNo, setRollNo]       = useState('');
  const [name, setName]           = useState('');
  const [games, setGames]         = useState([]);
  const [genders, setGenders]     = useState([]);
  const [departments, setDepts]   = useState([]);
  const [years, setYears]         = useState([]);

  /* sort + pagination */
  const [dateSort, setDateSort]   = useState('new-to-old');
  const [nameSort, setNameSort]   = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage]           = useState(1);

  /* ── fetch once ── */
  const fetchAll = async () => {
    try {
      setLoading(true);
      const params = {};
      if (user?.role === 'admin') params.status = 'approved';
      const res = await getStudents(params);
      setAllStudents(res.data);
    } catch {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    getStudentMeta().then(r => setMeta(r.data)).catch(() => {});
    if (user?.role === 'admin') getAdminStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  /* reset to page 1 whenever a filter/sort/rows changes */
  useEffect(() => { setPage(1); }, [rollNo, name, games, genders, departments, years, dateSort, nameSort, rowsPerPage]);

  /* ── computed: sorted + filtered ── */
  const sortFn = (a, b) => {
    // Primary: date sort
    let dateCmp = 0;
    if (dateSort === 'new-to-old') dateCmp = new Date(b.createdAt) - new Date(a.createdAt);
    else if (dateSort === 'old-to-new') dateCmp = new Date(a.createdAt) - new Date(b.createdAt);

    // Secondary: name sort
    let nameCmp = 0;
    if (nameSort === 'a-to-z') nameCmp = (a.nameOfTheSportsperson || '').localeCompare(b.nameOfTheSportsperson || '');
    else if (nameSort === 'z-to-a') nameCmp = (b.nameOfTheSportsperson || '').localeCompare(a.nameOfTheSportsperson || '');

    return dateCmp !== 0 ? dateCmp : nameCmp;
  };

  const matchesFilter = (s) => {
    if (rollNo && !s.rollNo?.toLowerCase().includes(rollNo.toLowerCase())) return false;
    if (name && !s.nameOfTheSportsperson?.toLowerCase().includes(name.toLowerCase())) return false;
    if (games.length && !games.includes(s.nameOfTheGame)) return false;
    if (genders.length && !genders.includes(s.gender)) return false;
    if (departments.length && !departments.includes(s.nameOfThePresentClass)) return false;
    if (years.length && !years.includes(s.year)) return false;
    return true;
  };

  const { pinnedRows, filteredRows, totalVisible } = useMemo(() => {
    const sorted = [...allStudents].sort(sortFn);
    const pinned  = sorted.filter(s => selected.has(s._id));
    const rest    = sorted.filter(s => !selected.has(s._id) && matchesFilter(s));
    return { pinnedRows: pinned, filteredRows: rest, totalVisible: pinned.length + rest.length };
  }, [allStudents, selected, rollNo, name, games, genders, departments, years, dateSort, nameSort]);

  const combined = [...pinnedRows, ...filteredRows];
  const totalPages = Math.max(1, Math.ceil(combined.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * rowsPerPage;
  const pageRows  = combined.slice(pageStart, pageStart + rowsPerPage);

  /* ── checkboxes ── */
  const visibleIds = pageRows.map(s => s._id);
  const allPageChecked = visibleIds.length > 0 && visibleIds.every(id => selected.has(id));
  const somePageChecked = visibleIds.some(id => selected.has(id)) && !allPageChecked;

  const toggleAll = () => {
    setSelected(prev => {
      const next = new Set(prev);
      if (allPageChecked) visibleIds.forEach(id => next.delete(id));
      else visibleIds.forEach(id => next.add(id));
      return next;
    });
  };
  const toggleOne = (id) => setSelected(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next;
  });

  /* ── single delete ── */
  const handleDelete = async () => {
    try {
      await deleteStudent(deleteTarget);
      addToast('Student deleted successfully');
      setDeleteTarget(null);
      setSelected(prev => { const n = new Set(prev); n.delete(deleteTarget); return n; });
      fetchAll();
    } catch {
      addToast('Failed to delete student', 'error');
      setDeleteTarget(null);
    }
  };

  /* ── bulk delete ── */
  const selectedStudents = allStudents.filter(s => selected.has(s._id));
  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      await bulkDeleteStudents([...selected]);
      addToast(`${selected.size} student${selected.size !== 1 ? 's' : ''} deleted successfully`);
      setBulkModalOpen(false);
      setSelected(new Set());
      fetchAll();
    } catch {
      addToast('Failed to delete selected students', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  const activeFilterCount = [
    rollNo, name,
    ...games, ...genders, ...departments, ...years
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setRollNo(''); setName('');
    setGames([]); setGenders([]); setDepts([]); setYears([]);
  };

  /* ── department & year options ── */
  const deptOptions  = meta.departments.length ? meta.departments : [...new Set(allStudents.map(s => s.nameOfThePresentClass).filter(Boolean))];
  const yearOptions  = meta.years.length ? meta.years : [...new Set(allStudents.map(s => s.year).filter(Boolean))];
  const gameOptions  = GAMES;
  const genderOptions = ['MALE', 'FEMALE'];

  return (
    <div className="space-y-6">
      {/* Stats */}
      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users}       label="Total Students" value={stats.total}    color="blue"   />
          <StatCard icon={CheckCircle} label="Approved"       value={stats.approved} color="green"  />
          <StatCard icon={Clock}       label="Pending"        value={stats.pending}  color="yellow" />
          <StatCard icon={Trophy}      label="Sports"         value={stats.games}    color="purple" />
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Records</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {combined.length} student{combined.length !== 1 ? 's' : ''} found
            {selected.size > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">· {selected.size} selected</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {selected.size > 0 && (
            <button onClick={() => setBulkModalOpen(true)} className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors">
              <Trash2 className="w-4 h-4" />Delete Selected ({selected.size})
            </button>
          )}
          <Link to="/students/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />Add Student
          </Link>
        </div>
      </div>

      {/* ── Filter panel (always visible) ── */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">{activeFilterCount}</span>
            )}
          </span>
          {activeFilterCount > 0 && (
            <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium flex items-center gap-1">
              <X className="w-3.5 h-3.5" />Clear all
            </button>
          )}
        </div>

        {/* Row 1: text search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Roll Number</label>
            <input className="input-field" placeholder="Search roll no…" value={rollNo} onChange={e => setRollNo(e.target.value)} />
          </div>
          <div>
            <label className="label">Student Name</label>
            <input className="input-field" placeholder="Search name…" value={name} onChange={e => setName(e.target.value)} />
          </div>
        </div>

        {/* Row 2: multi-selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MultiSelect label="Sport / Game"   options={gameOptions}   value={games}    onChange={setGames}   placeholder="All Games"       />
          <MultiSelect label="Gender"         options={genderOptions} value={genders}  onChange={setGenders} placeholder="All Genders"     />
          <MultiSelect label="Department"     options={deptOptions}   value={departments} onChange={setDepts} placeholder="All Departments" />
          <MultiSelect label="Academic Year"  options={yearOptions}   value={years}    onChange={setYears}   placeholder="All Years"       />
        </div>
      </div>

      {/* ── Table toolbar: sort + rows per page ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">Sort by:</span>
          <select
            value={dateSort}
            onChange={e => setDateSort(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="new-to-old">New to Old</option>
            <option value="old-to-new">Old to New</option>
          </select>
          <select
            value={nameSort}
            onChange={e => setNameSort(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="">Name (no sort)</option>
            <option value="a-to-z">A → Z</option>
            <option value="z-to-a">Z → A</option>
          </select>
        </div>

        {/* Rows per page */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
          <div className="flex gap-1">
            {ROWS_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setRowsPerPage(n)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                  rowsPerPage === n
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center"><LoadingSpinner text="Loading students…" /></div>
        ) : combined.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No students found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Add your first student to get started'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <CircleCheckbox checked={allPageChecked} indeterminate={somePageChecked} onChange={toggleAll} />
                    </th>
                    {['Roll No', 'Name', 'Game', 'Gender', 'Department', 'Year', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pageRows.map((s, idx) => {
                    const isPinned = selected.has(s._id);
                    const isFirstUnpinned = isPinned === false && idx > 0 && selected.has(pageRows[idx - 1]?._id);
                    return (
                      <tr
                        key={s._id}
                        className={`transition-colors ${
                          isPinned
                            ? 'bg-blue-50 dark:bg-blue-900/10'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                        }`}
                      >
                        <td className="pl-4 pr-2 py-3">
                          <CircleCheckbox checked={isPinned} onChange={() => toggleOne(s._id)} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">#{s.rollNo}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {s.image ? (
                              <img src={`/uploads/${s.image}`} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-100 dark:border-blue-900" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{s.nameOfTheSportsperson?.charAt(0)}</span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{s.nameOfTheSportsperson}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full whitespace-nowrap">{s.nameOfTheGame}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                            s.gender === 'MALE'
                              ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400'
                              : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400'
                          }`}>{s.gender}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[160px] truncate">{s.nameOfThePresentClass || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.year || '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/students/${s._id}/view`} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="View">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link to={`/students/${s._id}/edit`} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button onClick={() => setDeleteTarget(s._id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Pagination footer ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-900 dark:text-white">{pageStart + 1}</span>–<span className="font-semibold text-gray-900 dark:text-white">{Math.min(pageStart + rowsPerPage, combined.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{combined.length}</span>
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:border-blue-400 disabled:cursor-not-allowed transition-colors"
                >«</button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:border-blue-400 disabled:cursor-not-allowed transition-colors"
                >‹ Prev</button>

                {/* page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                    acc.push(p); return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…'
                      ? <span key={`e${i}`} className="px-1.5 text-xs text-gray-400">…</span>
                      : <button key={p} onClick={() => setPage(p)} className={`w-8 h-7 text-xs rounded-lg border transition-colors ${safePage === p ? 'bg-blue-600 border-blue-600 text-white font-semibold' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-blue-400'}`}>{p}</button>
                  )
                }

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:border-blue-400 disabled:cursor-not-allowed transition-colors"
                >Next ›</button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-40 hover:border-blue-400 disabled:cursor-not-allowed transition-colors"
                >»</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Single delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student"
        message="This will permanently delete the student record and photo. This action cannot be undone."
        confirmLabel="Delete"
        confirmClass="btn-danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk delete modal */}
      {bulkModalOpen && (
        <BulkDeleteModal
          students={selectedStudents}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkModalOpen(false)}
          loading={bulkDeleting}
        />
      )}
    </div>
  );
}
