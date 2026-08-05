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
  const [activeView, setActiveView] = useState('dual'); // 'practitioner', 'patient', 'dual'
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedPatientId, setSelectedPatientId] = useState('p-1');
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
      if (cloudData && Array.isArray(cloudData) && cloudData.length > 0) {
        setPatients(cloudData);
        setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } else {
        // First run: Upload initial preloaded state
        await saveStateToSupabase(INITIAL_PATIENTS);
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
        // Compare stringified JSON to detect external updates
        if (JSON.stringify(remoteData) !== JSON.stringify(patients)) {
          setPatients(remoteData);
          setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [patients]);

  // Handler to update a single patient's record
  const handleUpdatePatient = (updatedPatient) => {
    const newPatientsList = patients.map(p => 
      p.id === updatedPatient.id ? updatedPatient : p
    );
    setPatients(newPatientsList);
    syncToCloud(newPatientsList);
  };

  // Handler to add a new patient
  const handleAddPatient = (newPatient) => {
    const newPatientsList = [...patients, newPatient];
    setPatients(newPatientsList);
    setSelectedPatientId(newPatient.id);
    syncToCloud(newPatientsList);
  };

  // Handler to delete a patient
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
    <div class="min-h-screen flex flex-col bg-[#F4F6F8]">
      
      {/* Top Navbar */}
      <Navbar 
        activeView={activeView}
        setActiveView={setActiveView}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        lastSyncedTime={lastSyncedTime}
      />

      {/* Main Views Container */}
      <main class="flex-1 p-2 sm:p-4 lg:p-6">
        
        {/* VIEW 1: PRACTITIONER WEBSITE ONLY */}
        {activeView === 'practitioner' && (
          <PractitionerDashboard 
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={setSelectedPatientId}
            onUpdatePatient={handleUpdatePatient}
            onAddPatient={handleAddPatient}
            onDeletePatient={handleDeletePatient}
          />
        )}

        {/* VIEW 2: PATIENT APP ONLY */}
        {activeView === 'patient' && (
          <div class="py-4">
            <PatientApp 
              patients={patients}
              currentPatientId={selectedPatientId}
              onSelectPatient={setSelectedPatientId}
              onUpdatePatient={handleUpdatePatient}
              onAddPatient={handleAddPatient}
            />
          </div>
        )}

        {/* VIEW 3: DUAL LIVE VIEW (SIDE-BY-SIDE FOR LIVE TESTING) */}
        {activeView === 'dual' && (
          <div class="max-w-[1600px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* Left 7 columns: Practitioner Website */}
            <div class="xl:col-span-7">
              <div class="bg-white rounded-2xl p-2 mb-3 border border-slate-200 shadow-sm flex items-center justify-between px-4 text-xs font-bold text-slate-700">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  Practitioner Live Dashboard
                </span>
                <span class="text-slate-400 font-mono text-[11px]">Syncing with Supabase Bucket</span>
              </div>
              
              <PractitionerDashboard 
                patients={patients}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onUpdatePatient={handleUpdatePatient}
                onAddPatient={handleAddPatient}
                onDeletePatient={handleDeletePatient}
              />
            </div>

            {/* Right 5 columns: Patient App Mobile Device Mockup */}
            <div class="xl:col-span-5 flex flex-col items-center">
              <div class="w-full bg-white rounded-2xl p-2 mb-3 border border-slate-200 shadow-sm flex items-center justify-between px-4 text-xs font-bold text-slate-700 max-w-md">
                <span class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Patient App Device Preview
                </span>
                <span class="text-slate-400 font-mono text-[11px]">Instant Live Sync</span>
              </div>

              <PatientApp 
                patients={patients}
                currentPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onUpdatePatient={handleUpdatePatient}
                onAddPatient={handleAddPatient}
              />
            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer class="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 font-medium">
        WellnessBuddy Encrypted Prescription & Compliance System • Powered by Supabase Storage & AES-256 Client Security
      </footer>

    </div>
  );
}
