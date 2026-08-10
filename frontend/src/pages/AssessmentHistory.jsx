import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import RiskBadge from '../components/RiskBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, Activity } from 'lucide-react';

export default function AssessmentHistory() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      if (!currentUser) return;
      try {
        // No orderBy - avoids requiring a Firestore composite index
        const q = query(
          collection(db, 'assessments'),
          where('patientId', '==', currentUser.uid)
        );
        const snap = await getDocs(q);
        const list = [];
        snap.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        // Sort ascending by date for the chart
        list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Table shows newest first
        setAssessments([...list].reverse());

        // Process data for charts
        const formatted = list.map((a) => ({
          date: new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          systolic: a.systolicBP,
          diastolic: a.diastolicBP,
          heartRate: a.heartRate,
          bloodSugar: a.bs,
        }));
        setChartData(formatted);
      } catch (err) {
        console.error("Error fetching history: ", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [currentUser]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8 transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Risk History</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your vital sign trends and AI risk classification predictions over time.</p>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-12 text-center rounded-2xl card-shadow transition-colors">
          <p className="text-slate-400 dark:text-slate-500">No assessments found. Submit a new assessment to see history trends.</p>
        </div>
      ) : (
        <>
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Blood Pressure & Heart Rate Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 rounded-2xl card-shadow space-y-4 transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-md flex items-center gap-2">
                <Activity size={18} className="text-health-500" /> BP & Heart Rate Trends
              </h3>
              <div className="h-72 w-full text-xs">
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
            </div>

            {/* Blood Sugar Chart */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 rounded-2xl card-shadow space-y-4 transition-colors">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-md flex items-center gap-2">
                <Activity size={18} className="text-teal-500" /> Blood Sugar Trends (mmol/L)
              </h3>
              <div className="h-72 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="stroke-slate-100 dark:stroke-slate-700/50" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #f1f5f9' }} />
                    <Legend />
                    <Line type="monotone" dataKey="bloodSugar" name="Fasting Sugar (BS)" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-2xl card-shadow overflow-hidden transition-colors">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center gap-2">
              <Calendar size={18} className="text-slate-500 dark:text-slate-400" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Full Assessment Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/30 text-slate-400 dark:text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700/80">
                    <th className="px-6 py-4">Assessment Date</th>
                    <th className="px-6 py-4">Age</th>
                    <th className="px-6 py-4">Blood Pressure</th>
                    <th className="px-6 py-4">Blood Sugar</th>
                    <th className="px-6 py-4">Heart Rate</th>
                    <th className="px-6 py-4">Body Temp</th>
                    <th className="px-6 py-4">Predicted Risk</th>
                    <th className="px-6 py-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm text-slate-600 dark:text-slate-400 font-medium">
                  {assessments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {new Date(a.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-slate-800 dark:text-slate-100">{a.age} y/o</td>
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
          </div>
        </>
      )}
    </div>
  );
}
