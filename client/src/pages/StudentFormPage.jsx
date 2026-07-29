import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { createStudent, updateStudent, getStudent, getStudentMeta } from '../api';
import { ArrowLeft, Upload, Loader2, User, ChevronDown, X, Check, Plus } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

/* ─── Static option lists ──────────────────────────────────────────────────── */

const DEFAULT_GAMES = [
  'CRICKET','FOOTBALL','CHESS','BASKETBALL','VOLLEYBALL','HOCKEY',
  'TABLE TENNIS','BADMINTON','CROSS COUNTRY','FENCING & CYCLE','SWIMMING',
  'ARCHERY','TENNIS','KABADDI','ATHLETICS','KHO - KHO','BEST PHYSIQUE',
  'NETBALL','HANDBALL','BOXING','BALL BADMINTON','YOGASANA','TAEKWONDO','KARATE',
];

const DEFAULT_YEARS = (() => {
  const list = [];
  for (let y = 2018; y <= 2032; y++) list.push(`${y}-${y + 1}`);
  return list;
})();

const DEFAULT_CLASSES = [
  'I YEAR','II YEAR','III YEAR','IV YEAR','V YEAR',
];

const DEFAULT_DURATIONS = ['1','2','3','4','5','6','7','8'];

/* ─── Sanitisers ───────────────────────────────────────────────────────────── */

