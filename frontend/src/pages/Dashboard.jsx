import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { Activity, Users, Bell, FileText, Plus, UserPlus, Heart, Thermometer, ShieldAlert, CheckCircle, UserCheck, Calendar } from 'lucide-react';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const { userProfile, currentUser } = useAuth();
  const role = userProfile?.role;
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ riskLevel: 'None', bp: 'N/A', bs: 'N/A', temp: 'N/A', hr: 'N/A' });
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [assignedPatients, setAssignedPatients] = useState([]);
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Patient caseworker & gestational age states
  const [caseworker, setCaseworker] = useState(null);
  const [healthWorkers, setHealthWorkers] = useState([]);
  const [patientWeek, setPatientWeek] = useState('N/A');
  const [caseworkerModalOpen, setCaseworkerModalOpen] = useState(false);
  const [updatingCaseworker, setUpdatingCaseworker] = useState(false);

  // Reusable feedback modal state
  const [feedbackModal, setFeedbackModal] = useState({
    open: false,
    title: '',
    content: '',
    type: 'info'
  });

  useEffect(() => {
    async function loadDashboardData() {
      if (!currentUser || !role) return;
      setLoading(true);
      
      try {
        if (role === 'patient') {
          // --- PATIENT VIEW DATA ---
          // 1. Fetch patient subcollection doc
          const patientRef = doc(db, 'patients', currentUser.uid);
          const patientSnap = await getDoc(patientRef);
          let hwId = "";
          if (patientSnap.exists()) {
            const pData = patientSnap.data();
            hwId = pData.assignedHealthWorkerId || "";
            setPatientWeek(pData.gestationalAge || "N/A");
          }

          // 2. Fetch assigned caseworker details
          if (hwId) {
            const hwSnap = await getDoc(doc(db, 'users', hwId));
            if (hwSnap.exists()) {
              setCaseworker(hwSnap.data());
            } else {
              setCaseworker(null);
            }
          } else {
            setCaseworker(null);
          }

          // 3. Fetch all health workers for caseworker assignment modal
          const hwQuery = query(collection(db, 'users'), where('role', '==', 'health_worker'));
          const hwSnap = await getDocs(hwQuery);
          const workers = [];
          hwSnap.forEach((doc) => {
            workers.push({ uid: doc.id, ...doc.data() });
          });
          setHealthWorkers(workers);

          // 4. Fetch patient's assessments - no orderBy to avoid needing composite index
          const q = query(
            collection(db, 'assessments'),
            where('patientId', '==', currentUser.uid)
          );
          const snap = await getDocs(q);
          const assessmentsList = [];
          snap.forEach((doc) => {
            assessmentsList.push({ id: doc.id, ...doc.data() });
          });
          // Sort in JavaScript - newest first
          assessmentsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const recentFive = assessmentsList.slice(0, 5);
          setRecentAssessments(recentFive);

          // Get last assessment for stats
          if (recentFive.length > 0) {
            const latest = recentFive[0];
            setStats({
              riskLevel: latest.riskLevel,
              bp: `${latest.systolicBP}/${latest.diastolicBP}`,
              bs: `${latest.bs} mmol/L`,
              temp: `${latest.bodyTemp} °F`,
              hr: `${latest.heartRate} bpm`
            });
          } else {
            setStats({
              riskLevel: 'None',
              bp: 'N/A',
              bs: 'N/A',
              temp: 'N/A',
              hr: 'N/A'
            });
          }

        } else if (role === 'health_worker') {
          // --- HEALTH WORKER VIEW DATA ---
          // Fetch ALL patients then filter client-side.
          // This correctly handles assignedHealthWorkerId being '', null, or missing.
          const allPatientsSnap = await getDocs(collection(db, 'patients'));

          const allPatients = [];
          const allPatientIds = [];
          allPatientsSnap.forEach(docSnap => {
            allPatients.push({ uid: docSnap.id, ...docSnap.data() });
            allPatientIds.push(docSnap.id);
          });

          // Fetch user metadata for all patient IDs to filter out deleted users
          const usersMap = {};
          if (allPatientIds.length > 0) {
            await Promise.all(allPatientIds.map(async (pid) => {
              const uSnap = await getDoc(doc(db, 'users', pid));
              if (uSnap.exists()) {
                usersMap[pid] = uSnap.data();
              }
            }));
          }

          // Only include patients whose user account still exists
          const validPatients = allPatients.filter(p => usersMap[p.uid] !== undefined);

          // Split into assigned-to-me vs unassigned (empty, null, or missing field)
          const assigned = validPatients
            .filter(p => p.assignedHealthWorkerId === currentUser.uid)
            .map(p => ({
              ...p,
              name: usersMap[p.uid]?.name || 'Unknown Patient',
              email: usersMap[p.uid]?.email || 'N/A'
            }));

          const unassigned = validPatients
            .filter(p => !p.assignedHealthWorkerId || p.assignedHealthWorkerId === '')
            .map(p => ({
              ...p,
              name: usersMap[p.uid]?.name || 'Unknown Patient',
              email: usersMap[p.uid]?.email || 'N/A'
            }));

          // Fetch latest risk levels for assigned patients
          const assignedWithRisk = await Promise.all(assigned.map(async (pat) => {
            const q = query(
              collection(db, 'assessments'),
              where('patientId', '==', pat.uid)
            );
            const aSnap = await getDocs(q);
            
            const patAssessments = [];
            aSnap.forEach((aDoc) => {
              patAssessments.push(aDoc.data());
            });
            
            // Sort by createdAt desc in JavaScript to avoid composite index requirement
            patAssessments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            let latestRisk = 'No assessments';
            let latestDate = null;
            if (patAssessments.length > 0) {
              latestRisk = patAssessments[0].riskLevel;
              latestDate = patAssessments[0].createdAt;
            }
            
            return { ...pat, latestRisk, latestDate };
          }));

          setAssignedPatients(assignedWithRisk);
          setUnassignedPatients(unassigned);

          // Fetch unacknowledged alerts for assigned patients
          let activeAlerts = 0;
          if (assigned.length > 0) {
            const assignedIds = assigned.map(p => p.uid);
            const alertsSnap = await getDocs(
              query(collection(db, 'alerts'), where('acknowledged', '==', false))
            );
            alertsSnap.forEach(aDoc => {
              if (assignedIds.includes(aDoc.data().patientId)) activeAlerts++;
            });
          }
          setAlertCount(activeAlerts);
        }
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser, role, refreshTrigger]);

  // Unified router for administrator dashboard
  if (role === 'admin') {
    return <AdminDashboard />;
  }

  // Claim patient action for health worker
  async function claimPatient(patientId) {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'patients', patientId), {
        assignedHealthWorkerId: currentUser.uid
      });
      setRefreshTrigger(prev => prev + 1);
      setFeedbackModal({
        open: true,
        title: "Patient Claimed",
        content: "You have successfully assigned this patient to your care. You will now receive their vital reports and critical alerts.",
        type: "success"
      });
    } catch (err) {
      console.error("Error claiming patient: ", err);
      setFeedbackModal({
        open: true,
        title: "Claim Failed",
        content: "Could not claim patient. Please check system roles and permissions.",
        type: "danger"
      });
      setLoading(false);
    }
  }

  // Select caseworker action for patient
  async function handleAssignCaseworker(workerId) {
    try {
      setUpdatingCaseworker(true);
      const patientRef = doc(db, 'patients', currentUser.uid);
      await updateDoc(patientRef, {
        assignedHealthWorkerId: workerId
      });
      setCaseworkerModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
      setFeedbackModal({
        open: true,
        title: "Caseworker Updated",
        content: workerId 
          ? "Your assigned caseworker has been updated successfully. They can now view your risk logs."
          : "Caseworker assignment removed successfully.",
        type: "success"
      });
    } catch (err) {
      console.error("Error setting caseworker:", err);
      setFeedbackModal({
        open: true,
        title: "Operation Failed",
        content: "Failed to update caseworker. Please verify connection and try again.",
        type: "danger"
      });
    } finally {
      setUpdatingCaseworker(false);
    }
  }

  if (loading && recentAssessments.length === 0 && assignedPatients.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      {/* Header card */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700/80 card-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            Welcome back, {userProfile?.name}!
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {role === 'patient' 
              ? 'Your maternal health risk summary and AI vitals analysis.' 
              : 'Monitor your assigned patients and system alerts.'}
          </p>
        </div>
        {role === 'patient' && (
          <Link 
            to="/assessment/new" 
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-health-600 text-white font-bold hover:bg-health-700 shadow-md shadow-health-100 dark:shadow-none transition"
          >
            <Plus size={18} /> New Assessment
          </Link>
        )}
      </div>

      {/* Patient Specific UI */}
      {role === 'patient' && (
        <div className="space-y-8">
                    {/* Educational Banner */}
          <div className="bg-health-50 dark:bg-health-950/20 border border-health-100 dark:border-health-900/50 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="p-3 bg-health-100 dark:bg-health-900/50 text-health-600 dark:text-health-400 rounded-xl shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-health-800 dark:text-health-300">How Maternal Risk Prediction Works</h3>
              <p className="text-xs text-health-700 dark:text-health-400 mt-1 leading-relaxed max-w-4xl">
                This system uses a clinical Machine Learning model to evaluate your daily vitals. It automatically cross-references your blood pressure, blood sugar, heart rate, and temperature against modern maternal health thresholds to flag early signs of complications like <strong>Preeclampsia</strong> or <strong>Gestational Diabetes</strong>. 
                <br/><br/>
                <em>Note: "High Risk" generates an instant alert to your assigned caseworker for immediate clinical review.</em>
              </p>
            </div>
          </div>

          {/* Caseworker Assignment Card */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-5 rounded-2xl card-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${caseworker ? 'bg-health-50 dark:bg-health-950/20 text-health-500' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'}`}>
                {caseworker ? <UserCheck size={24} /> : <UserPlus size={24} />}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">
                  {caseworker ? `Assigned Caseworker: Dr./Nurse ${caseworker.name}` : 'No Healthcare Caseworker Assigned'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xl">
                  {caseworker 
                    ? `Contact: ${caseworker.email} | Receives your vital assessment logs automatically.` 
                    : 'Assign a health worker to review your AI-predicted pregnancy risk logs.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setCaseworkerModalOpen(true)}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl transition shrink-0 ${
                caseworker 
                  ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600' 
                  : 'bg-health-600 text-white hover:bg-health-700 shadow-sm shadow-health-100 dark:shadow-none'
              }`}
            >
              {caseworker ? 'Change Caseworker' : 'Assign Caseworker'}
            </button>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard 
              title="Maternal Risk Level"
              value={stats.riskLevel}
              icon={<ShieldAlert size={20} />}
              description={stats.riskLevel !== 'None' ? 'AI Triage Classification' : 'No vitals submitted yet'}
              colorClass={stats.riskLevel === 'high risk' ? 'bg-red-50 dark:bg-red-950/20 text-red-600' : stats.riskLevel === 'mid risk' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'}
            />
            <StatCard 
              title="Pregnancy Week"
              value={patientWeek !== 'N/A' ? `${patientWeek} Weeks` : 'N/A'}
              icon={<Calendar size={20} />}
              description="Current gestational age"
              colorClass="bg-teal-50 dark:bg-teal-950/20 text-teal-600"
            />
            <StatCard 
              title="Maternal BP"
              value={stats.bp}
              icon={<Activity size={20} />}
              description="Systolic / Diastolic mmHg"
              colorClass="bg-health-50 dark:bg-health-950/20 text-health-500"
            />
            <StatCard 
              title="Blood Sugar"
              value={stats.bs}
              icon={<Activity size={20} />}
              description="Gestational diabetes check"
              colorClass="bg-teal-50 dark:bg-teal-950/20 text-teal-600"
            />
            <StatCard 
              title="Resting Heart Rate"
              value={stats.hr}
              icon={<Heart size={20} />}
              description="Maternal cardiac monitoring"
              colorClass="bg-red-50 dark:bg-red-950/20 text-red-500"
            />
          </div>

          {/* Recent History Table */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl card-shadow overflow-hidden transition-colors">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Recent Assessments</h3>
              <Link to="/assessment/history" className="text-sm font-semibold text-health-600 dark:text-health-500 hover:text-health-700 dark:hover:text-health-400 transition">
                View Full History
              </Link>
            </div>
            
            {recentAssessments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                <p className="text-sm">You haven't run any health risk predictions yet.</p>
                <Link to="/assessment/new" className="mt-4 inline-block text-sm font-bold text-health-600 dark:text-health-500 hover:underline">
                  Create your first assessment &rarr;
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700/80">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Blood Pressure</th>
                      <th className="px-6 py-4">Blood Sugar</th>
                      <th className="px-6 py-4">Heart Rate</th>
                      <th className="px-6 py-4">Temp</th>
                      <th className="px-6 py-4">Risk Level</th>
                      <th className="px-6 py-4">Confidence</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-600 dark:text-slate-400 font-medium">
                    {recentAssessments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                          {new Date(a.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
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
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Worker Specific UI */}
      {role === 'health_worker' && (
        <div className="space-y-8">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard 
              title="Assigned Patients"
              value={assignedPatients.length}
              icon={<Users size={20} />}
              description="Active patients under your care"
              colorClass="bg-health-50 dark:bg-health-950/20 text-health-500"
            />
            <StatCard 
              title="Active Alerts"
              value={alertCount}
              icon={<Bell size={20} />}
              description="High risk notifications pending action"
              colorClass={alertCount > 0 ? "bg-red-50 dark:bg-red-950/20 text-red-600" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"}
            />
            <StatCard 
              title="Unassigned Patients"
              value={unassignedPatients.length}
              icon={<UserPlus size={20} />}
              description="Mothers awaiting caseworker claim"
              colorClass="bg-amber-50 dark:bg-amber-950/20 text-amber-600"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Assigned Patients Directory */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl card-shadow overflow-hidden lg:col-span-2 transition-colors">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">My Patients Directory</h3>
                <Link to="/patients" className="text-sm font-semibold text-health-600 dark:text-health-400 hover:text-health-700 dark:hover:text-health-300 transition">
                  Search All
                </Link>
              </div>

              {assignedPatients.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                  <p className="text-sm">You haven't assigned any patients to yourself yet.</p>
                  <p className="text-xs mt-1">Claim an unassigned patient from the panel on the right.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700/80">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Latest Risk</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {assignedPatients.map((pat) => (
                        <tr key={pat.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 dark:text-slate-100">{pat.name}</div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">{pat.email}</div>
                          </td>
                          <td className="px-6 py-4 text-xs">{pat.phone}</td>
                          <td className="px-6 py-4"><RiskBadge riskLevel={pat.latestRisk} /></td>
                          <td className="px-6 py-4 text-right">
                            <Link 
                              to={`/patient/${pat.uid}`} 
                              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-health-50 dark:hover:bg-health-950/20 hover:text-health-600 dark:hover:text-health-400 text-xs font-bold transition"
                            >
                              Open Profile
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Unassigned Patients Claiming Section */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl card-shadow overflow-hidden transition-colors">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/80">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Unassigned Mothers</h3>
              </div>
              
              {unassignedPatients.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                  No new unassigned patients registered.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {unassignedPatients.map((p) => (
                    <div key={p.uid} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition flex items-center justify-between">
                      <div className="min-w-0 pr-3">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100 truncate text-sm">{p.name}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{p.email}</span>
                      </div>
                      <button
                        onClick={() => claimPatient(p.uid)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-health-50 dark:bg-health-950/20 text-health-600 dark:text-health-400 hover:bg-health-100 dark:hover:bg-health-950/40 text-xs font-bold transition shrink-0"
                      >
                        <Plus size={14} /> Claim
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select Caseworker Modal for Patients */}
      <Modal
        isOpen={caseworkerModalOpen}
        onClose={() => setCaseworkerModalOpen(false)}
        title="Choose System Caseworker"
        type="confirm"
        footer={
          <button
            onClick={() => setCaseworkerModalOpen(false)}
            className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            disabled={updatingCaseworker}
          >
            Cancel
          </button>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-300 font-medium text-xs">
            Select a doctor or nurse to monitor your daily vital reports, receive high-risk alerts, and schedule consultations.
          </p>
          
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 border border-slate-100 dark:border-slate-700 rounded-xl pr-1">
            <div className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/20">
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">Unassigned</span>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Remove assigned worker</p>
              </div>
              <button
                onClick={() => handleAssignCaseworker("")}
                disabled={updatingCaseworker || !caseworker}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 font-bold text-[10px] rounded-lg transition disabled:opacity-50"
              >
                Clear
              </button>
            </div>
            
            {healthWorkers.length === 0 ? (
              <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                No healthcare workers are currently registered.
              </div>
            ) : (
              healthWorkers.map((hw) => {
                const isCurrent = caseworker?.uid === hw.uid;
                return (
                    <div key={hw.uid} className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <div className="min-w-0 pr-3">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs block truncate">Dr./Nurse {hw.name}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">{hw.email}</span>
                      </div>
                      <button
                        onClick={() => handleAssignCaseworker(hw.uid)}
                        disabled={updatingCaseworker || isCurrent}
                        className={`px-3 py-1 font-bold text-[10px] rounded-lg transition ${
                          isCurrent 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 cursor-default'
                            : 'bg-health-50 dark:bg-health-950/20 text-health-600 dark:text-health-400 hover:bg-health-100 dark:hover:bg-health-950/40'
                        }`}
                      >
                        {isCurrent ? 'Current' : 'Select'}
                      </button>
                    </div>
                  );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Global Feedback Modal */}
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
