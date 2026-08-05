import React, { useState } from 'react';
import { 
  Pill, Sparkles, BarChart3, Package, Bell, Flame, CheckCircle, 
  Hourglass, Check, Calendar, Download, RefreshCw, UserCheck, KeyRound, 
  Send, MessageSquare, Clock, ShieldCheck, HeartPulse, User
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
  const [activeTab, setActiveTab] = useState('protocol'); // 'protocol', 'reminders', 'doctor', 'adherence', 'fullscript'
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ name: '', dob: '' });
  const [chatInput, setChatInput] = useState('');
  
  // Custom Reminder Schedule Times
  const [reminderTimes, setReminderTimes] = useState({
    morning: '08:00 AM',
    midday: '12:00 PM',
    evening: '06:00 PM',
    bedtime: '09:00 PM'
  });

  const patient = patients.find(p => p.id === currentPatientId) || patients[0];

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
            confetti({ particleCount: 45, spread: 65, origin: { y: 0.75 } });
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

  const handleSendDoctorMessage = (textToSend = null) => {
    const msgText = textToSend || chatInput;
    if (!msgText.trim() || !patient) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: 'patient',
      senderName: patient.name,
      text: msgText.trim(),
      timestamp: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    const updatedMessages = [...(patient.doctorMessages || []), newMsg];
    const updatedPatient = {
      ...patient,
      doctorMessages: updatedMessages
    };

    onUpdatePatient(updatedPatient);
    if (!textToSend) setChatInput('');
  };

  const handlePatientLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginForm.name.trim() || !loginForm.dob.trim()) return;

    const existing = patients.find(p => 
      p.name.toLowerCase().trim() === loginForm.name.toLowerCase().trim() ||
      p.dob.trim() === loginForm.dob.trim()
    );

    if (existing) {
      onSelectPatient(existing.id);
    } else {
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
        practitionerName: 'Dr. Luba Vitti',
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
        ],
        doctorMessages: [
          { id: 'm-1', sender: 'doctor', senderName: 'Dr. Luba Vitti', text: `Welcome ${loginForm.name}! I am reviewing your intake. Feel free to leave me a message here.`, timestamp: 'Just now' }
        ]
      };
      onAddPatient(newP);
    }

    setShowLoginModal(false);
    setLoginForm({ name: '', dob: '' });
  };

  const handleTestNotification = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('WellnessBuddy Dose Reminder 💊', {
          body: `Hi ${patient ? patient.name : 'Patient'}! It is time for your scheduled supplement dose.`,
          icon: '/favicon.ico'
        });
      } else {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('WellnessBuddy Reminders Enabled! 🔔', {
              body: 'You will receive timely push alerts for your daily supplement protocol.'
            });
            setNotificationsAllowed(true);
          }
        });
      }
    } else {
      alert('Dose Reminder: Time for your daily supplement dose!');
    }
  };

  const hasSupplements = patient && patient.supplements && patient.supplements.length > 0;
  const completedDoses = patient ? (patient.supplements || []).filter(s => s.completedToday).length : 0;
  const totalDoses = patient ? (patient.supplements || []).length : 0;

  return (
    <div class="w-full max-w-lg mx-auto bg-[#F8FAFC] min-h-[760px] rounded-3xl sm:rounded-[36px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans relative my-2">
      
      {/* Mobile Top Header Banner */}
      <div class="bg-[#2F4858] text-white px-5 pt-4 pb-3 flex items-center justify-between shadow-sm select-none">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-xl bg-[#4E878C] flex items-center justify-center text-sm font-bold shadow-inner">
            💊
          </div>
          <div>
            <h1 class="font-extrabold text-sm tracking-wide text-white">WellnessBuddy Patient App</h1>
            <p class="text-[10px] text-emerald-300 font-medium flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Connected w/ Doctor
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowLoginModal(true)}
          title="Patient Switch / Login Profile"
          class="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-700/80 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-slate-600 transition-all shadow-sm"
        >
          <UserCheck class="w-3.5 h-3.5" />
          <span class="text-[11px]">{patient ? patient.name.split(' ')[0] : 'Profile'}</span>
        </button>
      </div>

      {/* Main Scrollable App Container */}
      <div class="flex-1 overflow-y-auto px-4 sm:px-5 pt-4 pb-24">
        
        {/* Patient Greeting & Status Header */}
        <div class="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-200/80 mb-4 flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold text-[#1E293B] tracking-tight">
              {getGreeting()}, <br />
              <span class="text-[#2F4858] font-extrabold">{patient ? patient.name : 'Patient'}</span>
            </h2>
            <p class="text-[11px] font-semibold text-slate-400 mt-0.5">
              DOB: {patient ? patient.dob : 'N/A'} • Goal: {patient ? patient.primaryGoal : 'Health Optimization'}
            </p>
          </div>

          <div class="text-right">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {patient ? patient.status : 'Active'}
            </span>
            <p class="text-[10px] text-slate-400 mt-1 font-mono">
              Dr. {patient ? patient.practitionerName || 'Luba Vitti' : 'Luba Vitti'}
            </p>
          </div>
        </div>

        {/* Quick Stat Bar: Active Streak & Doses Completed */}
        <div class="grid grid-cols-2 gap-3 mb-4">
          <div class="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Streak</span>
              <span class="text-lg font-extrabold text-slate-900 mt-0.5 block">
                {patient ? patient.activeStreak : 0} Days 🔥
              </span>
            </div>
            <Flame class="w-6 h-6 text-sky-500 fill-sky-400" />
          </div>

          <div class="bg-white rounded-2xl p-3.5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Doses</span>
              <span class="text-lg font-extrabold text-slate-900 mt-0.5 block">
                {completedDoses} of {totalDoses}
              </span>
            </div>
            <CheckCircle class="w-6 h-6 text-emerald-500 fill-emerald-100" />
          </div>
        </div>

        {/* TAB 1: PROTOCOL SCHEDULE & CHECKLIST */}
        {activeTab === 'protocol' && (
          <div class="space-y-4">
            
            {/* PRACTITIONER GUIDANCE Banner */}
            <div class="bg-gradient-to-br from-white to-sky-50/60 rounded-3xl p-4 shadow-sm border border-sky-100">
              <div class="flex items-center justify-between mb-1.5">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-[#4E878C]">
                  PRACTITIONER GUIDANCE NOTE
                </span>
                <span class="text-[11px] font-bold text-[#2F4858]">
                  Dr. {patient ? patient.practitionerName || 'Luba Vitti' : 'Luba Vitti'}
                </span>
              </div>
              <p class="text-xs italic text-slate-700 leading-relaxed font-medium">
                "{patient ? patient.guidanceNote : 'Waiting for doctor to update guidance.'}"
              </p>
            </div>

            {/* Daily Supplement Checklist */}
            <div>
              <div class="flex items-center justify-between mb-2.5">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Supplement Checklist</h3>
                
                <div class="flex space-x-1.5">
                  <button
                    onClick={() => exportRegimenPDF(patient)}
                    class="text-[11px] font-bold text-[#4E878C] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1"
                  >
                    <Download class="w-3 h-3" /> PDF
                  </button>
                  <button
                    onClick={() => exportRegimenText(patient)}
                    class="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg"
                  >
                    Text
                  </button>
                </div>
              </div>

              {!hasSupplements ? (
                <div class="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200/80 my-2 flex flex-col items-center">
                  <div class="w-14 h-14 rounded-full bg-slate-100 text-[#4E878C] flex items-center justify-center mb-3 border border-slate-200">
                    <Hourglass class="w-7 h-7 animate-pulse" />
                  </div>
                  <h3 class="text-base font-bold text-slate-900 mb-1">Waiting for Doctor Prescription</h3>
                  <p class="text-xs text-slate-500 leading-relaxed max-w-xs">
                    Your practitioner is reviewing your intake. Once prescribed, your personalized supplement doses and times will display here.
                  </p>
                  <button
                    onClick={() => setActiveTab('doctor')}
                    class="mt-4 px-4 py-2 bg-[#2F4858] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <MessageSquare class="w-3.5 h-3.5 text-emerald-300" />
                    <span>Message Dr. Vitti</span>
                  </button>
                </div>
              ) : (
                <div class="space-y-3">
                  {patient.supplements.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleToggleDose(s.id)}
                      class={`p-4 rounded-3xl border transition-all cursor-pointer shadow-sm flex items-center justify-between ${
                        s.completedToday
                          ? 'bg-emerald-50/90 border-emerald-300'
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
                          <p class="text-[10px] text-slate-400 mt-0.5 font-medium">
                            ⏰ {s.scheduledTime || '08:00 AM'} • {s.timing || 'Empty Stomach'}
                          </p>
                          <p class="text-[11px] italic text-slate-600 mt-1">
                            "{s.instructions}"
                          </p>
                        </div>
                      </div>

                      <span class={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        s.completedToday ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {s.completedToday ? 'Taken ✓' : 'Due'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: REMINDERS & NOTIFICATION SCHEDULE */}
        {activeTab === 'reminders' && (
          <div class="space-y-4">
            <div class="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-10 h-10 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center flex-shrink-0">
                  <Bell class="w-5 h-5" />
                </div>
                <div>
                  <h3 class="font-bold text-sm text-slate-900">Dose Push Alerts & Reminders</h3>
                  <p class="text-xs text-slate-500">Configure your daily supplement notifications</p>
                </div>
              </div>

              <div class="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 mb-4 flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-slate-800 block">Push Notifications</span>
                  <span class="text-[10px] text-slate-400">
                    {notificationsAllowed ? 'Enabled — Daily alerts active' : 'Click to enable local push reminders'}
                  </span>
                </div>

                <button
                  onClick={handleTestNotification}
                  class={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    notificationsAllowed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#2F4858] text-white hover:bg-slate-700'
                  }`}
                >
                  {notificationsAllowed ? 'Active ✓' : 'Enable'}
                </button>
              </div>

              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                DAILY REMINDER TIME SLOTS
              </span>

              <div class="grid grid-cols-2 gap-3">
                <div class="p-3 bg-white border border-slate-200 rounded-2xl">
                  <span class="text-[10px] font-bold text-slate-400 block">🌅 Morning Wake-Up</span>
                  <input
                    type="text"
                    value={reminderTimes.morning}
                    onChange={(e) => setReminderTimes({ ...reminderTimes, morning: e.target.value })}
                    class="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-1.5 mt-1"
                  />
                </div>

                <div class="p-3 bg-white border border-slate-200 rounded-2xl">
                  <span class="text-[10px] font-bold text-slate-400 block">☀️ Midday / Lunch</span>
                  <input
                    type="text"
                    value={reminderTimes.midday}
                    onChange={(e) => setReminderTimes({ ...reminderTimes, midday: e.target.value })}
                    class="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-1.5 mt-1"
                  />
                </div>

                <div class="p-3 bg-white border border-slate-200 rounded-2xl">
                  <span class="text-[10px] font-bold text-slate-400 block">🌇 Evening / Dinner</span>
                  <input
                    type="text"
                    value={reminderTimes.evening}
                    onChange={(e) => setReminderTimes({ ...reminderTimes, evening: e.target.value })}
                    class="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-1.5 mt-1"
                  />
                </div>

                <div class="p-3 bg-white border border-slate-200 rounded-2xl">
                  <span class="text-[10px] font-bold text-slate-400 block">🌙 Bedtime</span>
                  <input
                    type="text"
                    value={reminderTimes.bedtime}
                    onChange={(e) => setReminderTimes({ ...reminderTimes, bedtime: e.target.value })}
                    class="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-1.5 mt-1"
                  />
                </div>
              </div>

              <button
                onClick={handleTestNotification}
                class="w-full mt-4 py-2.5 bg-[#4E878C] hover:bg-[#3B7A72] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Bell class="w-3.5 h-3.5 text-emerald-200" />
                <span>Test Dose Push Notification Now</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CONNECT WITH DOCTOR / MESSAGING */}
        {activeTab === 'doctor' && (
          <div class="space-y-3">
            {/* Doctor Profile Header */}
            <div class="bg-[#2F4858] text-white rounded-3xl p-4 shadow-md flex items-center justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-11 h-11 rounded-2xl bg-[#4E878C] text-white flex items-center justify-center font-bold text-lg border border-emerald-400/40">
                  🩺
                </div>
                <div>
                  <h3 class="font-bold text-sm text-white">Dr. {patient ? patient.practitionerName || 'Luba Vitti' : 'Luba Vitti'}</h3>
                  <p class="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                    <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Prescribing Practitioner • Online
                  </p>
                </div>
              </div>

              <span class="text-[10px] bg-slate-700 px-2.5 py-1 rounded-full text-slate-300 font-mono">Encrypted</span>
            </div>

            {/* Doctor Guidance Note Card */}
            <div class="bg-amber-50 rounded-2xl p-3 border border-amber-200 text-xs">
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block mb-0.5">
                CURRENT DOCTOR GUIDANCE NOTE
              </span>
              <p class="italic text-amber-900 font-medium">
                "{patient ? patient.guidanceNote : 'No guidance note set.'}"
              </p>
            </div>

            {/* Quick Action Preset Message Buttons */}
            <div class="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => handleSendDoctorMessage('Hi Dr. Vitti, I took my morning dose! Everything feels great.')}
                class="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl whitespace-nowrap shadow-sm"
              >
                👍 Log Morning Dose
              </button>
              <button
                onClick={() => handleSendDoctorMessage('Should I take my supplement before or after eating?')}
                class="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl whitespace-nowrap shadow-sm"
              >
                ❓ Food Timing Question
              </button>
              <button
                onClick={() => handleSendDoctorMessage('Requesting a quick protocol review for my current supplements.')}
                class="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold rounded-xl whitespace-nowrap shadow-sm"
              >
                📋 Protocol Review
              </button>
            </div>

            {/* Chat Messages Thread */}
            <div class="bg-white rounded-3xl p-4 border border-slate-200 min-h-[300px] max-h-[380px] overflow-y-auto space-y-3 flex flex-col justify-end shadow-inner">
              {!patient || !patient.doctorMessages || patient.doctorMessages.length === 0 ? (
                <div class="text-center text-xs text-slate-400 py-8 italic">
                  No messages yet. Send a question to Dr. Vitti below!
                </div>
              ) : (
                patient.doctorMessages.map((msg) => {
                  const isDoctor = msg.sender === 'doctor';
                  return (
                    <div
                      key={msg.id}
                      class={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}
                    >
                      <span class="text-[10px] font-bold text-slate-400 mb-1 px-1">
                        {isDoctor ? `Dr. ${patient.practitionerName || 'Luba Vitti'}` : 'You'} • {msg.timestamp}
                      </span>
                      <div class={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${
                        isDoctor
                          ? 'bg-[#2F4858] text-white rounded-tl-none shadow-sm'
                          : 'bg-[#4E878C] text-white rounded-tr-none shadow-sm'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input Box */}
            <div class="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Ask Dr. Vitti a question or symptom update..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendDoctorMessage();
                }}
                class="flex-1 p-3 bg-white border border-slate-300 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4E878C] shadow-sm"
              />
              <button
                onClick={() => handleSendDoctorMessage()}
                class="p-3 bg-[#2F4858] hover:bg-slate-700 text-white rounded-2xl shadow-sm transition-all flex-shrink-0"
              >
                <Send class="w-4 h-4 text-emerald-300" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: ADHERENCE ANALYTICS */}
        {activeTab === 'adherence' && (
          <div class="space-y-4">
            <div class="bg-[#2F4858] text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
              <span class="text-[10px] font-extrabold uppercase tracking-widest text-slate-300 block mb-1">
                YOUR ADHERENCE SCORE
              </span>
              <div class="flex items-baseline space-x-3">
                <span class="text-4xl font-extrabold tracking-tight">
                  {patient ? patient.adherenceRate : 100}%
                </span>
                <span class="text-xs font-semibold text-emerald-400">Consistent Compliance</span>
              </div>

              <div class="w-full bg-slate-700 h-1.5 rounded-full my-4 overflow-hidden">
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

            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              LAST 7 DAYS ADHERENCE LOG
            </span>

            <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
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
                  <div key={idx} class="flex flex-col items-center space-y-1.5">
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

            <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
              RECENT DOSE LOG HISTORY
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

        {/* TAB 5: FULLSCRIPT & REGIMEN EXPORT */}
        {activeTab === 'fullscript' && (
          <div class="space-y-4">
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center">
              <Package class="w-12 h-12 text-[#2F4858] mx-auto mb-3" />
              <h4 class="font-bold text-sm text-slate-900 mb-1">Refill Supplement Supply</h4>
              <p class="text-xs text-slate-500 mb-4">
                Clinical grade supplement ordering via your practitioner's Fullscript portal.
              </p>
              
              <div class="space-y-2.5">
                <button
                  onClick={() => exportRegimenPDF(patient)}
                  class="w-full py-3 bg-[#2F4858] hover:bg-slate-700 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Download class="w-4 h-4 text-emerald-300" />
                  <span>Download Printable PDF Regimen</span>
                </button>

                <button
                  onClick={() => exportRegimenText(patient)}
                  class="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition-all border border-slate-300"
                >
                  Export Formatted Text Regimen
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* BOTTOM PATIENT APP NAVIGATION BAR */}
      <div class="absolute bottom-2 left-3 right-3 bg-white/95 backdrop-blur-md rounded-3xl p-1.5 shadow-xl border border-slate-200/90 flex items-center justify-around z-30">
        <button
          onClick={() => setActiveTab('protocol')}
          class={`flex flex-col items-center py-1.5 px-2.5 rounded-2xl transition-all ${
            activeTab === 'protocol'
              ? 'bg-[#EFF2F5] text-[#2F4858] font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Pill class="w-5 h-5 mb-0.5" />
          <span class="text-[10px]">Protocol</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          class={`flex flex-col items-center py-1.5 px-2.5 rounded-2xl transition-all ${
            activeTab === 'reminders'
              ? 'bg-[#EFF2F5] text-[#2F4858] font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Bell class="w-5 h-5 mb-0.5" />
          <span class="text-[10px]">Reminders</span>
        </button>

        <button
          onClick={() => setActiveTab('doctor')}
          class={`flex flex-col items-center py-1.5 px-2.5 rounded-2xl transition-all relative ${
            activeTab === 'doctor'
              ? 'bg-[#EFF2F5] text-[#2F4858] font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageSquare class="w-5 h-5 mb-0.5" />
          <span class="text-[10px]">Doctor</span>
          {patient && patient.doctorMessages && patient.doctorMessages.length > 0 && (
            <span class="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('adherence')}
          class={`flex flex-col items-center py-1.5 px-2.5 rounded-2xl transition-all ${
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
          class={`flex flex-col items-center py-1.5 px-2.5 rounded-2xl transition-all ${
            activeTab === 'fullscript'
              ? 'bg-[#EFF2F5] text-[#2F4858] font-bold shadow-inner'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Package class="w-5 h-5 mb-0.5" />
          <span class="text-[10px]">Refills</span>
        </button>
      </div>

      {/* PATIENT LOGIN MODAL */}
      {showLoginModal && (
        <div class="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm p-6 flex items-center justify-center">
          <div class="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-slate-100 text-left">
            <div class="flex items-center space-x-2 text-[#2F4858] font-bold text-base mb-2">
              <KeyRound class="w-5 h-5 text-[#4E878C]" />
              <span>Patient Profile Login</span>
            </div>
            <p class="text-xs text-slate-500 mb-4">
              Enter your Name & Date of Birth to log into your patient account.
            </p>

            <form onSubmit={handlePatientLoginSubmit} class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. James Bond"
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
                  Log In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
