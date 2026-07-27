import React from 'react';
import { AlertOctagon, HeartPulse, Stethoscope, CheckCircle2, PhoneCall } from 'lucide-react';

interface PainAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PainAlertModal: React.FC<PainAlertModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-rose-500 rounded-2xl max-w-lg w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden">
        {/* Glowing Header Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 animate-pulse" />

        <div className="flex items-start space-x-4 mb-4">
          <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40 shrink-0">
            <AlertOctagon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-rose-400 flex items-center space-x-2">
              <span>WORKOUT HALTED: PAIN DETECTED</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Apex Safety Protocol has immediately paused all repetition counters and exercise timers.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-300">
          <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2">
            <h3 className="font-semibold text-slate-100 flex items-center space-x-2 text-xs uppercase tracking-wider text-rose-300">
              <HeartPulse className="w-4 h-4 text-rose-400" />
              <span>Immediate First Aid Guidance (R.I.C.E.)</span>
            </h3>
            <ul className="text-xs space-y-1.5 text-slate-300 list-disc list-inside">
              <li><strong className="text-amber-400">REST:</strong> Cease all weight-bearing or flexed movements on the joint immediately.</li>
              <li><strong className="text-amber-400">ICE:</strong> Apply an ice pack wrapped in a cloth for 15-20 minutes to reduce acute swelling.</li>
              <li><strong className="text-amber-400">COMPRESSION:</strong> Light supportive bandage wrapping if joint feels unstable.</li>
              <li><strong className="text-amber-400">ELEVATION:</strong> Elevate limb above heart level if comfortable.</li>
            </ul>
          </div>

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start space-x-2">
            <Stethoscope className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong className="block text-amber-200">Medical Disclaimer & Guardrail:</strong>
              Apex is an artificial intelligence coaching system and cannot diagnose musculoskeletal injuries or medical emergencies. If you experience sharp shooting pain, joint locking, deformity, or numbness, please consult a qualified physician or emergency medical provider immediately.
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors border border-slate-700"
          >
            I am Rested & Safe (Resume)
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>End Session for Today</span>
          </button>
        </div>
      </div>
    </div>
  );
};
