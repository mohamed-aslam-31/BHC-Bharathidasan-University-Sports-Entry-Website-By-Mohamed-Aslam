import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PDFDocument } from 'pdf-lib';
import html2canvas from 'html2canvas';
import { getStudent, deleteStudent } from '../api';
import { useToast } from '../components/Toast';
import {
  ArrowLeft, Pencil, Printer, Trash2, AlertTriangle, Loader2,
  ChevronLeft, ChevronRight, FileText, User, BookOpen,
  Download, Check,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── Page definitions ─────────────────────────────────────────────────────── */
const PAGES = [
  { key: 'proforma',  label: 'Proforma',   icon: BookOpen },
  { key: 'basicinfo', label: 'Basic Info',  icon: User },
  { key: 'documents', label: 'Documents',   icon: FileText },
];

/* ── Print items ──────────────────────────────────────────────────────────── */
const PRINT_ITEMS = [
  { key: 'proforma',    label: 'Eligibility Proforma' },
  { key: 'aadhaar',     label: 'Aadhaar Card' },
  { key: 'idcard',      label: 'ID Card' },
  { key: 'marksheet',   label: '12th Marksheet' },
  { key: 'feesreceipt', label: 'Fee Receipt' },
];

/* ── Small helpers ────────────────────────────────────────────────────────── */
const td = (v) => v || 'NIL';

const formatDOB = (val) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
};

/* ── Info row for Basic Info page ─────────────────────────────────────────── */
function InfoRow({ label, value, highlight = false }) {
  return (
    <div className={`flex items-start gap-3 py-3 px-4 rounded-xl border ${
      highlight
        ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-200/60 dark:border-blue-700/40'
        : 'bg-white/50 dark:bg-gray-800/50 border-gray-200/50 dark:border-gray-700/40'
    }`}>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-40 flex-shrink-0 mt-0.5">{label}</span>
      <span className={`text-sm font-semibold flex-1 ${
        highlight ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-gray-100'
      }`}>{value || '—'}</span>
    </div>
  );
}

