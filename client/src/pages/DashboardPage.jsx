import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { getStudents, getStudentMeta, getOptions, deleteStudent, bulkDeleteStudents, verifyStudent } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Plus, Eye, Pencil, Trash2, X,
  Users, Trophy, AlertTriangle, Check,
  ChevronDown, GraduationCap, CalendarDays, User2, PersonStanding, User, Loader2
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
const pBorder   = '1px solid #000';
const pNumCell  = { border: pBorder, padding: '7px 5px',  verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap',  fontFamily: 'Arial, sans-serif' };
const pLabelCell= { border: pBorder, padding: '7px 8px',  verticalAlign: 'middle', lineHeight: 1.5,     fontFamily: 'Arial, sans-serif' };
const pSubCell  = { border: pBorder, padding: '7px 8px',  verticalAlign: 'middle', whiteSpace: 'nowrap',fontFamily: 'Arial, sans-serif' };
const pValueCell= { border: pBorder, padding: '7px 8px',  verticalAlign: 'middle', fontWeight: 'bold',  wordBreak: 'break-word', fontFamily: 'Arial, sans-serif' };
const pAgeCell  = { border: pBorder, padding: '7px 8px',  verticalAlign: 'middle', fontWeight: 'bold',  textAlign: 'center', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif' };

const pFormatDOB = (val) => {
  if (!val) return 'NIL';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
};
const pCalcAge = (val) => {
  if (!val) return '';
  const dob = new Date(val);
  if (isNaN(dob)) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};
const ptd = (val) => val || 'NIL';

/* A4 at 96 dpi with 10 mm top+bottom margins ≈ 1040 px usable */
const A4_USABLE_H = 1040;
function fitToPage(el) {
  if (!el) return;
  el.style.zoom = '1';
  const h = el.scrollHeight;
  if (h > A4_USABLE_H) el.style.zoom = String((A4_USABLE_H / h).toFixed(4));
}

function StudentCard({ s, checked, onToggle, onEdit, onDelete }) {
  const proformaRef = useRef(null);
  useEffect(() => {
    const el = proformaRef.current;
    if (!el) return;
    fitToPage(el);
    window.addEventListener('beforeprint', () => fitToPage(el));
    return () => window.removeEventListener('beforeprint', () => fitToPage(el));
  }, [s]);

  return (
    <div className={`mb-8 print-student ${checked ? '' : 'opacity-40 print-exclude'}`}>

      {/* ── Screen-only action bar ── */}
      <div className="no-print flex items-center gap-2 mb-2 px-1">
        <button
          onClick={onToggle}
          title={checked ? 'Uncheck (exclude from print)' : 'Check (include in print)'}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
            checked
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-blue-400'
          }`}
        >
          {checked
            ? <><Check className="w-3 h-3 stroke-[3]" />Selected</>
            : <><div className="w-3 h-3 rounded-full border-2 border-gray-400" />Select</>}
        </button>
        <button
          onClick={onEdit}
          title="Edit student"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-400 transition-colors"
        >
          <Pencil className="w-3 h-3" />Edit
        </button>
        <button
          onClick={onDelete}
          title="Delete student"
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />Delete
        </button>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">Roll #{s.rollNo}</span>
      </div>

      {/* ── Proforma (matches StudentViewPage exactly) ── */}
      <div ref={proformaRef} style={{ fontFamily: 'Times New Roman, serif', color: '#000', background: '#fff', padding: '18px 22px', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
          <div style={{ width: '120px', flexShrink: 0 }}>
            <img src="/university-logo.gif" alt="BU Logo" style={{ width: '115px', height: '115px', objectFit: 'contain', display: 'block' }} />
          </div>
          <div style={{ flex: 1, textAlign: 'center', lineHeight: 1.4, paddingTop: '6px', paddingBottom: '6px' }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bharathidasan University</div>
            <div style={{ fontSize: '14px' }}>TIRUCHIRAPPALLI - 620 024</div>
            <div style={{ fontSize: '17px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '3px' }}>Eligibility Proforma of Players</div>
            <div style={{ fontSize: '14px', fontStyle: 'italic', marginTop: '2px' }}>Division: <em>Trichy / Thanjavur*</em></div>
            <div style={{ fontSize: '14px', fontStyle: 'italic', marginTop: '2px' }}><em>{s.year || ''}</em></div>
          </div>
          <div style={{ width: '125px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ border: '1px solid #000', width: '115px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {s.image
                ? <img src={`/uploads/${s.image}`} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '12px', color: '#666', textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '4px' }}>Photo</span>
              }
            </div>
          </div>
        </div>

        {/* College / Game line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', marginTop: '4px', fontFamily: 'Arial, sans-serif', flexWrap: 'wrap', gap: '4px' }}>
          <div>College: <strong>Bishop Heber College, Trichy</strong></div>
          <div>Game: <strong>{s.nameOfTheGame}{s.gender ? ' – ' + s.gender : ''}</strong></div>
        </div>

        {/* Main table — 5 columns; col5 is the age box used only in row 3 */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'Arial, sans-serif', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '26%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={pNumCell}>1.</td>
              <td colSpan={2} style={pLabelCell}>Name of the sportsperson</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.nameOfTheSportsperson)}</td>
            </tr>
            <tr>
              <td style={pNumCell}>2.</td>
              <td colSpan={2} style={pLabelCell}>Father's Name</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.fathersName)}</td>
            </tr>
            <tr>
              <td style={pNumCell}>3.</td>
              <td colSpan={2} style={pLabelCell}>
                Date of Birth
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '1px' }}>(copy of +2 Mark sheet should be enclosed)</div>
              </td>
              <td style={pValueCell}>{pFormatDOB(s.dateOfBirth)}</td>
              <td style={pAgeCell}>
                {s.dateOfBirth && pCalcAge(s.dateOfBirth) !== '' ? <>Age : {pCalcAge(s.dateOfBirth)}</> : ''}
              </td>
            </tr>
            <tr>
              <td rowSpan={2} style={{ ...pNumCell, verticalAlign: 'middle' }}>4.</td>
              <td rowSpan={2} style={{ ...pLabelCell, verticalAlign: 'middle' }}>Date &amp; year of passing Qualifying Examination for First admission to a college / university</td>
              <td style={pSubCell}>Name of Exam</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.nameOfExam)}</td>
            </tr>
            <tr>
              <td style={pSubCell}>Date &amp; Year</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.dateAndYear)}</td>
            </tr>
            <tr>
              <td style={pNumCell}>5.</td>
              <td colSpan={2} style={pLabelCell}>Present Class</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.presentClass)}</td>
            </tr>
            <tr>
              <td style={pNumCell}>6.</td>
              <td colSpan={2} style={pLabelCell}>Name of the present course</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.nameOfThePresentClass)}</td>
            </tr>
            <tr>
              <td style={pNumCell}>7.</td>
              <td colSpan={2} style={pLabelCell}>Duration of course</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.durationOfCourse)}</td>
            </tr>
            <tr>
              <td rowSpan={2} style={{ ...pNumCell, verticalAlign: 'middle' }}>8.</td>
              <td rowSpan={2} style={{ ...pLabelCell, verticalAlign: 'middle' }}>Date &amp; year of First admission to</td>
              <td style={pSubCell}>University</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.university)}</td>
            </tr>
            <tr>
              <td style={pSubCell}>Present course</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.presentCourse)}</td>
            </tr>
            <tr>
              <td rowSpan={2} style={{ ...pNumCell, verticalAlign: 'middle' }}>9.</td>
              <td rowSpan={2} style={{ ...pLabelCell, verticalAlign: 'middle' }}>No. of years of previous IUT participation while pursuing</td>
              <td style={pSubCell}>Graduate course</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.graduateCourse)}</td>
            </tr>
            <tr>
              <td style={pSubCell}>P.G. course</td>
              <td colSpan={2} style={pValueCell}>{ptd(s.pgCourse)}</td>
            </tr>
            <tr>
              <td style={pNumCell}>10.</td>
              <td colSpan={2} style={pLabelCell}>
                Details about change of course / faculty, if any
                <div style={{ fontSize: '10px', marginTop: '1px' }}>(Details about the previous / new – course / faculty)</div>
              </td>
              <td colSpan={2} style={pValueCell}>{ptd(s.previousCourse)}</td>
            </tr>
            <tr>
              <td style={pNumCell}>11.</td>
              <td colSpan={2} style={pLabelCell}>Residential address (With phone / Mobile no)</td>
              <td colSpan={2} style={{ ...pValueCell, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                {s.address || '—'}
                {s.phoneNumber ? <><br /><strong>{s.phoneNumber}</strong></> : null}
              </td>
            </tr>
            <tr>
              <td style={pNumCell}>12.</td>
              <td colSpan={4} style={{ ...pValueCell, fontWeight: 'normal' }}>
                <span>T-Shirt Size : <strong>{s.tshirt || ''}</strong></span>
                <span style={{ marginLeft: '48px' }}>Track Size : <strong>{s.track || ''}</strong></span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer notes */}
        <div style={{ marginTop: '14px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
          <div>*Strike out whichever is not applicable</div>
          <div>Readmitted UG/PG students should enclose copy of admission fee receipt in original</div>
        </div>

        {/* Signatures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '16px', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'right', paddingBottom: '48px' }}>
            Signature of the student
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '48px' }}>
            <div>Signature of the<br />Director of Physical Education</div>
            <div style={{ textAlign: 'right' }}>Signature of the Principal/HOD<br />College seal with date</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ border: '1.5px solid #000', padding: '14px 48px', textAlign: 'center', fontSize: '13px' }}>
              Eligibility verified<br />Local organiser Signature &amp; Seal
            </div>
          </div>
        </div>
      </div>
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
const STUDENT_TYPES = ['AIDED', 'SELF-FINANCE'];
const DAY_TYPES = ['DAYSCHOLAR', 'HOSTELLER'];
const SHIFTS = ['MORNING', 'EVENING'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'GOLDEN'];
const HOSTELS = [
  'Mens Hostel', 'Womens Hostel', 'Boys Hostel No.1', 'Boys Hostel No.2',
  'Girls Hostel No.1', 'Girls Hostel No.2', 'Research Scholars Hostel',
];

/* ─── MAIN COMPONENT ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();

  /* raw data */
  const [allStudents, setAllStudents] = useState([]);
  const [meta, setMeta] = useState({ departments: [], years: [], games: [] });
  const [optionLists, setOptionLists] = useState({});
  const [loading, setLoading] = useState(true);

  /* single delete */
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const handleVerify = async (studentId, verified) => {
    setVerifyingId(studentId);
    try {
      await verifyStudent(studentId, verified);
      setAllStudents((prev) => prev.map((s) => s._id === studentId ? { ...s, documentsVerified: verified } : s));
      addToast(verified ? 'Documents marked as verified' : 'Verification removed');
    } catch {
      addToast('Failed to update verification', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const [bulkVerifying, setBulkVerifying] = useState(false);
  const handleBulkVerify = async () => {
    const toVerify = allStudents.filter(s =>
      selected.has(s._id) &&
      !s.documentsVerified &&
      s.aadhaarPdf && s.idCardPdf && s.marksheetPdf && s.feesReceiptPdf
    );
    if (!toVerify.length) return;
    setBulkVerifying(true);
    try {
      await Promise.all(toVerify.map(s => verifyStudent(s._id, true)));
      setAllStudents((prev) => prev.map(s =>
        toVerify.some(v => v._id === s._id) ? { ...s, documentsVerified: true } : s
      ));
      addToast(`${toVerify.length} student${toVerify.length > 1 ? 's' : ''} marked as verified`);
    } catch {
      addToast('Failed to verify some students', 'error');
    } finally {
      setBulkVerifying(false);
    }
  };

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
  const [studentTypes, setStudentTypes] = useState([]);
  const [dayTypes, setDayTypes]         = useState([]);
  const [hostels, setHostels]           = useState([]);
  const [shifts, setShifts]             = useState([]);
  const [bloodGroups, setBloodGroups]   = useState([]);
  const [docStatuses, setDocStatuses]   = useState([]);

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
    // Shared combo-box option lists — same source the add/edit forms manage,
    // so renaming/deleting an option there updates these filters too.
    getOptions().then(r => setOptionLists(r.data)).catch(() => {});
  }, []);

  /* reset to page 1 whenever a filter/sort/rows changes */
  useEffect(() => { setPage(1); }, [
    rollNo, name, games, genders, departments, years,
    studentTypes, dayTypes, hostels, shifts, bloodGroups, docStatuses, sortBy, rowsPerPage
  ]);
  useEffect(() => {
    if (!dayTypes.includes('HOSTELLER') && hostels.length > 0) setHostels([]);
  }, [dayTypes]);

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

  const getDocStatus = (s) => {
    const uploaded = [s.aadhaarPdf, s.idCardPdf, s.marksheetPdf, s.feesReceiptPdf].filter(Boolean).length;
    if (s.documentsVerified) return 'verified';
    if (uploaded === 4) return 'not-verified';
    return 'docs-missing';
  };

  const matchesFilter = (s) => {
    if (rollNo && !s.rollNo?.toLowerCase().includes(rollNo.toLowerCase())) return false;
    if (name && !s.nameOfTheSportsperson?.toLowerCase().includes(name.toLowerCase())) return false;
    if (games.length && !games.includes(s.nameOfTheGame)) return false;
    if (genders.length && !genders.includes(s.gender)) return false;
    if (departments.length && !departments.includes(s.presentCourse)) return false;
    if (years.length && !years.includes(s.year)) return false;
    if (studentTypes.length && !studentTypes.includes(s.studentType)) return false;
    if (dayTypes.length && !dayTypes.includes(s.dayType)) return false;
    if (hostels.length && !hostels.includes(s.hostelName)) return false;
    if (shifts.length && !shifts.includes(s.shift)) return false;
    if (bloodGroups.length && !bloodGroups.includes(s.bloodGroup)) return false;
    if (docStatuses.length && !docStatuses.includes(getDocStatus(s))) return false;
    return true;
  };

  const { pinnedRows, filteredRows, totalVisible } = useMemo(() => {
    const sorted = [...allStudents].sort(sortFn);
    const pinned  = sorted.filter(s => selected.has(s._id));
    const rest    = sorted.filter(s => !selected.has(s._id) && matchesFilter(s));
    return { pinnedRows: pinned, filteredRows: rest, totalVisible: pinned.length + rest.length };
  }, [
    allStudents, selected, rollNo, name, games, genders, departments, years,
    studentTypes, dayTypes, hostels, shifts, bloodGroups, docStatuses, sortBy
  ]);

  const combined = [...pinnedRows, ...filteredRows];

  const filteredStats = useMemo(() => {
    const all = allStudents.filter(s => matchesFilter(s));
    return {
      total:      all.length,
      sportsList: [...new Set(all.map(s => s.nameOfTheGame).filter(Boolean))].sort(),
      deptList:   [...new Set(all.map(s => s.presentCourse).filter(Boolean))].sort(),
      yearList:   [...new Set(all.map(s => s.year).filter(Boolean))].sort(),
      bloodGroupList: [...new Set(all.map(s => s.bloodGroup).filter(Boolean))].sort(),
      studentTypeList: [...new Set(all.map(s => s.studentType).filter(Boolean))].sort(),
      shiftList: [...new Set(all.map(s => s.shift).filter(Boolean))].sort(),
      dayTypeList: [...new Set(all.map(s => s.dayType).filter(Boolean))].sort(),
      hostelList: [...new Set(all.map(s => s.hostelName).filter(Boolean))].sort(),
      male:       all.filter(s => s.gender === 'MALE').length,
      female:     all.filter(s => s.gender === 'FEMALE').length,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    allStudents, rollNo, name, games, genders, departments, years,
    studentTypes, dayTypes, hostels, shifts, bloodGroups, docStatuses
  ]);
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
    ...games, ...genders, ...departments, ...years,
    ...studentTypes, ...dayTypes, ...hostels, ...shifts, ...bloodGroups,
    ...docStatuses,
    ...nonDefaultSort
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setRollNo(''); setName('');
    setGames([]); setGenders([]); setDepts([]); setYears([]);
    setStudentTypes([]); setDayTypes([]); setHostels([]); setShifts([]); setBloodGroups([]);
    setDocStatuses([]);
    setSortBy(['new-to-old']);
  };

  /* ── department & year options ──
     Sourced from the shared OptionList collection (GET /api/options) — the
     same data the add/edit student forms manage — so an option renamed or
     deleted on either form updates here without a page reload. */
  const deptOptions  = [...new Set([...(optionLists.dept || []), ...meta.departments, ...allStudents.map(s => s.presentCourse).filter(Boolean)])];
  const yearOptions  = [...new Set([...(optionLists.year || []), ...meta.years, ...allStudents.map(s => s.year).filter(Boolean)])];
  const gameOptions  = [...new Set([...(optionLists.game || GAMES), ...meta.games, ...allStudents.map(s => s.nameOfTheGame).filter(Boolean)])];
  const genderOptions = ['MALE', 'FEMALE'];
  const studentTypeOptions = [...new Set([...(optionLists.studentType || STUDENT_TYPES), ...allStudents.map(s => s.studentType).filter(Boolean)])];
  const dayTypeOptions = [...new Set([...(optionLists.dayType || DAY_TYPES), ...allStudents.map(s => s.dayType).filter(Boolean)])];
  const shiftOptions = [...new Set([...(optionLists.shift || SHIFTS), ...allStudents.map(s => s.shift).filter(Boolean)])];
  const bloodGroupOptions = [...new Set([...(optionLists.bloodGroup || BLOOD_GROUPS), ...allStudents.map(s => s.bloodGroup).filter(Boolean)])];
  const hostelOptions = [...new Set([...(optionLists.hostel || HOSTELS), ...allStudents.map(s => s.hostelName).filter(Boolean)])];

  return (
    <div className="space-y-6">
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
          <MultiSelect label="Student Type"   options={studentTypeOptions} value={studentTypes} onChange={setStudentTypes} placeholder="All Student Types" />
          <MultiSelect label="Day / Hosteller" options={dayTypeOptions} value={dayTypes} onChange={setDayTypes} placeholder="All Day Types" />
          {dayTypes.includes('HOSTELLER') && (
            <MultiSelect label="Hostel Name" options={hostelOptions} value={hostels} onChange={setHostels} placeholder="All Hostels" />
          )}
          <MultiSelect label="Shift"           options={shiftOptions} value={shifts} onChange={setShifts} placeholder="All Shifts" />
          <MultiSelect label="Blood Group"     options={bloodGroupOptions} value={bloodGroups} onChange={setBloodGroups} placeholder="All Blood Groups" />
          <MultiSelect
            label="Doc Status"
            options={['Docs Missing', 'Not Verified', 'Verified']}
            value={docStatuses.map(v => ({ 'docs-missing': 'Docs Missing', 'not-verified': 'Not Verified', 'verified': 'Verified' }[v] || v))}
            onChange={labels => setDocStatuses(labels.map(l => ({ 'Docs Missing': 'docs-missing', 'Not Verified': 'not-verified', 'Verified': 'verified' }[l] || l)))}
            placeholder="All Statuses"
            noSearch
          />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Trophy,        label: 'Sports',          list: filteredStats.sportsList, color: 'purple' },
            { icon: GraduationCap, label: 'Departments',     list: filteredStats.deptList,   color: 'indigo' },
            { icon: CalendarDays,  label: 'Academic Year',   list: filteredStats.yearList,   color: 'yellow' },
            {
              icon: User,
              label: 'Blood Group',
              list: bloodGroups.length ? bloodGroups : filteredStats.bloodGroupList,
              color: 'red',
            },
            {
              icon: GraduationCap,
              label: 'Student Type',
              list: studentTypes.length ? studentTypes : filteredStats.studentTypeList,
              color: 'blue',
            },
            {
              icon: CalendarDays,
              label: 'Shift',
              list: shifts.length ? shifts : filteredStats.shiftList,
              color: 'purple',
            },
            {
              icon: User2,
              label: 'Day / Hosteller',
              list: dayTypes.length ? dayTypes : filteredStats.dayTypeList,
              color: 'green',
            },
            ...((hostels.length > 0 || filteredStats.hostelList.length > 0)
              ? [{
                  icon: GraduationCap,
                  label: 'Hostel Name',
                  list: hostels.length ? hostels : filteredStats.hostelList,
                  color: 'orange',
                }]
              : []),
          ].map(({ icon: Icon, label, list, color }) => {
            const colors = {
              purple: { bg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', dot: 'bg-purple-400 dark:bg-purple-500' },
              indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400', dot: 'bg-indigo-400 dark:bg-indigo-500' },
              yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400', dot: 'bg-yellow-400 dark:bg-yellow-500' },
              red:    { bg: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400', dot: 'bg-red-400 dark:bg-red-500' },
              blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', dot: 'bg-blue-400 dark:bg-blue-500' },
              green:  { bg: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400', dot: 'bg-green-400 dark:bg-green-500' },
              orange: { bg: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400', dot: 'bg-orange-400 dark:bg-orange-500' },
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
            <div className="overflow-x-auto table-scroll">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="pl-4 pr-2 py-3 w-10">
                      <CircleCheckbox checked={allPageChecked} indeterminate={somePageChecked} onChange={toggleAll} />
                    </th>
                    {['Roll No', 'Name', 'Game', 'Gender', 'Department', 'Year', 'Status', 'Actions'].map(h => (
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
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[160px] truncate">{s.presentCourse || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">{s.year || '—'}</td>
                        <td className="px-4 py-3">
                          {(() => {
                            const uploaded = [s.aadhaarPdf, s.idCardPdf, s.marksheetPdf, s.feesReceiptPdf].filter(Boolean).length;
                            const isBusy = verifyingId === s._id;
                            if (s.documentsVerified) {
                              return (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleVerify(s._id, false); }}
                                  disabled={isBusy}
                                  title="Click to remove verification"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 whitespace-nowrap hover:bg-green-200 dark:hover:bg-green-900/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isBusy ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" /> : <span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />}
                                  Verified
                                </button>
                              );
                            }
                            if (uploaded === 4) {
                              return (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleVerify(s._id, true); }}
                                  disabled={isBusy}
                                  title="Click to mark as verified"
                                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 whitespace-nowrap hover:bg-yellow-200 dark:hover:bg-yellow-900/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isBusy ? <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" /> : <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block flex-shrink-0" />}
                                  Not Verified
                                </button>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full bg-red-500 inline-block flex-shrink-0" />
                                {uploaded}/4 Docs
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Link to={`/students/${s._id}/view`} className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" title="View">
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
      {deleteTarget && (() => {
        const s = allStudents.find(x => x._id === deleteTarget);
        return s ? (
          <BulkDeleteModal
            students={[s]}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={false}
          />
        ) : null;
      })()}

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

          {/* Verify Selected — only shown when at least one selected student has all docs but isn't verified yet */}
          {allStudents.some(s =>
            selected.has(s._id) && !s.documentsVerified &&
            s.aadhaarPdf && s.idCardPdf && s.marksheetPdf && s.feesReceiptPdf
          ) && (
            <div className="group flex items-center gap-3">
              <span className="opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 pointer-events-none
                text-xs font-semibold whitespace-nowrap px-3 py-1.5 rounded-xl shadow-lg
                text-green-700 dark:text-white
                bg-green-50/90 dark:bg-white/10 backdrop-blur-md
                border border-green-200 dark:border-white/20">
                Mark Verified
              </span>
              <button
                onClick={handleBulkVerify}
                disabled={bulkVerifying}
                className="w-14 h-14 rounded-full flex items-center justify-center
                  bg-green-600 hover:bg-green-700 dark:bg-green-500/40 dark:hover:bg-green-500/60
                  backdrop-blur-md
                  border border-green-500 dark:border-green-400/50 dark:hover:border-green-300/70
                  text-white
                  shadow-lg hover:shadow-green-500/40
                  transition-all duration-200 hover:scale-110
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {bulkVerifying
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <Check className="w-5 h-5" />}
              </button>
            </div>
          )}

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
