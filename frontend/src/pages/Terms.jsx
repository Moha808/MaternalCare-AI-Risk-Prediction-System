import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <Navbar onMenuToggle={() => {}} />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-black mb-6">Terms of Service</h1>
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-4">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">1. Acceptance of Terms</h2>
          <p>By accessing and using MaternalCare, you agree to be bound by these Terms of Service. This platform is designed to assist healthcare workers and patients in managing maternal health data.</p>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">2. Clinical Disclaimer</h2>
          <p>MaternalCare is an AI-assisted predictive tool. It is <strong>not</strong> a replacement for professional medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with any questions you may have regarding a medical condition.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">3. User Responsibilities</h2>
          <p>Users are responsible for maintaining the confidentiality of their account credentials. Patients should ensure the accuracy of the vitals they input, as the AI predictions rely entirely on user-provided data.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
