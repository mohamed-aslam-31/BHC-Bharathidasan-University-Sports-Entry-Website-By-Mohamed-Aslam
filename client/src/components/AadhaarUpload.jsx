import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Upload, X, Eye, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MIN_SIZE = 200 * 1024;       // 200 KB
const MAX_SIZE = 2 * 1024 * 1024;  // 2 MB
const MIN_PAGES = 1;
const MAX_PAGES = 2;

/* ── Get page count from a PDF file ─────────────────────────────────────── */
async function getPdfPageCount(file) {
  const ab  = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  return pdf.numPages;
}

/* ── Main component ──────────────────────────────────────────────────────── */
// locked = true when required fields haven't been filled yet
// onFileChange(file|null) = called whenever the user picks or clears a PDF
export default function AadhaarUpload({ onValidationChange, onFileChange, locked = false }) {
  const [file, setFile]         = useState(null);
  const [blobUrl, setBlobUrl]   = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError]       = useState('');
  const [pageCount, setPageCount] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const fileRef = useRef(null);

  const reset = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setFile(null); setBlobUrl(null); setError(''); setPageCount(null); setShowViewer(false);
    onValidationChange(false);
    if (onFileChange) onFileChange(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = async (f) => {
    // Type check
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF files are allowed.');
      return;
    }
    // Size checks
    if (f.size < MIN_SIZE) {
      setError(`File too small (${(f.size / 1024).toFixed(0)} KB). Minimum is 200 KB — ensure the scan is clear and high quality.`);
      return;
    }
    if (f.size > MAX_SIZE) {
      setError(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 2 MB.`);
      return;
    }

    const url = URL.createObjectURL(f);
    setFile(f); setBlobUrl(url);
    setError(''); setPageCount(null);
    onValidationChange(false);
    if (onFileChange) onFileChange(f);
    setChecking(true);

    try {
      const pages = await getPdfPageCount(f);
      setPageCount(pages);

      if (pages < MIN_PAGES) {
        setError('The PDF has no pages. Please upload a valid Aadhaar card PDF.');
        onValidationChange(false);
        return;
      }
      if (pages > MAX_PAGES) {
        setError(`This PDF has ${pages} pages. Maximum allowed is 2 pages. Please upload a 1–2 page PDF.`);
        onValidationChange(false);
        return;
      }

      // All checks passed
      onValidationChange(true);
    } catch (err) {
      const msg = String(err?.message || '');
      if (/password/i.test(msg)) {
        setError('This PDF is password-protected. Please upload an unprotected PDF.');
      } else {
        setError('Could not read this PDF. Please upload a valid Aadhaar card PDF.');
      }
      onValidationChange(false);
    } finally {
      setChecking(false);
    }
  };

  const isValid = file && !error && !checking && pageCount !== null && pageCount >= MIN_PAGES && pageCount <= MAX_PAGES;

  /* ── Render ────────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-3">

      {/* Locked — required fields not yet filled */}
      {locked && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-5 py-6 flex flex-col items-center gap-2 text-center">
          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aadhaar upload will be available once you fill in the required fields above</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Name · Father's name · Mother's name · DOB · Phone · Address</p>
        </div>
      )}

      {/* Upload UI */}
      {!locked && <>

        {/* Rules banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> Aadhaar Upload Guidelines
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span>⭐</span>
              <span>
                <strong>Preferred:</strong> Download e-Aadhaar PDF from{' '}
                <a
                  href="https://myaadhaar.uidai.gov.in/"
                  target="_blank" rel="noreferrer"
                  className="underline hover:text-blue-900 dark:hover:text-blue-200"
                >
                  myaadhaar.uidai.gov.in
                </a>
              </span>
            </li>
            <li className="flex items-start gap-1.5"><span>📄</span><span>Physical Aadhaar: scan both sides into a single PDF (1–2 pages)</span></li>
            <li className="flex items-start gap-1.5"><span>📏</span><span>File size: <strong>200 KB – 2 MB</strong></span></li>
            <li className="flex items-start gap-1.5"><span>📑</span><span>Pages: <strong>1 or 2 pages</strong> only</span></li>
            <li className="flex items-start gap-1.5"><span>✅</span><span>Format: <strong>PDF only</strong></span></li>
          </ul>
        </div>

        {/* Upload area (no file selected yet) */}
        {!file && (
          <>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload Aadhaar PDF</span>
              <span className="text-xs text-gray-400">PDF only · 1–2 pages · 200 KB – 2 MB</span>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
              />
            </label>
            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
          </>
        )}

        {/* File uploaded */}
        {file && (
          <div className={`rounded-xl border p-4 space-y-3 ${
            isValid
              ? 'border-green-300 dark:border-green-700 bg-green-50/40 dark:bg-green-900/10'
              : error
              ? 'border-red-300 dark:border-red-700 bg-red-50/40 dark:bg-red-900/10'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40'
          }`}>

            {/* File row */}
            <div className="flex items-center gap-3">
              <FileText className={`w-5 h-5 flex-shrink-0 ${
                isValid ? 'text-green-600 dark:text-green-400'
                : error ? 'text-red-500'
                : 'text-gray-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(0)} KB
                  {pageCount !== null ? ` · ${pageCount} page${pageCount > 1 ? 's' : ''}` : ''}
                </p>
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

            {/* Checking spinner */}
            {checking && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>Checking PDF…</span>
              </div>
            )}

            {/* Error */}
            {!checking && error && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Success */}
            {isValid && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                Aadhaar PDF uploaded successfully ✓
              </p>
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
