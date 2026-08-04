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
    { to: '/',            label: 'Dashboard',             icon: Home },
    { to: '/students/new',label: 'Add Student',           icon: Plus },
    { to: '/drafts',      label: 'Draft',                 icon: BookOpen, badge: draftCount || null },
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

  const NavItem = ({ to, label, icon: Icon, badge }) => {
    const active = isActive(to);
    return (
      <Link
        to={to}
        title={collapsed ? label : undefined}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none ${
          active
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 dark:shadow-blue-900/40'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
        } ${collapsed ? 'justify-center' : ''}`}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />

        <span className={`flex-1 truncate transition-all duration-300 ${collapsed ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
          {label}
        </span>

        {/* Badge when expanded */}
        {!collapsed && badge > 0 && (
          <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
            active ? 'bg-white/25 text-white' : 'bg-blue-600 text-white'
          }`}>{badge}</span>
        )}
        {/* Badge dot when collapsed */}
        {collapsed && badge > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-blue-600 text-white text-[9px] font-bold leading-none">
            {badge}
          </span>
        )}

        {/* Tooltip when collapsed */}
        {collapsed && (
          <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
            {label}
            {badge > 0 && <span className="ml-1.5 bg-blue-500 rounded-full px-1.5 py-0.5 text-[10px]">{badge}</span>}
          </span>
        )}
      </Link>
    );
  };

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700/60 flex-shrink-0 ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <Link to="/" className={`flex items-center gap-3 min-w-0 ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ${collapsed && !mobile ? 'w-0 opacity-0' : 'opacity-100'}`}>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight whitespace-nowrap">BHC Sports</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 leading-tight whitespace-nowrap">Bharathidasan University</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto overflow-x-hidden">
        <p className={`text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-wider mb-2 px-3 transition-all duration-300 ${collapsed && !mobile ? 'opacity-0 h-0 mb-0 overflow-hidden' : 'opacity-100'}`}>
          Navigation
        </p>
        {navLinks.map((link) => (
          <NavItem key={link.to} {...link} />
        ))}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 dark:border-gray-700/60 py-3 px-2 space-y-1 flex-shrink-0">
        {bottomLinks.map((link) => (
          <NavItem key={link.to} {...link} />
        ))}

        {/* Dark mode toggle */}
        <button
          onClick={toggleTheme}
          title={collapsed && !mobile ? (dark ? 'Light Mode' : 'Dark Mode') : undefined}
          className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200 ${collapsed && !mobile ? 'justify-center' : ''}`}
        >
          {dark
            ? <Sun className="w-5 h-5 flex-shrink-0" />
            : <Moon className="w-5 h-5 flex-shrink-0" />}
          <span className={`truncate transition-all duration-300 ${collapsed && !mobile ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
            {dark ? 'Light Mode' : 'Dark Mode'}
          </span>
          {collapsed && !mobile && (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
              {dark ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* User row */}
        <div className={`flex items-center gap-2 px-2 py-2 rounded-xl ${collapsed && !mobile ? 'justify-center' : ''}`}>
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-blue-600 flex items-center justify-center shadow-sm">
            {user?.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="text-white text-xs font-bold">{user?.username?.charAt(0).toUpperCase()}</span>
            }
          </div>
          <div className={`flex-1 min-w-0 transition-all duration-300 ${collapsed && !mobile ? 'w-0 overflow-hidden opacity-0' : 'opacity-100'}`}>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-tight">{user?.username}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize leading-tight">{user?.role}</p>
          </div>
          {(!collapsed || mobile) && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          {collapsed && !mobile && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="group relative p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-lg z-50">
                Logout
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 print:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 print:hidden ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-full z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-2xl transition-transform duration-300 ease-in-out print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent mobile={true} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col flex-shrink-0 h-screen sticky top-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out overflow-hidden relative print:hidden ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => {
            const next = !collapsed;
            setCollapsed(next);
            localStorage.setItem('bhc_sidebar', next ? 'collapsed' : 'expanded');
          }}
          className="absolute top-[4.5rem] -right-3 z-10 w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 shadow-sm"
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