/* ── Document viewer panel ─────────────────────────────────────────────────── */
function DocPanel({ title, path, icon: Icon }) {
  if (!path) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
        <Icon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
        <p className="text-sm text-gray-400 dark:text-gray-500">{title} not uploaded</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Icon className="w-4 h-4" />{title}
        </h3>
        <a
          href={`/uploads/${path}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          Open in new tab ↗
        </a>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900" style={{ height: '480px' }}>
        <iframe
          src={`/uploads/${path}`}
          title={title}
          className="w-full h-full"
          style={{ border: 'none' }}
        />
      </div>
    </div>
  );
}

/* ── Render the proforma element as a high-res PDF page ──────────────────── */
async function captureProformaAsPdf() {
  const el = document.getElementById('element-to-print');
  if (!el) return null;

  const A4_W = 794; // A4 at 96 dpi

  // Clone so we never touch the live element
  const clone = el.cloneNode(true);
  clone.style.cssText = [
    'font-family: Times New Roman, serif',
    'color: #000 !important',
    'background: #fff !important',
    `width: ${A4_W}px`,
    'max-width: none',
    'padding: 28px 32px',
    'box-sizing: border-box',
    'position: fixed',
    'top: -9999px',
    'left: -9999px',
    'z-index: -1',
    'pointer-events: none',
  ].join(';');

  // Force all text in the clone to be black on white (override dark-mode classes)
  clone.querySelectorAll('*').forEach((node) => {
    node.style.color = '#000';
    node.style.backgroundColor = '';
    node.style.borderColor = '';
  });

  document.body.appendChild(clone);

  // Wait two frames for layout
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: A4_W,
      windowWidth: A4_W,
    });

    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png');
    const doc = await PDFDocument.create();

    // A4 in PDF points: 595 × 842
    const PW = 595, PH = 842;
    const margin = 20;
    const usableW = PW - margin * 2;
    const usableH = PH - margin * 2;
    const imgRatio = canvas.width / canvas.height;
    let iw = usableW;
    let ih = iw / imgRatio;
    if (ih > usableH) { ih = usableH; iw = ih * imgRatio; }

    const page = doc.addPage([PW, PH]);
    const img  = await doc.embedPng(imgData);
    page.drawImage(img, {
      x: (PW - iw) / 2,
      y: PH - margin - ih,
      width: iw,
      height: ih,
    });
    return doc;
  } catch (err) {
    if (document.body.contains(clone)) document.body.removeChild(clone);
    console.error('Proforma capture failed:', err);
    return null;
  }
}

/* ── Merge proforma + uploaded PDFs into one ─────────────────────────────── */
async function buildMergedPdf(paths, includeProforma = false) {
  const merged = await PDFDocument.create();

  if (includeProforma) {
    const proformaPdf = await captureProformaAsPdf();
    if (proformaPdf) {
      const [pg] = await merged.copyPages(proformaPdf, [0]);
      merged.addPage(pg);
    }
  }

  for (const path of paths) {
    const res = await fetch(`/uploads/${path}`);
    if (!res.ok) continue;
    const bytes = await res.arrayBuffer();
    try {
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const copied = await merged.copyPages(src, src.getPageIndices());
      copied.forEach((p) => merged.addPage(p));
    } catch {
      // skip unreadable PDF silently
    }
  }
  return await merged.save();
}

/* ── Print-select modal ────────────────────────────────────────────────────── */
function PrintModal({ student, onClose }) {
  const DOC_KEYS = ['aadhaar', 'idcard', 'marksheet', 'feesreceipt'];
  const pdfMap = {
    aadhaar:     student.aadhaarPdf,
    idcard:      student.idCardPdf,
    marksheet:   student.marksheetPdf,
    feesreceipt: student.feesReceiptPdf,
  };

  const [selected, setSelected] = useState(() => ({
    proforma:    true,
    aadhaar:     !!student.aadhaarPdf,
    idcard:      !!student.idCardPdf,
    marksheet:   !!student.marksheetPdf,
    feesreceipt: !!student.feesReceiptPdf,
  }));

  const [status, setStatus] = useState('idle'); // 'idle' | 'generating' | 'ready'
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError]   = useState('');

  const toggle = (k) => {
    setSelected((p) => ({ ...p, [k]: !p[k] }));
    setStatus('idle');
    if (pdfUrl) { URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
  };

  const anySelected = selected.proforma || DOC_KEYS.some((k) => selected[k] && pdfMap[k]);

  const handlePrintProforma = () => {
    onClose();
    setTimeout(() => window.print(), 150);
  };

  const handleGenerate = async () => {
    setError('');
    setStatus('generating');
    try {
      const paths = DOC_KEYS.filter((k) => selected[k] && pdfMap[k]).map((k) => pdfMap[k]);
      const bytes = await buildMergedPdf(paths, selected.proforma);
      const blob  = new Blob([bytes], { type: 'application/pdf' });
      setPdfUrl(URL.createObjectURL(blob));
      setStatus('ready');
    } catch {
      setError('Failed to generate PDF. Please try again.');
      setStatus('idle');
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${student.nameOfTheSportsperson || 'student'}_documents.pdf`;
    a.click();
  };

  const handleClose = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    onClose();
  };

  const DOC_ITEMS = [
    { key: 'aadhaar',     label: 'Aadhaar Card' },
    { key: 'idcard',      label: 'ID Card' },
    { key: 'marksheet',   label: '12th Marksheet' },
    { key: 'feesreceipt', label: 'Fee Receipt' },
  ];

  const ALL_ITEMS = [
    { key: 'proforma',    label: 'Eligibility Proforma', alwaysAvailable: true },
    { key: 'aadhaar',     label: 'Aadhaar Card' },
    { key: 'idcard',      label: 'ID Card' },
    { key: 'marksheet',   label: '12th Marksheet' },
    { key: 'feesreceipt', label: 'Fee Receipt' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">

        {/* Title */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print / Export
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Select pages to include in the merged PDF download.
          </p>
        </div>

        {/* Checkboxes */}
        <div className="space-y-1.5">
          {ALL_ITEMS.map(({ key, label, alwaysAvailable }) => {
            const unavailable = !alwaysAvailable && !pdfMap[key];
            return (
              <label key={key} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                unavailable
                  ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : selected[key]
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
                <input type="checkbox" checked={!!selected[key]} disabled={unavailable}
                  onChange={() => toggle(key)} className="sr-only" />
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selected[key] && !unavailable ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-500 bg-transparent'
                }`}>
                  {selected[key] && !unavailable && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1">{label}</span>
                {unavailable && <span className="text-xs text-gray-400">Not uploaded</span>}
              </label>
            );
          })}
        </div>

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        {/* Actions */}
        {status === 'ready' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">Ready to download</span>
            </div>
            <button onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
              <Download className="w-4 h-4" /> Download Merged PDF
            </button>
            <button onClick={handleClose} className="w-full btn-secondary text-sm">Close</button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={handleClose} className="flex-1 btn-secondary text-sm">Cancel</button>
            <button onClick={handleGenerate} disabled={!anySelected || status === 'generating'}
              className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {status === 'generating'
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
                : <><FileText className="w-4 h-4" /> Merge &amp; Download</>}
            </button>
          </div>
        )}

        {/* Proforma-only print shortcut */}
        <button onClick={handlePrintProforma}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors py-1">
          <Printer className="w-3.5 h-3.5" /> Print proforma only (browser print dialog)
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function StudentViewPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

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

  useEffect(() => {
    getStudent(id)
      .then((res) => setStudent(res.data))
      .catch(() => { addToast('Student not found', 'error'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading student details…" />
    </div>
  );
  if (!student) return null;

  const prevPage = () => setPage((p) => Math.max(0, p - 1));
  const nextPage = () => setPage((p) => Math.min(PAGES.length - 1, p + 1));

  return (
    <div className="max-w-4xl">

      {/* ── Toolbar (screen only) ── */}
      <div className="flex items-center justify-between mb-6 no-print print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student View</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.nameOfTheSportsperson}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <Link to={`/students/${id}/edit`} className="btn-primary flex items-center gap-2 text-sm">
            <Pencil className="w-4 h-4" /> Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* ── Delete confirm ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Delete Student</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Are you sure you want to delete <strong>{student.nameOfTheSportsperson}</strong>? This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-1">
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="btn-secondary text-sm px-5 disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex items-center gap-2 text-sm px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50">
                {deleting ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</> : <><Trash2 className="w-4 h-4" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Print modal ── */}
      {showPrintModal && <PrintModal student={student} onClose={() => setShowPrintModal(false)} />}

      {/* ── Page tabs (screen only) ── */}
      <div className="flex gap-1 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl no-print print:hidden">
        {PAGES.map((p, i) => {
          const Icon = p.icon;
          return (
            <button
              key={p.key}
              onClick={() => setPage(i)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                page === i
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {p.label}
            </button>
          );
        })}
      </div>

      {/* ══ PAGE 0: PROFORMA ═════════════════════════════════════════════════ */}
      {page === 0 && (
        <div id="element-to-print" style={{ fontFamily: 'Times New Roman, serif', color: '#000', background: '#fff', padding: '18px 20px', maxWidth: '760px', margin: '0 auto', boxSizing: 'border-box' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
            <div style={{ width: '100px', flexShrink: 0 }}>
              <img src="/university-logo.gif" alt="BU Logo" style={{ width: '95px', height: '95px', objectFit: 'contain', display: 'block' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'center', lineHeight: 1.4, paddingTop: '6px', paddingBottom: '6px' }}>
              <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bharathidasan University</div>
              <div style={{ fontSize: '13px' }}>TIRUCHIRAPPALLI - 620 024</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '3px' }}>Eligibility Proforma of Players</div>
              <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }}>Division: <em>Trichy / Thanjavur*</em></div>
              <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }}><em>{student.year || ''}</em></div>
            </div>
            <div style={{ width: '100px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ border: '1px solid #000', width: '90px', height: '105px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {student.image
                  ? <img src={`/uploads/${student.image}`} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '11px', color: '#666', textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '4px' }}>Photo</span>
                }
              </div>
            </div>
          </div>

          {/* College / Game line */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', marginTop: '4px', fontFamily: 'Arial, sans-serif', flexWrap: 'wrap', gap: '4px' }}>
            <div>College: <strong>Bishop Heber College, Trichy</strong></div>
            <div>Game: <strong>{student.nameOfTheGame}{student.gender ? ' – ' + student.gender : ''}</strong></div>
          </div>

          {/* Main table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'Arial, sans-serif', tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '6%' }} />
              <col style={{ width: '44%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '32%' }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={numCell}>1.</td>
                <td colSpan={2} style={labelCell}>Name of the sportsperson</td>
                <td style={valueCell}>{td(student.nameOfTheSportsperson)}</td>
              </tr>
              <tr>
                <td style={numCell}>2.</td>
                <td colSpan={2} style={labelCell}>Father's Name</td>
                <td style={valueCell}>{td(student.fathersName)}</td>
              </tr>
              <tr>
                <td style={numCell}>3.</td>
                <td colSpan={2} style={labelCell}>
                  Date of Birth
                  <div style={{ fontSize: '9.5px', fontWeight: 'bold', marginTop: '1px' }}>(copy of +2 Mark sheet should be enclosed)</div>
                </td>
                <td style={valueCell}>{formatDOB(student.dateOfBirth)}</td>
              </tr>
              <tr>
                <td rowSpan={2} style={{ ...numCell, verticalAlign: 'middle' }}>4.</td>
                <td rowSpan={2} style={{ ...labelCell, verticalAlign: 'middle' }}>Date &amp; year of passing Qualifying Examination for First admission to a college / university</td>
                <td style={subLabelCell}>Name of Exam</td>
                <td style={valueCell}>{td(student.nameOfExam)}</td>
              </tr>
              <tr>
                <td style={subLabelCell}>Date &amp; Year</td>
                <td style={valueCell}>{td(student.dateAndYear)}</td>
              </tr>
              <tr>
                <td style={numCell}>5.</td>
                <td colSpan={2} style={labelCell}>Present Class</td>
                <td style={valueCell}>{td(student.presentClass)}</td>
              </tr>
              <tr>
                <td style={numCell}>6.</td>
                <td colSpan={2} style={labelCell}>Name of the present course</td>
                <td style={valueCell}>{td(student.nameOfThePresentClass)}</td>
              </tr>
              <tr>
                <td style={numCell}>7.</td>
                <td colSpan={2} style={labelCell}>Duration of course</td>
                <td style={valueCell}>{td(student.durationOfCourse)}</td>
              </tr>
              <tr>
                <td rowSpan={2} style={{ ...numCell, verticalAlign: 'middle' }}>8.</td>
                <td rowSpan={2} style={{ ...labelCell, verticalAlign: 'middle' }}>Date &amp; year of First admission to</td>
                <td style={subLabelCell}>University</td>
                <td style={valueCell}>{td(student.university)}</td>
              </tr>
              <tr>
                <td style={subLabelCell}>Present course</td>
                <td style={valueCell}>{td(student.presentCourse)}</td>
              </tr>
              <tr>
                <td rowSpan={2} style={{ ...numCell, verticalAlign: 'middle' }}>9.</td>
                <td rowSpan={2} style={{ ...labelCell, verticalAlign: 'middle' }}>No. of years of previous IUT participation while pursuing</td>
                <td style={subLabelCell}>Graduate course</td>
                <td style={valueCell}>{td(student.graduateCourse)}</td>
              </tr>
              <tr>
                <td style={subLabelCell}>P.G. course</td>
                <td style={valueCell}>{td(student.pgCourse)}</td>
              </tr>
              <tr>
                <td style={numCell}>10.</td>
                <td colSpan={2} style={labelCell}>
                  Details about change of course / faculty, if any
                  <div style={{ fontSize: '9.5px', marginTop: '1px' }}>(Details about the previous / new – course / faculty)</div>
                </td>
                <td style={valueCell}>{td(student.previousCourse)}</td>
              </tr>
              <tr>
                <td style={numCell}>11.</td>
                <td colSpan={2} style={labelCell}>Residential address (With phone / Mobile no)</td>
                <td style={{ ...valueCell, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {student.address || '—'}
                  {student.phoneNumber ? <><br /><strong>{student.phoneNumber}</strong></> : null}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer notes */}
          <div style={{ marginTop: '10px', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
            <div>*Strike out whichever is not applicable</div>
            <div>Readmitted UG/PG students should enclose copy of admission fee receipt in original</div>
          </div>

          {/* Signatures */}
          <div style={{ textAlign: 'right', marginTop: '18px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
            Signature of the student
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
            <div>Signature of the<br />Director of Physical Education</div>
            <div style={{ textAlign: 'right' }}>Signature of the Principal/HOD<br />College seal with date</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <div style={{ border: '1px solid #000', padding: '10px 32px', textAlign: 'center', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
              Eligibility verified<br />Local organiser Signature &amp; Seal
            </div>
          </div>
        </div>
      )}

      {/* ══ PAGE 1: BASIC INFO ═══════════════════════════════════════════════ */}
      {page === 1 && (
        <div className="no-print print:hidden space-y-3">
          {/* Photo + name banner */}
          <div className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/40 mb-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {student.image
                ? <img src={`/uploads/${student.image}`} alt="Photo" className="w-full h-full object-cover" />
                : <User className="w-8 h-8 text-gray-400" />}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{student.nameOfTheSportsperson || '—'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{student.nameOfTheGame} · {student.gender || '—'}</p>
              {student.status && (
                <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                  student.status === 'approved'
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                    : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400'
                }`}>{student.status.toUpperCase()}</span>
              )}
            </div>
          </div>

          {/* Identity */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1">Identity</p>
          <InfoRow label="Year" value={student.year} />
          <InfoRow label="Roll Number" value={student.rollNo} />
          <InfoRow label="Aadhaar Number" value={student.aadharNumber} />
          <InfoRow label="Blood Group" value={student.bloodGroup} />
          <InfoRow label="Date of Birth" value={formatDOB(student.dateOfBirth)} />

          {/* Classification */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 pt-2">Classification</p>
          <InfoRow label="Shift" value={student.shift} highlight={!!student.shift} />
          <InfoRow label="Student Type" value={student.studentType} />
          <InfoRow label="Day Scholar / Hosteller" value={student.dayType} />
          {student.hostelName && <InfoRow label="Hostel Name" value={student.hostelName} />}

          {/* Contact */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 pt-2">Contact</p>
          <InfoRow label="Phone Number" value={student.phoneNumber} />
          <InfoRow label="Address" value={student.address} />
          <InfoRow label="Father's Name" value={student.fathersName} />
          <InfoRow label="Mother's Name" value={student.motherName} />

          {/* Sportsman Dress */}
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-1 pt-2">Sportsman Dress</p>
          <InfoRow label="T-Shirt Size" value={student.tshirt} />
          <InfoRow label="Track Size" value={student.track} />
        </div>
      )}

      {/* ══ PAGE 2: DOCUMENTS ═══════════════════════════════════════════════ */}
      {page === 2 && (
        <div className="no-print print:hidden space-y-8">
          <DocPanel title="Aadhaar Card"   path={student.aadhaarPdf}     icon={FileText} />
          <DocPanel title="ID Card"        path={student.idCardPdf}      icon={FileText} />
          <DocPanel title="12th Marksheet" path={student.marksheetPdf}   icon={FileText} />
          <DocPanel title="Fee Receipt"    path={student.feesReceiptPdf} icon={FileText} />
        </div>
      )}

      {/* ── Prev / Next navigation ── */}
      <div className="flex items-center justify-between mt-8 no-print print:hidden">
        <button
          onClick={prevPage}
          disabled={page === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {/* Page dots */}
        <div className="flex items-center gap-2">
          {PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`rounded-full transition-all ${
                i === page
                  ? 'w-6 h-2.5 bg-blue-500'
                  : 'w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextPage}
          disabled={page === PAGES.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Print CSS */}
      <style>{`
        @page { size: A4 portrait; margin: 12mm 20mm; }
        @media print {
          .print\\:hidden, .no-print { display: none !important; }
          html, body { margin: 0; padding: 0; background: #fff; }
          #element-to-print {
            padding: 0 4mm !important;
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ── Cell styles ── */
const border = '1px solid #000';
const numCell      = { border, padding: '6px 7px', verticalAlign: 'top', textAlign: 'center', whiteSpace: 'nowrap' };
const labelCell    = { border, padding: '6px 8px', verticalAlign: 'top', lineHeight: 1.5 };
const subLabelCell = { border, padding: '6px 8px', verticalAlign: 'middle', whiteSpace: 'nowrap' };
const valueCell    = { border, padding: '6px 8px', verticalAlign: 'middle', fontWeight: 'bold', wordBreak: 'break-word' };
