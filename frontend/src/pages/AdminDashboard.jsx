import React, { useEffect, useState } from 'react';
import { db } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';
import { 
  Users, 
  Activity, 
  Bell, 
  ShieldAlert, 
  Trash2, 
  CheckCircle, 
  Calendar, 
  UserCheck, 
  RefreshCw,
  Search
} from 'lucide-react';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPatients: 0,
    totalWorkers: 0,
    totalAssessments: 0,
    totalAlerts: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);

  useEffect(() => {
    async function loadAdminData() {
      try {
        setLoading(true);
        
        // 1. Fetch collections
        const usersSnap = await getDocs(collection(db, 'users'));
        const patientsSnap = await getDocs(collection(db, 'patients'));
        const assessmentsSnap = await getDocs(collection(db, 'assessments'));
        const alertsSnap = await getDocs(query(collection(db, 'alerts'), where('acknowledged', '==', false)));

        const usersList = [];
        let patientCount = 0;
        let workerCount = 0;

        usersSnap.forEach(d => {
          const u = d.data();
          usersList.push(u);
          if (u.role === 'patient') patientCount++;
          if (u.role === 'health_worker') workerCount++;
        });

        // Sort users by name
        usersList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setUsers(usersList);

        setStats({
          totalUsers: usersList.length,
          totalPatients: patientCount,
          totalWorkers: workerCount,
          totalAssessments: assessmentsSnap.size,
          totalAlerts: alertsSnap.size
        });

      } catch (err) {
        console.error("Error loading admin dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [refreshTrigger]);

  async function confirmDeleteUser(user) {
    setUserToDelete(user);
    setModalOpen(true);
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;
    try {
      setDeleting(true);
      
      // Delete user profile document
      await deleteDoc(doc(db, 'users', userToDelete.uid));
      
      // If patient, delete the sub-collection patient document
      if (userToDelete.role === 'patient') {
        await deleteDoc(doc(db, 'patients', userToDelete.uid));
      }

      setModalOpen(false);
      setUserToDelete(null);
      setSuccessModal(true);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error deleting user document:", err);
      setErrorModal(true);
    } finally {
      setDeleting(false);
    }
  }

  // Filtered Users
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  if (loading && users.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-700/80 card-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-200 tracking-tight flex items-center gap-3">
            <ShieldAlert size={28} className="text-red-500" /> Admin Control Dashboard
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Global management portal for users, system metrics, and records.
          </p>
        </div>
        <button 
          onClick={() => setRefreshTrigger(prev => prev + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-semibold text-sm transition"
        >
          <RefreshCw size={16} /> Refresh Metrics
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Registered"
          value={stats.totalUsers}
          icon={<Users size={20} />}
          description="Total active user accounts"
          colorClass="bg-health-50 dark:bg-health-950/20 text-health-500"
        />
        <StatCard 
          title="Pregnant Patients"
          value={stats.totalPatients}
          icon={<Users size={20} />}
          description="Pregnant mothers registered"
          colorClass="bg-teal-50 dark:bg-teal-950/20 text-teal-600"
        />
        <StatCard 
          title="Caseworkers"
          value={stats.totalWorkers}
          icon={<UserCheck size={20} />}
          description="Clinicians, doctors & nurses"
          colorClass="bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500"
        />
        <StatCard 
          title="Vitals Assessments"
          value={stats.totalAssessments}
          icon={<Activity size={20} />}
          description="AI risk predictions run"
          colorClass="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
        />
        <StatCard 
          title="Active Alerts"
          value={stats.totalAlerts}
          icon={<Bell size={20} />}
          description="Pending critical warnings"
          colorClass={stats.totalAlerts > 0 ? "bg-red-50 dark:bg-red-950/20 text-red-600" : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"}
        />
      </div>

      {/* User Management Panel */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl card-shadow overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">System Users Registry</h3>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative rounded-md shadow-sm flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 block w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-health-400 focus:border-transparent transition"
                placeholder="Search name, email, UID..."
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-health-400 focus:border-transparent transition"
            >
              <option value="all">All Roles</option>
              <option value="patient">Patients (Mothers)</option>
              <option value="health_worker">Health Workers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            No registered users found matching the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700/80">
                  <th className="px-6 py-4">Name & Email</th>
                  <th className="px-6 py-4">User ID (UID)</th>
                  <th className="px-6 py-4">Account Role</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-700 dark:text-slate-300 font-medium">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{u.name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400 select-all">{u.uid}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                        u.role === 'admin' 
                          ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300' 
                          : u.role === 'health_worker' 
                          ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300' 
                          : 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                      }`}>
                        {u.role === 'health_worker' ? 'Worker' : u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {u.role === 'patient' && (
                        <a 
                          href={`/patient/${u.uid}`}
                          className="px-3 py-1.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 rounded-lg hover:bg-teal-100 dark:hover:bg-teal-900/40 transition"
                        >
                          View History
                        </a>
                      )}
                      {u.role === 'admin' ? (
                        <span className="text-xs text-slate-400 dark:text-slate-600 italic">System Protected</span>
                      ) : (
                        <button
                          onClick={() => confirmDeleteUser(u)}
                          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition"
                          title="Delete User Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Delete Custom Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm User Account Deletion"
        type="danger"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
              disabled={deleting}
            >
              {deleting ? 'Deleting Document...' : 'Delete Profile'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Are you sure you want to delete the user profile for <span className="font-bold text-red-500 dark:text-red-400">{userToDelete?.name}</span> ({userToDelete?.email})?
          </p>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl text-xs text-red-700 dark:text-red-300">
            <strong>Warning:</strong> Deleting this record removes all associated profile metrics from Cloud Firestore immediately. It does not delete the user account from Firebase Auth. In a production system, this would be tied to a Cloud Function triggered Auth deletion.
          </div>
        </div>
      </Modal>

      {/* Success Modal */}
      <Modal
        isOpen={successModal}
        onClose={() => setSuccessModal(false)}
        title="Account Record Removed"
        type="success"
        footer={
          <button
            onClick={() => setSuccessModal(false)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
          >
            Okay, Close
          </button>
        }
      >
        <p className="font-medium text-slate-700 dark:text-slate-300">
          The Firestore database document for the selected user account has been successfully removed. The user registry registry has been updated.
        </p>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={errorModal}
        onClose={() => setErrorModal(false)}
        title="Operation Failed"
        type="danger"
        footer={
          <button
            onClick={() => setErrorModal(false)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition"
          >
            Okay, Close
          </button>
        }
      >
        <p className="font-medium text-slate-700 dark:text-slate-300">
          Failed to delete user profile. Please verify system role permissions and security rules.
        </p>
      </Modal>
    </div>
  );
}
