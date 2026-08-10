import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Search, Filter, Users, ChevronRight, Clipboard } from 'lucide-react';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Patients() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    async function loadPatients() {
      if (!currentUser) return;
      try {
        setLoading(true);
        
        // 1. Get patient documents assigned to current health worker
        const qAssigned = query(
          collection(db, 'patients'),
          where('assignedHealthWorkerId', '==', currentUser.uid)
        );
        const patientsSnap = await getDocs(qAssigned);
        
        const assigned = [];
        const patientIds = [];
        patientsSnap.forEach((docSnap) => {
          patientIds.push(docSnap.id);
          assigned.push({
            uid: docSnap.id,
            ...docSnap.data()
          });
        });

        // Fetch user profiles for these patients
        const usersMap = {};
        if (patientIds.length > 0) {
          await Promise.all(patientIds.map(async (pid) => {
            const uSnap = await getDoc(doc(db, 'users', pid));
            if (uSnap.exists()) {
              usersMap[pid] = uSnap.data();
            }
          }));
        }

        const assignedWithMeta = assigned.map(p => ({
          ...p,
          name: usersMap[p.uid]?.name || 'Unknown Patient',
          email: usersMap[p.uid]?.email || 'N/A'
        }));

        // 2. Fetch latest risk levels for each patient
        const assignedWithRisk = await Promise.all(assignedWithMeta.map(async (pat) => {
          const q = query(
            collection(db, 'assessments'),
            where('patientId', '==', pat.uid)
          );
          const aSnap = await getDocs(q);
          
          const patAssessments = [];
          aSnap.forEach((aDoc) => {
            patAssessments.push(aDoc.data());
          });
          
          patAssessments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          let latestRisk = 'No assessments';
          if (patAssessments.length > 0) {
            latestRisk = patAssessments[0].riskLevel;
          }
          return { ...pat, latestRisk };
        }));

        setPatients(assignedWithRisk);
      } catch (err) {
        console.error("Error loading patient directories:", err);
      } finally {
        setLoading(false);
      }
    }

    loadPatients();
  }, [currentUser]);

  // Filtering Logic
  const filteredPatients = patients.filter((p) => {
    const nameStr = p.name || '';
    const emailStr = p.email || '';
    const matchesSearch = 
      nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emailStr.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = 
      riskFilter === 'all' || 
      p.latestRisk.toLowerCase().trim() === riskFilter.toLowerCase().trim();

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Users className="text-health-500" /> Patient Directory
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage and monitor health records of patients assigned to you.</p>
        </div>
      </div>

      {/* Search and Filter Panel */}
      <div className="bg-white dark:bg-slate-800 p-4 border border-slate-100 dark:border-slate-700/80 rounded-2xl card-shadow flex flex-col sm:flex-row gap-4 transition-colors">
        <div className="flex-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
            placeholder="Search by patient name or email..."
          />
        </div>
        <div className="sm:w-56 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-slate-400" />
          </div>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
          >
            <option value="all">All Risk Levels</option>
            <option value="high risk">High Risk</option>
            <option value="mid risk">Mid Risk</option>
            <option value="low risk">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl card-shadow overflow-hidden transition-colors">
        {filteredPatients.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500">
            No patients match the search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700/80">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Pregnancy Week</th>
                  <th className="px-6 py-4">Date of Birth</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Emergency Contact</th>
                  <th className="px-6 py-4">Latest Risk</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-600 dark:text-slate-300 font-medium">
                {filteredPatients.map((p) => (
                  <tr key={p.uid} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{p.email}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                      {p.gestationalAge ? `Week ${p.gestationalAge}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{new Date(p.dob).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                    <td className="px-6 py-4">{p.phone}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      <div className="font-bold">{p.emergencyName || 'N/A'}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{p.emergencyPhone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4"><RiskBadge riskLevel={p.latestRisk} /></td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/patient/${p.uid}`} 
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-health-600 hover:bg-health-700 text-white font-bold text-xs shadow-sm shadow-health-100 dark:shadow-none transition animate-pulse-hover"
                      >
                        Details <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
