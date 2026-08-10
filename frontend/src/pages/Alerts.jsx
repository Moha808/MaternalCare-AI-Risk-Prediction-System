import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { Bell, CheckCircle, AlertTriangle, Calendar, Info } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function Alerts() {
  const { currentUser, userProfile } = useAuth();
  const role = userProfile?.role;
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [feedbackModal, setFeedbackModal] = useState({
    open: false, title: '', content: '', type: 'info'
  });

  useEffect(() => {
    async function loadAlerts() {
      if (!currentUser || !role) return;
      try {
        setLoading(true);

        if (role === 'patient') {
          // --- PATIENT: Show their own alerts ---
          const q = query(
            collection(db, 'alerts'),
            where('patientId', '==', currentUser.uid)
          );
          const alertsSnap = await getDocs(q);
          const list = [];
          alertsSnap.forEach(aDoc => {
            list.push({ id: aDoc.id, patientName: userProfile?.name, ...aDoc.data() });
          });
          
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setAlerts(list);

        } else if (role === 'health_worker') {
          // --- HEALTH WORKER: Show alerts for assigned patients ---
          const qAssigned = query(
            collection(db, 'patients'),
            where('assignedHealthWorkerId', '==', currentUser.uid)
          );
          const patientsSnap = await getDocs(qAssigned);

          const assignedPatientIds = [];
          const patientsMap = {};

          patientsSnap.forEach(pDoc => {
            assignedPatientIds.push(pDoc.id);
            patientsMap[pDoc.id] = { phone: pDoc.data().phone, ...pDoc.data() };
          });

          // Fetch user names for these patients
          if (assignedPatientIds.length > 0) {
            await Promise.all(assignedPatientIds.map(async (pid) => {
              const uSnap = await getDoc(doc(db, 'users', pid));
              if (uSnap.exists()) {
                patientsMap[pid].name = uSnap.data().name;
              }
            }));
          }

          if (assignedPatientIds.length === 0) {
            setAlerts([]);
            return;
          }

          const q = query(
            collection(db, 'alerts'),
            where('acknowledged', '==', false)
          );
          const alertsSnap = await getDocs(q);
          const list = [];
          alertsSnap.forEach(aDoc => {
            const aData = aDoc.data();
            if (assignedPatientIds.includes(aData.patientId)) {
              list.push({
                id: aDoc.id,
                patientName: patientsMap[aData.patientId]?.name || 'Unknown Patient',
                patientPhone: patientsMap[aData.patientId]?.phone,
                ...aData
              });
            }
          });
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setAlerts(list);

        } else if (role === 'admin') {
          // --- ADMIN: Show all unacknowledged alerts system-wide ---
          const q = query(
            collection(db, 'alerts'),
            where('acknowledged', '==', false)
          );
          const alertsSnap = await getDocs(q);
          const patientIds = [];
          const rawAlerts = [];
          alertsSnap.forEach(aDoc => {
            rawAlerts.push({ id: aDoc.id, ...aDoc.data() });
            if (!patientIds.includes(aDoc.data().patientId)) {
              patientIds.push(aDoc.data().patientId);
            }
          });

          // Fetch patient names
          const namesMap = {};
          await Promise.all(patientIds.map(async (pid) => {
            const uSnap = await getDoc(doc(db, 'users', pid));
            if (uSnap.exists()) namesMap[pid] = uSnap.data().name;
          }));

          rawAlerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          setAlerts(rawAlerts.map(a => ({
            ...a,
            patientName: namesMap[a.patientId] || 'Unknown Patient'
          })));
        }
      } catch (err) {
        console.error("Error loading alerts feed:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, [currentUser, role, refreshTrigger]);

  async function acknowledgeAlert(alertId) {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'alerts', alertId), { acknowledged: true });
      setRefreshTrigger(prev => prev + 1);
      setFeedbackModal({
        open: true,
        title: "Alert Acknowledged",
        content: "The high-risk patient alert has been marked as acknowledged and cleared from your dashboard feed.",
        type: "success"
      });
    } catch (err) {
      console.error("Error acknowledging alert: ", err);
      setFeedbackModal({
        open: true,
        title: "Error",
        content: "Failed to acknowledge the selected alert. Please check your network connection and permissions.",
        type: "danger"
      });
      setLoading(false);
    }
  }

  if (loading && alerts.length === 0) {
    return <LoadingSpinner />;
  }

  const isPatient = role === 'patient';

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Bell className="text-red-500 animate-bounce" />
          {isPatient ? 'My Health Alerts' : 'High-Risk Alerts Feed'}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {isPatient
            ? 'Alerts generated by your risk assessment submissions. Contact your caseworker for any high-risk flags.'
            : 'Review active critical alerts for patients assigned to your care.'}
        </p>
      </div>

      {/* Info banner for patient */}
      {isPatient && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 flex items-start gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-blue-700 dark:text-blue-300 leading-relaxed">
            Alerts are automatically generated when your submitted vitals are classified as <strong>High Risk</strong> or when you report active pregnancy symptoms. Acknowledged alerts are removed from this list — only your assigned caseworker can acknowledge them.
          </p>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-12 text-center rounded-2xl card-shadow flex flex-col items-center justify-center space-y-3 transition-colors">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle size={24} />
          </div>
          <h3 className="font-bold text-slate-700 dark:text-slate-200">
            {isPatient ? 'No Active Alerts' : 'All Patient Alerts Acknowledged'}
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm max-w-sm">
            {isPatient
              ? 'You have no active health alerts. Keep submitting your vitals regularly for ongoing monitoring.'
              : 'No new high-risk assessments have been submitted by your assigned patients.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white dark:bg-slate-800 border-l-4 border-red-500 border-y border-r border-slate-200 dark:border-slate-700/80 p-6 rounded-r-2xl card-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition hover:bg-slate-50/50 dark:hover:bg-slate-700/30">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {!isPatient && (
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Patient: {alert.patientName}</h4>
                  )}
                  <RiskBadge riskLevel={alert.riskLevel} />
                  {alert.acknowledged && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 uppercase">Acknowledged</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300 leading-relaxed">{alert.message}</p>
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {new Date(alert.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {!isPatient && alert.patientPhone && <span>Phone: {alert.patientPhone}</span>}
                </div>
              </div>
              {/* Only health workers and admins can acknowledge */}
              {!isPatient && !alert.acknowledged && (
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 font-bold text-xs shadow-sm transition shrink-0"
                >
                  <CheckCircle size={15} /> Acknowledge Alert
                </button>
              )}
            </div>
          ))}
        </div>
      )}

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
            Okay
          </button>
        }
      >
        <p className="font-medium text-slate-700 dark:text-slate-400">{feedbackModal.content}</p>
      </Modal>
    </div>
  );
}
