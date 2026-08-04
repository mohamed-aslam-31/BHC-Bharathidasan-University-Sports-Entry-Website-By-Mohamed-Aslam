import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { Upload, X, Eye, AlertCircle, CheckCircle, FileText, Loader2 } from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const MIN_SIZE  = 100 * 1024;        // 100 KB
const MAX_SIZE  = 1 * 1024 * 1024;   // 1 MB
const MIN_PAGES = 1;
const MAX_PAGES = 2;

async function getPdfPageCount(file) {
  const ab  = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
  return pdf.numPages;
}

/* ── Main component ──────────────────────────────────────────────────────── */
// locked = true when required fields haven't been filled yet
// onFileChange(file|null) = called whenever the user picks or clears a PDF
export default function IdCardUpload({ onValidationChange, onFileChange, locked = false, initialFile = null }) {
  const [file, setFile]           = useState(null);
  const [blobUrl, setBlobUrl]     = useState(null);
  const [checking, setChecking]   = useState(false);
  const [error, setError]         = useState('');
  const [pageCount, setPageCount] = useState(null);
  const [showViewer, setShowViewer] = useState(false);
  const fileRef = useRef(null);

  // Restore file from a saved draft on first render
  useEffect(() => {
    if (initialFile instanceof File || initialFile instanceof Blob) {
      handleFile(initialFile);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setError(`File too small (${(f.size / 1024).toFixed(0)} KB). Minimum is 100 KB — ensure the scan is clear and high quality.`);
      return;
    }
    if (f.size > MAX_SIZE) {
      setError(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 1 MB.`);
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
        setError('The PDF has no pages. Please upload a valid ID card PDF.');
        onValidationChange(false);
        return;
      }
      if (pages > MAX_PAGES) {
        setError(`This PDF has ${pages} pages. Maximum allowed is 2 pages.`);
        onValidationChange(false);
        return;
      }

      onValidationChange(true);
    } catch (err) {
      const msg = String(err?.message || '');
      if (/password/i.test(msg)) {
        setError('This PDF is password-protected. Please upload an unprotected PDF.');
      } else {
        setError('Could not read this PDF. Please upload a valid PDF.');
      }
      onValidationChange(false);
    } finally {
      setChecking(false);
    }
  };

  const isValid = file && !error && !checking && pageCount !== null && pageCount >= MIN_PAGES && pageCount <= MAX_PAGES;

  return (
    <div className="space-y-3">

      {/* Locked */}
      {locked && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 px-5 py-6 flex flex-col items-center gap-2 text-center">
          <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID card upload will be available once you fill in the required fields above</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">Name · Father's name · Mother's name · DOB · Phone · Address</p>
        </div>
      )}

      {!locked && <>

        {/* Guidelines */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
            <FileText className="w-4 h-4" /> ID Card Upload Guidelines
          </p>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1.5">
            <li className="flex items-start gap-1.5"><span>📸</span><span>Scan or photograph <strong>both the front and back</strong> of your ID card clearly</span></li>
            <li className="flex items-start gap-1.5"><span>📄</span><span>Combine both sides into a single PDF (1–2 pages)</span></li>
            <li className="flex items-start gap-1.5"><span>🔍</span><span>Ensure the image is <strong>clear and readable</strong> — blurry scans will be rejected</span></li>
            <li className="flex items-start gap-1.5"><span>📏</span><span>File size: <strong>100 KB – 1 MB</strong></span></li>
            <li className="flex items-start gap-1.5"><span>📑</span><span>Pages: <strong>1 or 2 pages</strong> only</span></li>
            <li className="flex items-start gap-1.5"><span>✅</span><span>Format: <strong>PDF only</strong></span></li>
          </ul>
        </div>

        {/* Upload area */}
        {!file && (
          <>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors">
              <Upload className="w-8 h-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Click to upload ID Card PDF</span>
              <span className="text-xs text-gray-400">PDF only · 1–2 pages · 100 KB – 1 MB</span>
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

            {checking && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <span>Checking PDF…</span>
              </div>
            )}

            {!checking && error && (
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {isValid && (
              <p className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400">
                <CheckCircle className="w-3.5 h-3.5" />
                ID card PDF uploaded successfully ✓
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
            <iframe src={blobUrl} className="flex-1 w-full" title="ID Card PDF Viewer" />
          </div>
        </div>
      )}
    </div>
  );
}
