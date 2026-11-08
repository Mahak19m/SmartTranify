import React from 'react';
import {
  ShieldAlert, Volume2, VolumeX, Camera, Activity, Dumbbell,
  Utensils, BarChart3, Radio, User, LogOut, LogIn
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  voiceCuesEnabled: boolean;
  setVoiceCuesEnabled: (enabled: boolean) => void;
  onEmergencyPain: () => void;
  isWebcamActive: boolean;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  voiceCuesEnabled,
  setVoiceCuesEnabled,
  onEmergencyPain,
  isWebcamActive,
  onOpenAuth
}) => {
  const { user, isAuthenticated, logout } = useAuth();

  const navItems = [
    { id: 'stage', label: 'AI Live Stage', icon: Camera },
    { id: 'intake', label: 'Intake & Profile', icon: Activity },
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
              ST
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-wider text-zinc-100">
                  SMART<span className="text-lime-400">TRANIFY</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-lime-400/10 text-lime-400 border border-lime-400/30 rounded-md font-bold uppercase tracking-wider">
                  AI COACH
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono hidden sm:block">
                MediaPipe Vision • Voice Coach • Biomechanics
              </p>
            </div>
          </div>

          {/* Quick Controls & User Profile & Emergency Pain Alert */}
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

            {/* Auth / Profile Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-2 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1">
                <div className="w-6 h-6 rounded-lg bg-lime-400/20 text-lime-400 flex items-center justify-center font-bold text-[10px] border border-lime-400/30">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-mono font-bold text-zinc-200 max-w-[100px] truncate">
                  {user.name}
                </span>
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1 text-zinc-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-lime-400/40 text-lime-300 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-md shadow-lime-400/10"
              >
                <LogIn className="w-3.5 h-3.5 text-lime-400" />
                <span>SIGN IN</span>
              </button>
            )}

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
