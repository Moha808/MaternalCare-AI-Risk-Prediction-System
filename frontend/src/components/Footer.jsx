import React from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-health-500 to-teal-400 flex items-center justify-center text-white shadow-sm">
                <Heart size={16} className="fill-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-health-600 to-teal-500 dark:from-health-400 dark:to-teal-300">
                MaternalCare
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
              Empowering maternal health workers with predictive AI to identify high-risk pregnancies early and save lives.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login" className="text-slate-500 dark:text-slate-400 hover:text-health-600 dark:hover:text-health-400 transition">Sign In</Link></li>
              <li><Link to="/register" className="text-slate-500 dark:text-slate-400 hover:text-health-600 dark:hover:text-health-400 transition">Create Account</Link></li>
              <li><Link to="/dashboard" className="text-slate-500 dark:text-slate-400 hover:text-health-600 dark:hover:text-health-400 transition">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/privacy" className="text-slate-500 dark:text-slate-400 hover:text-health-600 dark:hover:text-health-400 transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-slate-500 dark:text-slate-400 hover:text-health-600 dark:hover:text-health-400 transition">Terms of Service</Link></li>
              <li><Link to="/hipaa" className="text-slate-500 dark:text-slate-400 hover:text-health-600 dark:hover:text-health-400 transition">HIPAA Compliance</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-100 dark:border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <p>© {new Date().getFullYear()} MaternalCare AI System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
