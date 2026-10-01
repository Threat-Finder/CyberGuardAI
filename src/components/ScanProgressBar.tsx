import React from 'react';
import {
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  Lock,
  FileCode,
  Cookie,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import type { ScanResult } from '../types.js';

interface ScanProgressBarProps {
  isScanning: boolean;
  scanPhase: string;
  currentScan: ScanResult | null;
}

interface StepInfo {
  id: number;
  title: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PHASES: StepInfo[] = [
  { id: 1, title: 'Socket & TLS', shortDesc: 'Cipher & Cert Validation', icon: Lock },
  { id: 2, title: 'Security Headers', shortDesc: 'HSTS, CSP & Edge Leaks', icon: FileCode },
  { id: 3, title: 'Cookie & Policies', shortDesc: 'SameSite & Transport', icon: Cookie },
  { id: 4, title: 'CVE Heuristics', shortDesc: 'Threshold & Vector Audit', icon: AlertTriangle },
  { id: 5, title: 'AI Synthesis', shortDesc: 'Posture & Score Calculation', icon: Sparkles },
];

export const ScanProgressBar: React.FC<ScanProgressBarProps> = ({
  isScanning,
  scanPhase,
  currentScan,
}) => {
  let currentStep = 0;
  let percentage = 0;

  if (isScanning) {
    if (scanPhase.includes('1/5')) {
      currentStep = 1;
      percentage = 20;
    } else if (scanPhase.includes('2/5')) {
      currentStep = 2;
      percentage = 40;
    } else if (scanPhase.includes('3/5')) {
      currentStep = 3;
      percentage = 60;
    } else if (scanPhase.includes('4/5')) {
      currentStep = 4;
      percentage = 80;
    } else if (scanPhase.includes('5/5')) {
      currentStep = 5;
      percentage = 95;
    } else {
      currentStep = 2;
      percentage = 50;
    }
  } else if (currentScan) {
    currentStep = 5;
    percentage = 100;
  }

  return (
    <div className="cyber-card rounded-2xl p-5 sm:p-6 space-y-5 border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-xl transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--sidebar-border)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-purple)]/15 border border-[var(--accent-purple)]/30 flex items-center justify-center text-[var(--accent-purple)]">
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-purple)]" />
              ) : percentage === 100 ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-[var(--text-body)]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-heading)] tracking-wide flex items-center gap-2">
                <span>Assessment Progress</span>
                {isScanning && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[var(--accent-purple)]/20 text-[var(--accent-purple)] border border-[var(--accent-purple)]/40 animate-pulse">
                    Phase {currentStep} of 5 Active
                  </span>
                )}
                {!isScanning && percentage === 100 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Completed 100%
                  </span>
                )}
              </h3>
              <p className="text-xs text-[var(--text-body)] font-mono">
                {isScanning
                  ? scanPhase
                  : percentage === 100
                  ? 'All security audit vectors executed and verified'
                  : 'Awaiting scan initiation'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-body)] opacity-70 block">
              Completion
            </span>
            <div className="text-2xl font-black font-mono tracking-tight text-[var(--accent-purple)] flex items-baseline gap-1">
              <span>{percentage}</span>
              <span className="text-xs font-semibold opacity-70">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="w-full h-3.5 rounded-full bg-[var(--subtle-bg)] p-0.5 overflow-hidden border border-[var(--sidebar-border)] shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden ${
              isScanning
                ? 'bg-gradient-to-r from-[var(--accent-purple)] via-indigo-500 to-[var(--accent-purple)] shadow-[0_0_16px_rgba(183,148,246,0.6)]'
                : percentage === 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_16px_rgba(16,185,129,0.5)]'
                : 'bg-[var(--panel-border)]'
            }`}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          >
            {isScanning && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-[shimmer_1.5s_infinite]" />
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
        {PHASES.map((phase) => {
          const isDone = !isScanning ? percentage === 100 : currentStep > phase.id;
          const isActive = isScanning && currentStep === phase.id;
          const Icon = phase.icon;

          return (
            <div
              key={phase.id}
              className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-[var(--accent-purple)]/15 border-[var(--accent-purple)]/70 shadow-[0_0_12px_rgba(183,148,246,0.25)]'
                  : isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-[var(--subtle-bg)] border-[var(--sidebar-border)] opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive
                        ? 'text-[var(--accent-purple)] animate-pulse'
                        : isDone
                        ? 'text-emerald-400'
                        : 'text-[var(--text-body)]'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold truncate ${
                      isActive
                        ? 'text-[var(--text-heading)]'
                        : isDone
                        ? 'text-emerald-400'
                        : 'text-[var(--text-body)]'
                    }`}
                  >
                    {phase.title}
                  </span>
                </div>

                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : isActive ? (
                  <RefreshCw className="w-3 h-3 text-[var(--accent-purple)] animate-spin shrink-0" />
                ) : (
                  <span className="text-[10px] font-mono text-[var(--text-body)] opacity-60">
                    {phase.id}/5
                  </span>
                )}
              </div>

              <span className="text-[10px] text-[var(--text-body)] leading-tight truncate">
                {phase.shortDesc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
