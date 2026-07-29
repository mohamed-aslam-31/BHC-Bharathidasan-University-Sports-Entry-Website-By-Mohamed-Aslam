import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { getStudents, getStudentMeta, deleteStudent, getAdminStats, bulkDeleteStudents } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Plus, Eye, Pencil, Trash2, Filter, X,
  Users, CheckCircle, Clock, Trophy, AlertTriangle, Check
} from 'lucide-react';

/* ── Circular checkbox ── */
function CircleCheckbox({ checked, indeterminate, onChange }) {
  return (
    <label className="relative flex items-center justify-center cursor-pointer w-5 h-5 flex-shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-150 ${
        checked || indeterminate
          ? 'bg-blue-600 border-blue-600'
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
      }`}>
        {indeterminate && !checked ? (
          <span className="block w-2 h-0.5 bg-white rounded-full" />
        ) : checked ? (
          <Check className="w-3 h-3 text-white stroke-[3]" />
        ) : null}
      </div>
    </label>
  );
}

const GAMES = [
  'CRICKET','FOOTBALL','CHESS','BASKETBALL','VOLLEYBALL','HOCKEY',
  'TABLE TENNIS','BADMINTON','CROSS COUNTRY','FENCING & CYCLE','SWIMMING',
  'ARCHERY','TENNIS','KABADDI','ATHLETICS','KHO - KHO','BEST PHYSIQUE',
  'NETBALL','HANDBALL','BOXING','BALL BADMINTON','YOGASANA','TAEKWONDO','KARATE'
];

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}

/* ── Bulk-delete confirmation modal ── */
function BulkDeleteModal({ students, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Delete {students.length} Student{students.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              This action cannot be undone
            </p>
          </div>
        </div>

        {/* Student list */}
        <div className="p-5">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            The following student records will be permanently deleted:
          </p>
          <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
            {students.map((s, i) => (
              <div key={s._id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {s.nameOfTheSportsperson}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Roll No: <span className="font-mono text-blue-600 dark:text-blue-400">{s.rollNo}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary flex-1 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete {students.length} Record{students.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ departments: [], years: [], games: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Single delete
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Bulk selection & delete
  const [selected, setSelected] = useState(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Filters
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    rollNo: '', name: '', game: '', gender: '', department: '', year: ''
  });
  const [activeFilters, setActiveFilters] = useState({});

  const fetchStudents = useCallback(async (f = activeFilters) => {
    try {
      setLoading(true);
      setSelected(new Set()); // clear selection on reload
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
      if (user?.role === 'admin') params.status = 'approved';
      const res = await getStudents(params);
      setStudents(res.data);
    } catch {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeFilters, user]);

  useEffect(() => {
    fetchStudents();
    getStudentMeta().then(r => setMeta(r.data)).catch(() => {});
    if (user?.role === 'admin') {
      getAdminStats().then(r => setStats(r.data)).catch(() => {});
    }
  }, []);

  /* ── Filter helpers ── */
  const applyFilters = () => {
    setActiveFilters({ ...filters });
    fetchStudents(filters);
    setFiltersOpen(false);
  };
  const clearFilters = () => {
    const empty = { rollNo: '', name: '', game: '', gender: '', department: '', year: '' };
    setFilters(empty);
    setActiveFilters({});
    fetchStudents({});
    setFiltersOpen(false);
  };
  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

  /* ── Single delete ── */
  const handleDelete = async () => {
    try {
      await deleteStudent(deleteTarget);
      addToast('Student deleted successfully');
      setDeleteTarget(null);
      fetchStudents();
    } catch {
      addToast('Failed to delete student', 'error');
      setDeleteTarget(null);
    }
  };

  /* ── Checkbox helpers ── */
  const allChecked = students.length > 0 && selected.size === students.length;
  const someChecked = selected.size > 0 && selected.size < students.length;

  const toggleAll = () => {
    if (allChecked) {
      setSelected(new Set());
    } else {
      setSelected(new Set(students.map(s => s._id)));
    }
  };

  const toggleOne = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  /* ── Bulk delete ── */
  const selectedStudents = students.filter(s => selected.has(s._id));

  const handleBulkDelete = async () => {
    try {
      setBulkDeleting(true);
      await bulkDeleteStudents([...selected]);
      addToast(`${selected.size} student${selected.size !== 1 ? 's' : ''} deleted successfully`);
      setBulkModalOpen(false);
      fetchStudents();
    } catch {
      addToast('Failed to delete selected students', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats (admin only) */}
      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Students" value={stats.total} color="blue" />
          <StatCard icon={CheckCircle} label="Approved" value={stats.approved} color="green" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="yellow" />
          <StatCard icon={Trophy} label="Sports" value={stats.games} color="purple" />
        </div>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Student Records</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {students.length} student{students.length !== 1 ? 's' : ''} found
            {selected.size > 0 && (
              <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                · {selected.size} selected
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Bulk delete button */}
          {selected.size > 0 && (
            <button
              onClick={() => setBulkModalOpen(true)}
              className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selected.size})
            </button>
          )}

          <button
            onClick={() => setFiltersOpen(o => !o)}
            className={`btn-secondary flex items-center gap-2 text-sm ${activeFilterCount > 0 ? 'border-blue-400 text-blue-600 dark:text-blue-400' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <Link to="/students/new" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" />
            Add Student
          </Link>
        </div>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="card p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Roll Number</label>
              <input className="input-field" placeholder="Search roll no…" value={filters.rollNo}
                onChange={e => setFilters(f => ({ ...f, rollNo: e.target.value }))} />
            </div>
            <div>
              <label className="label">Student Name</label>
              <input className="input-field" placeholder="Search name…" value={filters.name}
                onChange={e => setFilters(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Sport / Game</label>
              <select className="input-field" value={filters.game}
                onChange={e => setFilters(f => ({ ...f, game: e.target.value }))}>
                <option value="">All Games</option>
                {GAMES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="input-field" value={filters.gender}
                onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}>
                <option value="">All</option>
                <option>MALE</option>
                <option>FEMALE</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input-field" value={filters.department}
                onChange={e => setFilters(f => ({ ...f, department: e.target.value }))}>
                <option value="">All Departments</option>
                {meta.departments.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Academic Year</label>
              <select className="input-field" value={filters.year}
                onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}>
                <option value="">All Years</option>
                {meta.years.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={applyFilters} className="btn-primary text-sm">Apply Filters</button>
            <button onClick={clearFilters} className="btn-secondary text-sm flex items-center gap-1">
              <X className="w-3.5 h-3.5" />Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner text="Loading students…" />
          </div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">No students found</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {activeFilterCount > 0 ? 'Try adjusting your filters' : 'Add your first student to get started'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  {/* Select-all checkbox */}
                  <th className="pl-4 pr-2 py-3 w-10">
                    <CircleCheckbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      onChange={toggleAll}
                    />
                  </th>
                  {['Roll No', 'Name', 'Game', 'Gender', 'Department', 'Year', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map(s => {
                  const isSelected = selected.has(s._id);
                  return (
                    <tr
                      key={s._id}
                      className={`transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/10'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'
                      }`}
                    >
                      {/* Row checkbox */}
                      <td className="pl-4 pr-2 py-3">
                        <CircleCheckbox
                          checked={isSelected}
                          onChange={() => toggleOne(s._id)}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">#{s.rollNo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.image ? (
                            <img src={`/uploads/${s.image}`} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-100 dark:border-blue-900" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {s.nameOfTheSportsperson?.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {s.nameOfTheSportsperson}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full whitespace-nowrap">
                          {s.nameOfTheGame}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                          s.gender === 'MALE'
                            ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400'
                            : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400'
                        }`}>
                          {s.gender}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[160px] truncate">
                        {s.nameOfThePresentClass || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {s.year || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/students/${s._id}/view`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/students/${s._id}/edit`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(s._id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Single delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student"
        message="This will permanently delete the student record and photo. This action cannot be undone."
        confirmLabel="Delete"
        confirmClass="btn-danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Bulk delete modal */}
      {bulkModalOpen && (
        <BulkDeleteModal
          students={selectedStudents}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkModalOpen(false)}
          loading={bulkDeleting}
        />
      )}
    </div>
  );
}
