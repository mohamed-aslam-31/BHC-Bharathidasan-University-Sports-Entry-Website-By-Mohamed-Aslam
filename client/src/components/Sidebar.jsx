import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Sun, Moon, LogOut, Menu, X,
  Home, Plus, BookOpen, Clock, Settings,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { getDrafts } from '../utils/drafts';

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const refresh = () => setDraftCount(getDrafts().length);
    refresh();
    window.addEventListener('bhc_drafts_changed', refresh);
    return () => window.removeEventListener('bhc_drafts_changed', refresh);
  }, [location.pathname]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinks = [
    { to: '/',             label: 'Dashboard',             icon: Home },
    { to: '/students/new', label: 'Add Student',           icon: Plus },
    { to: '/drafts',       label: 'Draft',                 icon: BookOpen, badge: draftCount || null },
    ...(user?.role === 'admin' ? [
      { to: '/admin',        label: 'Student Self Register', icon: Clock },
    ] : []),
  ];

  const bottomLinks = [
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const glass = `bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/50 dark:border-white/[0.08] shadow-2xl shadow-black/10 dark:shadow-black/40`;

  /* ── Single nav item ── */
  const NavItem = ({ to, label, icon: Icon, badge, mini }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        title={mini ? label : undefined}
        className={`group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 select-none
          ${mini ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full'}
          ${active
            ? 'bg-blue-600/90 text-white shadow-sm shadow-blue-500/30'
            : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-gray-100'
          }`}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />

        {!mini && <span className="flex-1 truncate">{label}</span>}

        {/* Badge */}
        {!mini && badge > 0 && (
          <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5
            ${active ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'}`}>
            {badge}
          </span>
        )}
        {mini && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-blue-600 text-white text-[9px] font-bold leading-none">
            {badge}
          </span>
        )}

        {/* Tooltip */}
        {mini && (
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
            {label}{badge > 0 && <span className="ml-1.5 bg-blue-500 rounded-full px-1.5 py-0.5 text-[10px]">{badge}</span>}
          </span>
        )}
      </Link>
    );
  };

  /* ── Shared sidebar body ── */
  const SidebarContent = ({ mini = false }) => (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className={`flex items-center h-16 px-3 flex-shrink-0 ${mini ? 'justify-center' : ''}`}>
        <Link to="/" className={`flex items-center min-w-0 ${mini ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 flex-shrink-0">
            <img src="/dept-logo.png" alt="Department Logo" className="w-full h-full object-contain" />
          </div>
          {!mini && (
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">BHC Sports</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-tight whitespace-nowrap">Department of Physical Education</p>
            </div>
          )}
        </Link>
      </div>

      <div className="mx-3 h-px bg-black/5 dark:bg-white/[0.08] flex-shrink-0" />

      {/* Nav links */}
      <nav className={`flex-1 py-3 overflow-y-auto overflow-x-hidden ${mini ? 'px-1 space-y-1' : 'px-2 space-y-0.5'}`}>
        {!mini && (
          <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2 px-3">
            Navigation
          </p>
        )}
        {navLinks.map((link) => (
          <NavItem key={link.to} {...link} mini={mini} />
        ))}
      </nav>

      <div className="mx-3 h-px bg-black/5 dark:bg-white/[0.08] flex-shrink-0" />

      {/* Bottom links */}
      <div className={`py-3 overflow-x-hidden ${mini ? 'px-1 space-y-1' : 'px-2 space-y-0.5'}`}>
        {bottomLinks.map((link) => (
          <NavItem key={link.to} {...link} mini={mini} />
        ))}

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          className={`group relative flex items-center rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200
            ${mini ? 'justify-center w-10 h-10 mx-auto' : 'gap-3 px-3 py-2.5 w-full'}`}
        >
          {dark
            ? <Sun  className="w-[18px] h-[18px] flex-shrink-0" />
            : <Moon className="w-[18px] h-[18px] flex-shrink-0" />}
          {!mini && <span className="truncate">{dark ? 'Light Mode' : 'Dark Mode'}</span>}
          {mini && (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
              {dark ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>
      </div>

      <div className="mx-3 h-px bg-black/5 dark:bg-white/[0.08] flex-shrink-0" />

      {/* User profile + Logout */}
      <div className={`py-3 flex-shrink-0 ${mini ? 'flex flex-col items-center gap-2 px-1' : 'px-3 space-y-2'}`}>
        {/* Avatar + info */}
        <Link
          to="/settings"
          title={mini ? user?.username : undefined}
          className={`group relative flex items-center rounded-xl transition-all duration-200 hover:bg-black/5 dark:hover:bg-white/[0.08]
            ${mini ? 'justify-center w-10 h-10' : 'gap-3 px-2 py-2 w-full'}`}
        >
          {/* Avatar */}
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-bold leading-none">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name + role */}
          {!mini && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                {user?.username}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 capitalize leading-tight">
                {user?.role}
              </p>
            </div>
          )}

          {/* Tooltip in mini mode */}
          {mini && (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
              {user?.username}
              <span className="ml-1 text-gray-400 capitalize">· {user?.role}</span>
            </span>
          )}
        </Link>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`group relative flex items-center rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200
            ${mini ? 'justify-center w-10 h-10' : 'gap-3 px-3 py-2.5 w-full'}`}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!mini && <span>Logout</span>}
          {mini && (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
              Logout
            </span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl ${glass} text-gray-700 dark:text-gray-300 print:hidden`}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile backdrop ── */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 print:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* ── Mobile drawer ── */}
      <aside className={`lg:hidden fixed left-3 top-3 bottom-3 z-50 w-60 rounded-2xl ${glass} flex flex-col overflow-hidden transition-all duration-300 ease-in-out print:hidden ${
        mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0'
      }`}>
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent mini={false} />
      </aside>

      {/* ── Desktop floating sidebar ── */}
      {/* Wrapper holds both the aside and the toggle so the toggle isn't clipped by overflow-hidden */}
      <div className={`hidden lg:block fixed left-3 top-3 bottom-3 z-40 transition-all duration-300 ease-in-out print:hidden ${
        collapsed ? 'w-[60px]' : 'w-[240px]'
      }`}>
        <aside className={`h-full rounded-2xl ${glass} flex flex-col overflow-hidden`}>
          <SidebarContent mini={collapsed} />
        </aside>

        {/* Collapse toggle — lives outside overflow-hidden so it's never clipped */}
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem('bhc_sidebar', next ? 'collapsed' : 'expanded');
          }}
          className={`absolute top-1/2 -translate-y-1/2 -right-4 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${glass} text-gray-400 hover:text-blue-600 dark:hover:text-blue-400`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft  className="w-3.5 h-3.5" />}
        </button>
      </div>
    </>
  );
}
