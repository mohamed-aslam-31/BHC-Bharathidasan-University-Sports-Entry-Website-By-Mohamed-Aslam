import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getStudent } from '../api';
import { useToast } from '../components/Toast';
import { ArrowLeft, Pencil, Printer } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudentViewPage() {
  const { id } = useParams();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudent(id).then(res => {
      setStudent(res.data);
    }).catch(() => {
      addToast('Student not found', 'error');
      navigate('/');
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading student details…" />
    </div>
  );

  if (!student) return null;

  const formatDOB = (val) => {
    if (!val) return '—';
    const d = new Date(val);
    if (isNaN(d)) return val;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.');
  };

  const td = (val) => val || 'NIL';

  return (
    <div className="max-w-4xl">
      {/* Screen-only toolbar */}
      <div className="flex items-center justify-between mb-6 no-print print:hidden">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Eligibility Proforma</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.nameOfTheSportsperson}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 text-sm">
            <Printer className="w-4 h-4" />Print
          </button>
          <Link to={`/students/${id}/edit`} className="btn-primary flex items-center gap-2 text-sm">
            <Pencil className="w-4 h-4" />Edit
          </Link>
        </div>
      </div>

      {/* ── PRINTABLE PROFORMA ── */}
      <div id="element-to-print" style={{ fontFamily: 'Times New Roman, serif', color: '#000', background: '#fff', padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '6px' }}>
          {/* Logo */}
          <div style={{ width: '110px', flexShrink: 0 }}>
            <img src="/university-logo.gif" alt="BU Logo" style={{ width: '105px', height: '105px', objectFit: 'contain' }} />
          </div>

          {/* Center title block */}
          <div style={{ flex: 1, textAlign: 'center', lineHeight: 1.4 }}>
            <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase' }}>Bharathidasan University</div>
            <div style={{ fontSize: '13px', fontWeight: 'normal' }}>TIRUCHIRAPPALLI - 620 024</div>
            <div style={{ fontSize: '17px', fontWeight: 'bold', textTransform: 'uppercase', marginTop: '2px' }}>Eligibility Proforma of Players</div>
            <div style={{ fontSize: '13px', fontStyle: 'italic', marginTop: '2px' }}>Division: <em>Trichy / Thanjavur*</em></div>
          </div>

          {/* Photo box */}
          <div style={{ width: '110px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ border: '1px solid #000', width: '90px', height: '105px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {student.image
                ? <img src={`/uploads/${student.image}`} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '10px', color: '#666', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>Photo</span>
              }
            </div>
          </div>
        </div>

        {/* ── College / Game line ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px', marginTop: '10px', fontFamily: 'Arial, sans-serif' }}>
          <div>Name of the College: <strong>Bishop Heber College, Trichy</strong></div>
          <div>Name of the Game: <strong>{student.nameOfTheGame}{student.gender ? ' - ' + student.gender : ''}</strong></div>
        </div>

        {/* ── MAIN TABLE ── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '38%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '42%' }} />
          </colgroup>

          {/* Row 1 – Name of sportsperson */}
          <tr>
            <td style={numCell}>1.</td>
            <td colSpan={2} style={labelCell}>Name of the sportsperson</td>
            <td style={valueCell}>{td(student.nameOfTheSportsperson)}</td>
          </tr>

          {/* Row 2 – Father's Name */}
          <tr>
            <td style={numCell}>2.</td>
            <td colSpan={2} style={labelCell}>Father's Name</td>
            <td style={valueCell}>{td(student.fathersName)}</td>
          </tr>

          {/* Row 3 – Date of Birth */}
          <tr>
            <td style={numCell}>3.</td>
            <td colSpan={2} style={labelCell}>
              Date of the Birth<br />
              <strong>(copy of +2 Mark sheet should be enclosed)</strong>
            </td>
            <td style={valueCell}>{formatDOB(student.dateOfBirth)}</td>
          </tr>

          {/* Row 4 – Qualifying Exam (2 sub-rows) */}
          <tr>
            <td rowSpan={2} style={numCell}>4.</td>
            <td rowSpan={2} style={labelCell}>
              Date &amp; year of passing Qualifying Examination for First admission to a college / university
            </td>
            <td style={subLabelCell}>Name of Exam</td>
            <td style={valueCell}>{td(student.nameOfExam)}</td>
          </tr>
          <tr>
            <td style={subLabelCell}>Date &amp; Year</td>
            <td style={valueCell}>{td(student.dateAndYear)}</td>
          </tr>

          {/* Row 5 – Present Class */}
          <tr>
            <td style={numCell}>5.</td>
            <td colSpan={2} style={labelCell}>Present Class</td>
            <td style={valueCell}>{td(student.presentClass)}</td>
          </tr>

          {/* Row 6 – Name of present course */}
          <tr>
            <td style={numCell}>6.</td>
            <td colSpan={2} style={labelCell}>Name of the present course</td>
            <td style={valueCell}>{td(student.nameOfThePresentClass)}</td>
          </tr>

          {/* Row 7 – Duration of course */}
          <tr>
            <td style={numCell}>7.</td>
            <td colSpan={2} style={labelCell}>Duration of course</td>
            <td style={valueCell}>{td(student.durationOfCourse)}</td>
          </tr>

          {/* Row 8 – First admission (2 sub-rows) */}
          <tr>
            <td rowSpan={2} style={numCell}>8.</td>
            <td rowSpan={2} style={labelCell}>Date &amp; year of First admission to</td>
            <td style={subLabelCell}>University</td>
            <td style={valueCell}>{td(student.university)}</td>
          </tr>
          <tr>
            <td style={subLabelCell}>Present course</td>
            <td style={valueCell}>{td(student.presentCourse)}</td>
          </tr>

          {/* Row 9 – Previous IUT participation (2 sub-rows) */}
          <tr>
            <td rowSpan={2} style={numCell}>9.</td>
            <td rowSpan={2} style={labelCell}>
              Number of years of previous IUT participation while pursuing
            </td>
            <td style={subLabelCell}>Graduate course</td>
            <td style={valueCell}>{td(student.graduateCourse)}</td>
          </tr>
          <tr>
            <td style={subLabelCell}>P.G. course</td>
            <td style={valueCell}>{td(student.pgCourse)}</td>
          </tr>

          {/* Row 10 – Change of course */}
          <tr>
            <td style={numCell}>10.</td>
            <td colSpan={2} style={labelCell}>
              Details about change of course / faculty, if any<br />
              (Details about the previous / new &nbsp;- course / faculty)
            </td>
            <td style={valueCell}>{td(student.previousCourse)}</td>
          </tr>

          {/* Row 11 – Residential address */}
          <tr>
            <td style={numCell}>11.</td>
            <td colSpan={2} style={labelCell}>Residential address (With phone / Mobile no)</td>
            <td style={{ ...valueCell, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {student.address ? student.address : '—'}
              {student.phoneNumber ? <><br /><strong>{student.phoneNumber}</strong></> : null}
            </td>
          </tr>
        </table>

        {/* ── Footer notes ── */}
        <div style={{ marginTop: '10px', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
          <div>Strike out whichever is not applicable</div>
          <div>Readmitted UG/PG students should enclose copy of admission fee receipt in original</div>
        </div>

        {/* Signature of student */}
        <div style={{ textAlign: 'right', marginTop: '18px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
          Signature of the student
        </div>

        {/* ── Bottom signatures ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '48px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'left' }}>
            Signature of the<br />Director of Physical Education
          </div>
          <div style={{ textAlign: 'right' }}>
            Signature of the Principal/HOD<br />College seal with date
          </div>
        </div>

        {/* ── Eligibility verified box ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <div style={{ border: '1px solid #000', padding: '10px 28px', textAlign: 'center', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
            Eligibility verified<br />Local organiser Signature &amp; Seal
          </div>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          .print\\:hidden, .no-print { display: none !important; }
          body { margin: 0; background: #fff; }
          #element-to-print { padding: 16px !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  );
}

// ── Cell styles ──────────────────────────────────────────────────────────────
const border = '1px solid #000';

const numCell = {
  border,
  padding: '5px 6px',
  verticalAlign: 'middle',
  textAlign: 'center',
  fontWeight: 'normal',
};

const labelCell = {
  border,
  padding: '5px 8px',
  verticalAlign: 'middle',
};

const subLabelCell = {
  border,
  padding: '5px 8px',
  verticalAlign: 'middle',
};

const valueCell = {
  border,
  padding: '5px 8px',
  verticalAlign: 'middle',
  fontWeight: 'bold',
};
