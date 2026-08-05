import React, { useState } from 'react';
import { 
  Pill, Sparkles, BarChart3, Package, Bell, Flame, CheckCircle, 
  Hourglass, Check, Calendar, Download, RefreshCw, UserCheck, KeyRound, ShieldAlert 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportRegimenPDF, exportRegimenText } from '../lib/pdfExporter';

export default function PatientApp({ 
  patients, 
  currentPatientId, 
  onSelectPatient, 
  onUpdatePatient, 
  onAddPatient 
}) {
  const [activeTab, setActiveTab] = useState('protocol'); // 'protocol', 'supplements', 'adherence', 'fullscript'
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: '', dob: '' });

  const patient = patients.find(p => p.id === currentPatientId) || patients[0];

  // Helper for greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleToggleDose = (suppId) => {
    if (!patient || !patient.supplements) return;

    const updatedSupps = patient.supplements.map(s => {
      if (s.id === suppId) {
        const nextState = !s.completedToday;
        if (nextState) {
          try {
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
          } catch (e) {}
        }
        return { ...s, completedToday: nextState };
      }
      return s;
    });

    const completedCount = updatedSupps.filter(s => s.completedToday).length;
    const totalCount = updatedSupps.length;
    const isAllDone = totalCount > 0 && completedCount === totalCount;
    const newStreak = isAllDone ? Math.max(patient.activeStreak || 0, 1) : patient.activeStreak;
    const newAdh = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Add log item
    const toggledItem = updatedSupps.find(s => s.id === suppId);
    const newLog = {
      timestamp: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      action: `${toggledItem.completedToday ? 'Took' : 'Unchecked'} ${toggledItem.name}`
    };

    const updatedPatient = {
      ...patient,
      supplements: updatedSupps,
      dosesCompletedToday: completedCount,
      totalDosesToday: totalCount,
      activeStreak: newStreak,
      adherenceRate: newAdh,
      historyLogs: [newLog, ...(patient.historyLogs || []).slice(0, 15)]
    };

    onUpdatePatient(updatedPatient);
  };

  const handlePatientLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginForm.name.trim() || !loginForm.dob.trim()) return;

    // Search if patient exists by DOB & Name
    const existing = patients.find(p => 
      p.name.toLowerCase().trim() === loginForm.name.toLowerCase().trim() ||
      p.dob.trim() === loginForm.dob.trim()
    );

    if (existing) {
      onSelectPatient(existing.id);
    } else {
      // Create new patient automatically and sync
      const newP = {
        id: `p-${Date.now()}`,
        name: loginForm.name,
        dob: loginForm.dob,
        email: `${loginForm.name.toLowerCase().replace(/\s+/g, '.')}@wellnessclient.com`,
        status: 'Pending Intake',
        isNew: true,
        primaryGoal: 'Optimize peak vitality & health',
        reportedSymptoms: 'New patient registration',
        currentSupplements: 'None',
        guidanceNote: 'Waiting for your practitioner to prescribe your custom protocol.',
        practitionerName: 'Luba Vitti',
        adherenceRate: 0,
        activeStreak: 0,
        dosesCompletedToday: 0,
        totalDosesToday: 0,
        supplements: [],
        adherenceLog: [
          { day: 'W', completed: false, date: '2026-07-29' },
          { day: 'T', completed: false, date: '2026-07-30' },
          { day: 'F', completed: false, date: '2026-07-31' },
          { day: 'S', completed: false, date: '2026-08-01' },
          { day: 'S', completed: false, date: '2026-08-02' },
          { day: 'M', completed: false, date: '2026-08-03' },
          { day: 'T', completed: false, date: '2026-08-04' }
        ],
        historyLogs: [
          { timestamp: 'Just now', action: 'Patient logged in & initialized intake' }
        ]
      };
      onAddPatient(newP);
    }

    setShowLoginModal(false);
    setLoginForm({ name: '', dob: '' });
  };

  const hasSupplements = patient && patient.supplements && patient.supplements.length > 0;
  const completedDoses = patient ? (patient.supplements || []).filter(s => s.completedToday).length : 0;
  const totalDoses = patient ? (patient.supplements || []).length : 0;

  return (
    <div class="max-w-md mx-auto min-h-[750px] bg-[#F4F6F8] rounded-[40px] shadow-2xl border-[8px] border-slate-900 overflow-hidden flex flex-col font-sans relative my-4">
      
      {/* Dynamic Mobile Island / Notch */}
      <div class="bg-black text-white px-6 pt-3 pb-2 flex items-center justify-between text-xs font-semibold select-none">
        <span class="text-xs">8:40</span>
        <div class="w-24 h-4 bg-black rounded-full border border-slate-800 flex items-center justify-center space-x-1">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <div class="flex items-center space-x-1 text-[10px]">
          <span>5G+</span>
          <span class="bg-red-500 text-white text-[9px] px-1 rounded font-bold">14</span>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div class="flex-1 overflow-y-auto px-5 pt-4 pb-24">
        
        {/* Header Greeting Bar */}
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-2xl font-bold text-[#1E293B] tracking-tight">
              {getGreeting()}, <br />
              <span class="text-[#2F4858] font-extrabold">{patient ? patient.name : 'James Charles'}</span>
            </h2>
            <p class="text-xs font-semibold text-slate-400 mt-0.5">
              DOB: {patient ? patient.dob : 'Test'}
            </p>
          </div>

          <button
            onClick={() => setShowLoginModal(true)}
            title="Patient Login / Switch Profile"
            class="w-10 h-10 rounded-full bg-[#2F4858] text-white flex items-center justify-center shadow-md hover:bg-slate-700 transition-all border border-slate-600"
          >
            <UserCheck class="w-5 h-5 text-emerald-300" />
          </button>
        </div>

        {/* Enable Notification Banner (matching IMG_9240.PNG) */}
        <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 mb-4 flex items-center justify-between space-x-3">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
              <Bell class="w-5 h-5" />
            </div>
            <div>
              <h4 class="font-bold text-xs text-slate-900 leading-tight">Enable Pill & Prescription Notifications</h4>
              <p class="text-[10px] text-slate-400 mt-0.5 leading-snug">
                Tap Allow to get push alerts when your medicine is due
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setNotificationsAllowed(!notificationsAllowed);
              if (!notificationsAllowed && 'Notification' in window) {
                Notification.requestPermission();
              }
            }}
            class={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex-shrink-0 ${
              notificationsAllowed
                ? 'bg-emerald-600 text-white'
                : 'bg-[#2F4858] text-white hover:bg-slate-700'
            }`}
          >
            {notificationsAllowed ? 'Allowed ✓' : 'Allow'}
          </button>
        </div>

        {/* Quick Stat Cards: Active Streak & Doses Completed (matching IMG_9240.PNG) */}
        <div class="grid grid-cols-2 gap-3 mb-5">
          <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-400 block">Active Streak</span>
              <span class="text-xl font-extrabold text-slate-900 mt-1 block">
                {patient ? patient.activeStreak : 0} Days
              </span>
            </div>
            <Flame class="w-6 h-6 text-sky-500 fill-sky-400" />
          </div>

          <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-400 block">Doses Completed</span>
              <span class="text-xl font-extrabold text-slate-900 mt-1 block">
                {completedDoses} of {totalDoses}
              </span>
            </div>
            <CheckCircle class="w-6 h-6 text-emerald-500 fill-emerald-100" />
          </div>
        </div>

        {/* PRACTITIONER GUIDANCE Box (matching IMG_9240.PNG) */}
        <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 mb-5">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              PRACTITIONER GUIDANCE
            </span>
            <span class="text-[11px] font-semibold text-[#4E878C]">
              Practitioner {patient ? patient.practitionerName || 'Luba Vitti' : 'Luba Vitti'}
            </span>
          </div>
          <p class="text-xs italic text-slate-700 leading-relaxed font-medium">
            "{patient ? patient.guidanceNote : 'Waiting for your practitioner to prescribe your custom protocol.'}"
          </p>
        </div>

        {/* TAB 1: PROTOCOL VIEW */}
        {activeTab === 'protocol' && (
          <div>
            {!hasSupplements ? (
              /* Waiting for Practitioner State (matching IMG_9240.PNG) */
              <div class="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200/80 my-4 flex flex-col items-center">
                <div class="w-16 h-16 rounded-full bg-slate-100 text-[#4E878C] flex items-center justify-center mb-4 border border-slate-200">
                  <Hourglass class="w-8 h-8 animate-pulse" />
                </div>
                <h3 class="text-lg font-bold text-slate-900 mb-2">Waiting for your Practitioner</h3>
                <p class="text-xs text-slate-500 leading-relaxed max-w-xs">
                  Your practitioner is reviewing your Date of Birth and health intake. Once your custom protocol is prescribed, your daily regimen, timing schedule, and reminders will pop up here live.
                </p>
              </div>
            ) : (
              /* Active Daily Supplement Protocol Checklist */
              <div class="space-y-3">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Today's Regimen Schedule</h3>
                  
                  <div class="flex space-x-2">
                    <button
                      onClick={() => exportRegimenPDF(patient)}
                      class="text-[11px] font-bold text-[#4E878C] bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Download class="w-3 h-3" /> PDF
                    </button>
                    <button
                      onClick={() => exportRegimenText(patient)}
                      class="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg"
                    >
                      Text
                    </button>
                  </div>
                </div>

                {patient.supplements.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleToggleDose(s.id)}
                    class={`p-4 rounded-3xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${
                      s.completedToday
                        ? 'bg-emerald-50/80 border-emerald-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div class="flex items-center space-x-3.5 pr-2">
                      <div class={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        s.completedToday
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {s.completedToday && <Check class="w-4 h-4 stroke-[3]" />}
                      </div>

                      <div>
                        <h4 class={`font-bold text-xs ${s.completedToday ? 'text-emerald-900 line-through' : 'text-slate-900'}`}>
                          {s.name}
                        </h4>
                        <p class="text-[10px] text-slate-400 mt-0.5">
                          {s.scheduledTime || 'Morning'} • {s.timing || 'Empty Stomach'}
                        </p>
                        <p class="text-[11px] italic text-slate-600 mt-1">
                          "{s.instructions}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUPPLEMENTS HUB (matching IMG_9241.PNG) */}
        {activeTab === 'supplements' && (
          <div>
            <div class="text-center mb-4">
              <h3 class="text-lg font-bold text-slate-900">Supplements Hub</h3>
            </div>

            {/* Banner card */}
            <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 mb-5">
              <div class="flex items-center space-x-2 text-[#4E878C] font-bold text-base mb-1">
                <Sparkles class="w-5 h-5 fill-[#4E878C]/20" />
                <span>Supplements & Regimens</span>
              </div>
              <p class="text-xs text-slate-500 leading-snug">
                Detailed breakdown of your custom supplement stack prescribed by your practitioner.
              </p>
            </div>

            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
              PRESCRIBED SUPPLEMENT STACK
            </span>

            {!hasSupplements ? (
              <div class="bg-white rounded-3xl p-6 text-center text-xs text-slate-400 border border-slate-200">
                No supplements currently prescribed in your stack.
              </div>
            ) : (
              <div class="space-y-3">
                {patient.supplements.map((s) => (
                  <div key={s.id} class="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="font-bold text-xs text-slate-900">{s.name}</h4>
                        <p class="text-[10px] text-slate-400 mt-0.5">
                          {s.manufacturer || 'Empower Pharma'} • {s.frequency}
                        </p>
                      </div>
                      <span class="bg-[#EFF2F5] text-slate-700 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-slate-300/60">
                        {s.timing || 'Empty Stomach'}
                      </span>
                    </div>

                    <div class="mt-2.5 bg-slate-50 rounded-xl p-2.5 text-[11px] italic text-slate-700 border border-slate-200/60">
                      "{s.instructions}"
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: COMPLIANCE ANALYTICS / ADHERENCE (matching IMG_9242.PNG) */}
        {activeTab === 'adherence' && (
          <div>
            <div class="text-center mb-4">
              <h3 class="text-lg font-bold text-slate-900">Compliance Analytics</h3>
            </div>

            {/* Dark Rate Card (matching IMG_9242.PNG) */}
            <div class="bg-[#2F4858] text-white rounded-3xl p-6 shadow-md mb-5 relative overflow-hidden">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 block mb-1">
                REGIMEN ADHERENCE RATE
              </span>
              <div class="flex items-baseline space-x-3">
                <span class="text-4xl font-extrabold tracking-tight">
                  {patient ? patient.adherenceRate : 100}%
                </span>
                <span class="text-xs font-semibold text-emerald-400">Consistent</span>
              </div>

              {/* Flame icon */}
              <div class="absolute right-5 top-5 w-12 h-12 rounded-full bg-slate-700/50 flex items-center justify-center">
                <Flame class="w-6 h-6 text-sky-400 fill-sky-400" />
              </div>

              <div class="w-full bg-slate-700 h-1 rounded-full my-4 overflow-hidden">
                <div 
                  class="bg-sky-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${patient ? patient.adherenceRate : 100}%` }}
                ></div>
              </div>

              <div class="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span class="flex items-center gap-1">
                  ⚡ {patient ? patient.activeStreak : 0}-Day Active Streak
                </span>
                <span class="text-slate-400">Target: 95%+</span>
              </div>
            </div>

            {/* 7-Day Visual Log Dots (matching IMG_9242.PNG) */}
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              LAST 7 DAYS ADHERENCE LOG
            </span>

            <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 mb-5">
              <div class="flex items-center justify-between text-center px-1">
                {(patient ? patient.adherenceLog : [
                  { day: 'W', completed: true },
                  { day: 'T', completed: true },
                  { day: 'F', completed: true },
                  { day: 'S', completed: true },
                  { day: 'S', completed: true },
                  { day: 'M', completed: true },
                  { day: 'T', completed: true }
                ]).map((log, idx) => (
                  <div key={idx} class="flex flex-col items-center space-y-2">
                    <span class="text-xs font-bold text-slate-400">{log.day}</span>
                    <div class={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      log.completed
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {log.completed ? '✓' : '–'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Log History */}
            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              RECENT LOG HISTORY
            </span>

            <div class="space-y-2">
              {!patient || !patient.historyLogs || patient.historyLogs.length === 0 ? (
                <div class="bg-white rounded-2xl p-4 text-center text-xs text-slate-400 border border-slate-200">
                  No log history recorded yet.
                </div>
              ) : (
                patient.historyLogs.map((log, i) => (
                  <div key={i} class="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/80 flex items-center justify-between text-xs">
                    <span class="font-medium text-slate-800">{log.action}</span>
                    <span class="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: FULLSCRIPT */}
        {activeTab === 'fullscript' && (
          <div>
            <div class="text-center mb-4">
              <h3 class="text-lg font-bold text-slate-900">Fullscript Supplement Portal</h3>
            </div>

            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center">
              <Package class="w-12 h-12 text-[#2F4858] mx-auto mb-3" />
              <h4 class="font-bold text-sm text-slate-900 mb-1">Refill Supplement Supply</h4>
              <p class="text-xs text-slate-500 mb-4">
                Direct integration with your practitioner's Fullscript dispensary store for clinical grade ordering.
              </p>
              
              <div class="space-y-2">
                <button
                  onClick={() => exportRegimenPDF(patient)}
                  class="w-full py-3 bg-[#2F4858] hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
                >
                  Download Printable Regimen (PDF)
                </button>
                <button
                  onClick={() => exportRegimenText(patient)}
                  class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all border border-slate-300"
                >
                  Export Formatted Text Summary
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM FLOATING NAVIGATION BAR (matching all 3 mobile screenshots!) */}
      <div class="absolute bottom-3 left-4 right-4 bg-white/95 backdrop-blur-md rounded-3xl p-1.5 shadow-xl border border-slate-200/80 flex items-center justify-around z-30">
        <button
          onClick={() => setActiveTab('protocol')}
          class={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all ${
            activeTab === 'protocol'
              ? 'bg-[#EFF2F5] text-[#2F4858] font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Pill class="w-5 h-5 mb-0.5" />
          <span class="text-[10px]">Protocol</span>
        </button>

        <button
          onClick={() => setActiveTab('supplements')}
          class={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all ${
            activeTab === 'supplements'
              ? 'bg-[#EFF2F5] text-[#2F4858] font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles class="w-5 h-5 mb-0.5" />
          <span class="text-[10px]">Supplements</span>
        </button>

        <button
          onClick={() => setActiveTab('adherence')}
          class={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all ${
            activeTab === 'adherence'
              ? 'bg-[#EFF2F5] text-[#2F4858] font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart3 class="w-5 h-5 mb-0.5" />
          <span class="text-[10px]">Adherence</span>
        </button>

        <button
          onClick={() => setActiveTab('fullscript')}
          class={`flex flex-col items-center py-2 px-3 rounded-2xl transition-all ${
            activeTab === 'fullscript'
              ? 'bg-[#EFF2F5] text-[#2F4858] font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package class="w-5 h-5 mb-0.5" />
          <span class="text-[10px]">Fullscript</span>
        </button>
      </div>

      {/* PATIENT LOGIN / INTAKE MODAL */}
      {showLoginModal && (
        <div class="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-6 flex items-center justify-center">
          <div class="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-slate-100 text-left">
            <div class="flex items-center space-x-2 text-[#2F4858] font-bold text-base mb-2">
              <KeyRound class="w-5 h-5 text-[#4E878C]" />
              <span>Patient Login / Intake</span>
            </div>
            <p class="text-xs text-slate-500 mb-4">
              Enter your Name & Date of Birth to log into your profile or initialize a new intake.
            </p>

            <form onSubmit={handlePatientLoginSubmit} class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. James Bond or peter c"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm({ ...loginForm, name: e.target.value })}
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Date of Birth (DOB)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1985-06-15"
                  value={loginForm.dob}
                  onChange={(e) => setLoginForm({ ...loginForm, dob: e.target.value })}
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                />
              </div>

              <div class="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  class="px-3 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 bg-[#2F4858] text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Log In & Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
