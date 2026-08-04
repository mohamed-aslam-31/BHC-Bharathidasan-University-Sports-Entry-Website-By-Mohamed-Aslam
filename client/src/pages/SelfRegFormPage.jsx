import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, ChevronDown, X, CheckCircle, Camera, ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { selfRegOptions, selfRegSubmit } from '../api';
import Cropper from 'react-easy-crop';
import AadhaarUpload from '../components/AadhaarUpload';
import MarksheetUpload from '../components/MarksheetUpload';
import FeesReceiptUpload from '../components/FeesReceiptUpload';
import IdCardUpload from '../components/IdCardUpload';

/* ─── Crop helper ──────────────────────────────────────────────────────────── */
async function getCroppedImg(src, crop) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const canvas = document.createElement('canvas');
  canvas.width = crop.width; canvas.height = crop.height;
  canvas.getContext('2d').drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
}

/* ─── Sanitisers (mirrored from StudentFormPage) ───────────────────────────── */
const sanitizeName    = (v) => v.replace(/[^a-zA-Z. ]/g, '').replace(/ {2,}/g, ' ');
const sanitizeDigits  = (v, max) => v.replace(/\D/g, '').slice(0, max);
const sanitizeAddress = (v) => v.replace(/[^a-zA-Z0-9 \n"'\u201C\u201D\u2018\u2019\-_|/\\&#@();:,.[\]]/g, '').replace(/[ \t]{2,}/g, ' ');
const sanitizeExamName = (v) => v.replace(/[^a-zA-Z0-9 &()\-_[\]|\\/.,;:'\u2018\u2019"\u201C\u201D#%@*]/g, '').replace(/ {2,}/g, ' ').slice(0, 40);
const sanitizeMonthYear = (v) => {
  v = v.replace(/ /g, '-');
  v = v.replace(/[^a-zA-Z0-9\-]/g, '');
  if (v.includes('-')) {
    const firstDash = v.indexOf('-');
    const before = v.slice(0, firstDash).replace(/[^a-zA-Z]/g, '');
    const after  = v.slice(firstDash + 1).replace(/[^0-9]/g, '').slice(0, 4);
    v = before + '-' + after;
  } else {
    v = v.replace(/[^a-zA-Z]/g, '');
  }
  return v.slice(0, 14);
};
const sanitizeDuration = (v) => {
  v = v.replace(/ /g, '-');
  v = v.replace(/[^a-zA-Z0-9-]/g, '');
  v = v.replace(/^-+/, '');
  let digitFound = false;
  v = v.split('').filter((ch) => {
    if (/\d/.test(ch)) { if (!digitFound) { digitFound = true; return true; } return false; }
    return true;
  }).join('');
  const di = v.indexOf('-');
  if (di !== -1) v = v.slice(0, di + 1) + v.slice(di + 1).replace(/-/g, '');
  return v.slice(0, 7);
};
const sanitizePresentCourse = (v) => {
  v = v.replace(/[^a-zA-Z .,()&-]/g, '');
  v = v.replace(/ {2,}/g, ' ');
  v = v.replace(/^ /, '');
  const op = v.indexOf('(');
  if (op !== -1) v = v.slice(0, op + 1) + v.slice(op + 1).replace(/\(/g, '');
  const cl = v.indexOf(')');
  if (cl !== -1) v = v.slice(0, cl + 1) + v.slice(cl + 1).replace(/\)/g, '');
  return v.slice(0, 40);
};
const sanitizePrevCourse = (v) => v.replace(/[^\w\s.,\-'"/()&:;]/g, '').slice(0, 100);

/* ─── Validators (mirrored from StudentFormPage) ───────────────────────────── */
const validatePersonName = (v, label = 'Name') =>
  !v                     ? `${label} is required` :
  v.trim().length < 3    ? `${label} must be at least 3 characters` :
  v.length > 50          ? `${label} must be at most 50 characters` :
  /[^a-zA-Z. ]/.test(v)  ? `${label}: letters, "." and spaces only` :
  / {2,}/.test(v)        ? `${label}: no consecutive spaces` : '';

const validatePhone = (v) =>
  !v ? 'Phone number is required' :
  v.length !== 10 ? 'Phone must be exactly 10 digits' : '';

const validateAadhar = (v) =>
  !v ? 'Aadhaar number is required' :
  v.length !== 12 ? 'Aadhaar must be exactly 12 digits' : '';

const validateAddress = (v) =>
  !v || !v.trim() ? 'Address is required' : '';

const validateDob = (v) =>
  !v ? 'Date of birth is required' : '';

const validateExamName = (v) =>
  !v ? 'Name of exam is required' :
  v.trim().length < 3 ? 'Minimum 3 characters required' :
  v.length > 40 ? 'Maximum 40 characters allowed' : '';

const validateMonthYear = (v) =>
  !v ? 'Month & year of passing is required' :
  v.trim().length < 8 ? 'Minimum 8 characters required' :
  v.length > 14 ? 'Maximum 14 characters allowed' : '';

const validateMinMax = (v, label, min, max, required = false) =>
  (!v && required)      ? `${label} is required` :
  !v                    ? '' :
  v.trim().length < min ? `${label} must be at least ${min} character${min > 1 ? 's' : ''}` :
  v.length > max        ? `${label} must be at most ${max} characters` : '';

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

const validatePresentCourse = (v) =>
  !v ? 'Name of Present Course is required' :
  v.trim().length < 2 ? 'Must be at least 2 characters' :
  v.length > 40 ? 'Maximum 40 characters allowed' :
  /[0-9]/.test(v) ? 'Numbers are not allowed' :
  /[^a-zA-Z .,()&-]/.test(v) ? 'Only letters and . , ( ) - & are allowed' :
  (v.match(/\(/g) || []).length > 1 ? 'Only one "(" allowed' :
  (v.match(/\)/g) || []).length > 1 ? 'Only one ")" allowed' : '';

const validatePrevCourse = (v) =>
  v.length > 100 ? 'Maximum 100 characters allowed' : '';

/* ─── FieldMeta: char count + error row ────────────────────────────────────── */
function FieldMeta({ value, max, error, always }) {
  const len = typeof value === 'string' ? value.length : 0;
  if (!always && !len && !error) return null;
  const near = max && len > max * 0.8;
  return (
    <div className="flex items-start gap-2 mt-1 min-h-[1rem]">
      {(always || len > 0) && (
        <span className={`text-xs tabular-nums ${near ? 'text-amber-500 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {max ? `${len} / ${max}` : `${len}`}
        </span>
      )}
      {error && <span className="text-xs text-red-500 leading-tight flex-1 text-right">{error}</span>}
    </div>
  );
}

/* ─── Read-only ComboBox ───────────────────────────────────────────────────── */
function ComboBox({ value, onChange, options = [], placeholder, error, disabled }) {
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
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm text-left bg-white dark:bg-gray-800 transition-colors
          ${disabled ? 'bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-70' : ''}
          ${error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}
          ${open ? 'ring-2 ring-blue-400/50 border-blue-500' : ''}`}>
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>{value || placeholder}</span>
        <span className="flex items-center gap-0.5 flex-shrink-0">
          {value && !disabled && <span onMouseDown={e => { e.stopPropagation(); onChange(''); setSearch(''); }} className="p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-3.5 h-3.5" /></span>}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input ref={sRef} type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              className="w-full text-sm px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-400 dark:placeholder-gray-500" />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? <p className="text-xs text-gray-400 text-center py-4">No options</p>
              : filtered.map(opt => (
                <button key={opt} type="button" onMouseDown={e => { e.preventDefault(); onChange(opt); setSearch(''); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${value === opt ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}>
                  {opt}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Field wrapper ────────────────────────────────────────────────────────── */
function Field({ label, required, error, children, span2 }) {
  return (
    <div className={span2 ? 'sm:col-span-2' : ''}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* ─── Section header ───────────────────────────────────────────────────────── */
function Section({ title }) {
  return <h3 className="sm:col-span-2 text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide pt-2">{title}</h3>;
}

/* ─── Stepper ──────────────────────────────────────────────────────────────── */
function Stepper({ step }) {
  const steps = ['Photo & Basic Info', 'Personal Details', 'Academic & Documents'];
  return (
    <div className="flex items-center justify-center gap-0 mb-8 flex-wrap">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done   = step > n;
        return (
          <React.Fragment key={n}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {done ? <CheckCircle className="w-5 h-5" /> : n}
              </div>
              <span className={`text-xs mt-1 font-medium ${active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 min-w-[24px] max-w-[60px] h-0.5 mb-5 mx-1 transition-colors ${step > n ? 'bg-green-400' : 'bg-gray-200 dark:bg-gray-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ─── Input helper ─────────────────────────────────────────────────────────── */
const inputCls = (err) => `w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors bg-white dark:bg-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${err ? 'border-red-400 focus:ring-2 focus:ring-red-300' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-300/50'}`;

/* ─── Main component ───────────────────────────────────────────────────────── */
export default function SelfRegFormPage() {
  const navigate = useNavigate();

  /* ── Access data from sessionStorage ── */
  const [accessData, setAccessData] = useState(null);
  useEffect(() => {
    const stored = sessionStorage.getItem('bhc_self_reg');
    if (!stored) { navigate('/self-register', { replace: true }); return; }
    try { setAccessData(JSON.parse(stored)); } catch { navigate('/self-register', { replace: true }); }
  }, []);

  /* ── Form state ── */
  const [step, setStep]   = useState(1);
  const [form, setForm]   = useState({
    studentName: '', fatherName: '', motherName: '', dob: '',
    gender: '', bloodGroup: '', phoneNumber: '', aadharNumber: '', address: '',
    studentType: '', dayType: '', hostelName: '', shift: '',
    nameOfExam: '', dateAndYear: '', presentClass: '',
    durationOfCourse: '', presentCourse: '',
    university: '', graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: '',
    tshirt: '', track: '',
  });
  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));
  const setRaw = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  /* ── Option lists ── */
  const [options, setOptions] = useState({});
  useEffect(() => {
    selfRegOptions().then(r => setOptions(r.data)).catch(() => {});
  }, []);

  /* ── Photo (step 1) ── */
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cropSrc, setCropSrc]           = useState(null);
  const [showCrop, setShowCrop]         = useState(false);
  const [crop, setCrop]                 = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                 = useState(1);
  const [croppedPx, setCroppedPx]       = useState(null);
  const photoRef = useRef(null);

  const handlePhotoChange = (e) => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    if (!['image/jpeg','image/png'].includes(f.type)) { alert('Only JPG/PNG allowed'); return; }
    if (f.size > 2 * 1024 * 1024) { alert('Photo must be ≤ 2 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setCropSrc(reader.result); setCrop({ x: 0, y: 0 }); setZoom(1); setShowCrop(true); };
    reader.readAsDataURL(f);
  };
  const confirmCrop = useCallback(async () => {
    try {
      const blob = await getCroppedImg(cropSrc, croppedPx);
      const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
      setImageFile(file); setImagePreview(URL.createObjectURL(blob));
      setShowCrop(false); setCropSrc(null);
    } catch { alert('Crop failed, please try again'); }
  }, [cropSrc, croppedPx]);

  /* ── Document PDFs (step 3) — tracked via upload component callbacks ── */
  const [aadhaarFile,          setAadhaarFile]          = useState(null);
  const [aadhaarValidated,     setAadhaarValidated]     = useState(false);
  const [marksheetFile,        setMarksheetFile]        = useState(null);
  const [marksheetValidated,   setMarksheetValidated]   = useState(false);
  const [feesReceiptFile,      setFeesReceiptFile]      = useState(null);
  const [feesReceiptValidated, setFeesReceiptValidated] = useState(false);
  const [idCardFile,           setIdCardFile]           = useState(null);
  const [idCardValidated,      setIdCardValidated]      = useState(false);
  const [termsAccepted,        setTermsAccepted]        = useState(false);

  /* ── Validation & errors ── */
  const [errors, setErrors] = useState({});

  /* touch: validate a single field and update errors */
  const touch = (key, value) => {
    let msg = '';
    switch (key) {
      case 'studentName': msg = validatePersonName(value, 'Sportsperson name'); break;
      case 'fatherName':  msg = validatePersonName(value, "Father's name");  break;
      case 'motherName':  msg = validatePersonName(value, "Mother's name");  break;
      case 'dob':         msg = validateDob(value);           break;
      case 'phoneNumber': msg = validatePhone(value);         break;
      case 'aadharNumber':msg = validateAadhar(value);        break;
      case 'address':     msg = validateAddress(value);       break;
      case 'nameOfExam':  msg = validateExamName(value);      break;
      case 'dateAndYear': msg = validateMonthYear(value);     break;
      case 'presentClass':msg = validateMinMax(value, 'Present class', 1, 20, true); break;
      case 'durationOfCourse': msg = validateDuration(value); break;
      case 'presentCourse':    msg = validatePresentCourse(value); break;
      case 'university':       msg = validateMonthYear(value); break;
      case 'graduateCourse':   msg = validateNoOfYears(value); break;
      case 'pgCourse':         msg = validateNoOfYears(value); break;
      case 'previousCourse':   msg = validatePrevCourse(value); break;
      default: break;
    }
    setErrors(e => ({ ...e, [key]: msg }));
    return !msg;
  };

  const validateStep1 = () => {
    const e = {};
    if (!imageFile) e.photo = 'Passport size photo is required';
    const sn = validatePersonName(form.studentName, 'Sportsperson name'); if (sn) e.studentName = sn;
    const fn = validatePersonName(form.fatherName, "Father's name");      if (fn) e.fatherName  = fn;
    const mn = validatePersonName(form.motherName, "Mother's name");      if (mn) e.motherName  = mn;
    const db = validateDob(form.dob);          if (db) e.dob          = db;
    if (!form.gender)     e.gender     = 'Gender is required';
    if (!form.bloodGroup) e.bloodGroup = 'Blood group is required';
    const ph = validatePhone(form.phoneNumber);         if (ph) e.phoneNumber  = ph;
    const ad = validateAadhar(form.aadharNumber);       if (ad) e.aadharNumber = ad;
    const addr = validateAddress(form.address);         if (addr) e.address    = addr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!form.studentType) e.studentType = 'Student type is required';
    if (!form.dayType)     e.dayType     = 'Day/Hostel type is required';
    if (!form.shift)       e.shift       = 'Shift is required';
    if (form.dayType === 'HOSTELLER' && !form.hostelName) e.hostelName = 'Hostel name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e = {};
    const ne = validateExamName(form.nameOfExam);              if (ne) e.nameOfExam      = ne;
    const dy = validateMonthYear(form.dateAndYear);            if (dy) e.dateAndYear     = dy;
    const pc = validateMinMax(form.presentClass, 'Present class', 1, 20, true); if (pc) e.presentClass = pc;
    const dur = validateDuration(form.durationOfCourse);       if (dur) e.durationOfCourse = dur;
    const pco = validatePresentCourse(form.presentCourse);     if (pco) e.presentCourse  = pco;
    const uni = validateMonthYear(form.university);            if (uni) e.university     = uni;
    const gc = validateNoOfYears(form.graduateCourse);         if (gc) e.graduateCourse  = gc;
    const pg = validateNoOfYears(form.pgCourse);               if (pg) e.pgCourse        = pg;
    const prev = validatePrevCourse(form.previousCourse);      if (prev) e.previousCourse = prev;
    if (!aadhaarValidated)     e.aadhaarFile    = 'Aadhaar card PDF is required and must pass validation';
    if (!marksheetValidated)   e.marksheetFile  = '+2 Marksheet PDF is required and must pass validation';
    if (!feesReceiptValidated) e.feesReceiptFile = 'Fees receipt PDF is required and must pass validation';
    if (!termsAccepted)        e.terms          = 'You must accept the terms and conditions';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleBack = () => { setStep(s => s - 1); window.scrollTo({ top: 0 }); };

  /* ── Submitting ── */
  const [submitting, setSubmitting] = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep3()) return;
    setSubmitting(true); setSubmitError('');
    try {
      const fd = new FormData();
      // Locked fields
      fd.append('rollNo',        accessData.rollNo);
      fd.append('nameOfTheGame', accessData.nameOfGame);
      fd.append('year',          accessData.year);
      // Step 1
      fd.append('studentName',  form.studentName);
      fd.append('fatherName',   form.fatherName);
      fd.append('motherName',   form.motherName);
      fd.append('dob',          form.dob);
      fd.append('gender',       form.gender);
      fd.append('bloodGroup',   form.bloodGroup);
      fd.append('phoneNumber',  form.phoneNumber);
      fd.append('aadharNumber', form.aadharNumber);
      fd.append('address',      form.address);
      // Step 2
      fd.append('studentType',  form.studentType);
      fd.append('dayType',      form.dayType);
      fd.append('hostelName',   form.hostelName);
      fd.append('shift',        form.shift);
      // Step 3
      fd.append('nameOfExam',       form.nameOfExam);
      fd.append('dateAndYear',      form.dateAndYear);
      fd.append('presentClass',     form.presentClass);
      fd.append('durationOfCourse', form.durationOfCourse);
      fd.append('presentCourse',    form.presentCourse);
      fd.append('university',       form.university);
      fd.append('graduateCourse',   form.graduateCourse);
      fd.append('pgCourse',         form.pgCourse);
      fd.append('previousCourse',   form.previousCourse || 'NIL');
      fd.append('tshirt',           form.tshirt);
      fd.append('track',            form.track);
      // Files
      fd.append('image',          imageFile);
      fd.append('aadhaarPdf',     aadhaarFile);
      fd.append('marksheetPdf',   marksheetFile);
      fd.append('feesReceiptPdf', feesReceiptFile);
      if (idCardFile) fd.append('idCardPdf', idCardFile);

      await selfRegSubmit(fd);
      sessionStorage.removeItem('bhc_self_reg');
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Registration Submitted!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Your form has been submitted successfully and is pending admin approval. You will be notified once it is reviewed.</p>
          <button onClick={() => navigate('/self-register')}
            className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            Back to Start
          </button>
        </div>
      </div>
    );
  }

  if (!accessData) return null;

  const opts = options;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 px-4 py-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-blue-500/30">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">BHC Sports Entry</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Bharathidasan University — Student Self Registration</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Stepper step={step} />

        {/* Locked identity banner */}
        <div className="flex flex-wrap items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6 text-sm">
          <span className="font-semibold text-blue-700 dark:text-blue-300">Roll No:</span>
          <span className="text-gray-800 dark:text-gray-200">{accessData.rollNo}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="font-semibold text-blue-700 dark:text-blue-300">Game:</span>
          <span className="text-gray-800 dark:text-gray-200">{accessData.nameOfGame}</span>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <span className="font-semibold text-blue-700 dark:text-blue-300">Year:</span>
          <span className="text-gray-800 dark:text-gray-200">{accessData.year}</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 p-6 space-y-6">

            {/* ═══════════════ STEP 1 ═══════════════ */}
            {step === 1 && (
              <>
                {/* Photo */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-3">Passport Size Photo</p>
                  <div className="flex items-center gap-5">
                    <div className="relative group w-24 h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex-shrink-0 flex items-center justify-center">
                      {imagePreview
                        ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                        : <Camera className="w-8 h-8 text-gray-300 dark:text-gray-600" />}
                      <div onClick={() => photoRef.current?.click()}
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Passport size photo <span className="text-red-500">*</span></p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">JPG or PNG · Max 2 MB · Will be cropped</p>
                      <button type="button" onClick={() => photoRef.current?.click()}
                        className="mt-2 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5">
                        <Upload className="w-3 h-3" />{imagePreview ? 'Change Photo' : 'Upload Photo'}
                      </button>
                      {errors.photo && <p className="mt-1 text-xs text-red-500">{errors.photo}</p>}
                    </div>
                    <input ref={photoRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePhotoChange} />
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Basic Information */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Basic Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Name of the Sportsperson" required error={errors.studentName} span2>
                      <input type="text" value={form.studentName} maxLength={50}
                        onChange={e => { const v = sanitizeName(e.target.value); set('studentName')(v); touch('studentName', v); }}
                        onBlur={() => touch('studentName', form.studentName)}
                        placeholder="Full name as per Aadhaar" className={inputCls(errors.studentName)} />
                      <FieldMeta value={form.studentName} max={50} always error={errors.studentName} />
                    </Field>
                    <Field label="Father's Name" required error={errors.fatherName}>
                      <input type="text" value={form.fatherName} maxLength={50}
                        onChange={e => { const v = sanitizeName(e.target.value); set('fatherName')(v); touch('fatherName', v); }}
                        onBlur={() => touch('fatherName', form.fatherName)}
                        placeholder="Father's full name" className={inputCls(errors.fatherName)} />
                      <FieldMeta value={form.fatherName} max={50} always error={errors.fatherName} />
                    </Field>
                    <Field label="Mother's Name" required error={errors.motherName}>
                      <input type="text" value={form.motherName} maxLength={50}
                        onChange={e => { const v = sanitizeName(e.target.value); set('motherName')(v); touch('motherName', v); }}
                        onBlur={() => touch('motherName', form.motherName)}
                        placeholder="Mother's full name" className={inputCls(errors.motherName)} />
                      <FieldMeta value={form.motherName} max={50} always error={errors.motherName} />
                    </Field>
                    <Field label="Date of Birth" required error={errors.dob}>
                      <input type="date" value={form.dob}
                        onChange={e => { set('dob')(e.target.value); touch('dob', e.target.value); }}
                        onBlur={() => touch('dob', form.dob)}
                        className={inputCls(errors.dob)} />
                    </Field>
                    <Field label="Gender" required error={errors.gender}>
                      <div className="flex gap-2">
                        {['MALE','FEMALE','OTHER'].map(g => (
                          <button key={g} type="button" onClick={() => { set('gender')(g); setErrors(e => ({ ...e, gender: '' })); }}
                            className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors
                              ${form.gender === g ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
                            {g.charAt(0) + g.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label="Blood Group" required error={errors.bloodGroup}>
                      <ComboBox value={form.bloodGroup} onChange={v => { set('bloodGroup')(v); setErrors(e => ({ ...e, bloodGroup: '' })); }}
                        options={opts.bloodGroup || []} placeholder="Select blood group" error={errors.bloodGroup} />
                    </Field>
                    <Field label="Phone Number" required error={errors.phoneNumber}>
                      <input type="text" inputMode="numeric" value={form.phoneNumber} maxLength={10}
                        onChange={e => { const v = sanitizeDigits(e.target.value, 10); set('phoneNumber')(v); touch('phoneNumber', v); }}
                        onBlur={() => touch('phoneNumber', form.phoneNumber)}
                        placeholder="10-digit mobile number" className={inputCls(errors.phoneNumber)} />
                      <FieldMeta value={form.phoneNumber} max={10} always error={errors.phoneNumber} />
                    </Field>
                    <Field label="Aadhaar Number" required error={errors.aadharNumber}>
                      <input type="text" inputMode="numeric" value={form.aadharNumber} maxLength={12}
                        onChange={e => { const v = sanitizeDigits(e.target.value, 12); set('aadharNumber')(v); touch('aadharNumber', v); }}
                        onBlur={() => touch('aadharNumber', form.aadharNumber)}
                        placeholder="12-digit Aadhaar number" className={inputCls(errors.aadharNumber)} />
                      <FieldMeta value={form.aadharNumber} max={12} always error={errors.aadharNumber} />
                    </Field>
                    <Field label="Address" required error={errors.address} span2>
                      <textarea rows={3} value={form.address} maxLength={100}
                        onChange={e => { const v = sanitizeAddress(e.target.value); set('address')(v); touch('address', v); }}
                        onBlur={() => touch('address', form.address)}
                        placeholder="Full postal address" className={inputCls(errors.address) + ' resize-none'} />
                      <FieldMeta value={form.address} max={100} always error={errors.address} />
                    </Field>
                  </div>
                </div>
              </>
            )}

            {/* ═══════════════ STEP 2 ═══════════════ */}
            {step === 2 && (
              <div>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Personal Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Student Type" required error={errors.studentType}>
                    <div className="flex gap-2">
                      {(opts.studentType || ['AIDED','SELF-FINANCE']).map(t => (
                        <button key={t} type="button" onClick={() => { set('studentType')(t); setErrors(e => ({ ...e, studentType: '' })); }}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors
                            ${form.studentType === t ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Shift" required error={errors.shift}>
                    <div className="flex gap-2">
                      {(opts.shift || ['MORNING','EVENING']).map(s => (
                        <button key={s} type="button" onClick={() => { set('shift')(s); setErrors(e => ({ ...e, shift: '' })); }}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors
                            ${form.shift === s ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Day Scholar / Hosteller" required error={errors.dayType} span2>
                    <div className="flex gap-2">
                      {(opts.dayType || ['DAYSCHOLAR','HOSTELLER']).map(d => (
                        <button key={d} type="button" onClick={() => { set('dayType')(d); if (d === 'DAYSCHOLAR') set('hostelName')(''); setErrors(e => ({ ...e, dayType: '' })); }}
                          className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors
                            ${form.dayType === d ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-blue-300'}`}>
                          {d === 'DAYSCHOLAR' ? 'Day Scholar' : 'Hosteller'}
                        </button>
                      ))}
                    </div>
                  </Field>
                  {form.dayType === 'HOSTELLER' && (
                    <Field label="Hostel Name" required error={errors.hostelName} span2>
                      <ComboBox value={form.hostelName} onChange={v => { set('hostelName')(v); setErrors(e => ({ ...e, hostelName: '' })); }}
                        options={opts.hostel || []} placeholder="Select hostel" error={errors.hostelName} />
                    </Field>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════ STEP 3 ═══════════════ */}
            {step === 3 && (
              <div className="space-y-6">

                {/* Examination for first admission */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Examination for First Admission to a College or University</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Name of Exam" required error={errors.nameOfExam}>
                      <ComboBox value={form.nameOfExam} onChange={v => { set('nameOfExam')(v); touch('nameOfExam', v); }}
                        options={opts.exam || []} placeholder="Select exam" error={errors.nameOfExam} />
                      <FieldMeta value={form.nameOfExam} max={40} always error={undefined} />
                    </Field>
                    <Field label="Month & Year of Passing" required error={errors.dateAndYear}>
                      <ComboBox value={form.dateAndYear} onChange={v => { set('dateAndYear')(v); touch('dateAndYear', v); }}
                        options={opts.monthYear || []} placeholder="Select month & year" error={errors.dateAndYear} />
                      <FieldMeta value={form.dateAndYear} max={14} always error={undefined} />
                    </Field>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Academic Details Currently */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Academic Details (Currently)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Present Class" required error={errors.presentClass}>
                      <ComboBox value={form.presentClass} onChange={v => { set('presentClass')(v); touch('presentClass', v); }}
                        options={opts.class || []} placeholder="e.g. I B.Sc" error={errors.presentClass} />
                      <FieldMeta value={form.presentClass} max={20} always error={undefined} />
                    </Field>
                    <Field label="Duration of Course" required error={errors.durationOfCourse}>
                      <ComboBox value={form.durationOfCourse} onChange={v => { set('durationOfCourse')(v); touch('durationOfCourse', v); }}
                        options={opts.duration || []} placeholder="e.g. 3 Years" error={errors.durationOfCourse} />
                      <FieldMeta value={form.durationOfCourse} max={7} always error={undefined} />
                    </Field>
                    <Field label="Name of Present Course" required error={errors.presentCourse} span2>
                      <ComboBox value={form.presentCourse} onChange={v => { set('presentCourse')(v); touch('presentCourse', v); }}
                        options={opts.course || []} placeholder="Select course" error={errors.presentCourse} />
                      <FieldMeta value={form.presentCourse} max={40} always error={undefined} />
                    </Field>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Month & Year of First Admission */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Month & Year of First Admission to University</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Month & Year of First Admission" required error={errors.university} span2>
                      <ComboBox value={form.university} onChange={v => { set('university')(v); touch('university', v); }}
                        options={opts.monthYear || []} placeholder="Select month & year" error={errors.university} />
                      <FieldMeta value={form.university} max={14} always error={undefined} />
                    </Field>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Previous IUT Participation */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Previous IUT Participation (While Pursuing)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Graduate Course — No. of Years" required error={errors.graduateCourse}>
                      <ComboBox value={form.graduateCourse} onChange={v => { set('graduateCourse')(v); touch('graduateCourse', v); }}
                        options={opts.iut || ['NIL','1 Year','2 Years','3 Years','4 Years','5 Years']} placeholder="Select" error={errors.graduateCourse} />
                    </Field>
                    <Field label="PG Course — No. of Years" required error={errors.pgCourse}>
                      <ComboBox value={form.pgCourse} onChange={v => { set('pgCourse')(v); touch('pgCourse', v); }}
                        options={opts.iut || ['NIL','1 Year','2 Years','3 Years','4 Years','5 Years']} placeholder="Select" error={errors.pgCourse} />
                    </Field>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Change of course */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Details about Change of Course / Faculty (if any)</p>
                  <Field label="Previous course / faculty details">
                    <textarea rows={2} value={form.previousCourse} maxLength={100}
                      onChange={e => { const v = sanitizePrevCourse(e.target.value); set('previousCourse')(v); touch('previousCourse', v); }}
                      onBlur={() => touch('previousCourse', form.previousCourse)}
                      placeholder="Describe any previous / new course or faculty change (leave blank if none)"
                      className={inputCls(errors.previousCourse) + ' resize-none'} />
                    <FieldMeta value={form.previousCourse} max={100} always error={errors.previousCourse} />
                  </Field>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Sportsman Dress */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Other — Sportsman Dress</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="T-Shirt Size">
                      <input type="text" value={form.tshirt} maxLength={3}
                        onChange={e => setForm(f => ({ ...f, tshirt: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                        placeholder="e.g. 40" className={inputCls(false)} />
                      <FieldMeta value={form.tshirt} max={3} always={false} error={undefined} />
                    </Field>
                    <Field label="Track Size">
                      <input type="text" value={form.track} maxLength={3}
                        onChange={e => setForm(f => ({ ...f, track: e.target.value.replace(/\D/g, '').slice(0, 3) }))}
                        placeholder="e.g. 42" className={inputCls(false)} />
                      <FieldMeta value={form.track} max={3} always={false} error={undefined} />
                    </Field>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Document Uploads */}
                <div>
                  <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide mb-4">Document Uploads</p>
                  <div className="space-y-6">

                    {/* Aadhaar — required */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Aadhaar Card <span className="text-red-500">*</span>
                      </p>
                      <AadhaarUpload
                        locked={false}
                        onValidationChange={setAadhaarValidated}
                        onFileChange={setAadhaarFile}
                      />
                      {errors.aadhaarFile && !aadhaarValidated && (
                        <p className="mt-1 text-xs text-red-500">{errors.aadhaarFile}</p>
                      )}
                    </div>

                    {/* +2 Marksheet — required */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        +2 Marksheet <span className="text-red-500">*</span>
                      </p>
                      <MarksheetUpload
                        onValidationChange={setMarksheetValidated}
                        onFileChange={setMarksheetFile}
                      />
                      {errors.marksheetFile && !marksheetValidated && (
                        <p className="mt-1 text-xs text-red-500">{errors.marksheetFile}</p>
                      )}
                    </div>

                    {/* Fees Receipt — required */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        UG/PG Admission Fees Receipt <span className="text-red-500">*</span>
                      </p>
                      <FeesReceiptUpload
                        onValidationChange={setFeesReceiptValidated}
                        onFileChange={setFeesReceiptFile}
                      />
                      {errors.feesReceiptFile && !feesReceiptValidated && (
                        <p className="mt-1 text-xs text-red-500">{errors.feesReceiptFile}</p>
                      )}
                    </div>

                    {/* ID Card — optional */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        College ID Card
                        <span className="ml-1.5 text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                      </p>
                      <IdCardUpload
                        locked={false}
                        onValidationChange={setIdCardValidated}
                        onFileChange={setIdCardFile}
                      />
                    </div>

                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Terms & Conditions */}
                <div className={`rounded-xl border p-4 ${errors.terms ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-blue-600 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      I hereby certify that all the information provided in this form is <strong>true and original</strong>. I understand that any false information or misrepresentation may result in disqualification from sports participation and/or disciplinary action by Bharathidasan University.
                    </span>
                  </label>
                  {errors.terms && <p className="mt-2 text-xs text-red-500 ml-7">{errors.terms}</p>}
                </div>

                {submitError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">{submitError}</div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-5">
            {step > 1
              ? <button type="button" onClick={handleBack}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              : <div />}

            {step < 3
              ? <button type="button" onClick={handleNext}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              : <button type="submit" disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-xl text-sm font-medium transition-colors">
                  {submitting
                    ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                    : <><CheckCircle className="w-4 h-4" /> Submit Registration</>}
                </button>}
          </div>
        </form>
      </div>

      {/* Crop modal */}
      {showCrop && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="relative flex-1">
            <Cropper
              image={cropSrc} crop={crop} zoom={zoom} aspect={3 / 4}
              onCropChange={setCrop} onZoomChange={setZoom}
              onCropComplete={(_, px) => setCroppedPx(px)}
            />
          </div>
          <div className="bg-black px-4 py-4 flex items-center gap-4">
            <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 accent-blue-500" />
            <button type="button" onClick={() => { setShowCrop(false); setCropSrc(null); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm">Cancel</button>
            <button type="button" onClick={confirmCrop}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium">Use Photo</button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-6">© {new Date().getFullYear()} Bharathidasan University · Sports Division</p>
    </div>
  );
}
