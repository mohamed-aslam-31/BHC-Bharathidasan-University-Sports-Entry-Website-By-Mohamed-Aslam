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
  'I','II','III','IV','V','VI',
  'I YEAR','II YEAR','III YEAR','IV YEAR',
  'I SEM','II SEM','III SEM','IV SEM','V SEM','VI SEM','VII SEM','VIII SEM',
];

const DEFAULT_DURATIONS = ['1','2','3','4','5','6','7','8'];

/* ─── Sanitisers ───────────────────────────────────────────────────────────── */

/** Only digits and '-', no whitespace */
const sanitizeYear = (v) => v.replace(/[^\d-]/g, '');
/** Only digits, max 12 */
const sanitizeRollNo = (v) => v.replace(/\D/g, '').slice(0, 12);
/** Letters, "." and single spaces only */
const sanitizeName = (v) => v.replace(/[^a-zA-Z. ]/g, '').replace(/ {2,}/g, ' ');
/** Digits only, up to `max` chars */
const sanitizeDigits = (v, max) => v.replace(/\D/g, '').slice(0, max);
/** Collapse consecutive spaces */
const sanitizeAddress = (v) => v.replace(/ {2,}/g, ' ');

/* ─── Validators (return error string or '') ──────────────────────────────── */

const validateYear = (v) =>
  !v ? 'Academic year is required' :
  !/^\d{4}-\d{4}$/.test(v) ? 'Format must be YYYY-YYYY (e.g. 2023-2024)' : '';

const validateRollNo = (v) =>
  !v ? 'Roll number is required' :
  /\D/.test(v) ? 'Only numbers allowed' :
  v.length < 9 ? 'Minimum 9 digits' :
  v.length > 12 ? 'Maximum 12 digits' : '';

const validatePersonName = (v, label = 'Name') =>
  !v ? `${label} is required` :
  v.trim().length < 3 ? `${label} must be at least 3 characters` :
  v.length > 50 ? `${label} must be at most 50 characters` :
  /[^a-zA-Z. ]/.test(v) ? `${label}: only letters, "." and spaces allowed` :
  / {2,}/.test(v) ? `${label}: no consecutive spaces` : '';

const validateAadhar = (v) =>
  v && v.length > 0 && v.length !== 12 ? 'Aadhar must be exactly 12 digits' :
  v && /\D/.test(v) ? 'Only digits allowed' : '';

const validatePhone = (v) =>
  v && v.length > 0 && v.length !== 10 ? 'Phone must be exactly 10 digits' :
  v && /\D/.test(v) ? 'Only digits allowed' : '';

/* ─── ComboBox ─────────────────────────────────────────────────────────────── */
/**
 * Single-value searchable dropdown that lets the user pick from options
 * or type a new value (shown as 'Add "…"' at the bottom).
 * 
 * Props:
 *   value, onChange – controlled value
 *   options         – string[]
 *   placeholder     – string
 *   required        – bool
 *   error           – string (shown below input)
 *   sanitizer       – (raw: string) => string (applied on every keystroke)
 */
