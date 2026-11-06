import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, AlertCircle, Eye, EyeOff, Sun, Moon } from 'lucide-react';
const ROLES = [
  { key: 'patient', label: 'Patient', desc: 'Access your maternal health records and vitals tracker.' },
  { key: 'health_worker', label: 'Health Worker', desc: 'Monitor assigned patient records and critical alerts.' },
  { key: 'admin', label: 'Admin', desc: 'Access global system metrics and user database control.' },
];

export default function Login({ isAdminRoute = false }) {
  const { theme, toggleTheme } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState(isAdminRoute ? 'admin' : 'patient');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError('Please fill in all fields');
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Incorrect credentials. Please try again.');
      } else {
        setError('Failed to sign in. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 flex flex-col">
      {/* Mini Navbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-health-600 to-teal-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-health-500/30">
            M
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">MaternalCare</div>
            <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">System Login</div>
          </div>
        </Link>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-amber-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[460px]">

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-4">
              {ROLES.find(r => r.key === role)?.desc}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300">

            {/* Role Tabs */}
            {!isAdminRoute && (
              <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl mb-6 border border-slate-200 dark:border-slate-700">
                {ROLES.filter(r => r.key !== 'admin').map(r => {
                  const isActive = role === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                        isActive 
                          ? 'bg-white dark:bg-slate-800 text-health-600 shadow-sm' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl mb-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400 leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-health-500 transition-colors pointer-events-none" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-health-500 focus:ring-1 focus:ring-health-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-health-500 transition-colors pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-health-500 focus:ring-1 focus:ring-health-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex justify-end -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-health-600 hover:text-health-700 dark:text-health-400 dark:hover:text-health-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 rounded-xl border-none bg-gradient-to-r from-health-600 to-teal-500 text-white text-sm font-bold shadow-lg shadow-health-500/30 hover:shadow-health-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none transition-all duration-200"
              >
                {loading ? 'Signing you in…' : 'Sign In'}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
              New to the system?{' '}
              <Link to="/register" className="font-bold text-health-600 hover:text-health-700 dark:text-health-400 dark:hover:text-health-300 transition-colors">
                Create an Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
