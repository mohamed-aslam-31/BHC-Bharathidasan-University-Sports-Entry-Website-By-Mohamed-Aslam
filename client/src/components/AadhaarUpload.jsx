import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Upload, X, Eye, AlertCircle, CheckCircle, FileText, ExternalLink, Loader2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MIN_SIZE = 500 * 1024;       // 500 KB
const MAX_SIZE = 2 * 1024 * 1024;  // 2 MB

/* ── PDF text extractor ──────────────────────────────────────────────────── */

async function extractPdfText(file) {
  const ab = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  let raw = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 3); i++) {
    const page = await pdf.getPage(i);
    const tc = await page.getTextContent();
    // keep each item on its own line so we can detect line boundaries
    raw += tc.items.map((it) => it.str).join('\n') + '\n';
  }
  return raw;
}

/* ── Aadhaar data parser ─────────────────────────────────────────────────── */

// Boilerplate lines to skip (header/footer text that is not personal data)
const BOILERPLATE = /government|of india|uidai|aadhaar|unique identification|authority|enrollment|eid|vid|help|download|verify|issue|www\.|\.gov|resident|male|female|transgender|\d{4}\s\d{4}\s\d{4}|\d{4}\s\d{4}\s\d{4}/i;

// Relationship indicators that appear AFTER the father/guardian name on the same line
// e.g.  "RAMESH KUMAR S/O"  →  fatherName = "RAMESH KUMAR"
// Also handle the traditional order  "S/O RAMESH KUMAR"
const REL_INDICATOR = /\b(?:S\/O|C\/O|D\/O|G\/O|W\/O|H\/O)\b/i;

