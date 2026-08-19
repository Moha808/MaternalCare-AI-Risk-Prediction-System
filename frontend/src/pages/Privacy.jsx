import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50">
      <Navbar onMenuToggle={() => {}} />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-12 w-full">
        <h1 className="text-3xl font-black mb-6">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 space-y-4">
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">1. Information We Collect</h2>
          <p>MaternalCare collects maternal vital signs (Blood Pressure, Heart Rate, Blood Sugar, Temperature, Age) strictly for the purpose of predictive risk analysis. Account information such as email addresses and names are stored securely.</p>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">2. How We Use Information</h2>
          <p>The data collected is processed by our machine learning models to provide real-time clinical suggestions and risk classifications. Your data is accessible only by your assigned healthcare provider and authorized system administrators.</p>

          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-8 mb-4">3. Data Security</h2>
          <p>We implement industry-standard security measures, including Firestore security rules and authentication tokens, to ensure your health data remains confidential and protected from unauthorized access.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
