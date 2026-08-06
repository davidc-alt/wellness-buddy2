import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import PractitionerDashboard from './components/PractitionerDashboard';
import PatientApp from './components/PatientApp';
import { 
  INITIAL_PATIENTS, 
  fetchStateFromSupabase, 
  saveStateToSupabase 
} from './lib/supabase';

export default function App() {
  // Default to practitioner view for desktop web dashboard
  const [activeView, setActiveView] = useState('practitioner');
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState(null);

  // Synchronize state to Supabase Cloud Storage (Encrypted)
  const syncToCloud = useCallback(async (updatedPatients) => {
    setIsSyncing(true);
    const success = await saveStateToSupabase(updatedPatients);
    if (success) {
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }
    setIsSyncing(false);
  }, []);

  // Fetch initial state from Supabase on mount
  useEffect(() => {
    async function loadCloudData() {
      setIsSyncing(true);
      const cloudData = await fetchStateFromSupabase();
      if (cloudData && Array.isArray(cloudData)) {
        setPatients(cloudData);
        if (cloudData.length > 0) {
          setSelectedPatientId(prev => prev || cloudData[0].id);
        }
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
      setIsSyncing(false);
    }
    loadCloudData();
  }, []);

  // Background Polling Loop for Instant Realtime Sync between Patient & Practitioner (every 2.5 sec)
  useEffect(() => {
    const interval = setInterval(async () => {
      const remoteData = await fetchStateFromSupabase();
      if (remoteData && Array.isArray(remoteData)) {
        setPatients(prevPatients => {
          if (JSON.stringify(remoteData) !== JSON.stringify(prevPatients)) {
            if (remoteData.length > 0 && (!selectedPatientId || !remoteData.some(p => p.id === selectedPatientId))) {
              setSelectedPatientId(remoteData[0].id);
            }
            setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
            return remoteData;
          }
          return prevPatients;
        });
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedPatientId]);

  const handleUpdatePatient = (updatedPatient) => {
    const newPatientsList = patients.map(p => 
      p.id === updatedPatient.id ? updatedPatient : p
    );
    setPatients(newPatientsList);
    syncToCloud(newPatientsList);
  };

  const handleAddPatient = (newPatient) => {
    const newPatientsList = [...patients, newPatient];
    setPatients(newPatientsList);
    setSelectedPatientId(newPatient.id);
    syncToCloud(newPatientsList);
  };

  const handleDeletePatient = (patientId) => {
    const remaining = patients.filter(p => p.id !== patientId);
    setPatients(remaining);
    if (selectedPatientId === patientId && remaining.length > 0) {
      setSelectedPatientId(remaining[0].id);
    }
    syncToCloud(remaining);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const remoteData = await fetchStateFromSupabase();
    if (remoteData && Array.isArray(remoteData)) {
      setPatients(remoteData);
    } else {
      await saveStateToSupabase(patients);
    }
    setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setIsSyncing(false);
  };

  return (
    <div class="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      
      {/* Show Top Web Navbar ONLY when in Practitioner or Dual Mode */}
      {activeView !== 'patient' && (
        <Navbar 
          activeView={activeView}
          setActiveView={setActiveView}
          isSyncing={isSyncing}
          onManualSync={handleManualSync}
          lastSyncedTime={lastSyncedTime}
        />
      )}

      {/* Main Container */}
      <main class="flex-1 w-full">
        
        {/* VIEW 1: NATIVE PATIENT APP (PURE MOBILE EXPERIENCE, ZERO WEB WRAPPER) */}
        {activeView === 'patient' && (
          <PatientApp 
            patients={patients}
            currentPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            onUpdatePatient={handleUpdatePatient}
            onAddPatient={handleAddPatient}
            onSwitchToPractitioner={() => setActiveView('practitioner')}
          />
        )}

        {/* VIEW 2: PRACTITIONER WEBSITE ONLY (DESKTOP VIEW) */}
        {activeView === 'practitioner' && (
          <div class="p-4 sm:p-6 lg:p-8">
            <PractitionerDashboard 
              patients={patients}
              selectedPatientId={selectedPatientId}
              onSelectPatient={setSelectedPatientId}
              onUpdatePatient={handleUpdatePatient}
              onAddPatient={handleAddPatient}
              onDeletePatient={handleDeletePatient}
            />
          </div>
        )}

        {/* VIEW 3: DUAL LIVE VIEW (FOR SIDE-BY-SIDE TESTING) */}
        {activeView === 'dual' && (
          <div class="max-w-[1600px] mx-auto p-4 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div class="xl:col-span-7">
              <PractitionerDashboard 
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onUpdatePatient={handleUpdatePatient}
                onAddPatient={handleAddPatient}
                onDeletePatient={handleDeletePatient}
              />
            </div>
            <div class="xl:col-span-5 flex flex-col items-center">
              <div class="w-full max-w-md bg-white rounded-2xl p-2 mb-3 border border-slate-200 shadow-sm flex items-center justify-between px-4 text-xs font-bold text-slate-700">
                <span>Patient App Preview</span>
                <span class="text-emerald-600">Live Sync Active</span>
              </div>
              <div class="w-full max-w-md rounded-[36px] overflow-hidden border-[8px] border-slate-900 shadow-2xl bg-white min-h-[750px]">
                <PatientApp 
                  patients={patients}
                  currentPatientId={selectedPatientId}
                  onSelectPatient={setSelectedPatientId}
                  onUpdatePatient={handleUpdatePatient}
                  onAddPatient={handleAddPatient}
                />
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer shown ONLY in Practitioner or Dual Mode */}
      {activeView !== 'patient' && (
        <footer class="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 font-medium">
          WellnessBuddy Encrypted Prescription & Compliance System • Powered by Supabase Storage
        </footer>
      )}

    </div>
  );
}
