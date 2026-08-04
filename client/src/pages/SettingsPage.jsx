import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/Toast';
import { changePassword, updateProfile } from '../api';
import { Camera, Lock, User, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const fileRef = useRef();

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Username
  const [username, setUsername] = useState(user?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);

  // Password
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) { addToast('New passwords do not match', 'error'); return; }
    if (pw.new.length < 6) { addToast('Password must be at least 6 characters', 'error'); return; }
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

      {/* Profile section */}
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
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Profile picture</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">JPG, PNG or GIF · Max 2 MB</p>
            <button
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Change photo
            </button>
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

      {/* Password section */}
      <div className="card p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" /> Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { key: 'current', label: 'Current password' },
            { key: 'new',     label: 'New password' },
            { key: 'confirm', label: 'Confirm new password' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  className="input-field pr-10"
                  value={pw[key]}
                  onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                  placeholder="••••••••"
                  required
                  minLength={key !== 'current' ? 6 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => ({ ...s, [key]: !s[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={savingPw || !pw.current || !pw.new || !pw.confirm}
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