/** Strip non-digit/dash and cap at 9 chars (DDDD-DDDD) */
const sanitizeYear    = (v) => v.replace(/[^\d-]/g, '').slice(0, 9);
const sanitizeRollNo  = (v) => v.replace(/\D/g, '').slice(0, 12);
const sanitizeName    = (v) => v.replace(/[^a-zA-Z. ]/g, '').replace(/ {2,}/g, ' ');
/** Game: letters/digits/spaces + allowed specials: " \u201C \u201D ' \u2018 \u2019 ( ) & [ ] . , */
const sanitizeGame    = (v) => v.replace(/[^a-zA-Z0-9 "'\u201C\u201D\u2018\u2019()&[\].,]/g, '').replace(/ {2,}/g, ' ');
const sanitizeDigits  = (v, max) => v.replace(/\D/g, '').slice(0, max);
/** Address: letters/digits/spaces + allowed specials: " \u201C \u201D ' \u2018 \u2019 - _ | / \ & # @ ( ) ; : , [ ] */
const sanitizeAddress = (v) => v.replace(/[^a-zA-Z0-9 "'\u201C\u201D\u2018\u2019\-_|/\\&#@();:,[\]]/g, '').replace(/ {2,}/g, ' ');
/** Academic fields (class/dept/duration/course/university): letters/digits/spaces +
 *  allowed specials: [ ] ( ) : ; ' \u2018 \u2019 " \u201C \u201D / \ & # @ , . | */
const sanitizeAcademic = (v) => v.replace(/[^a-zA-Z0-9 [\]():;"'\u2018\u2019\u201C\u201D/\\&#@,.|]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '');
/** Class / dept / course: letters + numbers + single spaces, no leading space */
const sanitizeText    = (v) => v.replace(/[^a-zA-Z0-9 .]/g, '').replace(/ {2,}/g, ' ').replace(/^ /, '');
/** Like sanitizeText but allows special characters — for department, course names etc. */
const sanitizeTextSpl = (v) => v.replace(/ {2,}/g, ' ').replace(/^ /, '');

/* ─── Validators ───────────────────────────────────────────────────────────── */

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

const validateGame = (v) =>
  !v ? 'Name of the game is required' : '';

const validateMinMax = (v, label, min, max, required = false) =>
  (!v && required)      ? `${label} is required` :
  !v                    ? '' :
  v.trim().length < min ? `${label} must be at least ${min} character${min > 1 ? 's' : ''}` :
  v.length > max        ? `${label} must be at most ${max} characters` : '';

const validateUniversity = (v) => validateMinMax(v, 'University', 3, 50, true);

const validateDob = (v) =>
  !v ? 'Date of birth is required' : '';

const validateAddress = (v) =>
  !v || !v.trim() ? 'Address is required' : '';

const validateAadhar = (v) =>
  !v ? 'Aadhar number is required' :
  v.length !== 12 ? 'Aadhar must be exactly 12 digits' : '';

const validatePhone = (v) =>
  !v ? 'Phone number is required' :
  v.length !== 10 ? 'Phone must be exactly 10 digits' : '';

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
 * Single-value searchable combo box.
 * - Trigger button shows selected value / placeholder.
 * - Dropdown has a search input inside it.
 * - "Add …" option appears when typed text doesn't match any option.
 * - `sanitizer` is applied to the search input on every keystroke.
 */
/**
 * maxLength  – caps the search input (and therefore any new value) at this many chars
 * minCreate  – minimum typed length before the "Add …" option appears (default 1)
 */
function ComboBox({ value, onChange, options, placeholder, required, error, sanitizer, maxLength, minCreate = 1 }) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState('');
  const ref      = useRef(null);
  const searchRef = useRef(null);

  /* close on outside click */
  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  /* focus search box when dropdown opens */
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 0);
  }, [open]);

  const filtered   = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;
  const exactMatch = options.some((o) => o.toLowerCase() === search.toLowerCase());
  const trimmed    = search.trim();
  const showAdd    = trimmed.length >= minCreate &&
                     (!maxLength || trimmed.length <= maxLength) &&
                     !exactMatch;

  const select = (opt) => {
    onChange(opt);
    setSearch('');
    setOpen(false);
  };

  const handleSearchChange = (e) => {
    let v = e.target.value;
    if (sanitizer) v = sanitizer(v);
    setSearch(v);
    /* also push typed value to parent so validation sees it in real time */
    onChange(v);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setSearch(''); }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length === 1) select(filtered[0]);
      else if (showAdd) select(search.trim());
    }
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        required={required}
        className={`input-field flex items-center justify-between gap-2 text-left w-full min-h-[38px] ${
          error ? 'border-red-400 dark:border-red-500' : ''
        }`}
      >
        <span className="flex-1 min-w-0 truncate text-sm">
          {value
            ? <span className="text-gray-900 dark:text-gray-100">{value}</span>
            : <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>}
        </span>
        <span className="flex items-center gap-0.5 flex-shrink-0">
          {value && (
            <span
              onMouseDown={(e) => { e.stopPropagation(); clear(e); }}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
          {/* Search inside dropdown */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search…"
              maxLength={maxLength}
              className="w-full text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          {/* Options list */}
          <div className="max-h-52 overflow-y-auto multiselect-scroll">
            {filtered.length === 0 && !showAdd && (
              <p className="text-xs text-gray-400 text-center py-4">No options found</p>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(opt); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  value === opt
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {value === opt
                  ? <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 stroke-[3] flex-shrink-0" />
                  : <span className="w-3.5 flex-shrink-0" />}
                {opt}
              </button>
            ))}
            {showAdd && (
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); select(search.trim()); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-t border-gray-100 dark:border-gray-800"
              >
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                Add &ldquo;{search.trim()}&rdquo;
              </button>
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
function Field({ label, required, children, span }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : span === 3 ? 'col-span-full' : ''}>
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── Empty form state ─────────────────────────────────────────────────────── */

const empty = {
  year: '', rollNo: '', nameOfTheGame: '', gender: '',
  studentName: '', fatherName: '', motherName: '', dob: '',
  nameOfExam: '', dateAndYear: '',
  presentClass: '', nameOfThePresentClass: '', durationOfCourse: '',
  university: '', presentCourse: '',
  graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: '',
  address: '', phoneNumber: '', aadharNumber: '',
  tournament: '', tshirt: '', track: '',
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
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [meta, setMeta]         = useState({ departments: [], years: [], games: [] });

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
          previousCourse:        s.previousCourse          || '',
          address:               s.address                 || '',
          phoneNumber:           s.phoneNumber             || '',
          aadharNumber:          s.aadharNumber            || '',
          tournament:            s.tournament              || '',
          tshirt:                s.tshirt                  || '',
          track:                 s.track                   || '',
        });
        if (s.image) setCurrentImage(s.image);
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
      case 'nameOfTheGame':  msg = validateGame(value);                         break;
      case 'studentName':    msg = validatePersonName(value, 'Sportsperson name'); break;
      case 'fatherName':     msg = validatePersonName(value, "Father's name");  break;
      case 'motherName':     msg = validatePersonName(value, "Mother's name");  break;
      case 'dob':            msg = validateDob(value);                          break;
      case 'address':              msg = validateAddress(value);                                      break;
      case 'aadharNumber':         msg = validateAadhar(value);                                       break;
      case 'phoneNumber':          msg = validatePhone(value);                                        break;
      case 'university':           msg = validateUniversity(value);                                   break;
      case 'presentClass':         msg = validateMinMax(value, 'Present class', 1, 15, true);          break;
      case 'nameOfThePresentClass':msg = validateMinMax(value, 'Department', 3, 40, true);            break;
      case 'durationOfCourse':     msg = validateMinMax(value, 'Duration', 1, 15, true);              break;
      case 'presentCourse':        msg = validateMinMax(value, 'Present course', 3, 40, true);        break;
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
      nameOfTheGame:  validateGame(form.nameOfTheGame),
      studentName:    validatePersonName(form.studentName, 'Sportsperson name'),
      fatherName:     validatePersonName(form.fatherName, "Father's name"),
      motherName:     validatePersonName(form.motherName, "Mother's name"),
      dob:            validateDob(form.dob),
      address:        validateAddress(form.address),
      aadharNumber:        validateAadhar(form.aadharNumber),
      phoneNumber:         validatePhone(form.phoneNumber),
      university:          validateUniversity(form.university),
      presentClass:        validateMinMax(form.presentClass, 'Present class', 1, 15, true),
      nameOfThePresentClass: validateMinMax(form.nameOfThePresentClass, 'Department', 3, 40, true),
      durationOfCourse:    validateMinMax(form.durationOfCourse, 'Duration', 1, 15, true),
      presentCourse:       validateMinMax(form.presentCourse, 'Present course', 3, 40, true),
    };
    setErrors(next);
    return Object.values(next).every((e) => !e);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateAll()) { addToast('Please fix the errors before submitting', 'error'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
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
    } finally {
      setLoading(false);
    }
  };

  /* ── option lists ── */

  const yearOptions     = [...new Set([...DEFAULT_YEARS, ...(meta.years || [])])].sort();
  const gameOptions     = [...new Set([...DEFAULT_GAMES, ...(meta.games || [])])];
  const deptOptions     = [...new Set([...(meta.departments || [])])];
  const classOptions    = DEFAULT_CLASSES;
  const durationOptions = DEFAULT_DURATIONS;

  /* ── early return ── */

  if (fetching) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading student…" />
    </div>
  );

  const photoSrc = imagePreview || (currentImage ? `/uploads/${currentImage}` : null);

  /* ─────────────────────────── Render ──────────────────────────────────── */

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isEdit ? 'Update the student information below' : 'Fill in the details to register a new sportsperson'}
          </p>
        </div>
      </div>

      {!isEdit && user?.role !== 'admin' && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            ℹ️ Your submission will be reviewed by an admin before appearing in the records.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>

        {/* ── Basic Information ───────────────────────────────────────────── */}
        <Section title="Basic Information">

          {/* Academic Year */}
          <Field label="Academic Year" required>
            <ComboBox
              value={form.year}
              onChange={(v) => { set('year')(v); touch('year', v); }}
              options={yearOptions}
              placeholder="e.g. 2023-2024"
              required
              error={errors.year}
              sanitizer={sanitizeYear}
              maxLength={9}
              minCreate={9}
            />
            <FieldMeta value={form.year} max={9} always error={errors.year} />
          </Field>

          {/* Roll Number */}
          <Field label="Roll Number" required>
            <input
              className={`input-field ${errors.rollNo ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="9–12 digit roll number"
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
          <Field label="Name of the Game" required>
            <ComboBox
              value={form.nameOfTheGame}
              onChange={(v) => { set('nameOfTheGame')(v); touch('nameOfTheGame', v); }}
              options={gameOptions}
              placeholder="Select or type a game"
              required
              error={errors.nameOfTheGame}
              sanitizer={sanitizeGame}
              maxLength={30}
              minCreate={3}
            />
            <FieldMeta value={form.nameOfTheGame} max={30} always error={errors.nameOfTheGame} />
          </Field>

          {/* Gender */}
          <Field label="Gender" required>
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

        </Section>

        {/* ── Personal Details ────────────────────────────────────────────── */}
        <Section title="Personal Details">

          {/* Name of Sportsperson */}
          <Field label="Name of Sportsperson" required span={2}>
            <input
              className={`input-field ${errors.studentName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Full name (letters only, max 40)"
              value={form.studentName}
              maxLength={40}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('studentName')(v);
                touch('studentName', v);
              }}
              onBlur={() => touch('studentName', form.studentName)}
            />
            <FieldMeta value={form.studentName} max={40} always error={errors.studentName} />
          </Field>

          {/* Date of Birth */}
          <Field label="Date of Birth" required>
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

          {/* Father's Name */}
          <Field label="Father's Name" required>
            <input
              className={`input-field ${errors.fatherName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Father's full name"
              value={form.fatherName}
              maxLength={40}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('fatherName')(v);
                touch('fatherName', v);
              }}
              onBlur={() => touch('fatherName', form.fatherName)}
            />
            <FieldMeta value={form.fatherName} max={40} always error={errors.fatherName} />
          </Field>

          {/* Mother's Name */}
          <Field label="Mother's Name" required>
            <input
              className={`input-field ${errors.motherName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Mother's full name"
              value={form.motherName}
              maxLength={40}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('motherName')(v);
                touch('motherName', v);
              }}
              onBlur={() => touch('motherName', form.motherName)}
            />
            <FieldMeta value={form.motherName} max={40} always error={errors.motherName} />
          </Field>

          {/* Aadhar Number */}
          <Field label="Aadhar Number" required>
            <input
              className={`input-field ${errors.aadharNumber ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="12-digit Aadhar"
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
          <Field label="Phone Number" required>
            <input
              className={`input-field ${errors.phoneNumber ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="10-digit mobile number"
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
          <Field label="Address" required span={2}>
            <textarea
              className={`input-field resize-none ${errors.address ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              rows={2}
              placeholder="Full address"
              value={form.address}
              maxLength={80}
              onChange={(e) => {
                const v = sanitizeAddress(e.target.value);
                set('address')(v);
                touch('address', v);
              }}
              onBlur={() => touch('address', form.address)}
            />
            <FieldMeta value={form.address} max={80} always error={errors.address} />
          </Field>

        </Section>

        {/* ── Academic Details ────────────────────────────────────────────── */}
        <Section title="Academic Details">

          {/* University */}
          <Field label="University" required>
            <input
              className={`input-field ${errors.university ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="e.g. Bharathidasan University"
              value={form.university}
              maxLength={50}
              onChange={(e) => {
                const v = sanitizeAcademic(e.target.value);
                set('university')(v);
                touch('university', v);
              }}
              onBlur={() => touch('university', form.university)}
            />
            <FieldMeta value={form.university} max={50} always error={errors.university} />
          </Field>

          {/* Department */}
          <Field label="Department" required>
            <ComboBox
              value={form.nameOfThePresentClass}
              onChange={(v) => { set('nameOfThePresentClass')(v); touch('nameOfThePresentClass', v); }}
              options={deptOptions}
              placeholder="Select or type department"
              required
              error={errors.nameOfThePresentClass}
              sanitizer={sanitizeAcademic}
              maxLength={40}
              minCreate={3}
            />
            <FieldMeta value={form.nameOfThePresentClass} max={40} always error={errors.nameOfThePresentClass} />
          </Field>

          {/* Duration of Course */}
          <Field label="Duration of Course" required>
            <ComboBox
              value={form.durationOfCourse}
              onChange={(v) => { set('durationOfCourse')(v); touch('durationOfCourse', v); }}
              options={durationOptions}
              placeholder="e.g. 3"
              error={errors.durationOfCourse}
              sanitizer={sanitizeAcademic}
              maxLength={15}
              minCreate={1}
            />
            <FieldMeta value={form.durationOfCourse} max={15} always error={errors.durationOfCourse} />
          </Field>

          {/* Present Course */}
          <Field label="Present Course" required>
            <input
              className={`input-field ${errors.presentCourse ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="e.g. B.Sc Computer Science"
              value={form.presentCourse}
              maxLength={40}
              onChange={(e) => {
                const v = sanitizeAcademic(e.target.value);
                set('presentCourse')(v);
                touch('presentCourse', v);
              }}
              onBlur={() => touch('presentCourse', form.presentCourse)}
            />
            <FieldMeta value={form.presentCourse} max={40} always error={errors.presentCourse} />
          </Field>

          {/* Present Class */}
          <Field label="Present Class" required>
            <ComboBox
              value={form.presentClass}
              onChange={(v) => { set('presentClass')(v); touch('presentClass', v); }}
              options={classOptions}
              placeholder="e.g. I YEAR, II YEAR"
              error={errors.presentClass}
              sanitizer={sanitizeAcademic}
              maxLength={15}
              minCreate={1}
            />
            <FieldMeta value={form.presentClass} max={15} always error={errors.presentClass} />
          </Field>

        </Section>

        {/* ── IUT Participation ───────────────────────────────────────────── */}
        <Section title="Previous IUT Participation (While Pursuing)">
          <Field label="Graduate Course (No. of years)">
            <select className="input-field" value={form.graduateCourse} onChange={setRaw('graduateCourse')}>
              {['NIL','1','2','3'].map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="PG Course (No. of years)">
            <select className="input-field" value={form.pgCourse} onChange={setRaw('pgCourse')}>
              {['NIL','1','2','3'].map((v) => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Previous Course Details" span={3}>
            <textarea className="input-field resize-none" rows={2}
              placeholder="Details of previous course participation"
              value={form.previousCourse} onChange={setRaw('previousCourse')} />
            <FieldMeta value={form.previousCourse} />
          </Field>
        </Section>

        {/* ── Qualifying Examination ──────────────────────────────────────── */}
        <Section title="Qualifying Examination">
          <Field label="Name of Exam">
            <input className="input-field" placeholder="e.g. HSC, SSLC"
              value={form.nameOfExam} onChange={setRaw('nameOfExam')} />
            <FieldMeta value={form.nameOfExam} />
          </Field>
          <Field label="Date & Year of Passing">
            <input className="input-field" placeholder="e.g. April 2022"
              value={form.dateAndYear} onChange={setRaw('dateAndYear')} />
            <FieldMeta value={form.dateAndYear} />
          </Field>
        </Section>

        {/* ── Sports / Event Details ──────────────────────────────────────── */}
        <Section title="Sports / Event Details">
          <Field label="Tournament Number">
            <input className="input-field" type="number" placeholder="Tournament no."
              value={form.tournament} onChange={setRaw('tournament')} />
            <FieldMeta value={form.tournament} />
          </Field>
          <Field label="T-Shirt Size">
            <input className="input-field" type="number" placeholder="T-shirt size"
              value={form.tshirt} onChange={setRaw('tshirt')} />
            <FieldMeta value={form.tshirt} />
          </Field>
          <Field label="Track Size">
            <input className="input-field" type="number" placeholder="Track size"
              value={form.track} onChange={setRaw('track')} />
            <FieldMeta value={form.track} />
          </Field>
        </Section>

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
            <div>
              <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                {photoSrc ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept=".jpg,.jpeg,.png" onChange={handleImageChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">JPG or PNG, max 10 MB</p>
            </div>
          </div>
        </div>

        {/* ── Submit ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={loading}
            className="btn-primary flex items-center gap-2 px-8 py-2.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving…' : isEdit ? 'Update Student' : 'Submit Form'}
          </button>
          <Link to="/" className="btn-secondary text-sm">Cancel</Link>
        </div>

      </form>
    </div>
  );
}
