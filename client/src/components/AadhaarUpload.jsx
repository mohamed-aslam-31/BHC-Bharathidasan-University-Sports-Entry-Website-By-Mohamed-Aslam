import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Upload, X, Eye, AlertCircle, CheckCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MIN_SIZE = 200 * 1024;       // 200 KB
const MAX_SIZE = 2 * 1024 * 1024;  // 2 MB

/* ── PDF text extractor ─────────────────────────────────────────────────────
   Returns { text, numPages, isImageOnly }.
   isImageOnly = true when no embedded text was found (scanned PDF).
   Throws if the PDF is password-protected.
────────────────────────────────────────────────────────────────────────────── */
async function extractPdfText(file) {
  const ab  = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;

  const page = await pdf.getPage(1);
  const tc   = await page.getTextContent();
  const text = tc.items.map((it) => it.str).join('\n');

  // If fewer than 20 meaningful characters came back, treat as image-only
  const isImageOnly = text.replace(/\s/g, '').length < 20;

  return { text, numPages: pdf.numPages, isImageOnly, _pdf: pdf, _page: page };
}

/* ── Render PDF page → high-res canvas image data URL ───────────────────── */
async function renderPageToDataUrl(page) {
  const scale    = 3;   // 3× for better OCR accuracy on small Aadhaar card text
  const viewport = page.getViewport({ scale });
  const canvas   = document.createElement('canvas');
  canvas.width   = viewport.width;
  canvas.height  = viewport.height;
  const ctx      = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

/* ── OCR a data-URL image with Tesseract.js ─────────────────────────────── */
async function ocrImage(dataUrl, onProgress) {
  // Dynamic import so Tesseract is only loaded when needed (saves ~2 MB normally)
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round((m.progress || 0) * 100));
      }
    },
  });
  const { data: { text } } = await worker.recognize(dataUrl);
  await worker.terminate();
  return text;
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */

