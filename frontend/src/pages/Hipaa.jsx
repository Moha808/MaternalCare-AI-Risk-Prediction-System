import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Hipaa() {
  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <Navbar onMenuToggle={() => {}} />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-black mb-6">HIPAA Compliance Statement</h1>
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-4">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">1. Commitment to Privacy</h2>
          <p>MaternalCare is committed to maintaining the privacy and security of Protected Health Information (PHI) in accordance with the Health Insurance Portability and Accountability Act (HIPAA).</p>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">2. Safeguards</h2>
          <p>We utilize Google Firebase's secure infrastructure, including at-rest and in-transit encryption. Strict Firestore security rules are implemented to ensure that a patient's vitals and ML assessment records can only be read by the patient and their explicitly assigned healthcare worker.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">3. Data Access</h2>
          <p>Healthcare workers only have access to PHI for patients who have actively claimed them or been assigned to them. Administrative accounts do not have access to raw patient clinical data unless authorized for specific system maintenance.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
