import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { createStudent, updateStudent, getStudent, getStudentMeta, fetchProxyImage, deleteStudentAadhaar, deleteStudentIdCard, deleteStudentMarksheet, deleteStudentFeesReceipt, deleteStudent, renameOption, deleteOption } from '../api';
import { ArrowLeft, Upload, Loader2, User, ChevronDown, X, Check, Plus, Trash2, Pencil, CropIcon, ZoomIn, ZoomOut, FileText, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import AadhaarUpload from '../components/AadhaarUpload';
import IdCardUpload from '../components/IdCardUpload';
import MarksheetUpload from '../components/MarksheetUpload';
import FeesReceiptUpload from '../components/FeesReceiptUpload';
import StudentPreviewOverlay from '../components/StudentPreviewOverlay';
import Cropper from 'react-easy-crop';

/* ─── Crop helpers ─────────────────────────────────────────────────────────── */

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  canvas.width  = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    image,
    pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height,
    0, 0, pixelCrop.width, pixelCrop.height,
  );
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
}

/* ─── Static option lists ──────────────────────────────────────────────────── */

const DEFAULT_GAMES = [
  'CRICKET','FOOTBALL','CHESS','BASKETBALL','VOLLEYBALL','HOCKEY',
  'TABLE TENNIS','BADMINTON','CROSS COUNTRY','FENCING & CYCLE','SWIMMING',
  'ARCHERY','TENNIS','KABADDI','ATHLETICS','KHO - KHO','BEST PHYSIQUE',
  'NETBALL','HANDBALL','BOXING','BALL BADMINTON','YOGASANA','TAEKWONDO','KARATE',
];

const DEFAULT_YEARS = (() => {
  const list = [];
  for (let y = 2020; y <= 2039; y++) list.push(`${y}-${y + 1}`);
  return list;
})();

const DEFAULT_CLASSES = [
  'I B.A','II B.A','III B.A',
  'I B.Sc','II B.Sc','III B.Sc',
  'I B.Com','II B.Com','III B.Com',
  'I B.C.A','II B.C.A','III B.C.A',
  'I B.B.A','II B.B.A','III B.B.A',
  'I B.COM(CA)','II B.COM(CA)','III B.COM(CA)',
  'I B.Ed','II B.Ed',
  'I B.P.Ed','II B.P.Ed',
  'I M.A','II M.A',
  'I M.Sc','II M.Sc',
  'I M.Com','II M.Com',
  'I M.B.A','II M.B.A',
  'I M.C.A','II M.C.A',
  'I M.Ed','II M.Ed',
  'I M.P.Ed','II M.P.Ed',
  'I Ph.D','II Ph.D','III Ph.D',
];

const DEFAULT_DURATIONS = ['1 Year','2 Years','3 Years','4 Years','5 Years'];

const DEFAULT_HOSTELS = [
  'Mens Hostel', 'Womens Hostel', 'Boys Hostel No.1', 'Boys Hostel No.2',
  'Girls Hostel No.1', 'Girls Hostel No.2', 'Research Scholars Hostel',
];

const DEFAULT_EXAMS = [
  /* School board — 10th */
  'SSLC','Matriculation (10th)','CBSE (10th)','ICSE (10th)','State Board (10th)','NIOS (10th)',
  /* School board — 12th / Higher Secondary */
  'HSC','Higher Secondary','CBSE (12th)','ISC (12th)','State Board (12th)','NIOS (12th)',
  /* Engineering entrance */
  'JEE Main','JEE Advanced','MHT-CET','TS EAMCET','AP EAMCET','KCET','UGET','SRMJEEE','VITEEE',
  /* Medical entrance */
  'NEET','JIPMER','AIIMS',
  /* Management entrance */
  'CAT','MAT','GMAT','CMAT','TANCET (MBA)','KMAT',
  /* Law / Other */
  'CLAT','GATE','CUET','TNPG','TANCET (ME/MTech)',
];

const DEFAULT_MONTH_YEARS = (() => {
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const list = [];
  for (let y = 2015; y <= 2030; y++) {
    for (const m of months) list.push(`${m}-${y}`);
  }
  return list;
})();

const DEFAULT_UNIVERSITIES = [
  'Bharathidasan University',
  'University of Madras',
  'Anna University',
  'Madurai Kamaraj University',
  'Bharathiar University',
  'Annamalai University',
  'Manonmaniam Sundaranar University',
  'Periyar University',
  'Mother Teresa Women\'s University',
  'Tamil Nadu Open University',
];

const DEFAULT_BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'GOLDEN',
];

const DEFAULT_COURSES = [
  'B.A English','B.A Tamil','B.A History','B.A Economics','B.A Sociology',
  'B.Sc Mathematics','B.Sc Physics','B.Sc Chemistry','B.Sc Biology',
  'B.Sc Computer Science','B.Sc Statistics','B.Sc Biochemistry',
  'B.Com','B.Com (CA)','B.Com (CS)','BBA','BCA',
  'B.Ed','B.P.Ed',
  'M.A English','M.A Tamil','M.A History','M.A Economics',
  'M.Sc Mathematics','M.Sc Physics','M.Sc Chemistry','M.Sc Computer Science',
  'M.Com','MBA','MCA','M.Ed','M.P.Ed',
  'Ph.D',
];

/* ─── Sanitisers ───────────────────────────────────────────────────────────── */

