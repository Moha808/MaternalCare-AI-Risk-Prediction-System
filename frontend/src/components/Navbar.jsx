import React, { useState, useEffect } from 'react';
import { Menu, Sun, Moon, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';

export default function Navbar({ onMenuToggle }) {
  const { currentUser, userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestAlert, setLatestAlert] = useState(null); // For popup

  useEffect(() => {
    if (!currentUser || userProfile?.role !== 'health_worker') return;

    let unsubscribeAlerts = () => {};

    const setupAlertListener = async () => {
      try {
        // 1. Get assigned patients
        const qPatients = query(collection(db, 'patients'), where('assignedHealthWorkerId', '==', currentUser.uid));
        const pSnap = await getDocs(qPatients);
        const patientIds = pSnap.docs.map(d => d.id);

        if (patientIds.length === 0) return;

        // 2. Listen to unacknowledged alerts for these patients
        const qAlerts = query(
          collection(db, 'alerts'),
          where('patientId', 'in', patientIds),
          where('acknowledged', '==', false)
        );

        unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
          setUnreadCount(snapshot.docs.length);
          
          // Trigger a popup if a new alert was added in this snapshot
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const alertData = change.doc.data();
              // Only popup if it's a recent alert (created in the last minute), to prevent popups on initial load
              const alertTime = new Date(alertData.createdAt).getTime();
              const now = new Date().getTime();
              if (now - alertTime < 60000) {
                setLatestAlert(alertData);
                // Hide popup after 6 seconds
                setTimeout(() => setLatestAlert(null), 6000);
              }
            }
          });
        });

      } catch (err) {
        console.error("Error setting up alert listener:", err);
      }
    };

    setupAlertListener();

    return () => unsubscribeAlerts();
  }, [currentUser, userProfile]);

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

      <div className="flex items-center gap-3 relative">
        {/* Real-time Notification Bell for Health Workers */}
        {userProfile?.role === 'health_worker' && (
          <button
            onClick={() => navigate('/alerts')}
            className="relative p-2 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition duration-300 shadow-sm mr-2"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-800 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
        )}

        {/* Custom Toast Popup for New Alerts */}
        {latestAlert && (
          <div className="absolute top-14 right-40 w-72 bg-white dark:bg-slate-800 border-l-4 border-red-500 border-y border-r border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-4 transition-all duration-500 z-50">
            <div className="flex items-start gap-3">
              <Bell className="text-red-500 shrink-0 mt-0.5 animate-bounce" size={16} />
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">New High-Risk Alert</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">{latestAlert.message}</p>
                <button onClick={() => navigate('/alerts')} className="mt-2 text-[10px] font-bold text-health-600 dark:text-health-400 hover:underline">View Alert →</button>
              </div>
            </div>
          </div>
        )}

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
