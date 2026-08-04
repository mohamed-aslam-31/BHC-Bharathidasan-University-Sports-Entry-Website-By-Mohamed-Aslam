import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { changePassword, updateProfile } from '../api';
import { Camera, Lock, User, Save, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

// ─── Password strength helpers ────────────────────────────────────────────────
const RULES = [
  { id: 'len',   label: 'At least 8 characters',        test: p => p.length >= 8 },
  { id: 'upper', label: 'At least one uppercase letter', test: p => /[A-Z]/.test(p) },
  { id: 'lower', label: 'At least one lowercase letter', test: p => /[a-z]/.test(p) },
  { id: 'num',   label: 'At least one number',           test: p => /[0-9]/.test(p) },
  { id: 'spl',   label: 'At least one special character',test: p => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password) {
  if (!password) return 0;
  return RULES.filter(r => r.test(password)).length;
}

const STRENGTH_LABELS = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const STRENGTH_COLORS = [
  '',
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-400',
  'bg-blue-500',
  'bg-green-500',
];
const STRENGTH_TEXT = [
  '',
  'text-red-500',
  'text-orange-500',
  'text-yellow-500',
  'text-blue-500',
  'text-green-500',
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef();

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarError, setAvatarError]     = useState('');
  const [savingAvatar, setSavingAvatar]   = useState(false);

  // Username
  const [username, setUsername]           = useState(user?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);

  // Password
  const [pw, setPw]         = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  // Derived
  const strength    = getStrength(pw.new);
  const allRulesOk  = strength === 5;
  const passwordsMatch = pw.confirm !== '' && pw.new === pw.confirm;
  const passwordsMismatch = pw.confirm !== '' && pw.new !== pw.confirm;

  // ── Avatar handler ──────────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    // Reset input value so selecting the same file again triggers onChange
    e.target.value = '';
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setAvatarError('Only JPG and PNG files are allowed.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('File must be 2 MB or smaller.');
      return;
    }
    setAvatarError('');
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!avatarFile && username === user?.username) return;
    setSavingAvatar(true);
    try {
      const fd = new FormData();
      if (avatarFile) fd.append('avatar', avatarFile);
      if (username !== user?.username) fd.append('username', username);
      const res = await updateProfile(fd);
      updateUser(res.data.user, res.data.token);
      setAvatarFile(null);
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to update profile', 'error');
    } finally {
      setSavingAvatar(false);
    }
  };

  // ── Password handler ────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!allRulesOk) {
      addToast('New password does not meet the requirements', 'error');
      return;
    }
    if (pw.new !== pw.confirm) {
      addToast('New passwords do not match', 'error');
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.new });
      setPw({ current: '', new: '', confirm: '' });
      addToast('Password changed successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to change password', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = user?.username?.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences</p>
      </div>

      {/* ── Profile section ── */}
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" /> Profile
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-600 flex items-center justify-center shadow-md">
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-2xl font-bold">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <Camera className="w-5 h-5 text-white" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile picture</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">JPG or PNG · Max 2 MB</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Change photo
            </button>
            {avatarError && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3 h-3" /> {avatarError}
              </p>
            )}
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="label">Username / User ID</label>
          <input
            className="input-field"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Username"
          />
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={savingAvatar || (!avatarFile && username === user?.username)}
          className="btn-primary flex items-center gap-2 disabled:opacity-40"
        >
          {savingAvatar ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Profile
        </button>
      </div>

      {/* ── Password section ── */}
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">

          {/* Current password */}
          <div>
            <label className="label">Current password</label>
            <div className="relative">
              <input
                type={showPw.current ? 'text' : 'password'}
                className="input-field pr-10"
                value={pw.current}
                onChange={e => setPw(p => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password + strength */}
          <div>
            <label className="label">New password</label>
            <div className="relative">
              <input
                type={showPw.new ? 'text' : 'password'}
                className="input-field pr-10"
                value={pw.new}
                onChange={e => setPw(p => ({ ...p, new: e.target.value }))}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(s => ({ ...s, new: !s.new }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {pw.new && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength ? STRENGTH_COLORS[strength] : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${STRENGTH_TEXT[strength]}`}>
                  {STRENGTH_LABELS[strength]}
                </p>
              </div>
            )}

            {/* Rules checklist */}
            {pw.new && (
              <ul className="mt-2 space-y-1">
                {RULES.map(rule => {
                  const ok = rule.test(pw.new);
                  return (
                    <li key={rule.id} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {ok
                        ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        : <XCircle    className="w-3.5 h-3.5 shrink-0" />
                      }
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="label">Confirm new password</label>
            <div className="relative">
              <input
                type={showPw.confirm ? 'text' : 'password'}
                className={`input-field pr-10 ${
                  passwordsMismatch ? 'border-red-400 focus:ring-red-400' :
                  passwordsMatch    ? 'border-green-400 focus:ring-green-400' : ''
                }`}
                value={pw.confirm}
                onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {passwordsMatch && (
              <p className="mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Passwords match
              </p>
            )}
            {passwordsMismatch && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" /> Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={savingPw || !pw.current || !pw.new || !pw.confirm || !allRulesOk || !passwordsMatch}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            {savingPw ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
