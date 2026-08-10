import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import {
  Mail, Lock, User, Calendar, Phone, Home,
  AlertCircle, Eye, EyeOff, Clipboard, Sun, Moon
} from 'lucide-react';

const ENABLE_ADMIN_REGISTRATION = false;

const ROLES = [
  { key: 'patient', label: 'Patient' },
  { key: 'health_worker', label: 'Health Worker' },
  ...(ENABLE_ADMIN_REGISTRATION ? [{ key: 'admin', label: 'Admin' }] : []),
];

function FieldInput({ icon, type = 'text', value, onChange, placeholder, required, min, max, extra }) {
  return (
    <div className="relative group">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-health-500 transition-colors pointer-events-none flex">
        {icon}
      </span>
      <input
        type={type} value={value} onChange={onChange} required={required}
        min={min} max={max} placeholder={placeholder}
        className={`w-full pl-10 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-health-500 focus:ring-1 focus:ring-health-500 transition-all ${extra ? 'pr-11' : 'pr-4'}`}
      />
      {extra}
    </div>
  );
}

export default function Register() {
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('patient');

  // Patient fields
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password || !name) return setError('Please fill in all general fields');
    if (role === 'patient') {
      if (!dob || !phone || !address || !emergencyName || !emergencyPhone) {
        return setError('Please fill in all patient medical profile fields');
      }
    }
    try {
      setError('');
      setLoading(true);
      const user = await register(email, password, name, role);
      if (role === 'patient') {
        await setDoc(doc(db, 'patients', user.uid), {
          uid: user.uid, dob, phone, address, emergencyName, emergencyPhone,
          assignedHealthWorkerId: '',
        });
      }
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Email address already in use');
      else if (err.code === 'auth/weak-password') setError('Password should be at least 6 characters long');
      else setError('Failed to create account. Please check inputs and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans transition-colors duration-300 flex flex-col">
      {/* Mini Navbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700/60">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-health-600 to-teal-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-health-500/30">
            M
          </div>
          <div>
            <div className="font-extrabold text-sm text-slate-900 dark:text-white">MaternalCare</div>
            <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Create Account</div>
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

      {/* Content */}
      <div className="flex-1 flex items-start justify-center p-4 sm:p-8 md:py-12">
        <div className="w-full max-w-[560px]">

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">
              Create Your Account
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Join MaternalCare to monitor and manage pregnancy health risks.
            </p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 transition-all duration-300">

            {/* Role Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-xl mb-7 border border-slate-200 dark:border-slate-700">
              {ROLES.map(r => {
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

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400 leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Name + Email Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <FieldInput icon={<User size={15} />} value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Email Address</label>
                  <FieldInput icon={<Mail size={15} />} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" required />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Password</label>
                <FieldInput 
                  icon={<Lock size={15} />} 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  placeholder="•••••••• (min 6 chars)" 
                  required 
                  extra={
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-md transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </div>

              {/* Patient-Only Fields */}
              {role === 'patient' && (
                <div className="flex flex-col gap-5 pt-6 mt-2 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <span className="text-[10px] font-black text-teal-600 dark:text-teal-500 uppercase tracking-widest">
                      Patient Medical Profile
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {/* DOB */}
                  <div className="grid grid-cols-1 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Date of Birth</label>
                      <FieldInput icon={<Calendar size={15} />} type="date" value={dob} onChange={e => setDob(e.target.value)} required />
                    </div>
                  </div>

                  {/* Phone + Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Phone Number</label>
                      <FieldInput icon={<Phone size={15} />} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234 800 000 0000" required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Residential Address</label>
                      <FieldInput icon={<Home size={15} />} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, City" required />
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-red-50/50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                    <div className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Emergency Contact
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Contact Name</label>
                        <FieldInput icon={<User size={15} />} value={emergencyName} onChange={e => setEmergencyName(e.target.value)} placeholder="John Doe (Spouse)" required />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Contact Phone</label>
                        <FieldInput icon={<Phone size={15} />} type="tel" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} placeholder="+234 800 000 0001" required />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 rounded-xl border-none bg-gradient-to-r from-health-600 to-teal-500 text-white text-sm font-bold shadow-lg shadow-health-500/30 hover:shadow-health-500/50 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:pointer-events-none transition-all duration-200"
              >
                {loading ? 'Creating Account…' : 'Create Account'}
              </button>
            </form>

            <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-health-600 hover:text-health-700 dark:text-health-400 dark:hover:text-health-300 transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
