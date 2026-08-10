import React from 'react';
import { Menu, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar({ onMenuToggle }) {
  const { userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700/80 transition-colors duration-300">
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button 
          onClick={onMenuToggle}
          className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 rounded-md border border-teal-100 dark:border-teal-900/50">
          System Live
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition duration-300 shadow-sm"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <Moon size={16} className="transform rotate-0 transition-transform duration-500" />
          ) : (
            <Sun size={16} className="transform rotate-180 transition-transform duration-500 text-amber-400" />
          )}
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-3 sm:pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none mb-1">{userProfile?.name || 'User'}</p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-wide capitalize">
              {userProfile?.role === 'health_worker' ? 'Health Worker' : userProfile?.role || 'Guest'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-health-500 to-teal-400 text-white flex items-center justify-center font-bold shadow-sm border-2 border-white dark:border-slate-800 ring-2 ring-health-50 dark:ring-health-900/30">
            {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
