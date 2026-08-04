import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { getUsers, createUser, deleteUser } from '../api';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  UserPlus, Trash2, ShieldCheck, User, Eye, EyeOff, Plus, X
} from 'lucide-react';

export default function UserAccountPage() {
  const { user: me } = useAuth();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const [form, setForm] = useState({ username: '', password: '', role: 'user' });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      addToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createUser(form);
      addToast('User created successfully', 'success');
      setForm({ username: '', password: '', role: 'user' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to create user', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(deleteTarget);
      addToast('User deleted', 'success');
      setUsers(u => u.filter(x => x._id !== deleteTarget && x.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to delete user', 'error');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Accounts</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage who can access this system</p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'Add User'}
        </button>
      </div>

      {/* Add user form */}
      {showForm && (
        <div className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-600" /> New User
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input
                className="input-field"
                placeholder="e.g. coach_john"
                required
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input-field pr-10"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Role</label>
              <select
                className="input-field"
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <UserPlus className="w-4 h-4" />}
              Create User
            </button>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <LoadingSpinner text="Loading users…" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">No users found</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {users.map(u => {
              const isSelf = u._id === me?.id || u.id === me?.id;
              return (
                <li key={u._id || u.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {u.username?.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{u.username}</span>
                      {isSelf && (
                        <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full">You</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {u.role === 'admin'
                        ? <ShieldCheck className="w-3 h-3 text-blue-500" />
                        : <User className="w-3 h-3 text-gray-400" />}
                      <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{u.role}</span>
                    </div>
                  </div>

                  {/* Delete */}
                  {!isSelf && (
                    <button
                      onClick={() => setDeleteTarget(u._id || u.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete user?"
        message="This user will lose access immediately. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
