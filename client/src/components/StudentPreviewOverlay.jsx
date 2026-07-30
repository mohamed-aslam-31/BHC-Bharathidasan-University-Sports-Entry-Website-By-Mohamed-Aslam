import React from 'react';
import { ArrowLeft, Check, Loader2, FileText, User } from 'lucide-react';

/* ── Cell styles (mirrors StudentViewPage) ────────────────────────────────── */
const border = '1px solid #000';
const numCell    = { border, padding: '5px 6px',  verticalAlign: 'middle', textAlign: 'center' };
const labelCell  = { border, padding: '5px 8px',  verticalAlign: 'middle' };
const subLabelCell = { border, padding: '5px 8px', verticalAlign: 'middle' };
const valueCell  = { border, padding: '5px 8px',  verticalAlign: 'middle', fontWeight: 'bold' };

const td = (v) => v || 'NIL';

function formatDOB(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
}

/** Shows an attached-file badge or an existing-PDF link. */
function DocStatus({ newFile, existingPath, label }) {
  if (newFile) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded px-2 py-0.5">
        <FileText className="w-3 h-3" /> New: {newFile.name}
      </span>
    );
  }
  if (existingPath) {
    return (
      <a
        href={`/uploads/${existingPath}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 underline"
      >
        <FileText className="w-3 h-3" /> {label} (existing)
      </a>
    );
  }
  return <span className="text-xs text-gray-400">Not uploaded</span>;
}

/**
 * Full-screen preview overlay shown between form submission and actual save.
 *
 * Props:
 *   form            – form state object
 *   imagePreview    – blob-URL of newly chosen photo (or null)
 *   currentImage    – filename of existing stored photo (or null)
 *   aadhaarFile / idCardFile / marksheetFile / feesReceiptFile – new File objects (or null)
 *   currentAadhaarPdf / currentIdCardPdf / currentMarksheetPdf / currentFeesReceiptPdf – existing paths
 *   isEdit          – boolean
 *   loading         – boolean (saving in progress)
 *   onConfirm()     – called when user clicks Confirm & Save
 *   onBack()        – called when user clicks Back to Edit
 */
export default function StudentPreviewOverlay({
  form,
  imagePreview,
  currentImage,
  aadhaarFile, idCardFile, marksheetFile, feesReceiptFile,
  currentAadhaarPdf, currentIdCardPdf, currentMarksheetPdf, currentFeesReceiptPdf,
  isEdit,
  loading,
  onConfirm,
  onBack,
}) {
  const photoSrc = imagePreview || (currentImage ? `/uploads/${currentImage}` : null);

  return (
    <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-gray-950 overflow-y-auto">
      {/* ── Sticky action bar ── */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
                Preview — {isEdit ? 'Edit Student' : 'New Student'}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                Review all details carefully before saving
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onBack}
              disabled={loading}
              className="btn-secondary text-sm px-4 disabled:opacity-50"
            >
              Back to Edit
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="btn-primary text-sm px-5 flex items-center gap-2 disabled:opacity-50"
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                : <><Check className="w-4 h-4" /> {isEdit ? 'Confirm Update' : 'Confirm & Save'}</>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview body ── */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

        {/* Notice banner */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
          <span className="mt-0.5 flex-shrink-0">⚠️</span>
          <span>This is a preview. Nothing has been saved yet. Click <strong>Confirm {isEdit ? 'Update' : '& Save'}</strong> to submit, or <strong>Back to Edit</strong> to make changes.</span>
        </div>

        {/* ── Proforma card ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div
            id="preview-proforma"
            style={{ fontFamily: 'Times New Roman, serif', color: '#000', background: '#fff', padding: '24px' }}
          >
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '6px' }}>
              {/* Logo */}
              <div style={{ width: '110px', flexShrink: 0 }}>
                <img src="/university-logo.gif" alt="BU Logo" style={{ width: '105px', height: '105px', objectFit: 'contain' }} />
              </div>

              {/* Title block */}
              <div style={{ flex: 1, textAlign: 'center', lineHeight: 1.4 }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase' }}>Bharathidasan University</div>
                <div style={{ fontSize: '13px' }}>TIRUCHIRAPPALLI - 620 024</div>
                <div style={{ fontSize: '17px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>Eligibility Proforma of Players</div>
                <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }}>Division: <em>Trichy / Thanjavur*</em></div>
              </div>

              {/* Photo box */}
              <div style={{ width: '110px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ border: '1px solid #000', width: '90px', height: '105px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {photoSrc
                    ? <img src={photoSrc} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '10px', color: '#666', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>Photo</span>
                  }
                </div>
              </div>
            </div>

            {/* College / Game line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', marginTop: '10px', fontFamily: 'Arial, sans-serif' }}>
              <div>Name of the College: <strong>Bishop Heber College, Trichy</strong></div>
              <div>Name of the Game: <strong>{form.nameOfTheGame}{form.gender ? ' - ' + form.gender : ''}</strong></div>
            </div>

            {/* MAIN TABLE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
              <colgroup>
                <col style={{ width: '4%' }} />
                <col style={{ width: '38%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '42%' }} />
              </colgroup>
              <tbody>

              <tr>
                <td style={numCell}>1.</td>
                <td colSpan={2} style={labelCell}>Name of the sportsperson</td>
                <td style={valueCell}>{td(form.studentName)}</td>
              </tr>

              <tr>
                <td style={numCell}>2.</td>
                <td colSpan={2} style={labelCell}>Father's Name</td>
                <td style={valueCell}>{td(form.fatherName)}</td>
              </tr>

              <tr>
                <td style={numCell}>3.</td>
                <td colSpan={2} style={labelCell}>
                  Date of the Birth<br />
                  <strong>(copy of +2 Mark sheet should be enclosed)</strong>
                </td>
                <td style={valueCell}>{formatDOB(form.dob)}</td>
              </tr>

              <tr>
                <td rowSpan={2} style={numCell}>4.</td>
                <td rowSpan={2} style={labelCell}>
                  Date &amp; year of passing Qualifying Examination for First admission to a college / university
                </td>
                <td style={subLabelCell}>Name of Exam</td>
                <td style={valueCell}>{td(form.nameOfExam)}</td>
              </tr>
              <tr>
                <td style={subLabelCell}>Date &amp; Year</td>
                <td style={valueCell}>{td(form.dateAndYear)}</td>
              </tr>

              <tr>
                <td style={numCell}>5.</td>
                <td colSpan={2} style={labelCell}>Present Class</td>
                <td style={valueCell}>{td(form.presentClass)}</td>
              </tr>

              <tr>
                <td style={numCell}>6.</td>
                <td colSpan={2} style={labelCell}>Name of the present course</td>
                <td style={valueCell}>{td(form.nameOfThePresentClass)}</td>
              </tr>

              <tr>
                <td style={numCell}>7.</td>
                <td colSpan={2} style={labelCell}>Duration of course</td>
                <td style={valueCell}>{td(form.durationOfCourse)}</td>
              </tr>

              <tr>
                <td rowSpan={2} style={numCell}>8.</td>
                <td rowSpan={2} style={labelCell}>Date &amp; year of First admission to</td>
                <td style={subLabelCell}>University</td>
                <td style={valueCell}>{td(form.university)}</td>
              </tr>
              <tr>
                <td style={subLabelCell}>Present course</td>
                <td style={valueCell}>{td(form.presentCourse)}</td>
              </tr>

              <tr>
                <td rowSpan={2} style={numCell}>9.</td>
                <td rowSpan={2} style={labelCell}>Number of years of previous IUT participation while pursuing</td>
                <td style={subLabelCell}>Graduate course</td>
                <td style={valueCell}>{td(form.graduateCourse)}</td>
              </tr>
              <tr>
                <td style={subLabelCell}>P.G. course</td>
                <td style={valueCell}>{td(form.pgCourse)}</td>
              </tr>

              <tr>
                <td style={numCell}>10.</td>
                <td colSpan={2} style={labelCell}>
                  Details about change of course / faculty, if any<br />
                  (Details about the previous / new &nbsp;- course / faculty)
                </td>
                <td style={valueCell}>{td(form.previousCourse)}</td>
              </tr>

              <tr>
                <td style={numCell}>11.</td>
                <td colSpan={2} style={labelCell}>Residential address (With phone / Mobile no)</td>
                <td style={{ ...valueCell, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                  {form.address || '—'}
                  {form.phoneNumber ? <><br /><strong>{form.phoneNumber}</strong></> : null}
                </td>
              </tr>

              </tbody>
            </table>

            {/* Footer notes */}
            <div style={{ marginTop: '10px', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
              <div>*Strike out whichever is not applicable</div>
              <div>Readmitted UG/PG students should enclose copy of admission fee receipt in original</div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '18px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
              Signature of the student
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
              <div>Signature of the<br />Director of Physical Education</div>
              <div style={{ textAlign: 'right' }}>Signature of the Principal/HOD<br />College seal with date</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
              <div style={{ border: '1px solid #000', padding: '10px 28px', textAlign: 'center', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                Eligibility verified<br />Local organiser Signature &amp; Seal
              </div>
            </div>
          </div>
        </div>

        {/* ── Extra details card (fields not shown in proforma) ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional Details</h2>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <Detail label="Academic Year"    value={form.year} />
            <Detail label="Roll Number"      value={form.rollNo} />
            <Detail label="Blood Group"      value={form.bloodGroup} />
            <Detail label="Mother's Name"    value={form.motherName} />
            <Detail label="Aadhar Number"    value={form.aadharNumber} />
            <Detail label="Student Type"     value={form.studentType} />
            <Detail label="Day / Hostel"     value={form.dayType ? `${form.dayType}${form.hostelName ? ' — ' + form.hostelName : ''}` : ''} />
            <Detail label="T-Shirt Size"     value={form.tshirt} />
            <Detail label="Track Size"       value={form.track} />
          </div>
        </div>

        {/* ── Uploaded documents card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Uploaded Documents</h2>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <DocRow label="Aadhaar PDF">
              <DocStatus newFile={aadhaarFile} existingPath={currentAadhaarPdf} label="Aadhaar PDF" />
            </DocRow>
            <DocRow label="ID Card PDF">
              <DocStatus newFile={idCardFile} existingPath={currentIdCardPdf} label="ID Card PDF" />
            </DocRow>
            <DocRow label="+2 Marksheet PDF">
              <DocStatus newFile={marksheetFile} existingPath={currentMarksheetPdf} label="Marksheet PDF" />
            </DocRow>
            <DocRow label="Fees Receipt PDF">
              <DocStatus newFile={feesReceiptFile} existingPath={currentFeesReceiptPdf} label="Fees Receipt PDF" />
            </DocRow>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="btn-secondary px-6 disabled:opacity-50"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Check className="w-4 h-4" /> {isEdit ? 'Confirm Update' : 'Confirm & Save'}</>
            }
          </button>
        </div>

      </div>
    </div>
  );
}

/* ── Small helpers ─────────────────────────────────────────────────────────── */

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium text-gray-900 dark:text-white mt-0.5">{value || <span className="text-gray-400 font-normal">—</span>}</p>
    </div>
  );
}

function DocRow({ label, children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-500 dark:text-gray-400 w-36 flex-shrink-0">{label}</span>
      {children}
    </div>
  );
}
