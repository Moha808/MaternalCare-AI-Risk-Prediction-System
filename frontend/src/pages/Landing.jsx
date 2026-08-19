import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Footer from '../components/Footer';
import {
  Sun, Moon, Heart, Activity, Users, Shield, ArrowRight,
  CheckCircle2, Sparkles, ShieldCheck, TrendingUp, Bell, Star
} from 'lucide-react';

export default function Landing() {
  const { theme, toggleTheme } = useTheme();

  const [pulse, setPulse] = useState(72);
  const [systolic, setSystolic] = useState(120);
  const [riskLevel, setRiskLevel] = useState('low risk');

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(Math.floor(Math.random() * 8) + 70);
      setSystolic(prev => {
        const next = prev === 120 ? 142 : 120;
        setRiskLevel(next > 135 ? 'high risk' : 'low risk');
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">

      {/* ───── NAVBAR ───── */}
      <nav className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-health-600 to-teal-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-health-500/30">
              M
            </div>
            <div>
              <div className="font-extrabold text-sm leading-tight text-slate-900 dark:text-white">MaternalCare</div>
              <div className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-widest">Risk Prediction System</div>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-amber-400 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/login"
              className="hidden sm:block px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-health-600 to-teal-500 shadow-lg shadow-health-500/30 hover:shadow-health-500/50 hover:-translate-y-0.5 transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ───── HERO ───── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6 bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 transition-colors">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full bg-health-500/10 dark:bg-health-500/20 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full bg-teal-500/10 dark:bg-teal-500/20 blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative">

          {/* Left copy */}
          <div className="flex-1 max-w-2xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-health-100 dark:bg-health-500/20 border border-health-200 dark:border-health-500/30 text-health-700 dark:text-health-300 text-xs font-bold mb-6">
              <Sparkles size={14} /> AI-Powered Maternal Health Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-6 text-slate-900 dark:text-white">
              Protecting Every <br className="hidden sm:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-health-600 to-teal-500">
                Pregnancy Journey
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Instant clinical risk classification from maternal vitals — blood pressure, blood sugar, temperature and heart rate — with AI alerts for healthcare workers.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/register" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-white bg-gradient-to-r from-health-600 to-teal-500 shadow-xl shadow-health-500/30 hover:shadow-health-500/50 hover:-translate-y-0.5 transition-all">
                Start Free Assessment <ArrowRight size={20} />
              </Link>
              <Link to="/login" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
                Provider Login
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mt-10">
              {[
                { icon: <Star size={16} />, text: '99.6% Model Accuracy' },
                { icon: <Shield size={16} />, text: 'Firebase Secured' },
                { icon: <Bell size={16} />, text: 'Instant Risk Alerts' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                  <span className="text-teal-500">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Hero Image */}
          <div className="flex-1 w-full max-w-[500px]">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/80 border border-slate-200 dark:border-slate-700">
              <img src="/hero-image.jpg" alt="Maternal health consultation" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-health-100 dark:bg-health-900/50 flex items-center justify-center text-health-600 dark:text-health-400">
                    <Shield size={20} />
                  </div>
                  <div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">AI Clinical Support</div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Assisting doctors with data</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── STATS BAR ───── */}
      <section className="py-10 px-6 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '99.6%', label: 'Prediction Accuracy' },
            { value: '< 2s', label: 'Alert Dispatch' },
            { value: '3 Roles', label: 'Patient · Worker · Admin' },
            { value: '24/7', label: 'System Monitoring' },
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-health-600 to-teal-500">
                {stat.value}
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ───── FEATURES ───── */}
      <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">
              Built for Every Role in Maternal Care
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              One platform, three powerful views — each tailored for a specific role in the care journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Heart size={28} />, iconColor: 'text-rose-500', iconBg: 'bg-rose-50 dark:bg-rose-500/10',
                title: 'Expectant Mothers',
                description: 'Track your vitals daily, check symptoms, view AI-generated risk scores and connect with your assigned healthcare provider.',
                checks: ['Daily vital sign logging', 'Symptom safety checklist', 'Personal health risk chart', 'Caseworker directory'],
              },
              {
                icon: <Users size={28} />, iconColor: 'text-teal-500', iconBg: 'bg-teal-50 dark:bg-teal-500/10',
                title: 'Healthcare Providers',
                description: 'Monitor assigned patients, receive instant high-risk alerts, schedule consultations and manage clinical records.',
                checks: ['Full patient directory view', 'Real-time alert notifications', 'Consultation scheduling', 'Assessment history charts'],
              },
              {
                icon: <ShieldCheck size={28} />, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
                title: 'System Administrators',
                description: 'Control the full user registry, view platform-wide statistics, and manage account access for both patients and workers.',
                checks: ['Global user registry', 'System-wide statistics', 'Account management', 'Role-based access control'],
              },
            ].map((card, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/40 dark:shadow-none transition-colors">
                <div className={`w-14 h-14 rounded-2xl ${card.iconBg} ${card.iconColor} flex items-center justify-center mb-6`}>
                  {card.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{card.title}</h3>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{card.description}</p>
                <ul className="space-y-3">
                  {card.checks.map((check, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm font-bold text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={16} className="text-teal-500 shrink-0" /> {check}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CLINICAL TABLE ───── */}
      <section className="py-20 px-6 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Clinical Risk Thresholds</h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium">AI classification boundaries used for maternal triage.</p>
          </div>
          
          <div className="rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-900/50 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  {['Risk Level', 'Systolic BP', 'Diastolic BP', 'Blood Sugar', 'System Action'].map((h, i) => (
                    <th key={i} className="px-6 py-4 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm font-medium">
                {[
                  { level: 'Low Risk', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', systolic: '< 120 mmHg', diastolic: '< 80 mmHg', bs: '6.0–7.5 mmol/L', action: 'Routine monitoring. Symptoms logged.' },
                  { level: 'Mid Risk', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', systolic: '120–139 mmHg', diastolic: '80–89 mmHg', bs: '7.6–10 mmol/L', action: 'Provider consultation recommended.' },
                  { level: 'High Risk', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', systolic: '≥ 140 mmHg', diastolic: '≥ 90 mmHg', bs: '≥ 10.1 mmol/L', action: 'Instant alert dispatched to caseworker.' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-white dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-5">
                      <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${row.bg} ${row.color}`}>
                        {row.level}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-700 dark:text-slate-300">{row.systolic}</td>
                    <td className="px-6 py-5 text-slate-700 dark:text-slate-300">{row.diastolic}</td>
                    <td className="px-6 py-5 text-slate-700 dark:text-slate-300">{row.bs}</td>
                    <td className="px-6 py-5 text-slate-500 dark:text-slate-400 text-xs font-semibold">{row.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="py-24 px-6 bg-slate-50 dark:bg-slate-900 transition-colors">
        <div className="max-w-4xl mx-auto text-center">
          <div className="relative rounded-[2.5rem] p-10 sm:p-16 bg-gradient-to-br from-health-600 to-teal-600 overflow-hidden shadow-2xl shadow-health-500/40">
            {/* Decals */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
                Start Monitoring Maternal Health Today
              </h2>
              <p className="text-health-50 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                Join expectant mothers and healthcare providers using AI-powered risk assessment to ensure safer pregnancies.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-2xl text-health-700 bg-white font-black text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all">
                  Register as Patient
                </Link>
                <Link to="/register" className="w-full sm:w-auto px-8 py-4 rounded-2xl text-white bg-white/10 border border-white/20 backdrop-blur-sm font-black text-base hover:bg-white/20 transition-all">
                  Provider Sign Up
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <Footer />
    </div>
  );
}
