import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { getStudents, getStudentMeta, deleteStudent, getAdminStats, bulkDeleteStudents } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Plus, Eye, Pencil, Trash2, X,
  Users, CheckCircle, Clock, Trophy, AlertTriangle, Check,
  ChevronDown, GraduationCap, CalendarDays, User2, PersonStanding, User
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
function MultiSelect({ label, options, value, onChange, placeholder, noSearch }) {
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
          {!noSearch && (
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
          )}
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
function BulkDeleteModal({ students, onConfirm, onCancel, loading, zIndex = 50 }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
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
          <div className="glass-scroll max-h-52 overflow-y-auto rounded-xl
            bg-red-50/40 dark:bg-red-950/20
            backdrop-blur-md
            border border-red-200/60 dark:border-red-800/40
            divide-y divide-red-100/60 dark:divide-red-900/30">
            {students.map((s, i) => (
              <div key={s._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-100/40 dark:hover:bg-red-900/20 transition-colors">
                <span className="w-6 h-6 rounded-full bg-red-500/20 dark:bg-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0 border border-red-300/40 dark:border-red-600/30">{i + 1}</span>
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

/* ─── Group view modal ────────────────────────────────────────────────────── */
function StudentCard({ s, checked, onToggle, onEdit, onDelete }) {
  const dob = s.dateOfBirth ? new Date(s.dateOfBirth) : null;
  const age = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000)) : null;
  const Row = ({ label, value }) => value ? (
    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 dark:border-gray-800 py-2 last:border-0">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide sm:w-48 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white font-medium">{value}</span>
    </div>
  ) : null;
  const Section = ({ title, children }) => (
    <div className="mb-4">
      <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 pb-1.5 border-b-2 border-blue-100 dark:border-blue-900">{title}</h4>
      {children}
    </div>
  );
  return (
    <div className={`card overflow-hidden mb-6 print-student transition-opacity duration-200 ${checked ? '' : 'opacity-40 print-exclude'}`}>
      {/* Header — always visible */}
      <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 flex items-center gap-4">
        <div className="flex-1 text-center">
          <h2 className="text-base font-bold">BHARATHIDASAN UNIVERSITY</h2>
          <p className="text-xs opacity-80">TIRUCHIRAPPALLI - 620 024</p>
          <p className="text-sm font-semibold mt-0.5">ELIGIBILITY PROFORMA OF PLAYERS</p>
          <p className="text-xs opacity-70">Division: Trichy / Thanjavur · {s.year}</p>
        </div>
        <div className="flex-shrink-0">
          {s.image ? (
            <img src={`/uploads/${s.image}`} alt={s.nameOfTheSportsperson} className="w-20 h-24 object-cover rounded-lg border-2 border-white/30" />
          ) : (
            <div className="w-20 h-24 rounded-lg bg-white/20 flex items-center justify-center border-2 border-white/30">
              <User className="w-8 h-8 text-white/60" />
            </div>
          )}
        </div>
        {/* Action buttons — right side of header */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0 no-print">
          {/* Circle checkbox — yellow glass */}
          <button
            onClick={onToggle}
            title={checked ? 'Uncheck student' : 'Check student'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 backdrop-blur-md border
              ${checked
                ? 'bg-yellow-400/40 border-yellow-300/60 hover:bg-yellow-400/60 shadow-yellow-400/30 shadow-sm'
                : 'bg-yellow-400/20 border-yellow-300/30 hover:bg-yellow-400/40'
              }`}
          >
            {checked
              ? <Check className="w-3.5 h-3.5 text-yellow-100 stroke-[3]" />
              : <div className="w-3 h-3 rounded-full border-2 border-yellow-200/70" />}
          </button>
          {/* Edit — green glass */}
          <button
            onClick={onEdit}
            title="Edit student"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 backdrop-blur-md border bg-green-500/30 border-green-400/50 hover:bg-green-500/55 shadow-sm shadow-green-500/20"
          >
            <Pencil className="w-3.5 h-3.5 text-green-100" />
          </button>
          {/* Delete — red glass */}
          <button
            onClick={onDelete}
            title="Delete student"
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 backdrop-blur-md border bg-red-500/30 border-red-400/50 hover:bg-red-500/55 shadow-sm shadow-red-500/20"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-100" />
          </button>
        </div>
      </div>
      {/* Body — hidden when unchecked */}
      {checked && (
        <div className="p-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-3 py-1 rounded-full text-xs">{s.nameOfTheGame}</span>
            <span className={`font-medium px-3 py-1 rounded-full text-xs ${s.gender === 'MALE' ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400'}`}>{s.gender}</span>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">Roll No: <strong className="text-gray-900 dark:text-white">{s.rollNo}</strong></span>
          </div>
          <Section title="Personal Information">
            <Row label="Name of Sportsperson" value={s.nameOfTheSportsperson} />
            <Row label="Father's Name" value={s.fathersName} />
            <Row label="Mother's Name" value={s.motherName} />
            <Row label="Date of Birth" value={dob ? `${dob.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}${age ? ` (Age: ${age} yrs)` : ''}` : null} />
            <Row label="Aadhar Number" value={s.aadharNumber} />
            <Row label="Phone Number" value={s.phoneNumber} />
            <Row label="Address" value={s.address} />
          </Section>
          <Section title="Academic Information">
            <Row label="Present Class" value={s.presentClass} />
            <Row label="Department" value={s.nameOfThePresentClass} />
            <Row label="Duration of Course" value={s.durationOfCourse} />
            <Row label="University" value={s.university} />
            <Row label="Present Course" value={s.presentCourse} />
          </Section>
          <Section title="Qualifying Examination">
            <Row label="Name of Exam" value={s.nameOfExam} />
            <Row label="Date & Year of Passing" value={s.dateAndYear} />
          </Section>
          <Section title="Previous IUT Participation">
            <Row label="Graduate Course (Years)" value={s.graduateCourse} />
            <Row label="PG Course (Years)" value={s.pgCourse} />
            <Row label="Previous Course Details" value={s.previousCourse} />
          </Section>
          <Section title="Sports Details">
            <Row label="Tournament Number" value={s.tournament} />
            <Row label="T-Shirt Size" value={s.tshirt} />
            <Row label="Track Size" value={s.track} />
          </Section>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4 text-center">
            {['Student Signature', 'HOD / Principal', 'Physical Director'].map(lbl => (
              <div key={lbl}><div className="h-10 border-b border-gray-300 dark:border-gray-600 mb-1" /><p className="text-xs text-gray-500 dark:text-gray-400">{lbl}</p></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupViewModal({ students, onClose, onDeleted }) {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [list, setList] = useState(students);
  const [visible, setVisible] = useState(() => new Set(students.map(s => s._id)));
  // confirm: null | 'all' | <studentId>
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Add body class so print CSS can hide the rest of the app
  useEffect(() => {
    document.body.classList.add('group-view-open');
    return () => document.body.classList.remove('group-view-open');
  }, []);

  const checkedList = list.filter(s => visible.has(s._id));
  const confirmStudents = confirm === 'all' ? checkedList : list.filter(s => s._id === confirm);

  const toggleVisible = (id) =>
    setVisible(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const ids = confirmStudents.map(s => s._id);
      if (ids.length === 1) await deleteStudent(ids[0]);
      else await bulkDeleteStudents(ids);
      const gone = new Set(ids);
      const remaining = list.filter(s => !gone.has(s._id));
      setList(remaining);
      setVisible(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; });
      setConfirm(null);
      addToast(`${ids.length} student${ids.length !== 1 ? 's' : ''} deleted`);
      onDeleted && onDeleted(ids);
      if (remaining.length === 0) { onClose(); return; }
    } catch {
      addToast('Failed to delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return createPortal(
    <>
      <div className="group-view-print-root fixed inset-0 z-[9999] flex flex-col bg-white dark:bg-gray-950">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 no-print flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Group View</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{list.length} student{list.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Delete Selected */}
            <button
              onClick={() => setConfirm('all')}
              disabled={checkedList.length === 0}
              className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({checkedList.length})
            </button>
            {/* Print Selected */}
            <button
              onClick={() => window.print()}
              disabled={checkedList.length === 0}
              className="btn-secondary flex items-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Print Selected ({checkedList.length})
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        {/* Scrollable content */}
        <div className="group-view-scroll flex-1 overflow-y-auto p-5 max-w-4xl w-full mx-auto">
          {list.map(s => (
            <StudentCard
              key={s._id}
              s={s}
              checked={visible.has(s._id)}
              onToggle={() => toggleVisible(s._id)}
              onEdit={() => { onClose(); navigate(`/students/${s._id}/edit`); }}
              onDelete={() => setConfirm(s._id)}
            />
          ))}
        </div>
      </div>

      {/* Delete confirmation — rendered above group view */}
      {confirm && (
        <BulkDeleteModal
          students={confirmStudents}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
          loading={deleting}
          zIndex={10000}
        />
      )}
    </>,
    document.body
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
  const [groupViewOpen, setGroupViewOpen] = useState(false);

  /* filters */
  const [rollNo, setRollNo]       = useState('');
  const [name, setName]           = useState('');
  const [games, setGames]         = useState([]);
  const [genders, setGenders]     = useState([]);
  const [departments, setDepts]   = useState([]);
  const [years, setYears]         = useState([]);

  /* sort + pagination */
  const [sortBy, setSortBy]       = useState(['new-to-old']);
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
  useEffect(() => { setPage(1); }, [rollNo, name, games, genders, departments, years, sortBy, rowsPerPage]);

  /* ── computed: sorted + filtered ── */
  const sortFn = (a, b) => {
    let dateCmp = 0;
    if (sortBy.includes('new-to-old'))      dateCmp = new Date(b.createdAt) - new Date(a.createdAt);
    else if (sortBy.includes('old-to-new')) dateCmp = new Date(a.createdAt) - new Date(b.createdAt);

    let nameCmp = 0;
    if (sortBy.includes('a-to-z'))      nameCmp = (a.nameOfTheSportsperson || '').localeCompare(b.nameOfTheSportsperson || '');
    else if (sortBy.includes('z-to-a')) nameCmp = (b.nameOfTheSportsperson || '').localeCompare(a.nameOfTheSportsperson || '');

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
  }, [allStudents, selected, rollNo, name, games, genders, departments, years, sortBy]);

  const combined = [...pinnedRows, ...filteredRows];

  const filteredStats = useMemo(() => {
    const all = allStudents.filter(matchesFilter);
    return {
      total:      all.length,
      sportsList: [...new Set(all.map(s => s.nameOfTheGame).filter(Boolean))].sort(),
      deptList:   [...new Set(all.map(s => s.nameOfThePresentClass).filter(Boolean))].sort(),
      yearList:   [...new Set(all.map(s => s.year).filter(Boolean))].sort(),
      male:       all.filter(s => s.gender === 'MALE').length,
      female:     all.filter(s => s.gender === 'FEMALE').length,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allStudents, rollNo, name, games, genders, departments, years]);
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

  const nonDefaultSort = sortBy.filter(v => v !== 'new-to-old');
  const activeFilterCount = [
    rollNo, name,
    ...games, ...genders, ...departments, ...years, ...nonDefaultSort
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setRollNo(''); setName('');
    setGames([]); setGenders([]); setDepts([]); setYears([]);
    setSortBy(['new-to-old']);
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

        {/* Row 2: multi-selects + sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MultiSelect label="Sport / Game"   options={gameOptions}   value={games}    onChange={setGames}   placeholder="All Games"       />
          <MultiSelect label="Gender"         options={genderOptions} value={genders}  onChange={setGenders} placeholder="All Genders"     />
          <MultiSelect label="Department"     options={deptOptions}   value={departments} onChange={setDepts} placeholder="All Departments" />
          <MultiSelect label="Academic Year"  options={yearOptions}   value={years}    onChange={setYears}   placeholder="All Years"       />
          <MultiSelect
            label="Sort by"
            options={['New to Old', 'Old to New', 'A to Z', 'Z to A']}
            value={sortBy.map(v => ({ 'new-to-old': 'New to Old', 'old-to-new': 'Old to New', 'a-to-z': 'A to Z', 'z-to-a': 'Z to A' }[v] || v))}
            onChange={labels => {
              const toKey = l => ({ 'New to Old': 'new-to-old', 'Old to New': 'old-to-new', 'A to Z': 'a-to-z', 'Z to A': 'z-to-a' }[l] || l);
              const prev = sortBy.map(v => ({ 'new-to-old': 'New to Old', 'old-to-new': 'Old to New', 'a-to-z': 'A to Z', 'z-to-a': 'Z to A' }[v] || v));
              const added = labels.find(l => !prev.includes(l));
              if (!added) { setSortBy(labels.map(toKey)); return; }
              const dateGroup = new Set(['New to Old', 'Old to New']);
              const nameGroup = new Set(['A to Z', 'Z to A']);
              let next = labels.filter(l => {
                if (dateGroup.has(added) && dateGroup.has(l) && l !== added) return false;
                if (nameGroup.has(added) && nameGroup.has(l) && l !== added) return false;
                return true;
              });
              if (next.length > 2) next = next.slice(-2);
              setSortBy(next.map(toKey));
            }}
            placeholder="Sort order…"
            noSearch
          />
        </div>
      </div>

      {/* ── Live filter summary ── */}
      <div className="space-y-3">
        {/* Row 1: count cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Users,         label: 'Students', value: filteredStats.total,  color: 'blue' },
            { icon: User2,         label: 'Male',     value: filteredStats.male,   color: 'cyan' },
            { icon: PersonStanding,label: 'Female',   value: filteredStats.female, color: 'pink' },
          ].map(({ icon: Icon, label, value, color }) => {
            const colors = {
              blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
              cyan: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
              pink: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
            };
            return (
              <div key={label} className="card px-4 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Row 2: list cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Trophy,        label: 'Sports',        list: filteredStats.sportsList, color: 'purple' },
            { icon: GraduationCap, label: 'Departments',   list: filteredStats.deptList,   color: 'indigo' },
            { icon: CalendarDays,  label: 'Academic Year', list: filteredStats.yearList,   color: 'yellow' },
          ].map(({ icon: Icon, label, list, color }) => {
            const colors = {
              purple: { bg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', dot: 'bg-purple-400 dark:bg-purple-500' },
              indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-400 dark:bg-indigo-500' },
              yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-400 dark:bg-yellow-500' },
            };
            return (
              <div key={label} className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color].bg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}</span>
                  <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500">{list.length}</span>
                </div>
                {list.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">None</p>
                ) : (
                  <ul className="space-y-1">
                    {list.map(item => (
                      <li key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[color].dot}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
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
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{pageStart + 1}</span>–<span className="font-semibold text-gray-900 dark:text-white">{Math.min(pageStart + rowsPerPage, combined.length)}</span> of <span className="font-semibold text-gray-900 dark:text-white">{combined.length}</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                  <datalist id="rows-options">
                    {ROWS_OPTIONS.map(n => <option key={n} value={n} />)}
                  </datalist>
                  <input
                    type="number"
                    list="rows-options"
                    min={1}
                    value={rowsPerPage}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (v > 0) setRowsPerPage(v);
                    }}
                    className="w-20 text-sm text-center px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
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

      {/* Floating action buttons — visible when students are selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 no-print">
          {/* View Selected */}
          <div className="group flex items-center gap-3">
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 pointer-events-none
              text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-xl shadow-lg
              text-blue-700 dark:text-white
              bg-blue-50/90 dark:bg-white/10 backdrop-blur-md
              border border-blue-200 dark:border-white/20">
              View Selected ({selected.size})
            </span>
            <button
              onClick={() => setGroupViewOpen(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center
                bg-blue-600 hover:bg-blue-700 dark:bg-blue-500/40 dark:hover:bg-blue-500/60
                backdrop-blur-md
                border border-blue-500 dark:border-blue-400/50 dark:hover:border-blue-300/70
                text-white
                shadow-lg hover:shadow-blue-500/40
                transition-all duration-200 hover:scale-110"
            >
              <Eye className="w-5 h-5" />
            </button>
          </div>

          {/* Delete Selected */}
          <div className="group flex items-center gap-3">
            <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 pointer-events-none
              text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-xl shadow-lg
              text-red-700 dark:text-white
              bg-red-50/90 dark:bg-white/10 backdrop-blur-md
              border border-red-200 dark:border-white/20">
              Delete Selected ({selected.size})
            </span>
            <button
              onClick={() => setBulkModalOpen(true)}
              className="w-14 h-14 rounded-full flex items-center justify-center
                bg-red-600 hover:bg-red-700 dark:bg-red-500/40 dark:hover:bg-red-500/60
                backdrop-blur-md
                border border-red-500 dark:border-red-400/50 dark:hover:border-red-300/70
                text-white
                shadow-lg hover:shadow-red-500/40
                transition-all duration-200 hover:scale-110"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk delete modal */}
      {bulkModalOpen && (
        <BulkDeleteModal
          students={selectedStudents}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkModalOpen(false)}
          loading={bulkDeleting}
        />
      )}

      {/* Group view modal */}
      {groupViewOpen && (
        <GroupViewModal
          students={selectedStudents}
          onClose={() => { setGroupViewOpen(false); setSelected(new Set()); }}
          onDeleted={(ids) => { const gone = new Set(ids); setSelected(prev => { const n = new Set(prev); ids.forEach(id => n.delete(id)); return n; }); fetchAll(); }}
        />
      )}
    </div>
  );
}
