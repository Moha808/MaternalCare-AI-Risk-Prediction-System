import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Sun, Moon } from 'lucide-react';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return setError('Please enter your email address.');

    try {
      setError('');
      setLoading(true);
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError('Failed to send reset email. Please try again later.');
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
            <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Password Reset</div>
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-health-600 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-health-500/30">
              <Mail size={28} className="text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">
              Reset Password
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed px-4">
              Enter the email address linked to your account and we'll send you a password reset link.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300">

            {/* Success State */}
            {sent ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 flex items-center justify-center">
                  <CheckCircle size={28} className="text-teal-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Check your inbox</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    A password reset link has been sent to <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>. 
                    Check your spam folder if you don't see it within a minute.
                  </p>
                </div>
                <button
                  onClick={() => { setSent(false); setEmail(''); }}
                  className="mt-2 text-sm font-semibold text-health-600 hover:text-health-700 dark:text-health-400 dark:hover:text-health-300 transition-colors"
                >
                  Send to a different email
                </button>
                <Link
                  to="/login"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-health-600 to-teal-500 text-white text-sm font-bold text-center shadow-lg shadow-health-500/30 hover:shadow-health-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 block"
                >
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
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
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        autoFocus
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-health-500 focus:ring-1 focus:ring-health-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 rounded-xl border-none bg-gradient-to-r from-health-600 to-teal-500 text-white text-sm font-bold shadow-lg shadow-health-500/30 hover:shadow-health-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none transition-all duration-200"
                  >
                    {loading ? 'Sending Reset Link…' : 'Send Reset Link'}
                  </button>
                </form>

                {/* Back to login */}
                <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 font-bold text-health-600 hover:text-health-700 dark:text-health-400 dark:hover:text-health-300 transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Back to Sign In
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