function parseAadhaar(rawText) {
  // Split into lines, trim, drop blanks
  const allLines = rawText
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  const flat = allLines.join(' ');

  /* ── 1. Aadhaar number — 12 unmasked digits ── */
  const aadhaarMatch =
    flat.match(/\b(\d{4})\s(\d{4})\s(\d{4})\b/) ||
    flat.match(/\b(\d{4})(\d{4})(\d{4})\b/);
  const aadhaarNo = aadhaarMatch ? aadhaarMatch[0].replace(/\s/g, '') : null;

  /* Masked Aadhaar detection (XXXX XXXX 1234) */
  const isMasked =
    /[Xx]{4}\s?[Xx]{4}\s?\d{4}/.test(flat) ||
    /\b[Xx]+\s?[Xx]+\s?\d{4}\b/.test(flat);

  /* ── 2. DOB — DD/MM/YYYY ── */
  const dobMatch =
    flat.match(/(?:DOB|Date\s+of\s+Birth|D\.O\.B\.?)\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i) ||
    flat.match(/\b(\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/);
  let dob = null;
  if (dobMatch) {
    const parts = dobMatch[1].split(/[\/\-]/);
    if (parts.length === 3) {
      const [d, m, y] = parts;
      dob = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }

  /* ── 3 & 4: Name (line 1) and Father name (line 2) from meaningful lines ── */
  // Strip boilerplate, gender words, and lines that are purely numeric / too short
  const meaningful = allLines.filter((l) => {
    if (l.length < 3) return false;
    if (/^\d[\d\s]*$/.test(l)) return false;          // purely numeric
    if (BOILERPLATE.test(l)) return false;
    if (/^(?:DOB|Date of Birth|Gender|Address|VID)/i.test(l)) return false;
    if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(l)) return false; // standalone date
    return true;
  });

  /* Line 0 of meaningful content = cardholder full name */
  const name = meaningful[0] || null;

  /* Line 1 of meaningful content = father/guardian name line.
   *
   * e-Aadhaar formats seen:
   *   A)  "RAMESH KUMAR S/O"      → name before indicator
   *   B)  "S/O RAMESH KUMAR"      → indicator before name
   *   C)  "S/O: RAMESH KUMAR"     → indicator with colon before name
   *   D)  "RAMESH KUMAR"          → bare name (no indicator on this line)
   */
  let fatherName = null;
  if (meaningful.length > 1) {
    const line = meaningful[1];

    if (REL_INDICATOR.test(line)) {
      // Format A: name comes BEFORE the indicator  →  "RAMESH KUMAR S/O"
      const beforeRel = line.replace(REL_INDICATOR, '').trim();
      // Format B/C: indicator comes FIRST  →  "S/O RAMESH KUMAR"
      const afterRel = line.replace(/^(?:S\/O|C\/O|D\/O|G\/O|W\/O|H\/O)\s*:?\s*/i, '').trim();

      // Whichever side has the longer plausible name wins
      const nameRegex = /^[A-Za-z][A-Za-z .]{1,}$/;
      if (nameRegex.test(beforeRel) && beforeRel.length > afterRel.length) {
        fatherName = beforeRel;
      } else if (nameRegex.test(afterRel) && afterRel.length > 1) {
        fatherName = afterRel;
      } else {
        fatherName = beforeRel || afterRel || null;
      }
    } else {
      // No indicator on this line — take it as the father name if it looks like a name
      if (/^[A-Za-z][A-Za-z .]{1,}$/.test(line)) {
        fatherName = line;
      }
    }
  }

  /* Fallback: scan the whole text for the classic "S/O: FATHER" pattern */
  if (!fatherName) {
    const m = flat.match(
      /(?:S\/O|C\/O|D\/O|G\/O|W\/O|H\/O)\s*:?\s*([A-Za-z][A-Za-z .]{2,?)(?=\s{2,}|\d|$|,)/i,
    );
    if (m) fatherName = m[1].trim();
  }

  return { aadhaarNo, dob, fatherName, name, isMasked };
}

/* ── Comparison helpers ──────────────────────────────────────────────────── */

function norm(s) {
  return (s || '').toUpperCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
}

function nameMatches(a, b) {
  const na = norm(a), nb = norm(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  // At least 60 % of the shorter name's words appear in the longer
  const wa = na.split(' ').filter((w) => w.length > 1);
  const wb = nb.split(' ').filter((w) => w.length > 1);
  const common = wa.filter((w) => wb.includes(w));
  return common.length >= Math.ceil(Math.min(wa.length, wb.length) * 0.6);
}

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
  if (parsed.name && form.studentName) {
    if (!nameMatches(parsed.name, form.studentName))
      issues.push({ field: 'Name', pdf: parsed.name, entered: form.studentName });
  }
  if (parsed.fatherName && form.fatherName) {
    if (!nameMatches(parsed.fatherName, form.fatherName))
      issues.push({ field: "Father's Name", pdf: parsed.fatherName, entered: form.fatherName });
  }
  return issues;
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function AadhaarUpload({ form, onValidationChange }) {
  const [file, setFile]           = useState(null);
  const [blobUrl, setBlobUrl]     = useState(null);
  const [parsing, setParsing]     = useState(false);
  const [parsed, setParsed]       = useState(null);
  const [mismatches, setMismatches] = useState([]);
  const [parseError, setParseError] = useState('');
  const [showViewer, setShowViewer] = useState(false);
  const fileRef = useRef(null);

  const reset = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setFile(null); setBlobUrl(null); setParsed(null);
    setMismatches([]); setParseError(''); setShowViewer(false);
    onValidationChange(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (f) => {
    // Type check
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setParseError('Only PDF files are allowed.');
      return;
    }
    // Size check
    if (f.size < MIN_SIZE) {
      setParseError(
        `File too small (${(f.size / 1024).toFixed(0)} KB). Minimum is 500 KB — ensure the image is clear and high quality.`,
      );
      return;
    }
    if (f.size > MAX_SIZE) {
      setParseError(
        `File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 2 MB.`,
      );
      return;
    }

    const url = URL.createObjectURL(f);
    setFile(f); setBlobUrl(url);
    setParseError(''); setParsed(null); setMismatches([]);
    onValidationChange(false);
    setParsing(true);

    try {
      const rawText = await extractPdfText(f);
      const result  = parseAadhaar(rawText);

      if (result.isMasked) {
        setParseError(
          'This looks like a masked Aadhaar (XXXX XXXX 1234). Please upload a full unmasked Aadhaar PDF.',
        );
        onValidationChange(false);
        return;
      }
      if (!result.aadhaarNo) {
        setParseError(
          'No Aadhaar number found in this PDF. Please upload a valid e-Aadhaar or a clear scanned Aadhaar PDF.',
        );
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
    }
  };

  const isValid = parsed && !parseError && mismatches.length === 0;

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-3">

      {/* Rules banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
          <FileText className="w-4 h-4" /> Aadhaar Upload Guidelines
        </p>
        <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
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
          <li className="flex items-start gap-1.5"><span>📄</span><span>Or scan your physical Aadhaar card clearly and convert to PDF</span></li>
          <li className="flex items-start gap-1.5"><span>✅</span><span>Name, Aadhaar number, Father's name and Date of Birth must be fully visible</span></li>
          <li className="flex items-start gap-1.5"><span>❌</span><span>No masked Aadhaar (XXXX XXXX 1234 format)</span></li>
          <li className="flex items-start gap-1.5"><span>❌</span><span>No password-protected PDF</span></li>
          <li className="flex items-start gap-1.5">
            <span>📏</span>
            <span>File size: <strong>500 KB – 2 MB</strong> &nbsp;|&nbsp; Format: <strong>PDF only</strong></span>
          </li>
        </ul>
      </div>

      {/* Upload area (no file yet) */}
      {!file && (
        <>
          <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
            <Upload className="w-8 h-8 text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload Aadhaar PDF</span>
            <span className="text-xs text-gray-400">PDF only · 500 KB – 2 MB</span>
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
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
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
              <Loader2 className="w-4 h-4 animate-spin" />
              Reading Aadhaar details…
            </div>
          )}

          {/* Parse error */}
          {!parsing && parseError && (
            <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              {parseError}
            </div>
          )}

          {/* Extracted details */}
          {!parsing && parsed && !parseError && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Extracted from PDF
              </p>

              {[
                { label: 'Aadhaar Number', pdf: parsed.aadhaarNo, entered: form.aadharNumber },
                { label: 'Name',           pdf: parsed.name,      entered: form.studentName },
                { label: "Father's Name",  pdf: parsed.fatherName,entered: form.fatherName  },
                { label: 'Date of Birth',  pdf: parsed.dob,       entered: form.dob         },
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
                  Details don't match — correct the form fields above or upload the right Aadhaar
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 pt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  All details verified ✓
                </p>
              )}
            </div>
          )}
        </div>
      )}

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
