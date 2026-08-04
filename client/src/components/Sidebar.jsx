import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Trophy, Sun, Moon, LogOut, Menu, X,
  Home, Plus, BookOpen, Clock, User, Settings,
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

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/',             label: 'Dashboard',             icon: Home },
    { to: '/students/new', label: 'Add Student',           icon: Plus },
    { to: '/drafts',       label: 'Draft',                 icon: BookOpen, badge: draftCount || null },
    ...(user?.role === 'admin' ? [
      { to: '/admin', label: 'Student Self Register', icon: Clock },
    ] : []),
  ];

  const bottomLinks = [
    { to: '/account',  label: 'My Account', icon: User },
    { to: '/settings', label: 'Settings',   icon: Settings },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const NavItem = ({ to, label, icon: Icon, badge, isMobile = false }) => {
    const active = isActive(to);
    const mini = collapsed && !isMobile;
    return (
      <Link
        to={to}
        title={mini ? label : undefined}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none ${
          active
            ? 'bg-blue-600/90 text-white shadow-sm shadow-blue-500/30'
            : 'text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-gray-100'
        } ${mini ? 'justify-center' : ''}`}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />

        <span className={`flex-1 truncate transition-all duration-300 ${mini ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
          {label}
        </span>

        {/* Badge expanded */}
        {!mini && badge > 0 && (
          <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
            active ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'
          }`}>{badge}</span>
        )}
        {/* Badge dot collapsed */}
        {mini && badge > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-blue-600 text-white text-[9px] font-bold leading-none">
            {badge}
          </span>
        )}

        {/* Tooltip */}
        {mini && (
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
            {label}
            {badge > 0 && <span className="ml-1.5 bg-blue-500 rounded-full px-1.5 py-0.5 text-[10px]">{badge}</span>}
          </span>
        )}
      </Link>
    );
  };

  const glassBase = `bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-white/50 dark:border-white/8 shadow-2xl shadow-black/10 dark:shadow-black/40`;

  const SidebarContent = ({ mobile = false }) => {
    const mini = collapsed && !mobile;
    return (
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={`flex items-center h-16 px-3 flex-shrink-0 ${mini ? 'justify-center' : ''}`}>
          <Link to="/" className={`flex items-center gap-3 min-w-0 ${mini ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/30 flex-shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${mini ? 'w-0 opacity-0' : 'opacity-100'}`}>
              <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">BHC Sports</p>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-tight whitespace-nowrap">Bharathidasan University</p>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-black/5 dark:bg-white/8 flex-shrink-0" />

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          <p className={`text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2 px-3 transition-all duration-300 ${mini ? 'opacity-0 h-0 overflow-hidden mb-0 py-0' : 'opacity-100'}`}>
            Navigation
          </p>
          {navLinks.map((link) => (
            <NavItem key={link.to} {...link} isMobile={mobile} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="mx-3 h-px bg-black/5 dark:bg-white/8 flex-shrink-0" />
        <div className="py-3 px-2 space-y-0.5 flex-shrink-0">
          {bottomLinks.map((link) => (
            <NavItem key={link.to} {...link} isMobile={mobile} />
          ))}

          {/* Dark mode */}
          <button
            onClick={toggleTheme}
            className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 ${mini ? 'justify-center' : ''}`}
          >
            {dark ? <Sun className="w-[18px] h-[18px] flex-shrink-0" /> : <Moon className="w-[18px] h-[18px] flex-shrink-0" />}
            <span className={`truncate transition-all duration-300 ${mini ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
              {dark ? 'Light Mode' : 'Dark Mode'}
            </span>
            {mini && (
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
                {dark ? 'Light Mode' : 'Dark Mode'}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="mx-3 h-px bg-black/5 dark:bg-white/8 flex-shrink-0" />

        {/* User row */}
        <div className={`flex items-center gap-2.5 px-3 py-3 flex-shrink-0 ${mini ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-blue-600 flex items-center justify-center ring-2 ring-blue-500/20">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-xs font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
            }
          </div>
          {!mini && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{user?.username}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 capitalize leading-tight">{user?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
          {mini && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="group relative p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900/90 dark:bg-gray-700/90 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
                Logout
              </span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className={`lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl ${glassBase} text-gray-700 dark:text-gray-300 print:hidden`}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 print:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile drawer — floating */}
      <aside
        className={`lg:hidden fixed left-3 top-3 bottom-3 z-50 w-64 rounded-2xl ${glassBase} transition-all duration-300 ease-in-out print:hidden flex flex-col overflow-hidden ${
          mobileOpen ? 'translate-x-0 opacity-100' : '-translate-x-[110%] opacity-0'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-10"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent mobile={true} />
      </aside>

      {/* Desktop floating sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-3 top-3 bottom-3 z-40 rounded-2xl ${glassBase} transition-all duration-300 ease-in-out overflow-hidden print:hidden ${
          collapsed ? 'w-[68px]' : 'w-[240px]'
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem('bhc_sidebar', next ? 'collapsed' : 'expanded');
          }}
          className={`absolute top-[4.25rem] -right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shadow-md ${glassBase} text-gray-400 hover:text-blue-600 dark:hover:text-blue-400`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="w-3.5 h-3.5" />
            : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
        <SidebarContent />
      </aside>
    </>
  );
}
