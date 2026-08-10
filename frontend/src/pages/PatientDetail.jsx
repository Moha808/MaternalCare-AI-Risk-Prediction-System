import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, User, Phone, Home, Activity, Plus, ArrowLeft, Clipboard, ShieldAlert } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function PatientDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  // Appointment Form fields
  const [appDate, setAppDate] = useState('');
  const [appNotes, setAppNotes] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Custom Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('info');
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  useEffect(() => {
    async function loadPatientDetails() {
      if (!id) return;
      try {
        setLoading(true);

        // 1. Get user meta & patient profile
        const userSnap = await getDoc(doc(db, 'users', id));
        const patientSnap = await getDoc(doc(db, 'patients', id));

        if (!userSnap.exists() || !patientSnap.exists()) {
          console.error("Patient files not found");
          return;
        }

        setPatientProfile({
          uid: id,
          name: userSnap.data().name,
          email: userSnap.data().email,
          ...patientSnap.data()
        });

        // 2. Fetch assessments
        const assessmentsQuery = query(
          collection(db, 'assessments'),
          where('patientId', '==', id)
        );
        const aSnap = await getDocs(assessmentsQuery);
        const list = [];
        aSnap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() });
        });
        
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // ascending

        setAssessments([...list].reverse()); // Newest first for list

        const formatted = list.map((a) => ({
          date: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          systolic: a.systolicBP,
          diastolic: a.diastolicBP,
          heartRate: a.heartRate,
          bloodSugar: a.bs,
        }));
        setChartData(formatted);

        // 3. Fetch appointments
        const appQuery = query(
          collection(db, 'appointments'),
          where('patientId', '==', id),
          orderBy('date', 'desc')
        );
        const appSnap = await getDocs(appQuery);
        const appList = [];
        appSnap.forEach((doc) => {
          appList.push({ id: doc.id, ...doc.data() });
        });
        setAppointments(appList);

      } catch (err) {
        console.error("Error loading patient details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPatientDetails();
  }, [id, refreshTrigger]);

  function showAlert(title, content, type = 'info') {
    setModalTitle(title);
    setModalContent(content);
    setModalType(type);
    setModalOpen(true);
  }

  // Create new appointment for patient
  async function handleCreateAppointment(e) {
    e.preventDefault();
    if (!appDate || !appNotes) {
      return showAlert("Input Validation", "Please select a consultation date and add details.", "warning");
    }
    
    try {
      setSubmittingApp(true);
      
      const appDoc = {
        patientId: id,
        healthWorkerId: currentUser.uid,
        date: appDate,
        notes: appNotes,
        status: 'scheduled',
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'appointments'), appDoc);
      
      // Reset form & reload
      setAppDate('');
      setAppNotes('');
      showAlert("Consultation Scheduled", "The consultation has been successfully booked and recorded in the system timeline.", "success");
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error saving appointment:", err);
      showAlert("Authorization Error", "Failed to book consultation. Please check system access permissions.", "danger");
    } finally {
      setSubmittingApp(false);
    }
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!patientProfile) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/80 card-shadow max-w-md mx-auto transition-colors">
        <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Patient Not Found</h3>
        <p className="text-slate-400 dark:text-slate-500 mt-2">Could not retrieve files for patient ID: {id}</p>
        <Link to="/patients" className="mt-4 inline-block text-sm font-bold text-health-600 dark:text-health-500 hover:underline">&larr; Back to Directory</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* Back Header */}
      <div className="flex items-center gap-4">
        <Link to="/patients" className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">{patientProfile.name}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Detailed healthcare profile and assessment history.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Demographics Card */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 rounded-2xl card-shadow space-y-6 self-start transition-colors">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md border-b border-slate-100 dark:border-slate-700/80 pb-3 flex items-center gap-2">
            <User size={18} className="text-health-500" /> Patient Medical File
          </h3>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
            <div>
              <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Email</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 break-all">{patientProfile.email}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Date of Birth</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {new Date(patientProfile.dob).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
              </div>
              <div>
                <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Pregnancy Week</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {patientProfile.gestationalAge ? `${patientProfile.gestationalAge} Weeks` : 'N/A'}
                </span>
              </div>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Phone</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{patientProfile.phone}</span>
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Address</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{patientProfile.address}</span>
            </div>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
              <span className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Emergency Contact</span>
              <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                Name: {patientProfile.emergencyName || 'N/A'}
              </div>
              <div className="font-semibold text-slate-800 dark:text-slate-100 text-xs mt-0.5">
                Phone: {patientProfile.emergencyPhone || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Recharts Vitals Plot */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 rounded-2xl card-shadow space-y-4 transition-colors">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md flex items-center gap-2">
            <Activity size={18} className="text-health-500" /> Historical Vitals Trend
          </h3>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
              No vitals logged yet.
            </div>
          ) : (
            <div className="h-64 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-700/50" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9' }} />
                  <Legend />
                  <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#0e90e9" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#38abf8" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Appointment and Clinical Consult Scheduling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Book Consult Form */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 rounded-2xl card-shadow space-y-4 self-start transition-colors">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md flex items-center gap-2">
            <Calendar size={18} className="text-teal-600 dark:text-teal-400" /> Schedule Consultation
          </h3>
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Consultation Date & Time</label>
              <input
                type="datetime-local"
                required
                value={appDate}
                onChange={(e) => setAppDate(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Clinical Consultation Notes</label>
              <textarea
                required
                rows={3}
                value={appNotes}
                onChange={(e) => setAppNotes(e.target.value)}
                className="mt-1 block w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                placeholder="Prescription dosage, recommendations, or symptoms logged..."
              />
            </div>
            <button
              type="submit"
              disabled={submittingApp}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-teal-50/50 dark:shadow-none text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {submittingApp ? 'Scheduling...' : 'Save Consultation Record'}
            </button>
          </form>
        </div>

        {/* Schedule List */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 rounded-2xl card-shadow space-y-4 transition-colors">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-md flex items-center gap-2">
            <Calendar size={18} className="text-slate-500 dark:text-slate-400" /> Consult Records & Schedule
          </h3>
          {appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
              No historical consult logs or pending schedules recorded.
            </div>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {appointments.map((app) => (
                <div key={app.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500 dark:text-slate-400">
                      Date: {new Date(app.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${app.status === 'scheduled' ? 'bg-health-100 dark:bg-health-950/40 text-health-700 dark:text-health-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-xs font-semibold leading-relaxed">{app.notes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Assessments History table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl card-shadow overflow-hidden transition-colors">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/80">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Assessment History Log</h3>
        </div>
        <div className="overflow-x-auto">
          {assessments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
              No assessments recorded yet.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700/80">
                  <th className="px-6 py-4">Assessment Date</th>
                  <th className="px-6 py-4">Blood Pressure</th>
                  <th className="px-6 py-4">Blood Sugar</th>
                  <th className="px-6 py-4">Heart Rate</th>
                  <th className="px-6 py-4">Body Temp</th>
                  <th className="px-6 py-4">Predicted Risk</th>
                  <th className="px-6 py-4">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-600 dark:text-slate-300 font-medium">
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {new Date(a.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4">{a.systolicBP}/{a.diastolicBP} mmHg</td>
                    <td className="px-6 py-4">{a.bs} mmol/L</td>
                    <td className="px-6 py-4">{a.heartRate} bpm</td>
                    <td className="px-6 py-4">{a.bodyTemp} °F</td>
                    <td className="px-6 py-4"><RiskBadge riskLevel={a.riskLevel} /></td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{(a.confidence * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Custom Alert/Notification Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={modalTitle}
        type={modalType}
        footer={
          <button
            onClick={() => setModalOpen(false)}
            className="px-4 py-2 bg-health-600 hover:bg-health-700 text-white font-bold text-xs rounded-xl transition"
          >
            Acknowledge
          </button>
        }
      >
        <p className="font-medium text-slate-700 dark:text-slate-400">{modalContent}</p>
      </Modal>
    </div>
  );
}
