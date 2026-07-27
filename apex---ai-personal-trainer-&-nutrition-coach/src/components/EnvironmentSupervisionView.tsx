import React, { useState } from 'react';
import { EnvironmentScanResult } from '../types';
import { ShieldAlert, CheckCircle2, Camera, Sparkles, Sliders, AlertTriangle, Radio } from 'lucide-react';

export const EnvironmentSupervisionView: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<EnvironmentScanResult>({
    safeToWorkout: true,
    hazards: [
      {
        id: 'h1',
        label: 'Loose Dumbbell behind foot path',
        riskLevel: 'medium',
        location: '1.5 feet behind right heel',
        recommendation: 'Move unused 12kg dumbbells to side rack to prevent ankle roll.'
      }
    ],
    detectedEquipment: ['Dumbbells', 'Exercise Mat', 'Resistance Bands'],
    setupTips: [
      'Clear 6x6ft radius on floor before explosive jump squats.',
      'Ensure ceiling clearance exceeds arm reach + dumbbell length.'
    ]
  });

  const [selectedGuide, setSelectedGuide] = useState<string>('barbell_rack');

  const runEnvironmentScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/apex/scan-environment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: 'sample_environment_scan'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
      }
    } catch (err) {
      console.error('Environment scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const setupGuides = [
    {
      id: 'barbell_rack',
      title: 'Barbell Power Rack & Safety Catchers',
      category: 'Heavy Lifting',
      steps: [
        'Set J-Hooks at mid-sternum height so barbell un-racks with minimal knee dip.',
        'Adjust safety catcher pins to 1-2 inches below lowest chest height during bench press.',
        'Always secure weight plates using spring or collar locks on both ends.',
        'Inspect rubber mat floor for moisture or sweat drops before un-racking.'
      ]
    },
    {
      id: 'adjustable_bench',
      title: 'Adjustable Bench Incline Angles',
      category: 'Upper Body',
      steps: [
        'Incline Press: Set backrest to 30° - 45° angle. Avoid 60°+ to prevent excessive front delt strain.',
        'Ensure pop-pin locks click firmly into seat notches before sitting with weights.',
        'Seat angle should tilt up slightly (15°) to keep hips locked into seat crease.'
      ]
    },
    {
      id: 'resistance_bands',
      title: 'Resistance Bands & Door Anchor Security',
      category: 'Mobility & Cable',
      steps: [
        'Door Anchor: Place anchor on hinge-side of door and lock door completely before pulling.',
        'Inspect latex bands for tiny micro-tears or white stress discolorations.',
        'Never stretch bands past 3x their natural resting length.'
      ]
    }
  ];

  return (
    <div className="space-y-6 text-zinc-100">
      {/* Environment Hazard Scanner Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-mono font-bold text-lime-400 uppercase tracking-widest">
              SPATIAL INTELLIGENCE 01
            </span>
            <h2 className="text-xl font-black text-zinc-100 flex items-center space-x-2 mt-0.5">
              <Radio className="w-5 h-5 text-lime-400" />
              <span>Room Hazard & Spatial Equipment Audit</span>
            </h2>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              Apex AI scans video feeds to map room boundaries, floor clutter, and available gear.
            </p>
          </div>

          <button
            onClick={runEnvironmentScan}
            disabled={isScanning}
            className="px-5 py-2.5 bg-lime-400 hover:bg-lime-300 text-zinc-950 font-mono font-black text-xs rounded-xl shadow-lg shadow-lime-400/20 flex items-center space-x-2 shrink-0 disabled:opacity-50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isScanning ? 'Apex Scanning Room...' : 'Run Camera Room Scan'}</span>
          </button>
        </div>

        {/* Scan Status Banner */}
        <div className={`p-4 rounded-2xl border flex items-start space-x-3 font-mono ${
          scanResult.safeToWorkout
            ? 'bg-lime-400/10 border-lime-400/30 text-lime-200'
            : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
        }`}>
          {scanResult.safeToWorkout ? (
            <CheckCircle2 className="w-6 h-6 text-lime-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="font-bold text-sm">
              {scanResult.safeToWorkout ? 'ENVIRONMENT CLEAR & SAFE FOR TRAINING' : 'HAZARDS DETECTED - ATTENTION REQUIRED'}
            </h3>
            <p className="text-xs text-zinc-300 mt-0.5">
              Detected Equipment: {scanResult.detectedEquipment.join(', ') || 'Floor space'}
            </p>
          </div>
        </div>

        {/* Hazards List */}
        {scanResult.hazards.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase">
              FLAGGED HAZARDS ({scanResult.hazards.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scanResult.hazards.map((h) => (
                <div key={h.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-400 flex items-center space-x-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{h.label}</span>
                    </span>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                      {h.riskLevel} RISK
                    </span>
                  </div>
                  <div className="text-zinc-400">Location: {h.location}</div>
                  <div className="text-lime-300 font-bold">Tip: {h.recommendation}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Equipment Setup & Adjustment Guides */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div>
          <span className="text-xs font-mono font-bold text-lime-400 uppercase tracking-widest">
            SPATIAL INTELLIGENCE 02
          </span>
          <h2 className="text-xl font-black text-zinc-100 flex items-center space-x-2 mt-0.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Equipment Calibration Protocols</span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono">
            Biomechanical calibration guidelines for racks, benches, cables, and bands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {setupGuides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => setSelectedGuide(guide.id)}
              className={`p-4 rounded-2xl border text-left font-mono transition-all ${
                selectedGuide === guide.id
                  ? 'bg-lime-400/10 border-lime-400 text-lime-200'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <span className="text-[10px] uppercase text-lime-400 block font-bold">{guide.category}</span>
              <span className="font-bold text-sm text-zinc-100">{guide.title}</span>
            </button>
          ))}
        </div>

        {/* Active Selected Setup Steps */}
        {(() => {
          const activeGuide = setupGuides.find((g) => g.id === selectedGuide) || setupGuides[0];
          return (
            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3 font-mono">
              <h3 className="font-bold text-sm text-zinc-100 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-lime-400" />
                <span>{activeGuide.title} - Setup Protocol</span>
              </h3>
              <ol className="space-y-2 text-xs text-zinc-300 list-decimal list-inside">
                {activeGuide.steps.map((step, i) => (
                  <li key={i} className="leading-relaxed">{step}</li>
                ))}
              </ol>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

