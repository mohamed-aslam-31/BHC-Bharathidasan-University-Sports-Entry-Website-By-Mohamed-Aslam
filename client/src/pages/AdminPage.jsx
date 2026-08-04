import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { getPendingStudents, approveStudent, rejectStudent } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CheckCircle, XCircle, Eye, Clock, RefreshCw
} from 'lucide-react';

function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-blue-600 text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}>{count}</span>
      )}
    </button>
  );
}

export default function AdminPage() {
  const { addToast } = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await getPendingStudents();
      setPending(res.data);
    } catch {
      addToast('Failed to load pending students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveStudent(id);
      addToast('Student approved');
      setPending(p => p.filter(s => s.SAVED_TIME !== id));
    } catch {
      addToast('Failed to approve student', 'error');
    }
  };

  const handleReject = async () => {
    try {
      await rejectStudent(rejectTarget);
      addToast('Student rejected and removed');
      setPending(p => p.filter(s => s.SAVED_TIME !== rejectTarget));
      setRejectTarget(null);
    } catch {
      addToast('Failed to reject student', 'error');
      setRejectTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage student approvals and user accounts</p>
        </div>
        <button onClick={fetchPending}
          className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-4 h-4" />Refresh
        </button>
      </div>

      {/* Pending Approvals */}
      {(
        <div className="card overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner text="Loading pending…" /></div>
          ) : pending.length === 0 ? (
            <div className="py-16 text-center">
              <CheckCircle className="w-12 h-12 text-green-300 dark:text-green-700 mx-auto mb-3" />
              <p className="font-medium text-gray-500 dark:text-gray-400">All caught up!</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No pending submissions to review</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                    {['Roll No', 'Name', 'Father\'s Name', 'DOB', 'Department', 'Game', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pending.map(s => (
                    <tr key={s.SAVED_TIME} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">#{s.ROLL_NO}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">
                              {s.NAME_OF_THE_SPORTSPERSON?.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                            {s.NAME_OF_THE_SPORTSPERSON}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{s.FATHERS_NAME}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {s.DATE_OF_BIRTH ? new Date(s.DATE_OF_BIRTH).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-[140px] truncate">
                        {s.NAME_OF_THE_PRESENT_CLASS || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full font-medium whitespace-nowrap">
                          {s.NAME_OF_THE_GAME}
                        </span>
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
                          <button
                            onClick={() => handleApprove(s.SAVED_TIME)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setRejectTarget(s.SAVED_TIME)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
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
      )}

      <ConfirmDialog
        open={!!rejectTarget}
        title="Reject Student"
        message="This student's form will be permanently deleted. This action cannot be undone."
        confirmLabel="Reject & Delete"
        confirmClass="btn-danger"
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
}
