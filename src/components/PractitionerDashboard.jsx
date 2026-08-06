import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, History, Save, Zap, Edit3, CheckCircle2, 
  Clock, AlertCircle, FileText, Download, Sparkles, ChevronDown, Search,
  Send, MessageSquare
} from 'lucide-react';
import { exportRegimenPDF, exportRegimenText } from '../lib/pdfExporter';

export default function PractitionerDashboard({ 
  patients, 
  selectedPatientId, 
  onSelectPatient, 
  onUpdatePatient, 
  onAddPatient, 
  onDeletePatient 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [guidanceText, setGuidanceText] = useState('');
  const [isGuidanceSaved, setIsGuidanceSaved] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [editingSupplement, setEditingSupplement] = useState(null);
  const [doctorReplyInput, setDoctorReplyInput] = useState('');

  // Form states for adding/editing a supplement
  const [suppForm, setSuppForm] = useState({
    name: '',
    manufacturer: 'Empower Pharma',
    frequency: 'Daily at Morning Wake-Up',
    recurrence: 'Every 24h',
    timing: 'Empty Stomach',
    instructions: '',
    scheduledTime: '08:00 AM'
  });

  // Form state for new patient
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    dob: '',
    email: '',
    primaryGoal: 'Optimize peak vitality & performance',
    reportedSymptoms: 'Fatigue & Brain Fog',
    currentSupplements: 'Multivitamin'
  });

  // Fallback selectedPatient calculation
  const selectedPatient = patients.find(p => p.id === selectedPatientId) || (patients.length > 0 ? patients[0] : null);

  // Keep guidance text in sync with selected patient
  React.useEffect(() => {
    if (selectedPatient) {
      setGuidanceText(selectedPatient.guidanceNote || '');
      setIsGuidanceSaved(false);
    }
  }, [selectedPatientId, selectedPatient]);

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveGuidance = () => {
    if (!selectedPatient) return;
    const updated = {
      ...selectedPatient,
      guidanceNote: guidanceText
    };
    onUpdatePatient(updated);
    setIsGuidanceSaved(true);
    setTimeout(() => setIsGuidanceSaved(false), 2500);
  };

  const handleSendDoctorReply = () => {
    if (!doctorReplyInput.trim() || !selectedPatient) return;

    const newMsg = {
      id: `m-${Date.now()}`,
      sender: 'doctor',
      senderName: 'Dr. Luba Vitti',
      text: doctorReplyInput.trim(),
      timestamp: `Today at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    const updatedMessages = [...(selectedPatient.doctorMessages || []), newMsg];
    const updatedPatient = {
      ...selectedPatient,
      doctorMessages: updatedMessages
    };

    onUpdatePatient(updatedPatient);
    setDoctorReplyInput('');
  };

  const handleSaveSupplement = (e) => {
    e.preventDefault();
    if (!selectedPatient || !suppForm.name.trim()) return;

    let updatedSupplements = [...(selectedPatient.supplements || [])];
    if (editingSupplement) {
      updatedSupplements = updatedSupplements.map(s => 
        s.id === editingSupplement.id ? { ...suppForm, id: s.id } : s
      );
    } else {
      updatedSupplements.push({
        ...suppForm,
        id: `s-${Date.now()}`,
        completedToday: false
      });
    }

    const updatedPatient = {
      ...selectedPatient,
      supplements: updatedSupplements,
      status: updatedSupplements.length > 0 ? 'Protocol Active' : 'Pending Intake',
      isNew: false
    };

    onUpdatePatient(updatedPatient);
    setShowAddModal(false);
    setEditingSupplement(null);
    setSuppForm({
      name: '',
      manufacturer: 'Empower Pharma',
      frequency: 'Daily at Morning Wake-Up',
      recurrence: 'Every 24h',
      timing: 'Empty Stomach',
      instructions: '',
      scheduledTime: '08:00 AM'
    });
  };

  const handleRemoveSupplement = (suppId) => {
    if (!selectedPatient) return;
    const updatedSupps = selectedPatient.supplements.filter(s => s.id !== suppId);
    onUpdatePatient({
      ...selectedPatient,
      supplements: updatedSupps,
      status: updatedSupps.length > 0 ? 'Protocol Active' : 'Pending Intake'
    });
  };

  const handleApplyPreset = (presetType) => {
    if (!selectedPatient) return;

    let presetSupplements = [];
    if (presetType === 'vitality') {
      presetSupplements = [
        {
          id: `s-${Date.now()}-1`,
          name: 'NAD+ Liposomal Concentrate (2 sprays)',
          manufacturer: 'Empower Pharma',
          frequency: 'Daily at Morning Wake-Up',
          recurrence: 'Every 24h',
          timing: 'Empty Stomach',
          instructions: 'Administer 1 spray per nostril on empty stomach immediately upon waking.',
          scheduledTime: '07:00 AM',
          completedToday: false
        },
        {
          id: `s-${Date.now()}-2`,
          name: 'BPC-157 Oral Supplement (500 mcg)',
          manufacturer: 'Tailor Made Compounding',
          frequency: '5 Days On / 2 Days Off',
          recurrence: 'Every 24h',
          timing: 'Empty Stomach',
          instructions: 'Take 1 capsule 30 mins before breakfast for gut lining & recovery.',
          scheduledTime: '08:00 AM',
          completedToday: false
        },
        {
          id: `s-${Date.now()}-3`,
          name: 'Liposomal Vitamin D3 + K2 (5000 IU)',
          manufacturer: 'Quicksilver Scientific',
          frequency: 'Once Daily with Lunch',
          recurrence: 'Every 24h',
          timing: 'With Meal',
          instructions: 'Take with a meal containing healthy dietary fats.',
          scheduledTime: '12:30 PM',
          completedToday: false
        }
      ];
    } else if (presetType === 'gut') {
      presetSupplements = [
        {
          id: `s-${Date.now()}-1`,
          name: 'BPC-157 Oral Supplement (500 mcg)',
          manufacturer: 'Tailor Made Compounding',
          frequency: 'Daily',
          recurrence: 'Every 24h',
          timing: 'Empty Stomach',
          instructions: 'Take 1 capsule first thing in the morning with 8oz water.',
          scheduledTime: '08:00 AM',
          completedToday: false
        },
        {
          id: `s-${Date.now()}-2`,
          name: 'L-Glutamine Powder (5g)',
          manufacturer: 'Thorne',
          frequency: 'Twice Daily',
          recurrence: 'Every 12h',
          timing: 'Empty Stomach',
          instructions: 'Mix 1 scoop with room temperature water before meals.',
          scheduledTime: '08:30 AM',
          completedToday: false
        }
      ];
    } else {
      presetSupplements = [
        {
          id: `s-${Date.now()}-1`,
          name: 'NMN Liposomal Matrix (500 mg)',
          manufacturer: 'Alive By Science',
          frequency: 'Once Daily',
          recurrence: 'Every 24h',
          timing: 'Morning',
          instructions: 'Take 2 capsules in the morning with water.',
          scheduledTime: '07:30 AM',
          completedToday: false
        },
        {
          id: `s-${Date.now()}-2`,
          name: 'Magnesium L-Threonate (2000 mg)',
          manufacturer: 'Life Extension',
          frequency: 'Nightly',
          recurrence: 'Every 24h',
          timing: 'Before Bed',
          instructions: 'Take 3 capsules 1 hour before sleep.',
          scheduledTime: '09:30 PM',
          completedToday: false
        }
      ];
    }

    onUpdatePatient({
      ...selectedPatient,
      supplements: presetSupplements,
      status: 'Protocol Active',
      isNew: false
    });
    setShowPresetModal(false);
  };

  const handleCreatePatient = (e) => {
    e.preventDefault();
    if (!newPatientForm.name.trim()) return;

    const newPatient = {
      id: `p-${Date.now()}`,
      name: newPatientForm.name,
      dob: newPatientForm.dob || '1990-01-01',
      email: newPatientForm.email || `${newPatientForm.name.toLowerCase().replace(/\s+/g, '.')}@wellnessclient.com`,
      status: 'Pending Intake',
      isNew: true,
      primaryGoal: newPatientForm.primaryGoal,
      reportedSymptoms: newPatientForm.reportedSymptoms,
      currentSupplements: newPatientForm.currentSupplements,
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
      historyLogs: []
    };

    onAddPatient(newPatient);
    setShowNewPatientModal(false);
    setNewPatientForm({
      name: '',
      dob: '',
      email: '',
      primaryGoal: 'Optimize peak vitality & performance',
      reportedSymptoms: 'Fatigue & Brain Fog',
      currentSupplements: 'Multivitamin'
    });
  };

  return (
    <div class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 font-sans">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Patient Roster (matching IMG_9243.PNG sidebar) */}
        <div class="lg:col-span-4 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80">
          
          {/* Header */}
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-[#1E293B] tracking-tight">Patient Roster</h2>
            <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {patients.length} {patients.length === 1 ? 'Patient' : 'Patients'}
            </span>
          </div>

          {/* Search Input */}
          <div class="relative mb-4">
            <Search class="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search roster..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              class="w-full pl-9 pr-3 py-2 bg-slate-50 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4E878C]/40 text-slate-700"
            />
          </div>

          {/* Selected Patient Dropdown Card */}
          {selectedPatient && (
            <div class="mb-4 bg-slate-100/90 rounded-2xl p-3.5 border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800 cursor-pointer shadow-inner">
              <div class="truncate">
                <span>{selectedPatient.name}</span>
                <span class="font-normal text-slate-500 ml-1">(DOB: {selectedPatient.dob}) — {selectedPatient.adherenceRate}% Adh</span>
              </div>
              <ChevronDown class="w-4 h-4 text-slate-500 flex-shrink-0 ml-2" />
            </div>
          )}

          {/* Patient Roster List */}
          <div class="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {filteredPatients.map(p => {
              const isSelected = p.id === selectedPatient.id;
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectPatient(p.id)}
                  class={`p-4 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#2F4858] text-white border-[#2F4858] shadow-md'
                      : 'bg-[#EFF2F5] text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-200/60'
                  }`}
                >
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center space-x-2">
                        <span class={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {p.name}
                        </span>
                        {p.isNew && (
                          <span class="bg-[#2E7D6F] text-white text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded">
                            NEW
                          </span>
                        )}
                      </div>
                      <p class={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        DOB: {p.dob} • {p.email}
                      </p>
                    </div>

                    {/* Actions on list item */}
                    <div class="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPatient(p.id);
                          setShowHistoryModal(true);
                        }}
                        title="View Medication History"
                        class={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-slate-100 text-slate-800 hover:bg-white'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                        }`}
                      >
                        <span class="text-xs">📊</span> History
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete patient ${p.name}?`)) {
                            onDeletePatient(p.id);
                          }
                        }}
                        title="Delete patient"
                        class={`p-1.5 rounded-lg transition-all ${
                          isSelected ? 'text-slate-400 hover:text-red-300' : 'text-slate-400 hover:text-red-500'
                        }`}
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Patient Button */}
          <button
            onClick={() => setShowNewPatientModal(true)}
            class="w-full mt-4 py-3 bg-[#4E878C] hover:bg-[#3B7A72] text-white rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm"
          >
            <Plus class="w-4 h-4" />
            <span>Register New Patient</span>
          </button>

        </div>

        {/* RIGHT COLUMN: Patient Main Workspace (matching IMG_9243.PNG main panel) */}
        {!selectedPatient ? (
          <div class="lg:col-span-8 bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200/80 flex flex-col items-center justify-center min-h-[450px]">
            <div class="w-16 h-16 rounded-full bg-slate-100 text-[#4E878C] flex items-center justify-center mb-4 border border-slate-200">
              <Users class="w-8 h-8" />
            </div>
            <h3 class="text-xl font-bold text-slate-900 mb-2">No Active Patients in Roster</h3>
            <p class="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
              When patients log in or register on their mobile app, they will automatically sync and appear here in real time. You can also click "+ Register New Patient" below to manually add a patient.
            </p>
            <button
              onClick={() => setShowNewPatientModal(true)}
              class="px-6 py-3 bg-[#4E878C] hover:bg-[#3B7A72] text-white rounded-2xl font-bold text-xs inline-flex items-center space-x-2 transition-all shadow-sm"
            >
              <Plus class="w-4 h-4" />
              <span>Register New Patient</span>
            </button>
          </div>
        ) : (
          <div class="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          
          {/* Header Row: Patient Info + Action Buttons */}
          <div class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <div class="flex items-center space-x-3">
                <h2 class="text-2xl font-extrabold text-[#1E293B] tracking-tight">{selectedPatient.name}</h2>
                <span class={`text-xs font-bold px-3 py-1 rounded-full ${
                  selectedPatient.status === 'Protocol Active'
                    ? 'bg-[#E3ECE9] text-[#2E7D6F] border border-[#2E7D6F]/30'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {selectedPatient.status || 'Protocol Active'}
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-1">
                DOB: {selectedPatient.dob} • {selectedPatient.email}
              </p>
            </div>

            {/* Header Right Action Buttons */}
            <div class="flex items-center space-x-2 flex-wrap gap-y-2">
              <button
                onClick={() => setShowHistoryModal(true)}
                class="flex items-center space-x-1.5 bg-[#2F4858] hover:bg-[#1E293B] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>📊 Medication History & Days Taken</span>
                <ChevronDown class="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete patient record for ${selectedPatient.name}?`)) {
                    onDeletePatient(selectedPatient.id);
                  }
                }}
                class="flex items-center space-x-1 bg-[#EF4444] hover:bg-red-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <span>🗑️ Delete Patient</span>
              </button>
            </div>
          </div>

          {/* Patient Overview Box (Goals, Symptoms, Supplements) */}
          <div class="mt-6 bg-[#EFF2F5] rounded-2xl p-5 border border-slate-200/70 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                PRIMARY HEALTH GOAL
              </span>
              <p class="text-xs font-bold text-slate-800">
                {selectedPatient.primaryGoal || 'Optimize peak vitality & performance'}
              </p>
            </div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                REPORTED SYMPTOMS
              </span>
              <p class="text-xs font-bold text-slate-800">
                {selectedPatient.reportedSymptoms || 'Fatigue'}
              </p>
            </div>
            <div>
              <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                CURRENT SUPPLEMENTS
              </span>
              <p class="text-xs font-bold text-slate-800">
                {selectedPatient.currentSupplements || 'Multivitamin'}
              </p>
            </div>
          </div>

          {/* Practitioner Guidance Note Section */}
          <div class="mt-8">
            <h3 class="text-base font-bold text-[#1E293B] mb-3">Practitioner Guidance Note</h3>
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <textarea
                rows={2}
                value={guidanceText}
                onChange={(e) => setGuidanceText(e.target.value)}
                placeholder="Write customized guidance instructions for patient..."
                class="flex-1 p-3.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4E878C] shadow-inner"
              />
              <button
                onClick={handleSaveGuidance}
                class="px-5 py-3 bg-[#4E878C] hover:bg-[#3B7A72] text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 self-end sm:self-center"
              >
                <Save class="w-4 h-4" />
                <span>{isGuidanceSaved ? 'Saved!' : 'Save Note'}</span>
              </button>
            </div>
          </div>

          {/* Patient Messages & Doctor Chat Section */}
          <div class="mt-8 bg-slate-50/80 rounded-2xl p-5 border border-slate-200">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center space-x-2">
                <MessageSquare class="w-4 h-4 text-[#4E878C]" />
                <h3 class="text-sm font-bold text-[#1E293B]">Live Doctor-Patient Chat Thread</h3>
              </div>
              <span class="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Encrypted & Real-time
              </span>
            </div>

            <div class="bg-white rounded-xl p-3 border border-slate-200 max-h-48 overflow-y-auto space-y-2 mb-3 shadow-inner">
              {!selectedPatient.doctorMessages || selectedPatient.doctorMessages.length === 0 ? (
                <p class="text-xs text-slate-400 italic text-center py-4">
                  No messages from {selectedPatient.name} yet.
                </p>
              ) : (
                selectedPatient.doctorMessages.map((msg) => {
                  const isDoctor = msg.sender === 'doctor';
                  return (
                    <div key={msg.id} class={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'}`}>
                      <span class="text-[9px] font-bold text-slate-400 px-1">
                        {isDoctor ? 'You (Practitioner)' : selectedPatient.name} • {msg.timestamp}
                      </span>
                      <div class={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                        isDoctor
                          ? 'bg-[#2F4858] text-white rounded-tr-none'
                          : 'bg-[#EFF2F5] text-slate-800 rounded-tl-none border border-slate-200'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div class="flex items-center space-x-2">
              <input
                type="text"
                placeholder={`Reply to ${selectedPatient.name}...`}
                value={doctorReplyInput}
                onChange={(e) => setDoctorReplyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendDoctorReply();
                }}
                class="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#4E878C]"
              />
              <button
                onClick={handleSendDoctorReply}
                class="px-4 py-2.5 bg-[#2F4858] hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
              >
                <Send class="w-3.5 h-3.5 text-emerald-300" />
                <span>Send</span>
              </button>
            </div>
          </div>

          {/* Prescribed Supplement Protocol Section */}
          <div class="mt-8">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 class="text-base font-bold text-[#1E293B]">Prescribed Supplement Protocol</h3>
              
              <div class="flex items-center space-x-2">
                <button
                  onClick={() => exportRegimenPDF(selectedPatient)}
                  title="Export regimen PDF"
                  class="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-300 transition-all"
                >
                  <Download class="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => setShowPresetModal(true)}
                  class="flex items-center space-x-1 bg-[#EFF2F5] hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 transition-all"
                >
                  <Zap class="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span>Quick Stack Preset</span>
                </button>

                <button
                  onClick={() => {
                    setEditingSupplement(null);
                    setSuppForm({
                      name: '',
                      manufacturer: 'Empower Pharma',
                      frequency: 'Daily at Morning Wake-Up',
                      recurrence: 'Every 24h',
                      timing: 'Empty Stomach',
                      instructions: '',
                      scheduledTime: '08:00 AM'
                    });
                    setShowAddModal(true);
                  }}
                  class="flex items-center space-x-1 bg-[#2F4858] hover:bg-[#1E293B] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Add Supplement</span>
                </button>
              </div>
            </div>

            {/* List of Supplement Cards */}
            {!selectedPatient.supplements || selectedPatient.supplements.length === 0 ? (
              <div class="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center">
                <p class="text-xs text-slate-500 font-medium">No supplements prescribed yet for this patient.</p>
                <p class="text-[11px] text-slate-400 mt-1">Click "+ Add Supplement" or use "Quick Stack Preset" to generate a regimen.</p>
              </div>
            ) : (
              <div class="space-y-4">
                {selectedPatient.supplements.map((s) => (
                  <div 
                    key={s.id}
                    class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative group hover:border-[#4E878C]/40 transition-all"
                  >
                    <div class="flex items-start justify-between">
                      <div>
                        <h4 class="font-bold text-sm text-[#1E293B]">{s.name}</h4>
                        <p class="text-[11px] text-slate-400 mt-0.5">
                          {s.manufacturer || 'Empower Pharma'} • {s.frequency} • {s.recurrence}
                        </p>
                      </div>

                      {/* Timing Pill Tag */}
                      <span class="bg-[#EFF2F5] text-slate-700 font-bold text-[11px] px-3 py-1 rounded-full border border-slate-300/60">
                        {s.timing || 'Empty Stomach'}
                      </span>
                    </div>

                    {/* Instruction Quote Card */}
                    <div class="mt-3 bg-[#EFF2F5]/80 rounded-xl p-3 text-xs italic text-slate-700 border border-slate-200/60">
                      "{s.instructions || 'Take as prescribed.'}"
                    </div>

                    {/* Edit / Delete Buttons */}
                    <div class="mt-3 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setEditingSupplement(s);
                          setSuppForm(s);
                          setShowAddModal(true);
                        }}
                        class="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                      >
                        <Edit3 class="w-3 h-3 text-slate-500" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => handleRemoveSupplement(s.id)}
                        class="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
                      >
                        <Trash2 class="w-3 h-3 text-red-500" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}
    </div>

      {/* MODAL: ADD / EDIT SUPPLEMENT */}
      {showAddModal && (
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 class="text-lg font-bold text-slate-900 mb-4">
              {editingSupplement ? 'Edit Prescribed Supplement' : 'Add Prescribed Supplement'}
            </h3>
            
            <form onSubmit={handleSaveSupplement} class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Supplement Name & Dosage</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NAD+ Liposomal Concentrate (2 sprays)"
                  value={suppForm.name}
                  onChange={(e) => setSuppForm({ ...suppForm, name: e.target.value })}
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Empower Pharma"
                    value={suppForm.manufacturer}
                    onChange={(e) => setSuppForm({ ...suppForm, manufacturer: e.target.value })}
                    class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Timing Tag</label>
                  <select
                    value={suppForm.timing}
                    onChange={(e) => setSuppForm({ ...suppForm, timing: e.target.value })}
                    class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                  >
                    <option value="Empty Stomach">Empty Stomach</option>
                    <option value="With Meal">With Meal</option>
                    <option value="Before Bed">Before Bed</option>
                    <option value="Morning Wake-Up">Morning Wake-Up</option>
                    <option value="With Water">With Water</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    placeholder="e.g. Daily at Morning Wake-Up"
                    value={suppForm.frequency}
                    onChange={(e) => setSuppForm({ ...suppForm, frequency: e.target.value })}
                    class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Scheduled Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:00 AM"
                    value={suppForm.scheduledTime}
                    onChange={(e) => setSuppForm({ ...suppForm, scheduledTime: e.target.value })}
                    class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Patient Instructions (Quote)</label>
                <textarea
                  rows={2}
                  required
                  placeholder='e.g. "Administer 1 spray per nostril on empty stomach immediately upon waking."'
                  value={suppForm.instructions}
                  onChange={(e) => setSuppForm({ ...suppForm, instructions: e.target.value })}
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                />
              </div>

              <div class="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-5 py-2 bg-[#4E878C] hover:bg-[#3B7A72] text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  {editingSupplement ? 'Update Supplement' : 'Add Supplement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: QUICK STACK PRESETS */}
      {showPresetModal && (
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Zap class="w-5 h-5 text-amber-500 fill-amber-400" />
                <span>Quick Stack Presets</span>
              </h3>
              <button onClick={() => setShowPresetModal(false)} class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <p class="text-xs text-slate-500 mb-4">
              Instantly apply pre-configured clinical supplement protocols to {selectedPatient.name}.
            </p>

            <div class="space-y-3">
              <div 
                onClick={() => handleApplyPreset('vitality')}
                class="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#4E878C] hover:bg-emerald-50/50 cursor-pointer transition-all"
              >
                <h4 class="font-bold text-sm text-slate-800">⚡ Peak Vitality & Anti-Aging Stack (Default)</h4>
                <p class="text-xs text-slate-500 mt-1">NAD+ Liposomal + BPC-157 Oral + Vitamin D3/K2 Liposomal</p>
              </div>

              <div 
                onClick={() => handleApplyPreset('gut')}
                class="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#4E878C] hover:bg-emerald-50/50 cursor-pointer transition-all"
              >
                <h4 class="font-bold text-sm text-slate-800">🌿 Gut Health & Cellular Repair Stack</h4>
                <p class="text-xs text-slate-500 mt-1">BPC-157 Oral (500 mcg) + L-Glutamine Powder (5g)</p>
              </div>

              <div 
                onClick={() => handleApplyPreset('cognitive')}
                class="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-[#4E878C] hover:bg-emerald-50/50 cursor-pointer transition-all"
              >
                <h4 class="font-bold text-sm text-slate-800">🧠 Cognitive Focus & Longevity Stack</h4>
                <p class="text-xs text-slate-500 mt-1">NMN Liposomal (500mg) + Magnesium L-Threonate (2000mg)</p>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowPresetModal(false)}
                class="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MEDICATION HISTORY */}
      {showHistoryModal && (
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>📊 Medication History & Compliance Log</span>
              </h3>
              <button onClick={() => setShowHistoryModal(false)} class="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div class="bg-[#EFF2F5] rounded-2xl p-4 mb-4 flex items-center justify-between text-xs font-bold text-slate-800">
              <div>
                <span>Patient: {selectedPatient.name}</span>
                <p class="text-[11px] font-normal text-slate-500">Adherence Rate: {selectedPatient.adherenceRate}%</p>
              </div>
              <span class="bg-[#2E7D6F] text-white px-3 py-1 rounded-full text-[11px]">
                {selectedPatient.activeStreak}-Day Streak 🔥
              </span>
            </div>

            <h4 class="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Recent Logged Doses</h4>
            
            <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
              {!selectedPatient.historyLogs || selectedPatient.historyLogs.length === 0 ? (
                <p class="text-xs text-slate-400 italic">No doses logged yet for this patient.</p>
              ) : (
                selectedPatient.historyLogs.map((log, idx) => (
                  <div key={idx} class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span class="font-medium text-slate-800">{log.action}</span>
                    <span class="text-[11px] text-slate-500 font-mono">{log.timestamp}</span>
                  </div>
                ))
              )}
            </div>

            <div class="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => exportRegimenText(selectedPatient)}
                class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Export Text
              </button>
              <button
                onClick={() => setShowHistoryModal(false)}
                class="px-4 py-2 bg-[#2F4858] text-white font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW PATIENT */}
      {showNewPatientModal && (
        <div class="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 class="text-lg font-bold text-slate-900 mb-4">Register New Patient</h3>
            
            <form onSubmit={handleCreatePatient} class="space-y-3 text-xs">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Full Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. peter c"
                  value={newPatientForm.name}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-slate-700 mb-1">Date of Birth (DOB)</label>
                  <input
                    type="text"
                    required
                    placeholder="YYYY-MM-DD or 1990-01-01"
                    value={newPatientForm.dob}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, dob: e.target.value })}
                    class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="patient@wellnessclient.com"
                    value={newPatientForm.email}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                    class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Primary Health Goal</label>
                <input
                  type="text"
                  placeholder="e.g. Optimize peak vitality & performance"
                  value={newPatientForm.primaryGoal}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, primaryGoal: e.target.value })}
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                />
              </div>

              <div>
                <label class="block font-bold text-slate-700 mb-1">Reported Symptoms</label>
                <input
                  type="text"
                  placeholder="e.g. Fatigue, Brain Fog"
                  value={newPatientForm.reportedSymptoms}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, reportedSymptoms: e.target.value })}
                  class="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#4E878C] focus:outline-none"
                />
              </div>

              <div class="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  class="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="px-5 py-2 bg-[#4E878C] hover:bg-[#3B7A72] text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
