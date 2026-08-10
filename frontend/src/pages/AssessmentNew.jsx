import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, doc, setDoc } from 'firebase/firestore';
import { Activity, ShieldAlert, ShieldCheck, AlertTriangle, CheckSquare, Square, CheckCircle } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

const schema = z.object({
  age: z.coerce.number().int("Age must be a whole number").min(10, "Age must be between 10 and 70").max(70, "Age must be between 10 and 70"),
  systolicBP: z.coerce.number().int("Systolic BP must be a whole number").min(70, "Systolic BP must be between 70 and 180 mmHg").max(180, "Systolic BP must be between 70 and 180 mmHg"),
  diastolicBP: z.coerce.number().int("Diastolic BP must be a whole number").min(50, "Diastolic BP must be between 50 and 120 mmHg").max(120, "Diastolic BP must be between 50 and 120 mmHg"),
  bs: z.coerce.number().min(6.0, "Blood Sugar must be between 6.0 and 20.0 mmol/L").max(20.0, "Blood Sugar must be between 6.0 and 20.0 mmol/L"),
  bodyTemp: z.coerce.number().min(95.0, "Body Temp must be between 95.0 and 105.0 °F").max(105.0, "Body Temp must be between 95.0 and 105.0 °F"),
  heartRate: z.coerce.number().int("Heart Rate must be a whole number").min(40, "Heart Rate must be between 40 and 140 bpm").max(140, "Heart Rate must be between 40 and 140 bpm")
});

