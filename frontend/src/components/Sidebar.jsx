import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  User, 
  FileText, 
  Bell, 
  Users, 
  Activity, 
  LogOut 
} from 'lucide-react';
import Modal from './Modal';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { userProfile, logout } = useAuth();
  const role = userProfile?.role;

  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
    ...(role === 'patient' ? [
      { to: "/assessment/new", label: "New Assessment", icon: <Activity size={20} /> },
      { to: "/assessment/history", label: "Risk History", icon: <FileText size={20} /> }
    ] : []),
    ...(role === 'health_worker' ? [
      { to: "/patients", label: "My Patients", icon: <Users size={20} /> },
      { to: "/alerts", label: "Alerts Feed", icon: <Bell size={20} /> }
    ] : []),
    { to: "/profile", label: "My Profile", icon: <User size={20} /> },
  ];

  const getRoleLabel = () => {
    if (role === 'admin') return 'Administrator';
    if (role === 'health_worker') return 'Health Worker';
    if (role === 'patient') return 'Patient';
    return 'User';
  };

  const getRoleBadgeColor = () => {
    if (role === 'admin') return 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/40';
    if (role === 'health_worker') return 'text-health-700 bg-health-100 dark:text-health-400 dark:bg-health-950/20';
    return 'text-teal-700 bg-teal-100 dark:text-teal-400 dark:bg-teal-950/20';
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700/80 transition-all duration-300 lg:translate-x-0 lg:static lg:h-screen ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-health-500 text-white font-bold shadow-md shadow-health-200 dark:shadow-none">
            M
          </div>
          <div>
            <h1 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight leading-tight">MaternalCare</h1>
            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 tracking-wider uppercase">Risk AI System</span>
          </div>
        </div>

        {/* User Info Card */}
        <div className="p-4 mx-4 mt-6 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Signed In As</p>
          <h4 className="mt-1 font-semibold text-slate-800 dark:text-slate-200 truncate text-sm">{userProfile?.name || 'User'}</h4>
          <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${getRoleBadgeColor()}`}>
            {getRoleLabel()}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 mt-6 space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-health-50 dark:bg-health-950/20 text-health-600 dark:text-health-400 shadow-sm shadow-health-50/50' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30 hover:text-slate-800 dark:hover:text-slate-100'
                }`
              }
            >
              {link.icon}
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/80">
          <button
            onClick={() => setLogoutModalOpen(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Sign Out Confirmation"
        type="confirm"
        footer={
          <>
            <button
              onClick={() => setLogoutModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setLogoutModalOpen(false);
                logout();
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm"
            >
              Sign Out
            </button>
          </>
        }
      >
        <p className="font-semibold text-slate-700 dark:text-slate-300">
          Are you sure you want to log out of the MaternalCare Risk AI System? You will need to re-authenticate to track your vitals.
        </p>
      </Modal>
    </>
  );
}
