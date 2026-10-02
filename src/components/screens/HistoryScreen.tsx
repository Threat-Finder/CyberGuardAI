import React from 'react';
import {
  History,
  Clock,
  Zap,
} from 'lucide-react';
import type { ScanResult } from '../../types.js';

interface HistoryScreenProps {
  history: ScanResult[];
  activeScanId: string | null;
  onSelectScan: (scan: ScanResult) => void;
  onRescan: (url: string) => void;
  onNavigate: (screen: 'dashboard' | 'new-scan' | 'results' | 'history') => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  activeScanId,
  onSelectScan,
  onRescan,
  onNavigate,
}) => {
  return (
    <div className="space-y-6">
      <div className="cyber-card rounded-2xl p-5 sm:p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#B794F6]" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Scan Audit History & Target Comparison
            </h2>
          </div>
          <p className="text-xs text-[#A0A0B0] mt-1">
            Review historical vulnerability posture scores and comparative telemetry across audits.
          </p>
        </div>

        <button
          id="history-scan-now-btn"
          onClick={() => onNavigate('new-scan')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-[0_0_15px_rgba(183,148,246,0.3)]"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>Scan Now</span>
        </button>
      </div>

      <div className="space-y-3">
        {history.map((scan) => {
          const isActive = scan.id === activeScanId;
          const totalVulns = scan.counts.warn + scan.counts.fail;

          return (
            <div
              key={scan.id}
              onClick={() => {
                onSelectScan(scan);
                onNavigate('dashboard');
              }}
              className={`cyber-card rounded-2xl p-5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isActive ? 'border-[#B794F6] shadow-[0_0_20px_rgba(183,148,246,0.2)]' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1c1b2f] border border-[#B794F6]/40 flex flex-col items-center justify-center font-mono shrink-0">
                  <span className="text-sm font-black text-white">{scan.score}</span>
                  <span className="text-[9px] font-bold text-[#B794F6]">Grade {scan.grade}</span>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white truncate max-w-sm" title={scan.url}>
                      {scan.url}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#B794F6]/20 text-[#B794F6] border border-[#B794F6]/40">
                        Current View
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#A0A0B0] mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(scan.timestamp).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{scan.responseTimeMs}ms latency</span>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1c1b2f] text-[#B794F6] border border-[#B794F6]/40">
                      {scan.scanType === 'quick'
                        ? '1. Quick Scan'
                        : scan.scanType === 'stealth'
                        ? '3. Stealth Mode'
                        : '2. Full Assessment'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      scan.wafStrategy === 'allowlist-origin'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {scan.wafStrategy === 'allowlist-origin'
                        ? '5. Direct Origin'
                        : '4. Through WAF'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <div className="text-right">
                  <div className="text-xs font-bold font-mono text-white">
                    {totalVulns} Deficiencies
                  </div>
                  <div className="text-[10px] text-[#A0A0B0]">
                    {scan.counts.critical} Critical • {scan.counts.pass} Passed
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRescan(scan.url);
                    onNavigate('new-scan');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1c1b2f] text-[#B794F6] hover:bg-[#252538] border border-[#B794F6]/30 transition-colors"
                >
                  Rescan
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