export default function AssessmentNew() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();

  // Symptoms checklist state
  const [symptoms, setSymptoms] = useState({
    headache: false,
    blurredVision: false,
    swelling: false,
    abdominalPain: false
  });

  // Modal States
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: '',
    content: '',
    type: 'info'
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema)
  });

  const toggleSymptom = (key) => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError(null);
    setResult(null);

    const apiUrl = import.meta.env.VITE_ML_API_URL || 'http://localhost:5000';

    try {
      // 1. Call Flask ML endpoint
      const response = await fetch(`${apiUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction service error');
      }

      const prediction = await response.json();
      setResult(prediction);

      // 2. Save assessment to Firestore (including checklist)
      const assessmentId = doc(collection(db, 'assessments')).id;
      const createdAt = new Date().toISOString();

      const selectedSymptoms = Object.keys(symptoms).filter(k => symptoms[k]);

      const assessmentDoc = {
        id: assessmentId,
        patientId: currentUser.uid,
        age: data.age,
        systolicBP: data.systolicBP,
        diastolicBP: data.diastolicBP,
        bs: data.bs,
        bodyTemp: data.bodyTemp,
        heartRate: data.heartRate,
        riskLevel: prediction.riskLevel,
        confidence: prediction.confidence,
        symptoms: selectedSymptoms,
        createdAt,
        createdBy: currentUser.uid
      };

      await setDoc(doc(db, 'assessments', assessmentId), assessmentDoc);

      // 3. Create high-risk alert if predicted as High Risk OR if any critical symptoms checked
      const hasSevereSymptoms = selectedSymptoms.length > 0;
      const isHighRisk = prediction.riskLevel.toLowerCase() === 'high risk';

      if (isHighRisk || hasSevereSymptoms) {
        const alertId = doc(collection(db, 'alerts')).id;
        
        let alertMessage = `Critical high risk detected for patient: Blood Pressure ${data.systolicBP}/${data.diastolicBP} mmHg, Blood Sugar ${data.bs} mmol/L.`;
        if (hasSevereSymptoms) {
          alertMessage += ` Active symptoms: ${selectedSymptoms.join(', ')}.`;
        }

        const alertDoc = {
          id: alertId,
          patientId: currentUser.uid,
          riskLevel: isHighRisk ? prediction.riskLevel : 'mid risk', // Elevate to alert
          message: alertMessage,
          acknowledged: false,
          createdAt
        };
        await setDoc(doc(db, 'alerts', alertId), alertDoc);
      }

      setFeedbackModal({
        open: true,
        title: "Assessment Saved",
        content: "Your health details and symptoms have been stored securely. The risk prediction results are available in the side panel.",
        type: "success"
      });

    } catch (err) {
      console.error(err);
      setApiError(err.message || 'The Flask server is currently offline or unreachable. Please check if it is running.');
      setFeedbackModal({
        open: true,
        title: "Connection Failed",
        content: "Failed to connect to the machine learning prediction server. Vitals could not be evaluated at this time.",
        type: "danger"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasSymptomsChecked = Object.values(symptoms).some(v => v);

  return (
    <div className="max-w-4xl mx-auto space-y-8 transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">New Health Assessment</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Input patient vitals below to evaluate maternal health risks using our ML prediction server.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Vitals Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 sm:p-8 rounded-2xl card-shadow transition-colors">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Age */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Patient Age (years)</label>
                <input
                  type="number"
                  {...register('age')}
                  className={`mt-1 block w-full px-4 py-3 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition ${errors.age ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700'}`}
                  placeholder="25"
                />
                {errors.age && <p className="mt-1 text-xs font-semibold text-red-500">{errors.age.message}</p>}
              </div>

              {/* Heart Rate */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Heart Rate (bpm)</label>
                <input
                  type="number"
                  {...register('heartRate')}
                  className={`mt-1 block w-full px-4 py-3 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition ${errors.heartRate ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700'}`}
                  placeholder="72"
                />
                {errors.heartRate && <p className="mt-1 text-xs font-semibold text-red-500">{errors.heartRate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Systolic BP */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  {...register('systolicBP')}
                  className={`mt-1 block w-full px-4 py-3 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition ${errors.systolicBP ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700'}`}
                  placeholder="120"
                />
                {errors.systolicBP && <p className="mt-1 text-xs font-semibold text-red-500">{errors.systolicBP.message}</p>}
              </div>

              {/* Diastolic BP */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  {...register('diastolicBP')}
                  className={`mt-1 block w-full px-4 py-3 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition ${errors.diastolicBP ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700'}`}
                  placeholder="80"
                />
                {errors.diastolicBP && <p className="mt-1 text-xs font-semibold text-red-500">{errors.diastolicBP.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Blood Sugar */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Blood Sugar (mmol/L)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('bs')}
                  className={`mt-1 block w-full px-4 py-3 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition ${errors.bs ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700'}`}
                  placeholder="7.0"
                />
                {errors.bs && <p className="mt-1 text-xs font-semibold text-red-500">{errors.bs.message}</p>}
              </div>

              {/* Body Temp */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Body Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  {...register('bodyTemp')}
                  className={`mt-1 block w-full px-4 py-3 border rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition ${errors.bodyTemp ? 'border-red-300 ring-1 ring-red-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700'}`}
                  placeholder="98.6"
                />
                {errors.bodyTemp && <p className="mt-1 text-xs font-semibold text-red-500">{errors.bodyTemp.message}</p>}
              </div>
            </div>

            {/* Premium Symptoms Checklist */}
            <div className="p-5 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-2">
                <CheckCircle size={16} className="text-health-500" /> Active Symptoms Checklist
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Please check any symptoms currently experienced. These details assist caseworker validation.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { key: 'headache', label: 'Severe / Persistent Headaches' },
                  { key: 'blurredVision', label: 'Blurred Vision or Spot Seeing' },
                  { key: 'swelling', label: 'Sudden Hand, Face or Foot Swelling' },
                  { key: 'abdominalPain', label: 'Severe Abdominal Pain' }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => toggleSymptom(item.key)}
                    className="flex items-center gap-3 p-3 rounded-xl border text-left text-xs font-semibold transition bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-health-400 dark:hover:border-health-500"
                  >
                    {symptoms[item.key] ? (
                      <CheckSquare className="text-health-500 h-5 w-5 shrink-0" />
                    ) : (
                      <Square className="text-slate-400 h-5 w-5 shrink-0" />
                    )}
                    <span className="text-slate-700 dark:text-slate-200 leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-health-100 dark:shadow-none text-sm font-bold text-white bg-health-600 hover:bg-health-700 disabled:opacity-50 transition"
              >
                {loading ? 'Running ML Prediction...' : 'Evaluate Risk Level'}
              </button>
              <button
                type="button"
                onClick={() => { reset(); setResult(null); setApiError(null); setSymptoms({ headache: false, blurredVision: false, swelling: false, abdominalPain: false }); }}
                className="px-4 py-3.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-700 font-bold rounded-xl text-sm transition"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Prediction Results Display Panel */}
        <div className="lg:col-span-5 space-y-6">
          {apiError && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 p-6 rounded-2xl flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-red-800 dark:text-red-400 text-lg">Server Offline</h4>
                <p className="text-xs text-red-600 dark:text-red-400/90 font-semibold mt-2">{apiError}</p>
              </div>
              <button 
                onClick={handleSubmit(onSubmit)} 
                className="w-full py-2.5 bg-red-700 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition"
              >
                Retry Prediction
              </button>
            </div>
          )}

          {result && (
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 sm:p-8 rounded-2xl card-shadow space-y-6 transition-colors">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-health-50 dark:bg-health-950/20 text-health-600 dark:text-health-400 rounded-full flex items-center justify-center mx-auto">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-xs">Prediction Result</h3>
                  <div className="mt-3">
                    <RiskBadge riskLevel={result.riskLevel} />
                  </div>
                </div>
              </div>

              {/* Severe Symptoms warning alert overrides */}
              {hasSymptomsChecked && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-semibold space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle size={14} className="text-amber-600" /> Medical Safety Warning
                  </div>
                  <p className="leading-relaxed">
                    While ML vitals classification is recorded, you reported active high-risk pregnancy symptoms. Please contact your caseworker immediately.
                  </p>
                </div>
              )}

              {/* Confidence Meter */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500 dark:text-slate-400">Confidence Score</span>
                  <span className="text-slate-800 dark:text-slate-100">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-health-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${result.confidence * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Probabilities Breakdown */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Probabilities breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(result.probabilities).map(([risk, prob]) => (
                    <div key={risk} className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-500 dark:text-slate-400 capitalize">{risk}</span>
                      <span className="text-slate-800 dark:text-slate-200">{(prob * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold rounded-xl transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}

          {!result && !apiError && (
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 border-dashed p-8 rounded-2xl text-center space-y-3 flex flex-col items-center justify-center min-h-[300px] transition-colors">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center">
                <ShieldCheck size={20} />
              </div>
              <h4 className="font-semibold text-slate-600 dark:text-slate-300 text-sm">Awaiting Submission</h4>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto">Vitals will be evaluated by the ML classification algorithms upon submission.</p>
            </div>
          )}
        </div>
      </div>

      {/* Reusable modal for system feedback */}
      <Modal
        isOpen={feedbackModal.open}
        onClose={() => setFeedbackModal(prev => ({ ...prev, open: false }))}
        title={feedbackModal.title}
        type={feedbackModal.type}
        footer={
          <button
            onClick={() => setFeedbackModal(prev => ({ ...prev, open: false }))}
            className="px-4 py-2 bg-health-600 hover:bg-health-700 text-white font-bold text-xs rounded-xl transition"
          >
            Acknowledge
          </button>
        }
      >
        <p className="font-medium text-slate-700 dark:text-slate-400">{feedbackModal.content}</p>
      </Modal>
    </div>
  );
}
