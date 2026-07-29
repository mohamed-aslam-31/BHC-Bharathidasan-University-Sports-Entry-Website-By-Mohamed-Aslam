import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { createStudent, updateStudent, getStudent } from '../api';
import { ArrowLeft, Upload, Loader2, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const GAMES = [
  'CRICKET','FOOTBALL','CHESS','BASKETBALL','VOLLEYBALL','HOCKEY',
  'TABLE TENNIS','BADMINTON','CROSS COUNTRY','FENCING & CYCLE','SWIMMING',
  'ARCHERY','TENNIS','KABADDI','ATHLETICS','KHO - KHO','BEST PHYSIQUE',
  'NETBALL','HANDBALL','BOXING','BALL BADMINTON','YOGASANA','TAEKWONDO','KARATE'
];

const empty = {
  year: '', rollNo: '', nameOfTheGame: '', gender: 'MALE',
  studentName: '', fatherName: '', motherName: '', dob: '',
  nameOfExam: '', dateAndYear: '',
  presentClass: '', nameOfThePresentClass: '', durationOfCourse: '',
  university: '', presentCourse: '',
  graduateCourse: 'NIL', pgCourse: 'NIL', previousCourse: '',
  address: '', phoneNumber: '', aadharNumber: '',
  tournament: '', tshirt: '', track: '',
};

function Section({ title, children }) {
  return (
    <div className="card p-6">
      <h3 className="section-title">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {children}
      </div>
    </div>
  );
}

function Field({ label, required, children, span }) {
  return (
    <div className={span === 2 ? 'sm:col-span-2' : span === 3 ? 'col-span-full' : ''}>
      <label className="label">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function StudentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (isEdit) {
      setFetching(true);
      getStudent(id).then(res => {
        const s = res.data;
        setForm({
          year: s.year || '',
          rollNo: s.rollNo || '',
          nameOfTheGame: s.nameOfTheGame || '',
          gender: s.gender || 'MALE',
          studentName: s.nameOfTheSportsperson || '',
          fatherName: s.fathersName || '',
          motherName: s.motherName || '',
          dob: s.dateOfBirth || '',
          nameOfExam: s.nameOfExam || '',
          dateAndYear: s.dateAndYear || '',
          presentClass: s.presentClass || '',
          nameOfThePresentClass: s.nameOfThePresentClass || '',
          durationOfCourse: s.durationOfCourse || '',
          university: s.university || '',
          presentCourse: s.presentCourse || '',
          graduateCourse: s.graduateCourse || 'NIL',
          pgCourse: s.pgCourse || 'NIL',
          previousCourse: s.previousCourse || '',
          address: s.address || '',
          phoneNumber: s.phoneNumber || '',
          aadharNumber: s.aadharNumber || '',
          tournament: s.tournament || '',
          tshirt: s.tshirt || '',
          track: s.track || '',
        });
        if (s.image) setCurrentImage(s.image);
      }).catch(() => {
        addToast('Failed to load student', 'error');
        navigate('/');
      }).finally(() => setFetching(false));
    }
  }, [id, isEdit]);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (isEdit) {
        await updateStudent(id, fd);
        addToast('Student updated successfully');
      } else {
        const res = await createStudent(fd);
        addToast(res.data.message);
      }
      navigate('/');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to save student', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading student…" />
    </div>
  );

  const photoSrc = imagePreview || (currentImage ? `/uploads/${currentImage}` : null);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Student' : 'Add New Student'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isEdit ? 'Update the student information below' : 'Fill in the details to register a new sportsperson'}
          </p>
        </div>
      </div>

      {!isEdit && user?.role !== 'admin' && (
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-400">
            ℹ️ Your submission will be reviewed by an admin before appearing in the records.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <Section title="Basic Information">
          <Field label="Academic Year" required>
            <input className="input-field" placeholder="e.g. 2023-2024" value={form.year} onChange={set('year')} required />
          </Field>
          <Field label="Roll Number" required>
            <input className="input-field" placeholder="Enter roll number" value={form.rollNo} onChange={set('rollNo')} required />
          </Field>
          <Field label="Name of the Game" required>
            <input
              className="input-field" list="games-list"
              placeholder="Select or type a game" value={form.nameOfTheGame}
              onChange={set('nameOfTheGame')} required
            />
            <datalist id="games-list">
              {GAMES.map(g => <option key={g} value={g} />)}
            </datalist>
          </Field>
          <Field label="Gender" required>
            <div className="flex gap-4 mt-1">
              {['MALE', 'FEMALE'].map(g => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio" name="gender" value={g}
                    checked={form.gender === g}
                    onChange={set('gender')}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{g}</span>
                </label>
              ))}
            </div>
          </Field>
        </Section>

        {/* Personal Details */}
        <Section title="Personal Details">
          <Field label="Name of Sportsperson" required span={2}>
            <input className="input-field" placeholder="Full name" value={form.studentName} onChange={set('studentName')} required />
          </Field>
          <Field label="Date of Birth" required>
            <input type="date" className="input-field" value={form.dob} onChange={set('dob')} required />
          </Field>
          <Field label="Father's Name" required>
            <input className="input-field" placeholder="Father's full name" value={form.fatherName} onChange={set('fatherName')} required />
          </Field>
          <Field label="Mother's Name" required>
            <input className="input-field" placeholder="Mother's full name" value={form.motherName} onChange={set('motherName')} required />
          </Field>
          <Field label="Aadhar Number">
            <input className="input-field" placeholder="12-digit Aadhar" value={form.aadharNumber} onChange={set('aadharNumber')} maxLength={12} />
          </Field>
          <Field label="Phone Number">
            <input className="input-field" type="tel" placeholder="Mobile number" value={form.phoneNumber} onChange={set('phoneNumber')} />
          </Field>
          <Field label="Address" span={2}>
            <textarea className="input-field resize-none" rows={2} placeholder="Full address" value={form.address} onChange={set('address')} />
          </Field>
        </Section>

        {/* Academic Details */}
        <Section title="Academic Details">
          <Field label="Present Class / Semester">
            <input className="input-field" placeholder="e.g. I Year / II Sem" value={form.presentClass} onChange={set('presentClass')} />
          </Field>
          <Field label="Department" required>
            <input className="input-field" placeholder="Name of department" value={form.nameOfThePresentClass} onChange={set('nameOfThePresentClass')} required />
          </Field>
          <Field label="Duration of Course">
            <input className="input-field" placeholder="e.g. 3 Years" value={form.durationOfCourse} onChange={set('durationOfCourse')} />
          </Field>
          <Field label="University" span={2}>
            <input className="input-field" placeholder="University name" value={form.university} onChange={set('university')} />
          </Field>
          <Field label="Present Course">
            <input className="input-field" placeholder="e.g. B.Sc Computer Science" value={form.presentCourse} onChange={set('presentCourse')} />
          </Field>
        </Section>

        {/* IUT Participation */}
        <Section title="Previous IUT Participation (While Pursuing)">
          <Field label="Graduate Course (No. of years)">
            <select className="input-field" value={form.graduateCourse} onChange={set('graduateCourse')}>
              {['NIL','1','2','3'].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="PG Course (No. of years)">
            <select className="input-field" value={form.pgCourse} onChange={set('pgCourse')}>
              {['NIL','1','2','3'].map(v => <option key={v}>{v}</option>)}
            </select>
          </Field>
          <Field label="Previous Course Details" span={3}>
            <textarea className="input-field resize-none" rows={2} placeholder="Details of previous course participation" value={form.previousCourse} onChange={set('previousCourse')} />
          </Field>
        </Section>

        {/* Qualifying Exam */}
        <Section title="Qualifying Examination">
          <Field label="Name of Exam">
            <input className="input-field" placeholder="e.g. HSC, SSLC" value={form.nameOfExam} onChange={set('nameOfExam')} />
          </Field>
          <Field label="Date & Year of Passing">
            <input className="input-field" placeholder="e.g. April 2022" value={form.dateAndYear} onChange={set('dateAndYear')} />
          </Field>
        </Section>

        {/* Sports Details */}
        <Section title="Sports / Event Details">
          <Field label="Tournament Number">
            <input className="input-field" type="number" placeholder="Tournament no." value={form.tournament} onChange={set('tournament')} />
          </Field>
          <Field label="T-Shirt Size">
            <input className="input-field" type="number" placeholder="T-shirt size" value={form.tshirt} onChange={set('tshirt')} />
          </Field>
          <Field label="Track Size">
            <input className="input-field" type="number" placeholder="Track size" value={form.track} onChange={set('track')} />
          </Field>
        </Section>

        {/* Photo */}
        <div className="card p-6">
          <h3 className="section-title">Passport Size Photo</h3>
          <div className="flex items-start gap-6">
            {photoSrc ? (
              <img src={photoSrc} alt="Student" className="w-24 h-28 object-cover rounded-lg border-2 border-blue-200 dark:border-blue-800 shadow-sm" />
            ) : (
              <div className="w-24 h-28 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
            )}
            <div>
              <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
                <Upload className="w-4 h-4" />
                {photoSrc ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept=".jpg,.jpeg,.png" onChange={handleImageChange} className="hidden" />
              </label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">JPG or PNG, max 10MB</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 px-8 py-2.5">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving…' : isEdit ? 'Update Student' : 'Submit Form'}
          </button>
          <Link to="/" className="btn-secondary text-sm">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