function ComboBox({ value, onChange, options, placeholder, required, error, sanitizer }) {
  const [open, setOpen]   = useState(false);
  const [search, setSearch] = useState('');
  const ref      = useRef(null);
  const inputRef = useRef(null);

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

  const filtered   = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;
  const exactMatch = options.some((o) => o.toLowerCase() === search.toLowerCase());
  const showAdd    = search.trim().length > 0 && !exactMatch;

  /* while open, show typed search; when closed, show selected value */
  const displayValue = open ? search : (value || '');

  const select = (opt) => {
    onChange(opt);
    setSearch('');
    setOpen(false);
  };

  const handleChange = (e) => {
    let v = e.target.value;
    if (sanitizer) v = sanitizer(v);
    setSearch(v);
    onChange(v); /* update parent so the form field always reflects typing */
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { setOpen(false); setSearch(''); }
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearch('');
    inputRef.current?.focus();
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={`input-field pr-8 ${error ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && !open && (
            <button type="button" onClick={clear}
              className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform pointer-events-none ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden">
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

function Field({ label, required, children, span, error }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : span === 3 ? 'col-span-full' : ''}>
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/* ─── Empty form state ─────────────────────────────────────────────────────── */

const empty = {
  year: '', rollNo: '', nameOfTheGame: '', gender: 'MALE',
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

  /* fetch existing meta (departments, years, games used in DB) */
  useEffect(() => {
    getStudentMeta()
      .then((r) => setMeta(r.data))
      .catch(() => {});
  }, []);

  /* fetch student when editing */
  useEffect(() => {
    if (!isEdit) return;
    setFetching(true);
    getStudent(id)
      .then((res) => {
        const s = res.data;
        setForm({
          year:                s.year                   || '',
          rollNo:              s.rollNo                 || '',
          nameOfTheGame:       s.nameOfTheGame          || '',
          gender:              s.gender                 || 'MALE',
          studentName:         s.nameOfTheSportsperson  || '',
          fatherName:          s.fathersName            || '',
          motherName:          s.motherName             || '',
          dob:                 s.dateOfBirth            || '',
          nameOfExam:          s.nameOfExam             || '',
          dateAndYear:         s.dateAndYear            || '',
          presentClass:        s.presentClass           || '',
          nameOfThePresentClass: s.nameOfThePresentClass || '',
          durationOfCourse:    s.durationOfCourse       || '',
          university:          s.university             || '',
          presentCourse:       s.presentCourse          || '',
          graduateCourse:      s.graduateCourse         || 'NIL',
          pgCourse:            s.pgCourse               || 'NIL',
          previousCourse:      s.previousCourse         || '',
          address:             s.address                || '',
          phoneNumber:         s.phoneNumber            || '',
          aadharNumber:        s.aadharNumber           || '',
          tournament:          s.tournament             || '',
          tshirt:              s.tshirt                 || '',
          track:               s.track                  || '',
        });
        if (s.image) setCurrentImage(s.image);
      })
      .catch(() => { addToast('Failed to load student', 'error'); navigate('/'); })
      .finally(() => setFetching(false));
  }, [id, isEdit]);

  /* ── helpers ── */

  const set = (key) => (val) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setRaw = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setErr = (key, msg) =>
    setErrors((e) => ({ ...e, [key]: msg }));

  const clearErr = (key) =>
    setErrors((e) => { const n = { ...e }; delete n[key]; return n; });

  /* validate a single field and update errors; returns true if valid */
  const validateField = (key, value) => {
    let msg = '';
    switch (key) {
      case 'year':        msg = validateYear(value);                        break;
      case 'rollNo':      msg = validateRollNo(value);                      break;
      case 'studentName': msg = validatePersonName(value, 'Name of Sportsperson'); break;
      case 'fatherName':  msg = validatePersonName(value, "Father's Name"); break;
      case 'motherName':  msg = validatePersonName(value, "Mother's Name"); break;
      case 'aadharNumber': msg = validateAadhar(value);                     break;
      case 'phoneNumber':  msg = validatePhone(value);                      break;
      default: break;
    }
    if (msg) setErr(key, msg); else clearErr(key);
    return !msg;
  };

  /* validate all required / constrained fields; returns true if all pass */
  const validateAll = () => {
    const checks = {
      year:        validateYear(form.year),
      rollNo:      validateRollNo(form.rollNo),
      studentName: validatePersonName(form.studentName, 'Name of Sportsperson'),
      fatherName:  validatePersonName(form.fatherName, "Father's Name"),
      motherName:  validatePersonName(form.motherName, "Mother's Name"),
      aadharNumber: validateAadhar(form.aadharNumber),
      phoneNumber:  validatePhone(form.phoneNumber),
    };
    setErrors(checks);
    return Object.values(checks).every((e) => !e);
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
    if (!validateAll()) {
      addToast('Please fix the errors before submitting', 'error');
      return;
    }
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

  /* ── option lists (merge DB meta with defaults) ── */

  const yearOptions  = [...new Set([...DEFAULT_YEARS, ...(meta.years || [])])].sort();
  const gameOptions  = [...new Set([...DEFAULT_GAMES, ...(meta.games || [])])];
  const deptOptions  = [...new Set([...(meta.departments || [])])];
  const classOptions = DEFAULT_CLASSES;
  const durationOptions = DEFAULT_DURATIONS;

  /* ── early return ── */

  if (fetching) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading student…" />
    </div>
  );

  const photoSrc = imagePreview || (currentImage ? `/uploads/${currentImage}` : null);

  /* ─── Render ─────────────────────────────────────────────────────────────── */

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
            {isEdit
              ? 'Update the student information below'
              : 'Fill in the details to register a new sportsperson'}
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

          {/* Academic Year — combo box, format YYYY-YYYY */}
          <Field label="Academic Year" required error={errors.year}>
            <ComboBox
              value={form.year}
              onChange={(v) => { set('year')(v); validateField('year', v); }}
              options={yearOptions}
              placeholder="e.g. 2023-2024"
              required
              error={errors.year}
              sanitizer={sanitizeYear}
            />
          </Field>

          {/* Roll Number — digits only, 9-12 digits */}
          <Field label="Roll Number" required error={errors.rollNo}>
            <input
              className={`input-field ${errors.rollNo ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="9–12 digit roll number"
              value={form.rollNo}
              inputMode="numeric"
              onChange={(e) => {
                const v = sanitizeRollNo(e.target.value);
                set('rollNo')(v);
                validateField('rollNo', v);
              }}
              onBlur={() => validateField('rollNo', form.rollNo)}
              required
            />
            {errors.rollNo && <p className="text-xs text-red-500 mt-1">{errors.rollNo}</p>}
          </Field>

          {/* Name of the Game — combo box */}
          <Field label="Name of the Game" required>
            <ComboBox
              value={form.nameOfTheGame}
              onChange={set('nameOfTheGame')}
              options={gameOptions}
              placeholder="Select or type a game"
              required
            />
          </Field>

          {/* Gender — glass-theme radio buttons */}
          <Field label="Gender" required>
            <div className="flex gap-2 mt-1 flex-wrap">
              {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                <label
                  key={g}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-150 backdrop-blur-sm border select-none ${
                    form.gender === g
                      ? 'bg-blue-500/20 dark:bg-blue-500/25 border-blue-400/60 dark:border-blue-400/50 shadow-sm shadow-blue-500/20'
                      : 'bg-white/40 dark:bg-gray-800/40 border-gray-300/50 dark:border-gray-600/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 hover:border-blue-300/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={form.gender === g}
                    onChange={() => set('gender')(g)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                    form.gender === g
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 dark:border-gray-500 bg-transparent'
                  }`}>
                    {form.gender === g && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${
                    form.gender === g
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {g}
                  </span>
                </label>
              ))}
            </div>
          </Field>

        </Section>

        {/* ── Personal Details ────────────────────────────────────────────── */}
        <Section title="Personal Details">

          {/* Name of Sportsperson — letters + "." + single spaces, 3-50 chars */}
          <Field label="Name of Sportsperson" required span={2} error={errors.studentName}>
            <input
              className={`input-field ${errors.studentName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Full name (letters only, max 50)"
              value={form.studentName}
              maxLength={50}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('studentName')(v);
                if (errors.studentName) validateField('studentName', v);
              }}
              onBlur={() => validateField('studentName', form.studentName)}
              required
            />
            {errors.studentName && <p className="text-xs text-red-500 mt-1">{errors.studentName}</p>}
          </Field>

          {/* Date of Birth */}
          <Field label="Date of Birth" required>
            <input
              type="date"
              className="input-field"
              value={form.dob}
              onChange={setRaw('dob')}
              required
            />
          </Field>

          {/* Father's Name */}
          <Field label="Father's Name" required error={errors.fatherName}>
            <input
              className={`input-field ${errors.fatherName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Father's full name"
              value={form.fatherName}
              maxLength={50}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('fatherName')(v);
                if (errors.fatherName) validateField('fatherName', v);
              }}
              onBlur={() => validateField('fatherName', form.fatherName)}
              required
            />
            {errors.fatherName && <p className="text-xs text-red-500 mt-1">{errors.fatherName}</p>}
          </Field>

          {/* Mother's Name */}
          <Field label="Mother's Name" required error={errors.motherName}>
            <input
              className={`input-field ${errors.motherName ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="Mother's full name"
              value={form.motherName}
              maxLength={50}
              onChange={(e) => {
                const v = sanitizeName(e.target.value);
                set('motherName')(v);
                if (errors.motherName) validateField('motherName', v);
              }}
              onBlur={() => validateField('motherName', form.motherName)}
              required
            />
            {errors.motherName && <p className="text-xs text-red-500 mt-1">{errors.motherName}</p>}
          </Field>

          {/* Aadhar Number — 12 digits, optional but if typed must be complete */}
          <Field label="Aadhar Number" error={errors.aadharNumber}>
            <input
              className={`input-field ${errors.aadharNumber ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="12-digit Aadhar"
              value={form.aadharNumber}
              inputMode="numeric"
              maxLength={12}
              onChange={(e) => {
                const v = sanitizeDigits(e.target.value, 12);
                set('aadharNumber')(v);
                if (errors.aadharNumber) validateField('aadharNumber', v);
              }}
              onBlur={() => validateField('aadharNumber', form.aadharNumber)}
            />
            {errors.aadharNumber && <p className="text-xs text-red-500 mt-1">{errors.aadharNumber}</p>}
          </Field>

          {/* Phone Number — exactly 10 digits */}
          <Field label="Phone Number" error={errors.phoneNumber}>
            <input
              className={`input-field ${errors.phoneNumber ? 'border-red-400 dark:border-red-500 focus:ring-red-400' : ''}`}
              placeholder="10-digit mobile number"
              value={form.phoneNumber}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => {
                const v = sanitizeDigits(e.target.value, 10);
                set('phoneNumber')(v);
                if (errors.phoneNumber) validateField('phoneNumber', v);
              }}
              onBlur={() => validateField('phoneNumber', form.phoneNumber)}
            />
            {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
          </Field>

          {/* Address — special chars OK, no double spaces */}
          <Field label="Address" span={2}>
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Full address"
              value={form.address}
              onChange={(e) => set('address')(sanitizeAddress(e.target.value))}
            />
          </Field>

        </Section>

        {/* ── Academic Details ────────────────────────────────────────────── */}
        <Section title="Academic Details">

          {/* Present Class — combo box (renamed from "Present Class / Semester") */}
          <Field label="Present Class">
            <ComboBox
              value={form.presentClass}
              onChange={set('presentClass')}
              options={classOptions}
              placeholder="e.g. I YEAR, II SEM"
            />
          </Field>

          {/* Department — combo box */}
          <Field label="Department" required>
            <ComboBox
              value={form.nameOfThePresentClass}
              onChange={set('nameOfThePresentClass')}
              options={deptOptions}
              placeholder="Select or type department"
              required
            />
          </Field>

          {/* Duration of Course — combo box (number) */}
          <Field label="Duration of Course">
            <ComboBox
              value={form.durationOfCourse}
              onChange={set('durationOfCourse')}
              options={durationOptions}
              placeholder="e.g. 3"
            />
          </Field>

          {/* University */}
          <Field label="University" span={2}>
            <input
              className="input-field"
              placeholder="University name"
              value={form.university}
              onChange={setRaw('university')}
            />
          </Field>

          {/* Present Course */}
          <Field label="Present Course">
            <input
              className="input-field"
              placeholder="e.g. B.Sc Computer Science"
              value={form.presentCourse}
              onChange={setRaw('presentCourse')}
            />
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
            <textarea
              className="input-field resize-none"
              rows={2}
              placeholder="Details of previous course participation"
              value={form.previousCourse}
              onChange={setRaw('previousCourse')}
            />
          </Field>
        </Section>

        {/* ── Qualifying Examination ──────────────────────────────────────── */}
        <Section title="Qualifying Examination">
          <Field label="Name of Exam">
            <input
              className="input-field"
              placeholder="e.g. HSC, SSLC"
              value={form.nameOfExam}
              onChange={setRaw('nameOfExam')}
            />
          </Field>
          <Field label="Date & Year of Passing">
            <input
              className="input-field"
              placeholder="e.g. April 2022"
              value={form.dateAndYear}
              onChange={setRaw('dateAndYear')}
            />
          </Field>
        </Section>

        {/* ── Sports / Event Details ──────────────────────────────────────── */}
        <Section title="Sports / Event Details">
          <Field label="Tournament Number">
            <input
              className="input-field"
              type="number"
              placeholder="Tournament no."
              value={form.tournament}
              onChange={setRaw('tournament')}
            />
          </Field>
          <Field label="T-Shirt Size">
            <input
              className="input-field"
              type="number"
              placeholder="T-shirt size"
              value={form.tshirt}
              onChange={setRaw('tshirt')}
            />
          </Field>
          <Field label="Track Size">
            <input
              className="input-field"
              type="number"
              placeholder="Track size"
              value={form.track}
              onChange={setRaw('track')}
            />
          </Field>
        </Section>

        {/* ── Passport Photo ──────────────────────────────────────────────── */}
        <div className="card p-6">
          <h3 className="section-title">Passport Size Photo</h3>
          <div className="flex items-start gap-6">
            {photoSrc ? (
              <img
                src={photoSrc}
                alt="Student"
                className="w-24 h-28 object-cover rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm"
              />
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
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center gap-2 px-8 py-2.5"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving…' : isEdit ? 'Update Student' : 'Submit Form'}
          </button>
          <Link to="/" className="btn-secondary text-sm">Cancel</Link>
        </div>

      </form>
    </div>
  );
}
