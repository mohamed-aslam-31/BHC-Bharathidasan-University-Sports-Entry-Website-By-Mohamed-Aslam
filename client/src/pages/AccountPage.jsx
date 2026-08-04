import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Settings, ShieldCheck, User, Calendar } from 'lucide-react';

export default function AccountPage() {
  const { user } = useAuth();
  const initials = user?.username?.charAt(0).toUpperCase();

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your profile overview</p>
      </div>

      <div className="card p-8 flex flex-col items-center text-center gap-4">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-blue-600 flex items-center justify-center shadow-lg">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-3xl font-bold">{initials}</span>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.username}</h2>
          <span className={`inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            user?.role === 'admin'
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}>
            {user?.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
            {user?.role === 'admin' ? 'Administrator' : 'Standard User'}
          </span>
        </div>

        <div className="w-full border-t border-gray-200 dark:border-gray-700 pt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">User ID</p>
            <p className="mt-1 font-mono text-gray-700 dark:text-gray-300 truncate">{user?.username}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Role</p>
            <p className="mt-1 text-gray-700 dark:text-gray-300 capitalize">{user?.role}</p>
          </div>
        </div>

        <Link
          to="/settings"
          className="mt-2 btn-secondary flex items-center gap-2 w-full justify-center"
        >
          <Settings className="w-4 h-4" />
          Edit Profile & Settings
        </Link>
      </div>
    </div>
  );
}
