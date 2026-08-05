import React from 'react';
import { ShieldCheck, Monitor, Smartphone, LayoutGrid, RefreshCw, Lock, Sparkles } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, isSyncing, onManualSync, lastSyncedTime }) {
  return (
    <header class="bg-[#2F4858] text-white border-b border-slate-700 shadow-md sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4E878C] to-[#2E7D6F] flex items-center justify-center shadow-md">
            <span class="text-xl">💊</span>
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h1 class="font-bold text-lg tracking-wide text-white font-sans">WellnessBuddy</h1>
              <span class="bg-[#4E878C]/40 text-emerald-200 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-mono">
                <Lock class="w-3 h-3 text-emerald-400" /> AES-256
              </span>
            </div>
            <p class="text-xs text-slate-300 hidden sm:block">Prescription Protocol & Patient Compliance Engine</p>
          </div>
        </div>

        {/* View Switcher Controls */}
        <div class="flex items-center bg-[#1E293B] p-1 rounded-xl border border-slate-700 shadow-inner">
          <button
            onClick={() => setActiveView('practitioner')}
            class={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'practitioner'
                ? 'bg-[#4E878C] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Monitor class="w-3.5 h-3.5" />
            <span class="hidden md:inline">Practitioner</span> Website
          </button>

          <button
            onClick={() => setActiveView('patient')}
            class={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'patient'
                ? 'bg-[#4E878C] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone class="w-3.5 h-3.5" />
            <span class="hidden md:inline">Patient</span> App
          </button>

          <button
            onClick={() => setActiveView('dual')}
            class={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === 'dual'
                ? 'bg-[#3B7A72] text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutGrid class="w-3.5 h-3.5" />
            <span class="hidden lg:inline">Live</span> Dual View
          </button>
        </div>

        {/* Supabase Realtime & Replit Cloud Sync Indicator */}
        <div class="flex items-center space-x-3">
          <div class="hidden sm:flex flex-col items-end">
            <div class="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Supabase Sync</span>
            </div>
            <span class="text-[10px] text-slate-400 font-mono">
              {lastSyncedTime ? `Synced ${lastSyncedTime}` : 'Cloud Connected'}
            </span>
          </div>

          <button
            onClick={onManualSync}
            disabled={isSyncing}
            title="Force sync state with Supabase cloud storage"
            class="p-2 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white transition-all flex items-center justify-center border border-slate-600 disabled:opacity-50"
          >
            <RefreshCw class={`w-4 h-4 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
}