// True when a string is ≥80 % Latin/ASCII (filters Tamil/Hindi script lines)
function isLatinLine(s) {
  const latin = (s.match(/[a-zA-Z0-9 .,'"/\\()\-:]/g) || []).length;
  return latin / s.length >= 0.80;
}

const BOILERPLATE =
  /government|of india|uidai|unique identification|authority|enrolment|enrollment|eid\b|vid\b|help|download|verify|\.gov|www\.|digital|electronically|generated|issued|this is|e-aadhaar|eaadhaar|resident|आधार|ஆதார்/i;

const DATE_LINE   = /^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/;
const NUMERIC     = /^[\d\s\/\-]+$/;
const FIELD_LABEL = /^(?:DOB|Date\s+of\s+Birth|Gender|Address|VID|EID|Mobile|Phone|Email|Year\s+of\s+Birth)/i;
const REL_INDICATOR = /\b(?:S\/O|C\/O|D\/O|G\/O|W\/O|H\/O)\b/i;

/* ── Aadhaar data parser ─────────────────────────────────────────────────── */
function parseAadhaar(rawText) {
  const allLines = rawText
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  const flat      = allLines.join(' ');
  const latinFlat = allLines.filter(isLatinLine).join(' ');

  /* 1. Aadhaar number — any 12 consecutive digits (strip spaces between digit groups first) */
  // Collapse runs of digits separated only by spaces so OCR gaps don't split the number
  const digitCollapsed = flat.replace(/(\d)\s+(\d)/g, (_, a, b) => a + b)
                             .replace(/(\d)\s+(\d)/g, (_, a, b) => a + b); // second pass for odd-count gaps
  const aadhaarMatch = digitCollapsed.match(/(?<!\d)(\d{12})(?!\d)/);
  const aadhaarNo = aadhaarMatch ? aadhaarMatch[1] : null;

  /* Masked detection (XXXX XXXX 1234) */
  const isMasked =
    /[Xx]{4}\s?[Xx]{4}\s?\d{4}/.test(flat) ||
    /\b[Xx]{4}\s?[Xx]{4}\b/.test(flat);

  /* 2. DOB — prefer explicit "DOB:" label; bare date only from Latin lines */
  const dobLabelled = flat.match(
    /(?:DOB|Date\s+of\s+Birth|D\.O\.B\.?)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i,
  );
  const dobBare = latinFlat.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  const dobRaw  = dobLabelled ? dobLabelled[1] : dobBare ? dobBare[1] : null;
  let dob = null;
  if (dobRaw) {
    const parts = dobRaw.split(/[\/\-]/);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      dob = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  /* 3. Name + father name (informational only — not verified) */
  const meaningful = allLines.filter((l) => {
    if (!isLatinLine(l))     return false;
    if (l.length < 3)        return false;
    if (NUMERIC.test(l))     return false;
    if (DATE_LINE.test(l))   return false;
    if (BOILERPLATE.test(l)) return false;
    if (FIELD_LABEL.test(l)) return false;
    return true;
  });

  const name = meaningful[0] || null;

  let fatherName = null;
  const fatherLine = meaningful[1] || '';
  if (fatherLine) {
    if (REL_INDICATOR.test(fatherLine)) {
      const withoutRel = fatherLine.replace(REL_INDICATOR, '').replace(/:/g, '').trim();
      if (withoutRel.length > 1 && /^[A-Za-z]/.test(withoutRel)) fatherName = withoutRel;
    } else if (/^[A-Za-z][A-Za-z .]{1,}$/.test(fatherLine)) {
      fatherName = fatherLine;
    }
  }
  if (!fatherName) {
    const m = latinFlat.match(
      /(?:S\/O|C\/O|D\/O|G\/O|W\/O|H\/O)\s*:?\s*([A-Za-z][A-Za-z .]{2,})(?=\s{2,}|\d|$|,)/i,
    );
    if (m) fatherName = m[1].trim();
  }

  return { aadhaarNo, dob, name, fatherName, isMasked };
}

/* ── Verification (DOB + Aadhaar number only) ────────────────────────────── */
function buildMismatches(parsed, form) {
  const issues = [];
  if (parsed.aadhaarNo && form.aadharNumber) {
    if (parsed.aadhaarNo !== form.aadharNumber.replace(/\s/g, ''))
      issues.push({ field: 'Aadhaar Number', pdf: parsed.aadhaarNo, entered: form.aadharNumber });
  }
  if (parsed.dob && form.dob) {
    if (parsed.dob !== form.dob)
      issues.push({ field: 'Date of Birth', pdf: parsed.dob, entered: form.dob });
  }
  return issues;
}

/* ── Physical Aadhaar layout diagram ─────────────────────────────────────── */
function PhysicalAadhaarDiagram() {
  return (
    <div className="mt-3 border border-blue-200 dark:border-blue-700 rounded-xl overflow-hidden">
      <div className="bg-blue-100/60 dark:bg-blue-900/30 px-3 py-2 text-xs font-semibold text-blue-800 dark:text-blue-300 border-b border-blue-200 dark:border-blue-700">
        📐 How to arrange physical Aadhaar (front + back) in one PDF page
      </div>
      <div className="p-3 bg-white dark:bg-gray-800/60">
        {/* A4 page mockup */}
        <div className="mx-auto border-2 border-gray-400 dark:border-gray-500 rounded bg-gray-50 dark:bg-gray-700/50"
             style={{ width: '100%', maxWidth: 320, aspectRatio: '210/297' }}>
          <div className="h-full flex flex-col gap-2 p-3">
            {/* Front card */}
            <div className="flex-1 border-2 border-dashed border-amber-400 dark:border-amber-500 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex flex-col items-center justify-center gap-1">
              <div className="w-8 h-5 rounded bg-amber-300 dark:bg-amber-600 opacity-70" />
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400">FRONT SIDE</p>
              <p className="text-[10px] text-amber-600 dark:text-amber-500 text-center px-2">
                Name · DOB · Photo · Aadhaar No.
              </p>
            </div>
            {/* Back card */}
            <div className="flex-1 border-2 border-dashed border-sky-400 dark:border-sky-500 rounded-lg bg-sky-50 dark:bg-sky-900/20 flex flex-col items-center justify-center gap-1">
              <div className="w-10 h-2 rounded bg-sky-300 dark:bg-sky-600 opacity-70 mb-1" />
              <div className="w-8 h-2 rounded bg-sky-300 dark:bg-sky-600 opacity-50" />
              <p className="text-xs font-bold text-sky-700 dark:text-sky-400 mt-1">BACK SIDE</p>
              <p className="text-[10px] text-sky-600 dark:text-sky-500 text-center px-2">
                Address · QR Code
              </p>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Place both sides on a single A4 page, then export / print to PDF
        </p>
        {/* Step instructions */}
        <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <p className="font-semibold text-gray-700 dark:text-gray-300">Quick steps:</p>
          <p>1. Take a clear photo of the <strong>front</strong> and <strong>back</strong> of your Aadhaar card</p>
          <p>2. Open <strong>Google Docs / Word / Paint</strong> and paste both images on one page (top + bottom)</p>
          <p>3. <strong>File → Print → Save as PDF</strong> (or export as PDF)</p>
          <p>4. Upload the resulting single-page PDF here</p>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────────────── */
// locked = true when required fields haven't been filled yet
// onFileChange(file|null) = called whenever the user picks or clears a PDF
export default function AadhaarUpload({ form, onValidationChange, onFileChange, locked = false }) {
  const [file, setFile]               = useState(null);
  const [blobUrl, setBlobUrl]         = useState(null);
  const [parsing, setParsing]         = useState(false);
  const [parsingStatus, setParsingStatus] = useState('');
  const [parsed, setParsed]           = useState(null);
  const [mismatches, setMismatches]   = useState([]);
  const [parseError, setParseError]   = useState('');
  const [showViewer, setShowViewer]   = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const fileRef = useRef(null);

  // ── Live re-check whenever DOB or Aadhaar number changes after PDF parsed ──
  useEffect(() => {
    if (!parsed) return;
    const issues = buildMismatches(parsed, form);
    setMismatches(issues);
    if (issues.length > 0) setParseError('');   // clear old upload errors; show mismatch rows
    onValidationChange(issues.length === 0);
  }, [form.aadharNumber, form.dob]);             // eslint-disable-line react-hooks/exhaustive-deps

  const reset = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setFile(null); setBlobUrl(null); setParsed(null);
    setMismatches([]); setParseError(''); setShowViewer(false);
    onValidationChange(false);
    if (onFileChange) onFileChange(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (f) => {
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Only PDF files are allowed.');
      return;
    }
    if (f.size < MIN_SIZE) {
      setParseError(`File too small (${(f.size / 1024).toFixed(0)} KB). Minimum is 200 KB — ensure the scan is clear and high quality.`);
      return;
    }
    if (f.size > MAX_SIZE) {
      setParseError(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 2 MB.`);
      return;
    }

    const url = URL.createObjectURL(f);
    setFile(f); setBlobUrl(url);
    if (onFileChange) onFileChange(f);
    setParseError(''); setParsed(null); setMismatches([]);
    onValidationChange(false);
    setParsing(true);
    setParsingStatus('Reading PDF…');

    try {
      const { text, numPages, isImageOnly, _page } = await extractPdfText(f);

      // ── 1-page enforcement ──
      if (numPages > 1) {
        setParseError(
          `This PDF has ${numPages} pages. Only a single-page PDF is allowed. ` +
          'If you have a physical Aadhaar, place both sides on one page before converting to PDF.',
        );
        onValidationChange(false);
        return;
      }

      let finalText = text;

      // ── Scanned / image-only PDF → fall back to OCR ──
      if (isImageOnly) {
        setParsingStatus('Scanned PDF detected — running OCR (may take 10–20 s)…');
        const dataUrl = await renderPageToDataUrl(_page);
        setParsingStatus('OCR in progress…');
        finalText = await ocrImage(dataUrl, (pct) => {
          setParsingStatus(`OCR ${pct}%…`);
        });
      }

      const result = parseAadhaar(finalText);

      if (result.isMasked) {
        setParseError('This looks like a masked Aadhaar (XXXX XXXX 1234). Please upload a full unmasked Aadhaar PDF.');
        onValidationChange(false);
        return;
      }
      if (!result.aadhaarNo) {
        setParseError('No Aadhaar number found in this PDF. Please upload a valid e-Aadhaar or a clear scanned Aadhaar PDF.');
        onValidationChange(false);
        return;
      }

      const issues = buildMismatches(result, form);
      setParsed(result);
      setMismatches(issues);
      onValidationChange(issues.length === 0);
    } catch (err) {
      const msg = String(err?.message || '');
      if (/password/i.test(msg)) {
        setParseError('This PDF is password-protected. Please upload an unprotected Aadhaar PDF.');
      } else {
        setParseError('Failed to read this PDF. Please upload a valid e-Aadhaar PDF.');
      }
      onValidationChange(false);
    } finally {
      setParsing(false);
      setParsingStatus('');
    }
  };

  const isValid = parsed && !parseError && mismatches.length === 0;

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">

      {/* Locked — required fields not yet filled */}
      {locked && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-5 py-6 flex flex-col items-center gap-2 text-center">
          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhaar upload will be available once you fill in the required fields above</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Name · Father's name · Mother's name · DOB · Aadhaar number · Phone · Address</p>
        </div>
      )}

      {/* All upload UI hidden when locked */}
      {!locked && <>

      {/* Rules banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Aadhaar Upload Guidelines
        </p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
          <li className="flex items-start gap-1.5">
            <span className="mt-px">⭐</span>
            <span>
              <strong>Preferred:</strong> Download e-Aadhaar from{' '}
              <a
                href="https://uidai.gov.in/en/my-aadhaar/get-aadhaar.html"
                target="_blank" rel="noreferrer"
                className="underline hover:text-blue-900 dark:hover:text-blue-200 inline-flex items-center gap-0.5"
              >
                uidai.gov.in <ExternalLink className="w-3 h-3" />
              </a>
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span>📄</span>
            <span>
              Physical Aadhaar: scan/photograph <strong>both sides</strong> and place them on{' '}
              <strong>one page</strong> before converting to PDF —{' '}
              <button
                type="button"
                onClick={() => setShowDiagram((v) => !v)}
                className="underline text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                {showDiagram ? 'hide example' : 'see example'}
              </button>
            </span>
          </li>
          <li className="flex items-start gap-1.5"><span>✅</span><span>Aadhaar number and Date of Birth must be clearly visible</span></li>
          <li className="flex items-start gap-1.5"><span>❌</span><span>No masked Aadhaar (XXXX XXXX 1234 format)</span></li>
          <li className="flex items-start gap-1.5"><span>❌</span><span>No password-protected PDF &nbsp;|&nbsp; No multi-page PDF</span></li>
          <li className="flex items-start gap-1.5">
            <span>📏</span>
            <span>File size: <strong>200 KB – 2 MB</strong> &nbsp;|&nbsp; Format: <strong>PDF only · 1 page</strong></span>
          </li>
        </ul>

        {showDiagram && <PhysicalAadhaarDiagram />}
      </div>

      {/* Upload area (no file selected yet) */}
      {!file && (
        <>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload Aadhaar PDF</span>
            <span className="text-xs text-gray-400">PDF only · 1 page · 200 KB – 2 MB</span>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
            />
          </label>
          {parseError && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}
        </>
      )}

      {/* File uploaded */}
      {file && (
        <div className={`rounded-xl border p-4 space-y-3 ${
          isValid
            ? 'border-green-300 dark:border-green-700 bg-green-50/40 dark:bg-green-900/10'
            : mismatches.length > 0 || parseError
            ? 'border-red-300 dark:border-red-700 bg-red-50/40 dark:bg-red-900/10'
            : 'border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40'
        }`}>

          {/* File row */}
          <div className="flex items-center gap-3">
            <FileText className={`w-5 h-5 flex-shrink-0 ${
              isValid ? 'text-green-600 dark:text-green-400'
              : mismatches.length > 0 || parseError ? 'text-red-500'
              : 'text-gray-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB · 1 page PDF</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowViewer(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View
              </button>
              <button
                type="button"
                onClick={reset}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>

          {/* Parsing spinner */}
          {parsing && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>{parsingStatus || 'Reading Aadhaar details…'}</span>
            </div>
          )}

          {/* Parse / page error */}
          {!parsing && parseError && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}

          {/* Verification results — DOB and Aadhaar number only */}
          {!parsing && parsed && !parseError && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Verified from PDF
              </p>

              {[
                { label: 'Aadhaar Number', pdf: parsed.aadhaarNo, entered: form.aadharNumber },
                { label: 'Date of Birth',  pdf: parsed.dob,       entered: form.dob          },
              ].map(({ label, pdf, entered }) => {
                if (!pdf) return null;
                const mis = mismatches.find((m) => m.field === label);
                return (
                  <div
                    key={label}
                    className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 ${
                      mis ? 'bg-red-100 dark:bg-red-900/30' : 'bg-white/70 dark:bg-gray-700/40'
                    }`}
                  >
                    {mis
                      ? <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                      : <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{label}:</span>{' '}
                      <span className={mis ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                        {pdf}
                      </span>
                      {mis && (
                        <p className="text-red-500 mt-0.5">
                          You entered: <span className="font-semibold">{entered || '(empty)'}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}

              {mismatches.length > 0 ? (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Details don't match — correct the form fields or upload the correct Aadhaar
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 pt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Aadhaar verified ✓
                </p>
              )}
            </div>
          )}
        </div>
      )}

      </>}

      {/* PDF viewer modal */}
      {showViewer && blobUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setShowViewer(false)}
        >
          <div
            className="relative w-full max-w-3xl h-[88vh] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                {file?.name}
              </p>
              <button
                type="button"
                onClick={() => setShowViewer(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <iframe src={blobUrl} className="flex-1 w-full" title="Aadhaar PDF Viewer" />
          </div>
        </div>
      )}
    </div>
  );
}
