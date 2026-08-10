import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, setDoc } from 'firebase/firestore';
import { User, Mail, Calendar, Phone, Home, Shield, AlertCircle, CheckCircle2, Clipboard } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const role = userProfile?.role;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // General fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Patient fields
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [gestationalAge, setGestationalAge] = useState('');
  const [assignedHealthWorkerId, setAssignedHealthWorkerId] = useState('');

  const [healthWorkers, setHealthWorkers] = useState([]);

  useEffect(() => {
    async function loadProfileData() {
      if (!currentUser) return;
      try {
        setFetching(true);
        // Load general user data
        setName(userProfile?.name || '');
        setEmail(userProfile?.email || '');

        if (role === 'patient') {
          // Load patient details
          const patientRef = doc(db, 'patients', currentUser.uid);
          const patientSnap = await getDoc(patientRef);
          if (patientSnap.exists()) {
            const data = patientSnap.data();
            setDob(data.dob || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            setEmergencyName(data.emergencyName || '');
            setEmergencyPhone(data.emergencyPhone || '');
            setGestationalAge(data.gestationalAge || '');
            setAssignedHealthWorkerId(data.assignedHealthWorkerId || '');
          }

          // Fetch health workers list
          const q = query(collection(db, 'users'), where('role', '==', 'health_worker'));
          const snap = await getDocs(q);
          const workers = [];
          snap.forEach((doc) => {
            workers.push({ uid: doc.id, ...doc.data() });
          });
          setHealthWorkers(workers);
        }
      } catch (err) {
        console.error("Error loading profile: ", err);
        setError("Failed to load profile data.");
      } finally {
        setFetching(false);
      }
    }

    loadProfileData();
  }, [currentUser, role, userProfile]);

  async function handleUpdate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 1. Update user name in 'users' collection
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, { name });

      // 2. Update patient details in 'patients' collection if role is patient
      if (role === 'patient') {
        const patientRef = doc(db, 'patients', currentUser.uid);
        const ga = parseInt(gestationalAge);
        if (isNaN(ga) || ga < 1 || ga > 42) {
          setError('Gestational age must be a valid number of weeks (1 to 42)');
          setLoading(false);
          return;
        }

        // Use setDoc with merge: true in case the patient document doesn't exist yet
        await setDoc(patientRef, {
          uid: currentUser.uid,
          dob,
          phone,
          address,
          emergencyName,
          emergencyPhone,
          gestationalAge: ga,
          assignedHealthWorkerId
        }, { merge: true });
      }

      await refreshProfile(currentUser.uid);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      console.error("Error updating profile: ", err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 transition-colors duration-300">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">My Profile</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your account information and preferences.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 p-6 sm:p-8 rounded-2xl card-shadow transition-colors">
        <form onSubmit={handleUpdate} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/20 p-4 border border-red-100 dark:border-red-900/50 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-red-700 dark:text-red-300 leading-snug">{error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-4 border border-emerald-100 dark:border-emerald-900/50 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 leading-snug">{success}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Full Name</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                  placeholder="Jane Doe"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Email Address (Read-Only)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  disabled
                  value={email}
                  className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Role (Read-Only) */}
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Account Role (Read-Only)</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Shield className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  disabled
                  value={
                    role === 'admin' 
                      ? 'System Administrator' 
                      : role === 'health_worker' 
                      ? 'Health Worker (Doctor/Nurse)' 
                      : 'Patient (Pregnant Mother)'
                  }
                  className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Patient Specific Fields */}
          {role === 'patient' && (
            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-700/80">
              <h3 className="text-md font-bold text-health-600 dark:text-health-400">Patient Medical Profile</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* DOB */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Date of Birth</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* Gestational Age */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Pregnancy Week</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clipboard className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="42"
                      required
                      value={gestationalAge}
                      onChange={(e) => setGestationalAge(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                      placeholder="e.g. 24"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                      placeholder="+1 (555) 019-2834"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Residential Address</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Home className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                      placeholder="123 Main St, City"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Emergency Contact Name */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Emergency Contact Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                      placeholder="John Doe (Spouse)"
                    />
                  </div>
                </div>

                {/* Emergency Contact Phone */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Emergency Contact Phone</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                      placeholder="+1 (555) 012-3456"
                    />
                  </div>
                </div>
              </div>

              {/* Assigned Health Worker selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Select Assigned Health Worker</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <select
                    value={assignedHealthWorkerId}
                    onChange={(e) => setAssignedHealthWorkerId(e.target.value)}
                    className="pl-10 block w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-health-400 dark:focus:ring-health-500 focus:border-transparent transition"
                  >
                    <option value="">-- No Assigned Worker --</option>
                    {healthWorkers.map((hw) => (
                      <option key={hw.uid} value={hw.uid}>
                        Dr./Nurse {hw.name} ({hw.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-health-100 dark:shadow-none text-sm font-bold text-white bg-health-600 hover:bg-health-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-health-500 disabled:opacity-50 transition"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