/** Strip non-digit/dash and cap at 9 chars (DDDD-DDDD) */
const sanitizeYear = (v) => {
  // Keep only digits and dash, strip everything else
  let s = v.replace(/[^\d-]/g, '');
  // Remove any existing dashes then auto-insert after position 4
  const digits = s.replace(/-/g, '');
  const d1 = digits.slice(0, 4);
  const d2 = digits.slice(4, 8);
  if (d2.length > 0) return `${d1}-${d2}`;
  if (d1.length === 4 && s.endsWith('-')) return `${d1}-`;
  return d1;
};
const sanitizeRollNo  = (v) => v.replace(/\D/g, '').slice(0, 12);
const sanitizeName    = (v) => v.replace(/[^a-zA-Z. ]/g, '').replace(/ {2,}/g, ' ');
/** Game: letters/digits/spaces + allowed specials: " \u201C \u201D ' \u2018 \u2019 ( ) & [ ] . , */
const sanitizeGame    = (v) => v.replace(/[^a-zA-Z0-9 "'\u201C\u201D\u2018\u2019()&[\].,]/g, '').replace(/ {2,}/g, ' ');
const sanitizeDigits  = (v, max) => v.replace(/\D/g, '').slice(0, max);
/** Address: letters/digits/spaces/newlines + allowed specials: . " \u201C \u201D ' \u2018 \u2019 - _ | / \ & # @ ( ) ; : , [ ] */
const sanitizeAddress = (v) => v.replace(/[^a-zA-Z0-9 \n"'\u201C\u201D\u2018\u2019\-_|/\\&#@();:,.[\]]/g, '').replace(/[ \t]{2,}/g, ' ');
/** Academic fields (class/dept/duration/course/university): letters/digits/spaces +
 *  allowed specials: [ ] ( ) : ; ' \u2018 \u2019 " \u201C \u201D / \ & # @ , . | */
const sanitizeAcademic = (v) => v.replace(/[^a-zA-Z0-9 [\]():;"'\u2018\u2019\u201C\u201D/\\&#@,.|]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '');
/** Class / dept / course: letters + numbers + single spaces, no leading space */
const sanitizeText    = (v) => v.replace(/[^a-zA-Z0-9 .]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '');
/** Like sanitizeText but allows special characters — for department, course names etc. */
const sanitizeTextSpl = (v) => v.replace(/ {2,}/g, ' ').replace(/^ /, '');
/** Present Class: letters, digits, single interior spaces, . ( ) and one "-".
 *  Rules:
 *   - Must start with a letter or digit (no leading space/dash/dot)
 *   - Only one "-" allowed; trailing dash kept so typing "BCA-" → "BCA-II" works
 *   - Only ONE consecutive digit allowed (e.g. "12" → "1")
 *   - No consecutive dots — "B.C.A" valid, "B..C" → "B.C"
 *   - Only one "(" and one ")" allowed
 *   - No consecutive spaces. Max 20 chars.
 */
const sanitizePresentClass = (v) => {
  // 1. Strip disallowed characters — only letters, digits, space, dash, dot, parens
  v = v.replace(/[^a-zA-Z0-9 \-().]/g, '');
  // 2. Collapse consecutive spaces
  v = v.replace(/ {2,}/g, ' ');
  // 3. No leading space, dash, or dot
  v = v.replace(/^[ \-.]+/, '');
  // 4. No consecutive digits — keep only the first digit of any run
  v = v.replace(/(\d)\d+/g, '$1');
  // 5. No consecutive dots — collapse to one
  v = v.replace(/\.{2,}/g, '.');
  // 6. Only one "-": keep the FIRST, strip extras after it
  const d = v.indexOf('-');
  if (d !== -1) {
    v = v.slice(0, d + 1) + v.slice(d + 1).replace(/-/g, '');
  }
  // 7. Dash must not be at position 0 after all processing (safety guard)
  if (v[0] === '-') v = v.slice(1);
  // 8. Only one "(": keep the first, strip extras
  const op = v.indexOf('(');
  if (op !== -1) v = v.slice(0, op + 1) + v.slice(op + 1).replace(/\(/g, '');
  // 9. Only one ")": keep the first, strip extras
  const cl = v.indexOf(')');
  if (cl !== -1) v = v.slice(0, cl + 1) + v.slice(cl + 1).replace(/\)/g, '');
  return v.slice(0, 20);
};
/**
 * Duration of Course sanitizer:
 *  - Letters and digits only (no other special chars except "-")
 *  - Space is auto-converted to "-"
 *  - Only ONE digit allowed (first digit kept, rest stripped)
 *  - Only ONE "-" allowed
 *  - No leading "-"
 *  - Max 9 chars
 */
const sanitizeDuration = (v) => {
  // 1. Convert spaces to dashes
  v = v.replace(/ /g, '-');
  // 2. Strip everything except letters, digits, dash
  v = v.replace(/[^a-zA-Z0-9-]/g, '');
  // 3. No leading dash
  v = v.replace(/^-+/, '');
  // 4. Only one digit — keep the first digit, strip the rest
  let digitFound = false;
  v = v.split('').filter((ch) => {
    if (/\d/.test(ch)) { if (!digitFound) { digitFound = true; return true; } return false; }
    return true;
  }).join('');
  // 5. Only one dash — keep the first, strip extras
  const di = v.indexOf('-');
  if (di !== -1) v = v.slice(0, di + 1) + v.slice(di + 1).replace(/-/g, '');
  return v.slice(0, 7);
};

/**
 * Name of Present Course sanitizer:
 *  - Letters and spaces only (no digits)
 *  - Allowed specials: . , ( ) - &
 *  - Only ONE "(" and ONE ")" allowed (one pair)
 *  - Max 30 chars
 */
const sanitizePresentCourse = (v) => {
  // 1. Strip disallowed chars — only letters, space, and . , ( ) - &
  v = v.replace(/[^a-zA-Z .,()&-]/g, '');
  // 2. Collapse consecutive spaces
  v = v.replace(/ {2,}/g, ' ');
  // 3. No leading space
  v = v.replace(/^ /, '');
  // 4. Only one "(" — keep the first, strip the rest
  const op = v.indexOf('(');
  if (op !== -1) v = v.slice(0, op + 1) + v.slice(op + 1).replace(/\(/g, '');
  // 5. Only one ")" — keep the first, strip the rest
  const cl = v.indexOf(')');
  if (cl !== -1) v = v.slice(0, cl + 1) + v.slice(cl + 1).replace(/\)/g, '');
  return v.slice(0, 30);
};

/** Blood group: letters + +/- only, uppercase */
const sanitizeBloodGroup = (v) => v.replace(/[^a-zA-Z+\-]/g, '').toUpperCase().slice(0, 3);

/** Name of Exam: letters/digits/single spaces, allowed specials: & ( ) - _ [ ] | \ / . , : ; ' \u2018 \u2019 " \u201C \u201D # % @ * */
const sanitizeExamName = (v) => v.replace(/[^a-zA-Z0-9 &()\-_[\]|\\/.,;:'\u2018\u2019"\u201C\u201D#%@*]/g, '').replace(/ {2,}/g, ' ').slice(0, 40);
/** Month & Year of Passing: format = Letters-YYYY (one dash, letters before, up to 4 digits after).
 *  Space is auto-converted to "-". Letters mixed into the digit section are stripped. */
const sanitizeMonthYear = (v) => {
  // Convert space to dash
  v = v.replace(/ /g, '-');
  // Strip everything except letters, digits, and dash
  v = v.replace(/[^a-zA-Z0-9\-]/g, '');
  if (v.includes('-')) {
    // Collapse multiple dashes — only one allowed
    const firstDash = v.indexOf('-');
    const before = v.slice(0, firstDash).replace(/[^a-zA-Z]/g, ''); // letters only
    const after  = v.slice(firstDash + 1).replace(/[^0-9]/g, '').slice(0, 4); // digits only, max 4
    v = before + '-' + after;
  } else {
    // No dash yet — only letters allowed (month name)
    v = v.replace(/[^a-zA-Z]/g, '');
  }
  return v.slice(0, 14);
};

/* ─── Validators ───────────────────────────────────────────────────────────── */

const validateDuration = (v) =>
  !v ? 'Duration of Course is required' :
  v.length < 6 ? 'Minimum 6 characters required' :
  v.length > 7 ? 'Maximum 7 characters allowed' :
  / /.test(v) ? 'No spaces allowed' :
  (v.match(/\d/g) || []).length > 1 ? 'Only one digit allowed' :
  (v.match(/-/g) || []).length > 1 ? 'Only one "-" allowed' :
  /[^a-zA-Z0-9-]/.test(v) ? 'Only "-" is allowed as a special character' : '';

const validateNoOfYears = (v) =>
  !v ? 'This field is required' :
  v.length < 3 ? 'Minimum 3 characters required' :
  v.length > 7 ? 'Maximum 7 characters allowed' :
  / /.test(v) ? 'No spaces allowed' :
  (v.match(/\d/g) || []).length > 1 ? 'Only one digit allowed' :
  (v.match(/-/g) || []).length > 1 ? 'Only one "-" allowed' :
  /[^a-zA-Z0-9-]/.test(v) ? 'Only "-" is allowed as a special character' : '';

const validateStudentType = (v) =>
  !v ? 'Student type is required' : '';

const validateDayType = (v) =>
  !v ? 'Day / Hostel type is required' : '';

const validateHostelName = (v, dayType) =>
  dayType === 'HOSTELLER' && !v ? 'Hostel name is required' : '';

const validatePresentCourse = (v) =>
  !v ? 'Name of Present Course is required' :
  v.trim().length < 2 ? 'Must be at least 2 characters' :
  v.length > 30 ? 'Maximum 30 characters allowed' :
  /[0-9]/.test(v) ? 'Numbers are not allowed' :
  /[^a-zA-Z .,()&-]/.test(v) ? 'Only letters and . , ( ) - & are allowed' :
  (v.match(/\(/g) || []).length > 1 ? 'Only one "(" allowed' :
  (v.match(/\)/g) || []).length > 1 ? 'Only one ")" allowed' : '';

const validateYear = (v) =>
  !v ? 'Academic year is required' :
  !/^\d{4}-\d{4}$/.test(v) ? 'Format must be YYYY-YYYY (e.g. 2023-2024)' : '';

const validateRollNo = (v) =>
  !v ? 'Roll number is required' :
  v.length < 9 ? 'Minimum 9 digits required' :
  v.length > 12 ? 'Maximum 12 digits allowed' : '';

const validatePersonName = (v, label = 'Name') =>
  !v ? `${label} is required` :
  v.trim().length < 3 ? `${label} must be at least 3 characters` :
  v.length > 50 ? `${label} must be at most 50 characters` :
  /[^a-zA-Z. ]/.test(v) ? `${label}: letters, "." and spaces only` :
  / {2,}/.test(v) ? `${label}: no consecutive spaces` : '';

const validateGender = (v) =>
  !v ? 'Gender is required' : '';

const validateShift = (v) =>
  !v ? 'Shift is required' : '';

const validateGame = (v) =>
  !v ? 'Name of the game is required' : '';

const validateMinMax = (v, label, min, max, required = false) =>
  (!v && required)      ? `${label} is required` :
  !v                    ? '' :
  v.trim().length < min ? `${label} must be at least ${min} character${min > 1 ? 's' : ''}` :
  v.length > max        ? `${label} must be at most ${max} characters` : '';

const validateUniversity = (v) => validateMinMax(v, 'Month & year of first admission to university', 8, 15, true);

const validateExamName = (v) =>
  !v ? 'Name of exam is required' :
  v.trim().length < 3 ? 'Minimum 3 characters required' :
  v.length > 40 ? 'Maximum 40 characters allowed' : '';

const validateMonthYear = (v) =>
  !v ? 'Month & year of passing is required' :
  v.trim().length < 8 ? 'Minimum 8 characters required' :
  v.length > 14 ? 'Maximum 14 characters allowed' : '';

const validateDob = (v) =>
  !v ? 'Date of birth is required' : '';

const validateAddress = (v) =>
  !v || !v.trim() ? 'Address is required' : '';

const sanitizePrevCourse = (v) =>
  v.replace(/[^\w\s.,\-'"/()&:;]/g, '').slice(0, 100);

const validatePrevCourse = (v) =>
  !v || !v.trim()   ? 'This field is required' :
  v.trim().length < 3 ? 'Minimum 3 characters required' :
  v.length > 100      ? 'Maximum 100 characters allowed' : '';

const validateAadhar = (v) =>
  !v ? 'Aadhar number is required' :
  v.length !== 12 ? 'Aadhar must be exactly 12 digits' : '';

const validatePhone = (v) =>
  !v ? 'Phone number is required' :
  v.length !== 10 ? 'Phone must be exactly 10 digits' : '';

const validateBloodGroup = (v) =>
  !v ? 'Blood group is required' : '';

/* ─── Sub-components ───────────────────────────────────────────────────────── */

/**
 * Shows character count (and optional max) below-left of an input.
 * Only renders when value has content.
 */
function CharCount({ value, max, always }) {
  const len = typeof value === 'string' ? value.length : 0;
  if (!always && !len) return null;
  const near = max && len > max * 0.8;
  return (
    <span className={`text-xs tabular-nums ${near ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
      {max ? `${len} / ${max}` : `${len}`}
    </span>
  );
}

/**
 * Row below an input: char count on left, error on right.
 * Only renders if either has content.
 */
function FieldMeta({ value, max, error, always }) {
  const len = typeof value === 'string' ? value.length : 0;
  if (!always && !len && !error) return null;
  return (
    <div className="flex items-start gap-2 mt-1 min-h-[1rem]">
      <CharCount value={value} max={max} always={always} />
      {error && <span className="text-xs text-red-500 leading-tight flex-1 text-right">{error}</span>}
    </div>
  );
}

/**
 * Single-value searchable combo box with inline edit / delete per option.
 * Props:
 *   onEditOption(oldVal, newVal)  – called when user renames an option
 *   onDeleteOption(opt)           – called when user deletes an option
 * Both are optional; omitting them hides the edit/delete icons.
 */
function ComboBox({ value, onChange, options, placeholder, required, error, sanitizer, maxLength, minCreate = 1, validateAdd, onEditOption, onDeleteOption, deleteWarning }) {
  const [open,             setOpen]             = useState(false);
  const [search,           setSearch]           = useState('');
  const [editingOpt,       setEditingOpt]       = useState(null);
  const [editDraft,        setEditDraft]        = useState('');
  const [confirmDeleteOpt, setConfirmDeleteOpt] = useState(null);
  const ref      = useRef(null);
  const searchRef = useRef(null);
  const editRef   = useRef(null);

  const canManage = !!(onEditOption || onDeleteOption);

  /* close on outside click */
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false); setSearch(''); setEditingOpt(null); setConfirmDeleteOpt(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 0); }, [open]);
  useEffect(() => { if (editingOpt) setTimeout(() => editRef.current?.focus(), 0); }, [editingOpt]);

  const filtered   = search ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase())) : options;
  const exactMatch = options.some((o) => o.toLowerCase() === search.toLowerCase());
  const trimmed    = search.trim();
  const showAdd    = trimmed.length >= minCreate && (!maxLength || trimmed.length <= maxLength) && !exactMatch;
  const addError   = showAdd && validateAdd ? validateAdd(trimmed) : '';

  const select = (opt) => { onChange(opt); setSearch(''); setOpen(false); setEditingOpt(null); setConfirmDeleteOpt(null); };
  const handleSearchChange = (e) => { let v = e.target.value; if (sanitizer) v = sanitizer(v); setSearch(v); onChange(v); };
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setSearch(''); }
    if (e.key === 'Enter') { e.preventDefault(); if (filtered.length === 1) select(filtered[0]); else if (showAdd && !addError) select(search.trim()); }
  };
  const clear = (e) => { e.stopPropagation(); onChange(''); setSearch(''); };

  /* edit helpers */
  const startEdit   = (opt) => { setEditingOpt(opt); setEditDraft(opt); setConfirmDeleteOpt(null); };
  const cancelEdit  = () => { setEditingOpt(null); setEditDraft(''); };
  const confirmEdit = () => {
    const nv = editDraft.trim();
    if (nv && nv !== editingOpt && onEditOption) onEditOption(editingOpt, nv);
    setEditingOpt(null); setEditDraft('');
  };

  /* delete helpers */
  const startDelete   = (opt) => { setConfirmDeleteOpt(opt); setEditingOpt(null); };
  const cancelDelete  = () => setConfirmDeleteOpt(null);
  const confirmDelete = async () => {
    if (!onDeleteOption || !confirmDeleteOpt) return;
    const deleted = await onDeleteOption(confirmDeleteOpt);
    if (deleted) setConfirmDeleteOpt(null);
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button type="button" onClick={() => setOpen((o) => !o)} required={required}
        className={`input-field flex items-center justify-between gap-2 text-left w-full min-h-[38px] ${error ? 'border-red-400 dark:border-red-500' : ''}`}>
        <span className="flex-1 min-w-0 truncate text-sm">
          {value ? <span className="text-gray-900 dark:text-gray-100">{value}</span>
                 : <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>}
        </span>
        <span className="flex items-center gap-0.5 flex-shrink-0">
          {value && (
            <span onMouseDown={(e) => { e.stopPropagation(); clear(e); }}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input ref={searchRef} type="text" value={search} onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown} placeholder="Search…" maxLength={maxLength}
              className="w-full text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
          </div>
          {/* Options */}
          <div className="max-h-52 overflow-y-auto multiselect-scroll">
            {filtered.length === 0 && !showAdd && (
              <p className="text-xs text-gray-400 text-center py-4">No options found</p>
            )}
            {filtered.map((opt) => (
              <div key={opt} className="group relative">
                {editingOpt === opt ? (
                  /* ── Inline edit panel ── */
                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                    <input ref={editRef} type="text" value={editDraft} maxLength={maxLength}
                      onChange={(e) => { let v = e.target.value; if (sanitizer) v = sanitizer(v); setEditDraft(v); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); confirmEdit(); } if (e.key === 'Escape') cancelEdit(); }}
                      className="w-full text-sm px-2 py-1 mb-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
                    <div className="flex gap-2">
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); confirmEdit(); }}
                        className="flex-1 text-xs px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Change</button>
                      <button type="button" onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                        className="flex-1 text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button type="button" onMouseDown={(e) => { e.preventDefault(); select(opt); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${canManage ? 'pr-16' : ''} ${
                        value === opt
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}>
                      {value === opt
                        ? <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[3] flex-shrink-0" />
                        : <span className="w-3.5 flex-shrink-0" />}
                      {opt}
                    </button>
                    {/* Edit / Delete icons — visible on hover */}
                    {canManage && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEditOption && (
                          <button type="button" title="Edit"
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startEdit(opt); }}
                            className="p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                        )}
                        {onDeleteOption && (
                          <button type="button" title="Delete"
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); startDelete(opt); }}
                            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                    {/* Delete confirmation panel */}
                    {confirmDeleteOpt === opt && (
                      <div className="px-3 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-100 dark:border-red-800">
                         <p className="text-xs text-red-600 dark:text-red-400 mb-2">
                           {deleteWarning || <>Delete <span className="font-semibold">"{opt}"</span>?</>}
                        </p>
                        <div className="flex gap-2">
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); confirmDelete(); }}
                            className="flex-1 text-xs px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Delete</button>
                          <button type="button" onMouseDown={(e) => { e.preventDefault(); cancelDelete(); }}
                            className="flex-1 text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {showAdd && (
              addError ? (
                <div className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm border-t border-gray-100 dark:border-gray-800 text-red-500 dark:text-red-400 cursor-default select-none">
                  <Plus className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-40" />
                  <span>
                    <span className="opacity-60">Add &ldquo;{search.trim()}&rdquo;</span>
                    <span className="block text-xs mt-0.5">{addError}</span>
                  </span>
                </div>
              ) : (
                <button type="button" onMouseDown={(e) => { e.preventDefault(); select(search.trim()); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-100 dark:border-gray-800">
                  <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                  Add &ldquo;{search.trim()}&rdquo;
                </button>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Layout helpers ───────────────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <div className="card p-6">
      <h3 className="section-title">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {children}
      </div>
    </div>
  );
}

/** Pure layout wrapper — no error rendering; each child handles its own. */
function Field({ label, required, children, span, id }) {
  return (
    <div id={id} className={span === 2 ? 'sm:col-span-2' : span === 3 ? 'col-span-full' : ''}>
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Empty form state ─────────────────────────────────────────────────────── */

const empty = {
  year: '', rollNo: '', nameOfTheGame: '', gender: '', bloodGroup: '',
  shift: '',
  studentName: '', fatherName: '', motherName: '', dob: '',
  nameOfExam: '', dateAndYear: '',
  presentClass: '', nameOfThePresentClass: '', durationOfCourse: '',
  university: '', presentCourse: '',
  graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: 'NIL',
  address: '', phoneNumber: '', aadharNumber: '',
  tshirt: '', track: '',
  studentType: '', dayType: '', hostelName: '',
};

/* ─── Main component ───────────────────────────────────────────────────────── */

export default function StudentFormPage() {
  const { id }   = useParams();
  const isEdit   = !!id;
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm]       = useState(empty);
  const [errors, setErrors]   = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [meta, setMeta]         = useState({ departments: [], years: [], games: [] });
  const [managedOpts, setManagedOpts] = useState({});
  const [deleteWarning, setDeleteWarning] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [aadhaarValidated, setAadhaarValidated] = useState(false);
  const [aadhaarFile, setAadhaarFile]           = useState(null);
  const [currentAadhaarPdf, setCurrentAadhaarPdf] = useState(null);   // existing PDF on edit
  const [deletingAadhaar, setDeletingAadhaar]   = useState(false);
  const [idCardValidated, setIdCardValidated]       = useState(false);
  const [idCardFile, setIdCardFile]                 = useState(null);
  const [currentIdCardPdf, setCurrentIdCardPdf]     = useState(null);
  const [deletingIdCard, setDeletingIdCard]         = useState(false);
  const [marksheetValidated, setMarksheetValidated]     = useState(false);
  const [marksheetFile, setMarksheetFile]               = useState(null);
  const [currentMarksheetPdf, setCurrentMarksheetPdf]   = useState(null);
  const [deletingMarksheet, setDeletingMarksheet]       = useState(false);
  const [feesReceiptValidated, setFeesReceiptValidated] = useState(false);
  const [feesReceiptFile, setFeesReceiptFile]           = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentFeesReceiptPdf, setCurrentFeesReceiptPdf] = useState(null);
  const [deletingFeesReceipt, setDeletingFeesReceipt]   = useState(false);

  /* ── crop state ── */
  const [cropSrc, setCropSrc]               = useState(null);
  const [showCrop, setShowCrop]             = useState(false);
  const [crop, setCrop]                     = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                     = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const fileInputRef = useRef(null);

  /* ── ID card photo state ── */
  const [showIdCardPreview, setShowIdCardPreview] = useState(false);
  const [idCardLoading, setIdCardLoading]         = useState(false);
  const [idCardBlobUrl, setIdCardBlobUrl]         = useState(null);
  const [idCardBlob, setIdCardBlob]               = useState(null);

  useEffect(() => {
    getStudentMeta().then((r) => setMeta(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    getStudent(id)
      .then((res) => {
        const s = res.data;
        setForm({
          year:                  s.year                    || '',
          rollNo:                s.rollNo                  || '',
          nameOfTheGame:         s.nameOfTheGame           || '',
          bloodGroup:            s.bloodGroup              || '',
          gender:                s.gender                  || 'MALE',
          studentName:           s.nameOfTheSportsperson   || '',
          fatherName:            s.fathersName             || '',
          motherName:            s.motherName              || '',
          dob:                   s.dateOfBirth             || '',
          nameOfExam:            s.nameOfExam              || '',
          dateAndYear:           s.dateAndYear             || '',
          presentClass:          s.presentClass            || '',
          nameOfThePresentClass: s.nameOfThePresentClass   || '',
          durationOfCourse:      s.durationOfCourse        || '',
          university:            s.university              || '',
          presentCourse:         s.presentCourse           || '',
          graduateCourse:        s.graduateCourse          || 'NIL',
          pgCourse:              s.pgCourse                || 'NIL',
          previousCourse:        s.previousCourse          || 'NIL',
          address:               s.address                 || '',
          phoneNumber:           s.phoneNumber             || '',
          aadharNumber:          s.aadharNumber            || '',

          tshirt:                s.tshirt                  || '',
          track:                 s.track                   || '',
          shift:                 s.shift                   || '',
          studentType:           s.studentType             || '',
          dayType:               s.dayType                 || '',
          hostelName:            s.hostelName              || '',
        });
        if (s.image)       setCurrentImage(s.image);
        if (s.aadhaarPdf)  setCurrentAadhaarPdf(s.aadhaarPdf);
        if (s.idCardPdf)     setCurrentIdCardPdf(s.idCardPdf);
        if (s.marksheetPdf)    setCurrentMarksheetPdf(s.marksheetPdf);
        if (s.feesReceiptPdf)  setCurrentFeesReceiptPdf(s.feesReceiptPdf);
      })
      .catch(() => { addToast('Failed to load student', 'error'); navigate('/'); })
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  /* ── helpers ── */

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));
  const setRaw = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const touch = (key, value) => {
    let msg = '';
    switch (key) {
      case 'year':           msg = validateYear(value);                         break;
      case 'rollNo':         msg = validateRollNo(value);                       break;
      case 'gender':         msg = validateGender(value);                       break;
      case 'shift':          msg = validateShift(value);                        break;
      case 'studentType':    msg = validateStudentType(value);                  break;
      case 'dayType':        msg = validateDayType(value);                      break;
      case 'hostelName':     msg = validateHostelName(value, form.dayType);     break;
      case 'nameOfTheGame':  msg = validateGame(value);                         break;
      case 'bloodGroup':     msg = validateBloodGroup(value);                   break;
      case 'studentName':    msg = validatePersonName(value, 'Sportsperson name'); break;
      case 'fatherName':     msg = validatePersonName(value, "Father's name");  break;
      case 'motherName':     msg = validatePersonName(value, "Mother's name");  break;
      case 'dob':            msg = validateDob(value);                          break;
      case 'address':              msg = validateAddress(value);                                      break;
      case 'previousCourse':       msg = validatePrevCourse(value);                                   break;
      case 'aadharNumber':         msg = validateAadhar(value);                                       break;
      case 'phoneNumber':          msg = validatePhone(value);                                        break;
      case 'university':           msg = validateMonthYear(value);                                                               break;
      case 'presentClass':         msg = validateMinMax(value, 'Present class', 1, 20, true);                                break;
      case 'nameOfThePresentClass':msg = validateMonthYear(value);                                                               break;
      case 'durationOfCourse':     msg = validateDuration(value);                                     break;
      case 'graduateCourse':       msg = validateNoOfYears(value);                                            break;
      case 'pgCourse':             msg = validateNoOfYears(value);                                            break;
      case 'presentCourse':        msg = validatePresentCourse(value);                                break;
      case 'nameOfExam':           msg = validateExamName(value);                                     break;
      case 'dateAndYear':          msg = validateMonthYear(value);                                    break;
      default: break;
    }
    setErrors((e) => ({ ...e, [key]: msg }));
    return !msg;
  };

  const validateAll = () => {
    const next = {
      year:           validateYear(form.year),
      rollNo:         validateRollNo(form.rollNo),
      gender:         validateGender(form.gender),
      shift:          validateShift(form.shift),
      studentType:    validateStudentType(form.studentType),
      dayType:        validateDayType(form.dayType),
      hostelName:     validateHostelName(form.hostelName, form.dayType),
      nameOfTheGame:  validateGame(form.nameOfTheGame),
      bloodGroup:     validateBloodGroup(form.bloodGroup),
      studentName:    validatePersonName(form.studentName, 'Sportsperson name'),
      fatherName:     validatePersonName(form.fatherName, "Father's name"),
      motherName:     validatePersonName(form.motherName, "Mother's name"),
      dob:            validateDob(form.dob),
      address:        validateAddress(form.address),
      aadharNumber:        validateAadhar(form.aadharNumber),
      phoneNumber:         validatePhone(form.phoneNumber),
      university:          validateMonthYear(form.university),
      presentClass:        validateMinMax(form.presentClass, 'Present class', 1, 20, true),
      nameOfThePresentClass: validateMonthYear(form.nameOfThePresentClass),
      durationOfCourse:    validateDuration(form.durationOfCourse),
      graduateCourse:      validateNoOfYears(form.graduateCourse),
      pgCourse:            validateNoOfYears(form.pgCourse),
      presentCourse:       validatePresentCourse(form.presentCourse),
      nameOfExam:          validateExamName(form.nameOfExam),
      dateAndYear:         validateMonthYear(form.dateAndYear),
      previousCourse:      validatePrevCourse(form.previousCourse),
    };
    setErrors(next);
    return Object.values(next).every((e) => !e);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const MIN = 200 * 1024;
    const MAX = 1 * 1024 * 1024;
    if (file.size < MIN) {
      addToast('Photo must be at least 200 KB', 'error');
      e.target.value = '';
      return;
    }
    if (file.size > MAX) {
      addToast('Photo must be no larger than 1 MB', 'error');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropSrc(reader.result);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropConfirm = useCallback(async () => {
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      setImageFile(file);
      setImagePreview(URL.createObjectURL(blob));
      setShowCrop(false);
      setCropSrc(null);
    } catch {
      addToast('Failed to crop image', 'error');
    }
  }, [cropSrc, croppedAreaPixels]);

  const handleCropCancel = () => {
    setShowCrop(false);
    setCropSrc(null);
  };

  const handleRemovePhoto = () => {
    setImageFile(null);
    setImagePreview(null);
    setCurrentImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const idCardUrl = `http://115.245.30.252:10108/photoUpdation/view/stu_pics/${form.rollNo}.jpg`;

  const handleOpenIdCardPreview = async () => {
    if (!form.rollNo) {
      addToast('Please enter the roll number first', 'error');
      return;
    }
    // Revoke any previous blob URL
    if (idCardBlobUrl) URL.revokeObjectURL(idCardBlobUrl);
    setIdCardBlobUrl(null);
    setIdCardBlob(null);
    setShowIdCardPreview(true);
    setIdCardLoading(true);
    try {
      const res = await fetchProxyImage(idCardUrl);
      const blob = res.data;
      setIdCardBlob(blob);
      setIdCardBlobUrl(URL.createObjectURL(blob));
    } catch {
      // blob stays null — modal will show "not found" state
    } finally {
      setIdCardLoading(false);
    }
  };

  const handleIdCardCancel = () => {
    setShowIdCardPreview(false);
    if (idCardBlobUrl) URL.revokeObjectURL(idCardBlobUrl);
    setIdCardBlobUrl(null);
    setIdCardBlob(null);
  };

  const handleIdCardConfirm = () => {
    if (!idCardBlob) {
      addToast('Photo could not be loaded — check the roll number', 'error');
      return;
    }
    const file = new File([idCardBlob], `${form.rollNo}.jpg`, { type: 'image/jpeg' });
    setImageFile(file);
    setImagePreview(idCardBlobUrl);
    setIdCardBlobUrl(null);   // transferred ownership — don't revoke
    setIdCardBlob(null);
    setCurrentImage(null);
    setShowIdCardPreview(false);
    addToast('ID card photo applied');
  };

  // Step 1 — validate and show preview
  const handleSubmit = (e) => {
    e.preventDefault();
    const next = {
      year:           validateYear(form.year),
      rollNo:         validateRollNo(form.rollNo),
      gender:         validateGender(form.gender),
      shift:          validateShift(form.shift),
      studentType:    validateStudentType(form.studentType),
      dayType:        validateDayType(form.dayType),
      hostelName:     validateHostelName(form.hostelName, form.dayType),
      nameOfTheGame:  validateGame(form.nameOfTheGame),
      bloodGroup:     validateBloodGroup(form.bloodGroup),
      studentName:    validatePersonName(form.studentName, 'Sportsperson name'),
      fatherName:     validatePersonName(form.fatherName, "Father's name"),
      motherName:     validatePersonName(form.motherName, "Mother's name"),
      dob:            validateDob(form.dob),
      address:        validateAddress(form.address),
      aadharNumber:        validateAadhar(form.aadharNumber),
      phoneNumber:         validatePhone(form.phoneNumber),
      university:          validateMonthYear(form.university),
      presentClass:        validateMinMax(form.presentClass, 'Present class', 1, 20, true),
      nameOfThePresentClass: validateMonthYear(form.nameOfThePresentClass),
      durationOfCourse:    validateDuration(form.durationOfCourse),
      graduateCourse:      validateNoOfYears(form.graduateCourse),
      pgCourse:            validateNoOfYears(form.pgCourse),
      presentCourse:       validatePresentCourse(form.presentCourse),
      nameOfExam:          validateExamName(form.nameOfExam),
      dateAndYear:         validateMonthYear(form.dateAndYear),
      previousCourse:      validatePrevCourse(form.previousCourse),
    };
    setErrors(next);
    const hasErrors = Object.values(next).some(Boolean);
    if (hasErrors) {
      addToast('Please fix the errors before submitting', 'error');
      // Scroll to the first field with an error (in visual top-to-bottom order)
      const fieldOrder = [
        'year','rollNo','nameOfTheGame','bloodGroup','gender','shift',
        'studentType','dayType','hostelName',
        'studentName','dob','fatherName','motherName','aadharNumber','phoneNumber','address',
        'nameOfExam','dateAndYear',
        'presentClass','nameOfThePresentClass','durationOfCourse',
        'university','presentCourse',
        'graduateCourse','pgCourse',
        'previousCourse',
      ];
      const firstErrorKey = fieldOrder.find((k) => next[k]);
      if (firstErrorKey) {
        setTimeout(() => {
          const el = document.getElementById(`field-${firstErrorKey}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
      return;
    }
    setShowPreview(true);
    window.scrollTo({ top: 0 });
  };

  // Delete student (edit mode only)
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudent(id);
      addToast('Student deleted successfully');
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete student', 'error');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // Step 2 — called from preview overlay: actually save
  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile)        fd.append('image',          imageFile);
      if (aadhaarFile)      fd.append('aadhaarPdf',     aadhaarFile);
      if (idCardFile)       fd.append('idCardPdf',      idCardFile);
      if (marksheetFile)    fd.append('marksheetPdf',   marksheetFile);
      if (feesReceiptFile)  fd.append('feesReceiptPdf', feesReceiptFile);
      if (isEdit) {
        await updateStudent(id, fd);
        addToast('Student updated successfully');
      } else {
        const res = await createStudent(fd);
        addToast(res.data.message);
      }
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save student', 'error');
      setShowPreview(false);   // go back to form so user can fix / retry
    } finally {
      setLoading(false);
    }
  };

  /* ── option lists ── */

  const yearOptions       = managedOpts.year      ?? [...new Set([...DEFAULT_YEARS, ...(meta.years || [])])].sort();
  const gameOptions       = managedOpts.game      ?? [...new Set([...DEFAULT_GAMES, ...(meta.games || [])])];
  const deptOptions       = managedOpts.dept      ?? [...new Set([...(meta.departments || [])])];
  const universityOptions = managedOpts.university?? [...new Set([...DEFAULT_UNIVERSITIES, ...(meta.universities || [])])];
  const classOptions      = managedOpts.class     ?? DEFAULT_CLASSES;
  const durationOptions   = managedOpts.duration  ?? DEFAULT_DURATIONS;
  const iutOptions        = managedOpts.iut       ?? ['NIL', ...DEFAULT_DURATIONS];
  const courseOptions     = managedOpts.course    ?? [...new Set([...DEFAULT_COURSES, ...(meta.courses || [])])];
  const examOptions       = managedOpts.exam      ?? DEFAULT_EXAMS;
  const monthYearOptions  = managedOpts.monthYear ?? DEFAULT_MONTH_YEARS;
  const hostelOptions     = managedOpts.hostel    ?? [...new Set([...DEFAULT_HOSTELS, ...(meta.hostels || [])])];
  const bloodGroupOptions = managedOpts.bloodGroup ?? DEFAULT_BLOOD_GROUPS;

  /* ── Managed-options helpers ── */
  const mkEdit = (key, curOpts, ...fks) => async (old, nv) => {
    setManagedOpts((p) => ({ ...p, [key]: curOpts.map((o) => (o === old ? nv : o)) }));
    fks.forEach((fk) => { if (form[fk] === old) set(fk)(nv); });
    try {
      await renameOption({ key, oldValue: old, newValue: nv });
      addToast('Option updated in all student records');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update option', 'error');
    }
  };
  const mkDel = (key, curOpts, ...fks) => async (opt) => {
    try {
      const isConfirmed = pendingDelete?.key === key && pendingDelete?.value === opt;
      const check = await deleteOption({ key, value: opt, confirmed: isConfirmed });
      if (check.data.requiresConfirmation) {
        setPendingDelete({ key, value: opt });
        setDeleteWarning(check.data.used
          ? `This option is used by ${check.data.used} student(s). Confirm delete to change their data to Unknown.`
          : 'This option is not currently used. Confirm delete to remove it from the option list.');
        return false;
      }
      setPendingDelete(null);
      setDeleteWarning('');
      setManagedOpts((p) => ({ ...p, [key]: curOpts.filter((o) => o !== opt) }));
      fks.forEach((fk) => { if (form[fk] === opt) set(fk)('Unknown'); });
      addToast('Option deleted; affected records set to Unknown');
      return true;
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete option', 'error');
      return false;
    }
  };

  /* ── early return ── */

  if (fetching) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading student…" />
    </div>
  );

  const photoSrc = imagePreview || (currentImage ? `/uploads/${currentImage}` : null);

  /* ─────────────────────────── Render ──────────────────────────────────── */

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link to="/" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Student' : 'Add New Student'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isEdit ? 'Update the student information below' : 'Fill in the details to register a new sportsperson'}
            </p>
          </div>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-shrink-0 flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />Delete
          </button>
        )}
      </div>

      {/* Delete confirm modal — edit mode */}
      {isEdit && showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Delete Student</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Are you sure you want to delete <strong>{form.studentName || 'this student'}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="btn-secondary text-sm px-5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {!isEdit && user?.role !== 'admin' && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            ℹ️ Your submission will be reviewed by an admin before appearing in the records.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* ── Passport Photo ──────────────────────────────────────────────── */}
        <div className="card p-6">
          <h3 className="section-title">Passport Size Photo</h3>
          <div className="flex items-start gap-6">
            {photoSrc ? (
              <img src={photoSrc} alt="Student"
                className="w-24 h-28 object-cover rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm" />
            ) : (
              <div className="w-24 h-28 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                {photoSrc ? 'Change Photo' : 'Upload Photo'}
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleImageChange} className="hidden" />
              </label>
              <button
                type="button"
                onClick={handleOpenIdCardPreview}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                <User className="w-4 h-4" />
                Use ID Card Photo
              </button>
              {photoSrc && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Photo
                </button>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG or PNG · 200 KB – 1 MB</p>
            </div>
          </div>
        </div>

        {/* ── Crop Modal ──────────────────────────────────────────────────── */}
        {showCrop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Crop Photo</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Drag to reposition · scroll to zoom</p>
                </div>
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Crop area */}
              <div className="relative w-full" style={{ height: 340 }}>
                <Cropper
                  image={cropSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={3 / 4}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                  style={{ containerStyle: { borderRadius: 0 } }}
                />
              </div>

              {/* Zoom slider */}
              <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="range" min={1} max={3} step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-blue-500 h-1.5 rounded-full cursor-pointer"
                />
                <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleCropCancel}
                  className="btn-secondary text-sm px-5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropConfirm}
                  className="btn-primary text-sm px-5 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Apply Crop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ID Card Photo Preview Modal ──────────────────────────────────── */}
        {showIdCardPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">ID Card Photo</h2>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Roll No: {form.rollNo}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIdCardPreview(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* URL display */}
              <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Source URL</p>
                <a
                  href={idCardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 dark:text-blue-400 break-all hover:underline"
                >
                  {idCardUrl}
                </a>
              </div>

              {/* Photo preview */}
              <div className="flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/50 min-h-[200px]">
                {idCardLoading ? (
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-xs">Loading photo…</p>
                  </div>
                ) : idCardBlobUrl ? (
                  <img
                    src={idCardBlobUrl}
                    alt={`ID card photo for ${form.rollNo}`}
                    className="w-36 h-44 object-cover rounded-lg border-2 border-blue-200 dark:border-blue-700 shadow"
                  />
                ) : (
                  <div className="w-36 h-44 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center flex-col gap-2 text-center px-3">
                    <User className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                    <p className="text-xs text-gray-400 dark:text-gray-500">Photo not found for this roll number</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={handleIdCardCancel}
                  className="btn-secondary text-sm px-5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleIdCardConfirm}
                  disabled={idCardLoading || !idCardBlobUrl}
                  className="btn-primary text-sm px-5 flex items-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Use This Photo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Basic Information ───────────────────────────────────────────── */}
        <Section title="Basic Information">

          {/* Academic Year */}
          <Field label="Academic Year" required id="field-year">
            <ComboBox
              value={form.year}
              onChange={(v) => { set('year')(v); touch('year', v); }}
              options={yearOptions}
              placeholder="Select or add new academic year"
              required
              error={errors.year}
              sanitizer={sanitizeYear}
              maxLength={9}
              minCreate={9}
              onEditOption={mkEdit('year', yearOptions, 'year')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('year', yearOptions, 'year')}
            />
            <FieldMeta value={form.year} max={9} always error={errors.year} />
          </Field>

          {/* Roll Number */}
          <Field label="Roll Number" required id="field-rollNo">
            <input
              className={`input-field ${errors.rollNo ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Enter 9-12 digit roll number"
              value={form.rollNo}
              inputMode="numeric"
              onChange={(e) => {
                const v = sanitizeRollNo(e.target.value);
                set('rollNo')(v);
                touch('rollNo', v);
              }}
              onBlur={() => touch('rollNo', form.rollNo)}
            />
            <FieldMeta value={form.rollNo} max={12} always error={errors.rollNo} />
          </Field>

          {/* Name of the Game */}
          <Field label="Name of the Game" required id="field-nameOfTheGame">
            <ComboBox
              value={form.nameOfTheGame}
              onChange={(v) => { set('nameOfTheGame')(v); touch('nameOfTheGame', v); }}
              options={gameOptions}
              placeholder="Select or add new game"
              required
              error={errors.nameOfTheGame}
              sanitizer={sanitizeGame}
              maxLength={30}
              minCreate={3}
              onEditOption={mkEdit('game', gameOptions, 'nameOfTheGame')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('game', gameOptions, 'nameOfTheGame')}
            />
            <FieldMeta value={form.nameOfTheGame} max={30} always error={errors.nameOfTheGame} />
          </Field>

          {/* Blood Group */}
          <Field label="Blood Group" required id="field-bloodGroup">
            <ComboBox
              value={form.bloodGroup}
              onChange={(v) => { set('bloodGroup')(v); touch('bloodGroup', v); }}
              options={bloodGroupOptions}
              placeholder="Select or add blood group"
              required
              error={errors.bloodGroup}
              sanitizer={sanitizeBloodGroup}
              maxLength={3}
              minCreate={2}
              onEditOption={mkEdit('bloodGroup', bloodGroupOptions, 'bloodGroup')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('bloodGroup', bloodGroupOptions, 'bloodGroup')}
            />
            <FieldMeta value={form.bloodGroup} max={3} always error={errors.bloodGroup} />
          </Field>

          {/* Gender */}
          <Field label="Gender" required span={3} id="field-gender">
            <div className="space-y-2">
              <div className="flex gap-2 mt-1">
                {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                  <label
                    key={g}
                    className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-150 backdrop-blur-sm border select-none ${
                      form.gender === g
                        ? 'bg-blue-500/20 dark:bg-blue-500/25 border-blue-400/60 dark:border-blue-400/50 shadow-sm shadow-blue-500/20'
                        : errors.gender
                          ? 'bg-white/40 dark:bg-gray-800/40 border-red-300/70 dark:border-red-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                          : 'bg-white/40 dark:bg-gray-800/40 border-gray-300/50 dark:border-gray-600/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-300/60'
                    }`}
                  >
                    <input type="radio" name="gender" value={g} checked={form.gender === g}
                      onChange={() => { set('gender')(g); touch('gender', g); }} className="sr-only" />
                    {/* Checkbox square */}
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      form.gender === g
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 dark:border-gray-500 bg-transparent'
                    }`}>
                      {form.gender === g && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      form.gender === g ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                    }`}>{g}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between min-h-[1rem]">
                {errors.gender
                  ? <span className="text-xs text-red-500">{errors.gender}</span>
                  : <span />}
                {form.gender && (
                  <button
                    type="button"
                    onClick={() => { set('gender')(''); touch('gender', ''); }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" /> Unselect
                  </button>
                )}
              </div>
            </div>
          </Field>

          {/* Student Type */}
          <Field label="Student Type" required span={3} id="field-studentType">
            <div className="space-y-2">
              <div className="flex gap-2 mt-1">
                {['AIDED', 'SELF-FINANCE'].map((t) => (
                  <label
                    key={t}
                    className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-150 backdrop-blur-sm border select-none ${
                      form.studentType === t
                        ? 'bg-blue-500/20 dark:bg-blue-500/25 border-blue-400/60 dark:border-blue-400/50 shadow-sm shadow-blue-500/20'
                        : errors.studentType
                          ? 'bg-white/40 dark:bg-gray-800/40 border-red-300/70 dark:border-red-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                          : 'bg-white/40 dark:bg-gray-800/40 border-gray-300/50 dark:border-gray-600/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-300/60'
                    }`}
                  >
                    <input type="radio" name="studentType" value={t} checked={form.studentType === t}
                      onChange={() => { set('studentType')(t); touch('studentType', t); }} className="sr-only" />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      form.studentType === t ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-500 bg-transparent'
                    }`}>
                      {form.studentType === t && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${form.studentType === t ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>{t}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between min-h-[1rem]">
                {errors.studentType ? <span className="text-xs text-red-500">{errors.studentType}</span> : <span />}
                {form.studentType && (
                  <button type="button" onClick={() => { set('studentType')(''); touch('studentType', ''); }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" /> Unselect
                  </button>
                )}
              </div>
            </div>
          </Field>

          {/* Day Scholar / Hosteller */}
          <Field label="Day Scholar / Hosteller" required span={3} id="field-dayType">
            <div className="space-y-2">
              <div className="flex gap-2 mt-1">
                {['DAYSCHOLAR', 'HOSTELLER'].map((t) => (
                  <label
                    key={t}
                    className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-150 backdrop-blur-sm border select-none ${
                      form.dayType === t
                        ? 'bg-blue-500/20 dark:bg-blue-500/25 border-blue-400/60 dark:border-blue-400/50 shadow-sm shadow-blue-500/20'
                        : errors.dayType
                          ? 'bg-white/40 dark:bg-gray-800/40 border-red-300/70 dark:border-red-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                          : 'bg-white/40 dark:bg-gray-800/40 border-gray-300/50 dark:border-gray-600/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-300/60'
                    }`}
                  >
                    <input type="radio" name="dayType" value={t} checked={form.dayType === t}
                      onChange={() => {
                        set('dayType')(t);
                        touch('dayType', t);
                        if (t === 'DAYSCHOLAR') { set('hostelName')(''); setErrors((e) => ({ ...e, hostelName: '' })); }
                      }} className="sr-only" />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      form.dayType === t ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-500 bg-transparent'
                    }`}>
                      {form.dayType === t && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${form.dayType === t ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>{t}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between min-h-[1rem]">
                {errors.dayType ? <span className="text-xs text-red-500">{errors.dayType}</span> : <span />}
                {form.dayType && (
                  <button type="button" onClick={() => { set('dayType')(''); set('hostelName')(''); setErrors((e) => ({ ...e, dayType: '', hostelName: '' })); }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" /> Unselect
                  </button>
                )}
              </div>
            </div>
          </Field>

          {/* Shift */}
          <Field label="Shift" required span={3} id="field-shift">
            <div className="space-y-2">
              <div className="flex gap-2 mt-1">
                {['MORNING', 'EVENING'].map((s) => (
                  <label
                    key={s}
                    className={`flex-1 flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-150 backdrop-blur-sm border select-none ${
                      form.shift === s
                        ? 'bg-blue-500/20 dark:bg-blue-500/25 border-blue-400/60 dark:border-blue-400/50 shadow-sm shadow-blue-500/20'
                        : errors.shift
                          ? 'bg-white/40 dark:bg-gray-800/40 border-red-300/70 dark:border-red-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20'
                          : 'bg-white/40 dark:bg-gray-800/40 border-gray-300/50 dark:border-gray-600/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-300/60'
                    }`}
                  >
                    <input type="radio" name="shift" value={s} checked={form.shift === s}
                      onChange={() => { set('shift')(s); touch('shift', s); }} className="sr-only" />
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      form.shift === s ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-500 bg-transparent'
                    }`}>
                      {form.shift === s && (
                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${form.shift === s ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>{s}</span>
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between min-h-[1rem]">
                {errors.shift ? <span className="text-xs text-red-500">{errors.shift}</span> : <span />}
                {form.shift && (
                  <button type="button" onClick={() => { set('shift')(''); touch('shift', ''); }}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" /> Unselect
                  </button>
                )}
              </div>
            </div>
          </Field>

          {/* Hostel Name — only when HOSTELLER */}
          {form.dayType === 'HOSTELLER' && (
            <Field label="Hostel Name" required span={3} id="field-hostelName">
              <ComboBox
                value={form.hostelName}
                onChange={(v) => { set('hostelName')(v); touch('hostelName', v); }}
                options={hostelOptions}
                placeholder="Select or Add Hostel Name"
                required
                error={errors.hostelName}
                sanitizer={sanitizeAcademic}
                maxLength={50}
                minCreate={3}
                onEditOption={mkEdit('hostel', hostelOptions, 'hostelName')}
                deleteWarning={deleteWarning} onDeleteOption={mkDel('hostel', hostelOptions, 'hostelName')}
              />
              <FieldMeta value={form.hostelName} max={50} always error={errors.hostelName} />
            </Field>
          )}

        </Section>

        {/* ── Personal Details ────────────────────────────────────────────── */}
        <Section title="Personal Details">

          {/* Name of Sportsperson */}
          <Field label="Name of Sportsperson" required span={2} id="field-studentName">
            <input
              className={`input-field ${errors.studentName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Enter your name as per aadhar card"
              value={form.studentName}
              maxLength={50}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('studentName')(v);
                touch('studentName', v);
              }}
              onBlur={() => touch('studentName', form.studentName)}
            />
            <FieldMeta value={form.studentName} max={50} always error={errors.studentName} />
          </Field>

          {/* Date of Birth */}
          <Field label="Date of Birth" required id="field-dob">
            <div className="relative">
              <input
                type="date"
                className={`input-field pr-8 ${errors.dob ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
                value={form.dob}
                onChange={(e) => { set('dob')(e.target.value); touch('dob', e.target.value); }}
                onBlur={() => touch('dob', form.dob)}
              />
              {form.dob && (
                <button
                  type="button"
                  onClick={() => { set('dob')(''); touch('dob', ''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob}</p>}
          </Field>

          {/* Father Name */}
          <Field label="Father Name" required id="field-fatherName">
            <input
              className={`input-field ${errors.fatherName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Enter your father name as per aadhar card"
              value={form.fatherName}
              maxLength={50}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('fatherName')(v);
                touch('fatherName', v);
              }}
              onBlur={() => touch('fatherName', form.fatherName)}
            />
            <FieldMeta value={form.fatherName} max={50} always error={errors.fatherName} />
          </Field>

          {/* Mother Name */}
          <Field label="Mother Name" required id="field-motherName">
            <input
              className={`input-field ${errors.motherName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Enter your mother name"
              value={form.motherName}
              maxLength={50}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('motherName')(v);
                touch('motherName', v);
              }}
              onBlur={() => touch('motherName', form.motherName)}
            />
            <FieldMeta value={form.motherName} max={50} always error={errors.motherName} />
          </Field>

          {/* Aadhar Card Number */}
          <Field label="Aadhar Card Number" required id="field-aadharNumber">
            <input
              className={`input-field ${errors.aadharNumber ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Enter your 12-digit aadhar card number"
              value={form.aadharNumber}
              inputMode="numeric"
              maxLength={12}
              onChange={(e) => {
                const v = sanitizeDigits(e.target.value, 12);
                set('aadharNumber')(v);
                touch('aadharNumber', v);
              }}
              onBlur={() => touch('aadharNumber', form.aadharNumber)}
            />
            <FieldMeta value={form.aadharNumber} max={12} always error={errors.aadharNumber} />
          </Field>

          {/* Phone Number */}
          <Field label="Phone Number" required id="field-phoneNumber">
            <input
              className={`input-field ${errors.phoneNumber ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Enter your 10-digit mobile number"
              value={form.phoneNumber}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => {
                const v = sanitizeDigits(e.target.value, 10);
                set('phoneNumber')(v);
                touch('phoneNumber', v);
              }}
              onBlur={() => touch('phoneNumber', form.phoneNumber)}
            />
            <FieldMeta value={form.phoneNumber} max={10} always error={errors.phoneNumber} />
          </Field>

          {/* Address */}
          <Field label="Address" required span={2} id="field-address">
            <textarea
              className={`input-field ${errors.address ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              rows={3}
              placeholder="Enter your full address"
              value={form.address}
              maxLength={200}
              onChange={(e) => {
                const v = sanitizeAddress(e.target.value);
                set('address')(v);
                touch('address', v);
              }}
              onBlur={() => touch('address', form.address)}
            />
            <FieldMeta value={form.address} max={200} always error={errors.address} />
          </Field>

          {/* Aadhaar Card Upload — optional; unlocks once required fields are filled */}
          <div className="col-span-full">
            <label className="label">
              Aadhaar Card PDF
              <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>

            {/* Edit mode: show existing PDF with delete button */}
            {isEdit && currentAadhaarPdf && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20 px-4 py-3">
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    Stored Aadhaar PDF
                  </p>
                  <a
                    href={`/uploads/${currentAadhaarPdf}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                  >
                    View current PDF
                  </a>
                </div>
                <button
                  type="button"
                  disabled={deletingAadhaar}
                  onClick={async () => {
                    if (!window.confirm('Delete the stored Aadhaar PDF? This cannot be undone.')) return;
                    setDeletingAadhaar(true);
                    try {
                      await deleteStudentAadhaar(id);
                      setCurrentAadhaarPdf(null);
                      addToast('Aadhaar PDF deleted');
                    } catch {
                      addToast('Failed to delete Aadhaar PDF', 'error');
                    } finally {
                      setDeletingAadhaar(false);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-red-200 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deletingAadhaar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deletingAadhaar ? 'Deleting…' : 'Delete PDF'}
                </button>
              </div>
            )}

            <AadhaarUpload
              onValidationChange={setAadhaarValidated}
              onFileChange={setAadhaarFile}
              locked={!(
                form.studentName.trim() &&
                form.fatherName.trim() &&
                form.motherName.trim() &&
                form.dob.trim() &&
                form.phoneNumber.trim().length === 10 &&
                form.address.trim()
              )}
            />
          </div>

          {/* ID Card PDF Upload */}
          <div className="col-span-full">
            <label className="label">
              ID Card PDF
              <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>

            {/* Edit mode: show existing PDF with delete button */}
            {isEdit && currentIdCardPdf && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20 px-4 py-3">
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    Stored ID Card PDF
                  </p>
                  <a
                    href={`/uploads/${currentIdCardPdf}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                  >
                    View current PDF
                  </a>
                </div>
                <button
                  type="button"
                  disabled={deletingIdCard}
                  onClick={async () => {
                    if (!window.confirm('Delete the stored ID Card PDF? This cannot be undone.')) return;
                    setDeletingIdCard(true);
                    try {
                      await deleteStudentIdCard(id);
                      setCurrentIdCardPdf(null);
                      addToast('ID Card PDF deleted');
                    } catch {
                      addToast('Failed to delete ID Card PDF', 'error');
                    } finally {
                      setDeletingIdCard(false);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-red-200 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deletingIdCard ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deletingIdCard ? 'Deleting…' : 'Delete PDF'}
                </button>
              </div>
            )}

            <IdCardUpload
              onValidationChange={setIdCardValidated}
              onFileChange={setIdCardFile}
              locked={!(
                form.studentName.trim() &&
                form.fatherName.trim() &&
                form.motherName.trim() &&
                form.dob.trim() &&
                form.phoneNumber.trim().length === 10 &&
                form.address.trim()
              )}
            />
          </div>

        </Section>

        {/* ── Qualifying Examination ──────────────────────────────────────── */}
        <Section title="Examination for First Admission to a College or University">
          <Field label="Name of Exam" required id="field-nameOfExam">
            <ComboBox
              value={form.nameOfExam}
              onChange={(v) => { set('nameOfExam')(v); touch('nameOfExam', v); }}
              options={examOptions}
              placeholder="Select or add new Exam name"
              required
              error={errors.nameOfExam}
              sanitizer={sanitizeExamName}
              maxLength={40}
              minCreate={3}
              onEditOption={mkEdit('exam', examOptions, 'nameOfExam')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('exam', examOptions, 'nameOfExam')}
            />
            <FieldMeta value={form.nameOfExam} max={40} always error={errors.nameOfExam} />
          </Field>
          <Field label="Month & Year of Passing" required id="field-dateAndYear">
            <ComboBox
              value={form.dateAndYear}
              onChange={(v) => { set('dateAndYear')(v); touch('dateAndYear', v); }}
              options={monthYearOptions}
              placeholder="Select or add new month & year"
              required
              error={errors.dateAndYear}
              sanitizer={sanitizeMonthYear}
              maxLength={14}
              minCreate={3}
              onEditOption={mkEdit('monthYear', monthYearOptions, 'dateAndYear', 'university', 'nameOfThePresentClass')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('monthYear', monthYearOptions, 'dateAndYear', 'university', 'nameOfThePresentClass')}
            />
            <FieldMeta value={form.dateAndYear} max={14} always error={errors.dateAndYear} />
          </Field>

          {/* +2 Marksheet PDF Upload */}
          <div className="col-span-full">
            <label className="label">
              +2 Marksheet PDF
              <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>

            {/* Edit mode: show existing PDF with delete button */}
            {isEdit && currentMarksheetPdf && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20 px-4 py-3">
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    Stored +2 Marksheet PDF
                  </p>
                  <a
                    href={`/uploads/${currentMarksheetPdf}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                  >
                    View current PDF
                  </a>
                </div>
                <button
                  type="button"
                  disabled={deletingMarksheet}
                  onClick={async () => {
                    if (!window.confirm('Delete the stored +2 Marksheet PDF? This cannot be undone.')) return;
                    setDeletingMarksheet(true);
                    try {
                      await deleteStudentMarksheet(id);
                      setCurrentMarksheetPdf(null);
                      addToast('+2 Marksheet PDF deleted');
                    } catch {
                      addToast('Failed to delete +2 Marksheet PDF', 'error');
                    } finally {
                      setDeletingMarksheet(false);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-red-200 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deletingMarksheet ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deletingMarksheet ? 'Deleting…' : 'Delete PDF'}
                </button>
              </div>
            )}

            <MarksheetUpload
              onValidationChange={setMarksheetValidated}
              onFileChange={setMarksheetFile}
            />
          </div>

        </Section>

        {/* ── Academic Details ( Currently ) ──────────────────────────────── */}
        <Section title="Academic Details ( Currently )">

          {/* Present Class */}
          <Field label="Present Class" required id="field-presentClass">
            <ComboBox
              value={form.presentClass}
              onChange={(v) => { set('presentClass')(v); touch('presentClass', v); }}
              options={classOptions}
              placeholder="Select or Add new Class"
              error={errors.presentClass}
              sanitizer={sanitizePresentClass}
              maxLength={20}
              minCreate={1}
              validateAdd={(v) => v.endsWith('-') || v.endsWith('.') ? 'Format incomplete — add text after the dash' : ''}
              onEditOption={mkEdit('class', classOptions, 'presentClass')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('class', classOptions, 'presentClass')}
            />
            <FieldMeta value={form.presentClass} max={20} always error={errors.presentClass} />
          </Field>

          {/* Name of Present Course */}
          <Field label="Name of Present Course" required id="field-nameOfThePresentClass">
            <ComboBox
              value={form.presentCourse}
              onChange={(v) => { set('presentCourse')(v); touch('presentCourse', v); }}
              options={courseOptions}
              placeholder="Select or Add new Course"
              required
              error={errors.presentCourse}
              sanitizer={sanitizePresentCourse}
              maxLength={30}
              minCreate={2}
              onEditOption={mkEdit('course', courseOptions, 'presentCourse')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('course', courseOptions, 'presentCourse')}
            />
            <FieldMeta value={form.presentCourse} max={30} always error={errors.presentCourse} />
          </Field>

          {/* Duration of Course */}
          <Field label="Duration of Course" required id="field-durationOfCourse">
            <ComboBox
              value={form.durationOfCourse}
              onChange={(v) => { set('durationOfCourse')(v); touch('durationOfCourse', v); }}
              options={durationOptions}
              placeholder="Select or Add new Course Duration"
              error={errors.durationOfCourse}
              sanitizer={sanitizeDuration}
              maxLength={7}
              minCreate={1}
              onEditOption={mkEdit('duration', durationOptions, 'durationOfCourse')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('duration', durationOptions, 'durationOfCourse')}
            />
            <FieldMeta value={form.durationOfCourse} max={7} always error={errors.durationOfCourse} />
          </Field>

          {/* UG/PG Admission Fees Receipt PDF Upload */}
          <div className="col-span-full">
            <label className="label">
              UG/PG Admission Fees Receipt PDF
              <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
            </label>

            {isEdit && currentFeesReceiptPdf && (
              <div className="mb-3 flex items-center gap-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-900/20 px-4 py-3">
                <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    Stored Fees Receipt PDF
                  </p>
                  <a
                    href={`/uploads/${currentFeesReceiptPdf}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                  >
                    View current PDF
                  </a>
                </div>
                <button
                  type="button"
                  disabled={deletingFeesReceipt}
                  onClick={async () => {
                    if (!window.confirm('Delete the stored Fees Receipt PDF? This cannot be undone.')) return;
                    setDeletingFeesReceipt(true);
                    try {
                      await deleteStudentFeesReceipt(id);
                      setCurrentFeesReceiptPdf(null);
                      addToast('Fees Receipt PDF deleted');
                    } catch {
                      addToast('Failed to delete Fees Receipt PDF', 'error');
                    } finally {
                      setDeletingFeesReceipt(false);
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-red-200 dark:border-red-700 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                >
                  {deletingFeesReceipt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {deletingFeesReceipt ? 'Deleting…' : 'Delete PDF'}
                </button>
              </div>
            )}

            <FeesReceiptUpload
              onValidationChange={setFeesReceiptValidated}
              onFileChange={setFeesReceiptFile}
            />
          </div>

        </Section>

        {/* ── Month & Year of First Admission to ──────────────────────────── */}
        <div className="card p-6 space-y-4">
          <h3 className="section-title">Month &amp; Year of First Admission to</h3>

          <div className="grid grid-cols-2 gap-4">
            {/* University box */}
            <div className="p-4">
              <Field label="University ( month &amp; Year )" required id="field-university">
                <ComboBox
                  value={form.university}
                  onChange={(v) => { set('university')(v); touch('university', v); }}
                  options={monthYearOptions}
                  placeholder="Select or Add new Month & Year"
                  required
                  error={errors.university}
                  sanitizer={sanitizeMonthYear}
                  maxLength={14}
                  minCreate={3}
                  onEditOption={mkEdit('monthYear', monthYearOptions, 'dateAndYear', 'university', 'nameOfThePresentClass')}
                  deleteWarning={deleteWarning} onDeleteOption={mkDel('monthYear', monthYearOptions, 'dateAndYear', 'university', 'nameOfThePresentClass')}
                />
                <FieldMeta value={form.university} max={14} always error={errors.university} />
              </Field>
            </div>

            {/* Present Course box */}
            <div className="p-4">
              <Field label="Present Course ( month &amp; Year )" required id="field-presentCourse">
                <ComboBox
                  value={form.nameOfThePresentClass}
                  onChange={(v) => { set('nameOfThePresentClass')(v); touch('nameOfThePresentClass', v); }}
                  options={monthYearOptions}
                  placeholder="Select or Add new Month & Year"
                  required
                  error={errors.nameOfThePresentClass}
                  sanitizer={sanitizeMonthYear}
                  maxLength={14}
                  minCreate={3}
                  onEditOption={mkEdit('monthYear', monthYearOptions, 'dateAndYear', 'university', 'nameOfThePresentClass')}
                  deleteWarning={deleteWarning} onDeleteOption={mkDel('monthYear', monthYearOptions, 'dateAndYear', 'university', 'nameOfThePresentClass')}
                />
                <FieldMeta value={form.nameOfThePresentClass} max={14} always error={errors.nameOfThePresentClass} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── IUT Participation ───────────────────────────────────────────── */}
        <Section title="Previous IUT Participation (While Pursuing)">
          <Field label="Graduate Course (No. of years)" required id="field-graduateCourse">
            <ComboBox
              value={form.graduateCourse}
              onChange={(v) => { set('graduateCourse')(v); touch('graduateCourse', v); }}
              options={iutOptions}
              placeholder="Select or Add new No. of. years"
              required
              error={errors.graduateCourse}
              sanitizer={sanitizeDuration}
              maxLength={7}
              minCreate={1}
              onEditOption={mkEdit('iut', iutOptions, 'graduateCourse', 'pgCourse')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('iut', iutOptions, 'graduateCourse', 'pgCourse')}
            />
            <FieldMeta value={form.graduateCourse} max={7} always error={errors.graduateCourse} />
          </Field>
          <Field label="PG Course (No. of years)" required id="field-pgCourse">
            <ComboBox
              value={form.pgCourse}
              onChange={(v) => { set('pgCourse')(v); touch('pgCourse', v); }}
              options={iutOptions}
              placeholder="Select or Add new No. of. years"
              required
              error={errors.pgCourse}
              sanitizer={sanitizeDuration}
              maxLength={7}
              minCreate={1}
              onEditOption={mkEdit('iut', iutOptions, 'graduateCourse', 'pgCourse')}
              deleteWarning={deleteWarning} onDeleteOption={mkDel('iut', iutOptions, 'graduateCourse', 'pgCourse')}
            />
            <FieldMeta value={form.pgCourse} max={7} always error={errors.pgCourse} />
          </Field>
        </Section>

        {/* ── Change of Course / Faculty ──────────────────────────────────── */}
        <div id="field-previousCourse" className="card p-6">
          <h3 className="section-title">Details about change of course / faculty, if any <span className="normal-case font-normal">(Details about the previous / new – course / faculty)</span><span className="text-red-500 ml-1">*</span></h3>
          <div className="grid grid-cols-1">
            <div className="col-span-full">
              <textarea
                className={`input-field ${errors.previousCourse ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
                rows={3}
                placeholder=""
                maxLength={100}
                value={form.previousCourse}
                onChange={(e) => {
                  const v = sanitizePrevCourse(e.target.value);
                  set('previousCourse')(v);
                  touch('previousCourse', v);
                }}
                onBlur={() => touch('previousCourse', form.previousCourse)}
              />
              <FieldMeta value={form.previousCourse} max={100} always error={errors.previousCourse} />
            </div>
          </div>
        </div>

        {/* ── Sportsman Dress ─────────────────────────────────────────────── */}
        <Section title="Sportsman Dress">
          <Field label="T-Shirt Size (Optional)">
            <input
              className="input-field"
              type="number"
              placeholder="Enter Your T-Shirt Size"
              min="1"
              max="99"
              step="0.1"
              value={form.tshirt}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '' || /^\d{1,2}(\.\d?)?$/.test(raw)) {
                  setRaw('tshirt')({ target: { value: raw } });
                }
              }}
            />
            <FieldMeta value={String(form.tshirt)} max={2} always />
          </Field>
          <Field label="Track Size (Optional)">
            <input
              className="input-field"
              type="number"
              placeholder="Enter Your Track Size"
              min="1"
              max="99"
              step="0.1"
              value={form.track}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '' || /^\d{1,2}(\.\d?)?$/.test(raw)) {
                  setRaw('track')({ target: { value: raw } });
                }
              }}
            />
            <FieldMeta value={String(form.track)} max={2} always />
          </Field>
        </Section>

        {/* ── Submit ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2 px-8 py-2.5">
            {isEdit ? 'Preview & Update' : 'Preview & Submit'}
          </button>
          <Link to="/" className="btn-secondary text-sm">Cancel</Link>
        </div>

      </form>

      {/* ── Preview overlay (shown after validation passes) ── */}
      {showPreview && (
        <StudentPreviewOverlay
          form={form}
          imagePreview={imagePreview}
          currentImage={currentImage}
          aadhaarFile={aadhaarFile}
          idCardFile={idCardFile}
          marksheetFile={marksheetFile}
          feesReceiptFile={feesReceiptFile}
          currentAadhaarPdf={currentAadhaarPdf}
          currentIdCardPdf={currentIdCardPdf}
          currentMarksheetPdf={currentMarksheetPdf}
          currentFeesReceiptPdf={currentFeesReceiptPdf}
          isEdit={isEdit}
          loading={loading}
          onConfirm={handleConfirmSave}
          onBack={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
