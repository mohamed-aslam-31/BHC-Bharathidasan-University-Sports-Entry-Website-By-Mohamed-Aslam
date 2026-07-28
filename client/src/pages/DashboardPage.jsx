import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { getStudents, getStudentMeta, deleteStudent, getAdminStats } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  Search, Plus, Eye, Pencil, Trash2, Filter, X,
  Users, CheckCircle, Clock, Trophy, Printer, ChevronDown
} from 'lucide-react';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState({ departments: [], years: [], games: [] });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    rollNo: '', name: '', game: '', gender: '', department: '', year: ''
  });
  const [activeFilters, setActiveFilters] = useState({});

  const fetchStudents = useCallback(async (f = activeFilters) => {
    try {
      setLoading(true);
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

  const activeFilterCount = Object.values(activeFilters).filter(Boolean).length;

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
          </p>
        </div>
        <div className="flex items-center gap-3">
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
                  {['Roll No', 'Name', 'Game', 'Gender', 'Department', 'Year', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map(s => (
                  <tr key={s.SAVED_TIME} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">#{s.ROLL_NO}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {s.image ? (
                          <img src={`/uploads/${s.image}`} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-blue-100 dark:border-blue-900" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                              {s.NAME_OF_THE_SPORTSPERSON?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {s.NAME_OF_THE_SPORTSPERSON}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full whitespace-nowrap">
                        {s.NAME_OF_THE_GAME}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${
                        s.GENDER === 'MALE'
                          ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400'
                          : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400'
                      }`}>
                        {s.GENDER}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[160px] truncate">
                      {s.NAME_OF_THE_PRESENT_CLASS || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {s.YEAR || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/students/${s.SAVED_TIME}/view`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/students/${s.SAVED_TIME}/edit`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => setDeleteTarget(s.SAVED_TIME)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Student"
        message="This will permanently delete the student record and photo. This action cannot be undone."
        confirmLabel="Delete"
        confirmClass="btn-danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
