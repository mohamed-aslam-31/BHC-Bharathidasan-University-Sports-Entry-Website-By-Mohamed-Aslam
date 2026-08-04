import React, { useState } from 'react';
import { ArrowLeft, Check, Loader2, FileText, User } from 'lucide-react';

/* ── Cell styles (mirrors StudentViewPage exactly) ───────────────────────── */
const border       = '1px solid #000';
const numCell      = { border, padding: '7px 5px',  verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap',  fontFamily: 'Arial, sans-serif' };
const labelCell    = { border, padding: '7px 8px',  verticalAlign: 'middle', lineHeight: 1.5,     fontFamily: 'Arial, sans-serif' };
const subLabelCell = { border, padding: '7px 8px',  verticalAlign: 'middle', whiteSpace: 'nowrap',fontFamily: 'Arial, sans-serif' };
const valueCell    = { border, padding: '7px 8px',  verticalAlign: 'middle', fontWeight: 'bold',  wordBreak: 'break-word', fontFamily: 'Arial, sans-serif' };
const ageCell      = { border, padding: '7px 8px',  verticalAlign: 'middle', fontWeight: 'bold',  textAlign: 'center', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif' };

const td = (v) => v || 'NIL';

function formatDOB(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
}

function calcAge(val) {
  if (!val) return '';
  const dob = new Date(val);
  if (isNaN(dob)) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
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
 */
export default function StudentPreviewOverlay({
  form,
  imagePreview,
  currentImage,
  aadhaarFile, idCardFile, marksheetFile, feesReceiptFile,
  currentAadhaarPdf, currentIdCardPdf, currentMarksheetPdf, currentFeesReceiptPdf,
  isEdit,
  initialVerified = false,
  loading,
  onConfirm,
  onBack,
}) {
  const photoSrc = imagePreview || (currentImage
    ? (currentImage.startsWith('http') ? `/api/proxy-image?url=${encodeURIComponent(currentImage)}` : `/uploads/${currentImage}`)
    : null);

  const docCount = [
    aadhaarFile     || currentAadhaarPdf,
    idCardFile      || currentIdCardPdf,
    marksheetFile   || currentMarksheetPdf,
    feesReceiptFile || currentFeesReceiptPdf,
  ].filter(Boolean).length;
  const allDocsReady = docCount === 4;

  const [verified, setVerified] = useState(initialVerified);

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
            <button type="button" onClick={onBack} disabled={loading} className="btn-secondary text-sm px-4 disabled:opacity-50">
              Back to Edit
            </button>
            <button type="button" onClick={() => onConfirm(verified)} disabled={loading} className="btn-primary text-sm px-5 flex items-center gap-2 disabled:opacity-50">
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
            style={{ fontFamily: 'Times New Roman, serif', color: '#000', background: '#fff', padding: '18px 22px', boxSizing: 'border-box' }}
          >
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px' }}>
              <div style={{ width: '120px', flexShrink: 0 }}>
                <img src="/university-logo.gif" alt="BU Logo" style={{ width: '115px', height: '115px', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ flex: 1, textAlign: 'center', lineHeight: 1.4, paddingTop: '6px', paddingBottom: '6px' }}>
                <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Bharathidasan University</div>
                <div style={{ fontSize: '14px' }}>TIRUCHIRAPPALLI - 620 024</div>
                <div style={{ fontSize: '17px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '3px' }}>Eligibility Proforma of Players</div>
                <div style={{ fontSize: '14px', fontStyle: 'italic', marginTop: '2px' }}>Division: <em>Trichy / Thanjavur*</em></div>
                <div style={{ fontSize: '14px', fontStyle: 'italic', marginTop: '2px' }}><em>{form.year || ''}</em></div>
              </div>
              <div style={{ width: '125px', flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ border: '1px solid #000', width: '115px', height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {photoSrc
                    ? <img src={photoSrc} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: '12px', color: '#666', textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '4px' }}>Photo</span>
                  }
                </div>
              </div>
            </div>

            {/* College / Game line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', marginTop: '4px', fontFamily: 'Arial, sans-serif', flexWrap: 'wrap', gap: '4px' }}>
              <div>College: <strong>Bishop Heber College, Trichy</strong></div>
              <div>Game: <strong>{form.nameOfTheGame}{form.gender ? ' – ' + form.gender : ''}</strong></div>
            </div>

            {/* MAIN TABLE — 5 columns; col5 is the age box used only in row 3 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'Arial, sans-serif', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '38%' }} />
                <col style={{ width: '16%' }} />
                <col style={{ width: '26%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <tbody>

                <tr>
                  <td style={numCell}>1.</td>
                  <td colSpan={2} style={labelCell}>Name of the sportsperson</td>
                  <td colSpan={2} style={valueCell}>{td(form.studentName)}</td>
                </tr>

                <tr>
                  <td style={numCell}>2.</td>
                  <td colSpan={2} style={labelCell}>Father's Name</td>
                  <td colSpan={2} style={valueCell}>{td(form.fatherName)}</td>
                </tr>

                <tr>
                  <td style={numCell}>3.</td>
                  <td colSpan={2} style={labelCell}>
                    Date of Birth
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginTop: '1px' }}>(copy of +2 Mark sheet should be enclosed)</div>
                  </td>
                  <td style={valueCell}>{formatDOB(form.dob)}</td>
                  <td style={ageCell}>
                    {form.dob && calcAge(form.dob) !== '' ? <>Age : {calcAge(form.dob)}</> : ''}
                  </td>
                </tr>

                <tr>
                  <td rowSpan={2} style={{ ...numCell, verticalAlign: 'middle' }}>4.</td>
                  <td rowSpan={2} style={{ ...labelCell, verticalAlign: 'middle' }}>Date &amp; year of passing Qualifying Examination for First admission to a college / university</td>
                  <td style={subLabelCell}>Name of Exam</td>
                  <td colSpan={2} style={valueCell}>{td(form.nameOfExam)}</td>
                </tr>
                <tr>
                  <td style={subLabelCell}>Date &amp; Year</td>
                  <td colSpan={2} style={valueCell}>{td(form.dateAndYear)}</td>
                </tr>

                <tr>
                  <td style={numCell}>5.</td>
                  <td colSpan={2} style={labelCell}>Present Class</td>
                  <td colSpan={2} style={valueCell}>{td(form.presentClass)}</td>
                </tr>

                <tr>
                  <td style={numCell}>6.</td>
                  <td colSpan={2} style={labelCell}>Name of the present course</td>
                  <td colSpan={2} style={valueCell}>{td(form.nameOfThePresentClass)}</td>
                </tr>

                <tr>
                  <td style={numCell}>7.</td>
                  <td colSpan={2} style={labelCell}>Duration of course</td>
                  <td colSpan={2} style={valueCell}>{td(form.durationOfCourse)}</td>
                </tr>

                <tr>
                  <td rowSpan={2} style={{ ...numCell, verticalAlign: 'middle' }}>8.</td>
                  <td rowSpan={2} style={{ ...labelCell, verticalAlign: 'middle' }}>Date &amp; year of First admission to</td>
                  <td style={subLabelCell}>University</td>
                  <td colSpan={2} style={valueCell}>{td(form.university)}</td>
                </tr>
                <tr>
                  <td style={subLabelCell}>Present course</td>
                  <td colSpan={2} style={valueCell}>{td(form.presentCourse)}</td>
                </tr>

                <tr>
                  <td rowSpan={2} style={{ ...numCell, verticalAlign: 'middle' }}>9.</td>
                  <td rowSpan={2} style={{ ...labelCell, verticalAlign: 'middle' }}>No. of years of previous IUT participation while pursuing</td>
                  <td style={subLabelCell}>Graduate course</td>
                  <td colSpan={2} style={valueCell}>{td(form.graduateCourse)}</td>
                </tr>
                <tr>
                  <td style={subLabelCell}>P.G. course</td>
                  <td colSpan={2} style={valueCell}>{td(form.pgCourse)}</td>
                </tr>

                <tr>
                  <td style={numCell}>10.</td>
                  <td colSpan={2} style={labelCell}>
                    Details about change of course / faculty, if any
                    <div style={{ fontSize: '10px', marginTop: '1px' }}>(Details about the previous / new – course / faculty)</div>
                  </td>
                  <td colSpan={2} style={valueCell}>{td(form.previousCourse)}</td>
                </tr>

                <tr>
                  <td style={numCell}>11.</td>
                  <td colSpan={2} style={labelCell}>Residential address (With phone / Mobile no)</td>
                  <td colSpan={2} style={{ ...valueCell, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                    {form.address || '—'}
                    {form.phoneNumber ? <><br /><strong>{form.phoneNumber}</strong></> : null}
                  </td>
                </tr>

                <tr>
                  <td style={numCell}>12.</td>
                  <td colSpan={4} style={{ ...valueCell, fontWeight: 'normal' }}>
                    <span>T-Shirt Size : <strong>{form.tshirt || ''}</strong></span>
                    <span style={{ marginLeft: '48px' }}>Track Size : <strong>{form.track || ''}</strong></span>
                  </td>
                </tr>

              </tbody>
            </table>

            {/* Footer notes */}
            <div style={{ marginTop: '14px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
              <div>*Strike out whichever is not applicable</div>
              <div>Readmitted UG/PG students should enclose copy of admission fee receipt in original</div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '16px', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
              <div style={{ textAlign: 'right', paddingBottom: '48px' }}>
                Signature of the student
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '48px' }}>
                <div>Signature of the<br />Director of Physical Education</div>
                <div style={{ textAlign: 'right' }}>Signature of the Principal/HOD<br />College seal with date</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{ border: '1.5px solid #000', padding: '14px 48px', textAlign: 'center', fontSize: '13px' }}>
                  Eligibility verified<br />Local organiser Signature &amp; Seal
                </div>
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
            <Detail label="Shift"            value={form.shift} />
            <Detail label="Student Type"     value={form.studentType} />
            <Detail label="Day / Hostel"     value={form.dayType ? `${form.dayType}${form.hostelName ? ' — ' + form.hostelName : ''}` : ''} />
            <Detail label="T-Shirt Size"     value={form.tshirt} />
            <Detail label="Track Size"       value={form.track} />
          </div>
        </div>

        {/* ── Uploaded documents card ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Uploaded Documents</h2>
            {allDocsReady ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />4/4 Uploaded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />{docCount}/4 Uploaded
              </span>
            )}
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

          {/* ── Verify toggle ── */}
          <div className={`px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between ${!allDocsReady ? 'opacity-40' : ''}`}>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Mark Documents as Verified</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {allDocsReady ? 'All 4 documents uploaded — you can verify now.' : `Upload all 4 documents first (${docCount}/4 done).`}
              </p>
            </div>
            <label className={`flex items-center gap-3 ${!allDocsReady ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <span className={`text-sm font-semibold ${verified ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                {verified ? 'Verified' : 'Not Verified'}
              </span>
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={verified}
                  disabled={!allDocsReady}
                  onChange={(e) => setVerified(e.target.checked)}
                />
                <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${verified ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${verified ? 'translate-x-5' : 'translate-x-0'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex items-center justify-end gap-3 pb-6">
          <button type="button" onClick={onBack} disabled={loading} className="btn-secondary px-6 disabled:opacity-50">
            Back to Edit
          </button>
          <button type="button" onClick={() => onConfirm(verified)} disabled={loading} className="btn-primary px-8 flex items-center gap-2 disabled:opacity-50">
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
