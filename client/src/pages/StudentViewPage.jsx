import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getStudent } from '../api';
import { useToast } from '../components/Toast';
import { ArrowLeft, Pencil, Printer, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

function Row({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-100 dark:border-gray-800 py-2.5 last:border-0">
      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide sm:w-52 flex-shrink-0 mb-0.5 sm:mb-0">
        {label}
      </span>
      <span className="text-sm text-gray-900 dark:text-white font-medium">{value || '—'}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 pb-2 border-b-2 border-blue-100 dark:border-blue-900">
        {title}
      </h3>
      {children}
    </div>
  );
}

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

  const dob = student.dateOfBirth ? new Date(student.dateOfBirth) : null;
  const age = dob ? Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Details</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Eligibility Proforma</p>
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

      {/* Printable Form */}
      <div className="card overflow-hidden" id="element-to-print">
        {/* University Header */}
        <div className="bg-blue-600 dark:bg-blue-700 text-white p-6 flex items-center gap-4 print:bg-blue-600 print:text-white">
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold">BHARATHIDASAN UNIVERSITY</h1>
            <p className="text-sm opacity-90">TIRUCHIRAPPALLI - 620 024</p>
            <h2 className="text-base font-semibold mt-1">ELIGIBILITY PROFORMA OF PLAYERS</h2>
            <p className="text-sm opacity-80 mt-0.5">Division: Trichy / Thanjavur</p>
            <p className="text-sm opacity-80">{student.year}</p>
          </div>
          <div className="flex-shrink-0">
            {student.image ? (
              <img
                src={`/uploads/${student.image}`}
                alt={student.nameOfTheSportsperson}
                className="w-24 h-28 object-cover rounded-lg border-2 border-white/30 shadow-lg"
              />
            ) : (
              <div className="w-24 h-28 rounded-lg bg-white/20 flex items-center justify-center border-2 border-white/30">
                <User className="w-10 h-10 text-white/60" />
              </div>
            )}
            <p className="text-xs text-center mt-1 opacity-60">Photo</p>
          </div>
        </div>

        <div className="p-6">
          {/* Game badge */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold px-4 py-1.5 rounded-full text-sm">
              {student.nameOfTheGame}
            </span>
            <span className={`font-medium px-3 py-1 rounded-full text-sm ${
              student.gender === 'MALE'
                ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400'
                : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400'
            }`}>
              {student.gender}
            </span>
            <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
              Roll No: <strong className="text-gray-900 dark:text-white">{student.rollNo}</strong>
            </span>
          </div>

          <Section title="Personal Information">
            <Row label="Name of Sportsperson" value={student.nameOfTheSportsperson} />
            <Row label="Father's Name" value={student.fathersName} />
            <Row label="Mother's Name" value={student.motherName} />
            <Row label="Date of Birth" value={dob ? `${dob.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })} (Age: ${age} yrs)` : '—'} />
            <Row label="Aadhar Number" value={student.aadharNumber} />
            <Row label="Phone Number" value={student.phoneNumber} />
            <Row label="Address" value={student.address} />
          </Section>

          <Section title="Academic Information">
            <Row label="Present Class" value={student.presentClass} />
            <Row label="Department" value={student.nameOfThePresentClass} />
            <Row label="Duration of Course" value={student.durationOfCourse} />
            <Row label="University" value={student.university} />
            <Row label="Present Course" value={student.presentCourse} />
          </Section>

          <Section title="Qualifying Examination">
            <Row label="Name of Exam" value={student.nameOfExam} />
            <Row label="Date & Year of Passing" value={student.dateAndYear} />
          </Section>

          <Section title="Previous IUT Participation">
            <Row label="Graduate Course (Years)" value={student.graduateCourse} />
            <Row label="PG Course (Years)" value={student.pgCourse} />
            <Row label="Previous Course Details" value={student.previousCourse} />
          </Section>

          <Section title="Sports Details">
            <Row label="Tournament Number" value={student.tournament} />
            <Row label="T-Shirt Size" value={student.tshirt} />
            <Row label="Track Size" value={student.track} />
          </Section>

          {/* Signature block */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-6 text-center">
            {['Student Signature', 'HOD / Principal', 'Physical Director'].map(label => (
              <div key={label}>
                <div className="h-12 border-b border-gray-300 dark:border-gray-600 mb-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
