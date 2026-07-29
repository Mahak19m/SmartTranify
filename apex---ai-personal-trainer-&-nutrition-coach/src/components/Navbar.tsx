import React from 'react';
import { ShieldAlert, Volume2, VolumeX, Camera, Mic, Activity, Dumbbell, Utensils, BarChart3, HelpCircle, Zap, Radio } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  voiceCuesEnabled: boolean;
  setVoiceCuesEnabled: (enabled: boolean) => void;
  onEmergencyPain: () => void;
  isWebcamActive: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  voiceCuesEnabled,
  setVoiceCuesEnabled,
  onEmergencyPain,
  isWebcamActive
}) => {
  const navItems = [
    { id: 'stage', label: 'Bento Live Stage', icon: Camera },
    { id: 'intake', label: 'Intake & Mobility', icon: Activity },
    { id: 'library', label: 'Workouts & Exercises', icon: Dumbbell },
    { id: 'supervision', label: 'Spatial & Gear Scan', icon: Radio },
    { id: 'nutrition', label: 'Nutrition & Fuel', icon: Utensils },
    { id: 'progress', label: 'Analytics & Logs', icon: BarChart3 }
  ];

  return (
    <header className="bg-zinc-950/90 backdrop-blur border-b border-zinc-800/80 sticky top-0 z-40 text-zinc-100 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Certified Badge */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('stage')}>
            <div className="w-10 h-10 rounded-xl bg-lime-400 text-zinc-950 flex items-center justify-center font-black text-xl tracking-tighter shadow-md shadow-lime-400/20 border border-lime-300">
              AP
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider text-zinc-100">
                  APEX <span className="text-lime-400">AI</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-lime-400/10 text-lime-400 border border-lime-400/30 rounded-md font-bold uppercase tracking-wider">
                  BENTO BIOMECHANICS
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">
                Spatial Intelligence • Wearable Stream • Predictive Analytics
              </p>
            </div>
          </div>

          {/* Quick Controls & Emergency Pain Alert */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Camera Status Pill */}
            <div className={`hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isWebcamActive 
                ? 'bg-lime-400/10 text-lime-400 border-lime-400/40' 
                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isWebcamActive ? 'bg-lime-400 animate-ping' : 'bg-zinc-500'}`} />
              <span>{isWebcamActive ? 'CAM LIVE' : 'SIMULATOR'}</span>
            </div>

            {/* Voice Cues Toggle */}
            <button
              onClick={() => setVoiceCuesEnabled(!voiceCuesEnabled)}
              title={voiceCuesEnabled ? 'Mute AI Voice Cues' : 'Enable AI Voice Cues'}
              className={`p-2 rounded-xl transition-all flex items-center space-x-1.5 border font-mono text-xs font-bold ${
                voiceCuesEnabled 
                  ? 'bg-lime-400/15 text-lime-300 border-lime-400/40 hover:bg-lime-400/25 shadow-lg shadow-lime-400/10' 
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {voiceCuesEnabled ? <Volume2 className="w-4 h-4 text-lime-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden lg:inline">
                {voiceCuesEnabled ? 'VOICE ON' : 'MUTED'}
              </span>
            </button>

            {/* Emergency Pain Alert Button */}
            <button
              onClick={onEmergencyPain}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-950/80 transition-all border border-rose-400/30 animate-pulse font-mono tracking-wide"
              title="Click if experiencing sharp joint or muscle pain"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>PAIN ALERT</span>
            </button>
          </div>
        </div>

        {/* Bento Tab Navigation */}
        <nav className="flex space-x-1 overflow-x-auto pb-2.5 scrollbar-none border-t border-zinc-800/80 pt-2">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-lime-400 text-zinc-950 shadow-md shadow-lime-400/20 border border-lime-300'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

