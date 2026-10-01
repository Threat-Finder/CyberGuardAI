import React from 'react';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Globe,
  Lock,
  Terminal,
  ChevronRight,
  Zap,
} from 'lucide-react';
import type { ScanResult } from '../../types.js';
import { ThreatRadarMap } from '../ThreatRadarMap.js';
import { RealtimeCharts } from '../RealtimeCharts.js';
import { enrichFindingWithCve } from '../../utils/cveMapping.js';

interface DashboardScreenProps {
  currentScan: ScanResult | null;
  history: ScanResult[];
  onNavigate: (screen: 'dashboard' | 'new-scan' | 'results' | 'history') => void;
  onSelectCategory?: (category: string) => void;
  monitoringIntervalSec: number;
  onSetMonitoringInterval: (sec: number) => void;
  isContinuousMonitoring: boolean;
  onToggleContinuousMonitoring: () => void;
  onTriggerRefresh: () => void;
  onStartNewScan: (url: string) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  currentScan,
  history,
  onNavigate,
  onSelectCategory,
  monitoringIntervalSec,
  onSetMonitoringInterval,
  isContinuousMonitoring,
  onToggleContinuousMonitoring,
  onTriggerRefresh,
  onStartNewScan,
}) => {
  if (!currentScan) {
    return (
      <div className="p-12 text-center cyber-card rounded-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#1c1b2f] border border-[#B794F6]/40 flex items-center justify-center mx-auto text-[#B794F6]">
          <Activity className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-white">No Target Scanned Yet</h2>
        <p className="text-sm text-[#A0A0B0] max-w-md mx-auto">
          Launch your first passive vulnerability assessment to populate the Cyber Guard telemetry dashboard.
        </p>
        <button
          onClick={() => onNavigate('new-scan')}
          className="px-6 py-2.5 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-[0_0_20px_rgba(183,148,246,0.4)]"
        >
          Launch New Scan
        </button>
      </div>
    );
  }

  const score = currentScan.score;
  const grade = currentScan.grade;

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const critCount = currentScan.counts.critical;
  const highCount = (currentScan.sections.securityHeaders || []).filter(
    (h) => h.status === 'WARN' && h.severity === 'HIGH',
  ).length;
  const medCount = currentScan.counts.warn;
  const passCount = currentScan.counts.pass;

  const recentFindings = [
    ...(currentScan.sections.securityHeaders || []),
    ...(currentScan.sections.sslTls || []),
    ...(currentScan.sections.cookieSecurity || []),
    ...(currentScan.sections.bannerDisclosure || []),
  ]
    .filter((f) => f.status === 'WARN' || f.status === 'FAIL')
    .slice(0, 4)
    .map(enrichFindingWithCve);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 cyber-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-purple)]" />
              <h3 className="text-sm font-bold text-[var(--text-heading)] uppercase tracking-wider">
                Risk Score Gauge
              </h3>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                score >= 80
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : score >= 60
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              Grade {grade}
            </span>
          </div>

          <div className="my-6 flex items-center justify-around">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="var(--panel-border)"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke={score >= 80 ? '#10B981' : score >= 60 ? '#B794F6' : '#EF4444'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black font-mono text-[var(--text-heading)] tracking-tight">
                  {score}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-body)]">
                  out of 100
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <div className="text-xs text-[var(--text-body)] font-medium">Posture Status</div>
                <div className="text-sm font-bold text-[var(--text-heading)]">
                  {score >= 80 ? 'Hardened Defense' : score >= 60 ? 'Moderate Exposure' : 'Action Required'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-body)] font-medium">Verified Checks</div>
                <div className="text-sm font-mono font-bold text-[var(--accent-purple)]">
                  {passCount} / {passCount + currentScan.counts.warn + currentScan.counts.fail} rules
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-body)] font-medium">Response Time</div>
                <div className="text-sm font-mono text-[var(--text-heading)]">
                  {currentScan.responseTimeMs} ms
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between text-xs text-[var(--text-body)]">
            <span>Automated VAPT Assessment</span>
            <span className="text-[var(--accent-purple)] font-semibold">Engine Verified</span>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4 flex flex-col justify-between">
          <div className="cyber-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--subtle-bg)] border border-[var(--panel-border)] flex items-center justify-center text-[var(--accent-purple)] shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs text-[var(--text-body)] font-medium">Active Assessment Target</div>
                <div className="text-sm font-bold text-[var(--text-heading)] font-mono truncate" title={currentScan.url}>
                  {currentScan.url}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => onNavigate('results')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--subtle-bg)] hover:bg-[var(--panel-border)] text-[var(--accent-purple)] border border-[var(--panel-border)] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>View Results</span>
              </button>
              <button
                id="dashboard-scan-now-btn"
                onClick={() => onNavigate('new-scan')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer flex items-center gap-1.5 shadow-[0_0_12px_rgba(183,148,246,0.35)]"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Scan Now</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div
              onClick={() => onNavigate('results')}
              className="cyber-card rounded-2xl p-4 cursor-pointer hover:border-red-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                  Critical
                </span>
                <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-[var(--text-heading)] group-hover:text-red-400 transition-colors">
                {critCount}
              </div>
              <div className="text-[11px] text-[var(--text-body)] mt-0.5">Urgent CVEs</div>
            </div>

            <div
              onClick={() => onNavigate('results')}
              className="cyber-card rounded-2xl p-4 cursor-pointer hover:border-orange-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                  High
                </span>
                <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-[var(--text-heading)] group-hover:text-orange-400 transition-colors">
                {highCount}
              </div>
              <div className="text-[11px] text-[var(--text-body)] mt-0.5">High Severity</div>
            </div>

            <div
              onClick={() => onNavigate('results')}
              className="cyber-card rounded-2xl p-4 cursor-pointer hover:border-yellow-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">
                  Medium
                </span>
                <span className="w-2 h-2 rounded-full bg-[#EAB308]" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-[var(--text-heading)] group-hover:text-yellow-400 transition-colors">
                {medCount}
              </div>
              <div className="text-[11px] text-[var(--text-body)] mt-0.5">Warnings</div>
            </div>

            <div
              onClick={() => onNavigate('results')}
              className="cyber-card rounded-2xl p-4 cursor-pointer hover:border-emerald-500/50 transition-all group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                  Low / Clean
                </span>
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              </div>
              <div className="mt-2 text-2xl font-black font-mono text-[var(--text-heading)] group-hover:text-emerald-400 transition-colors">
                {passCount}
              </div>
              <div className="text-[11px] text-[var(--text-body)] mt-0.5">Passed Checks</div>
            </div>
          </div>

          <div className="cyber-card rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-[var(--accent-purple)]" />
              <div>
                <span className="text-[var(--text-heading)] font-semibold">SSL/TLS Encryption: </span>
                <span className="text-[var(--text-body)]">
                  {currentScan.sslDetails?.issuer || 'Let\'s Encrypt'} • {currentScan.sslDetails?.protocol || 'TLS 1.3'}
                </span>
              </div>
            </div>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                currentScan.sslDetails?.valid
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {currentScan.sslDetails?.daysRemaining}d Left
            </span>
          </div>
        </div>
      </div>

      <div className="cyber-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[var(--accent-purple)]" />
            <h3 className="text-base font-bold text-[var(--text-heading)]">
              Recent Vulnerabilities & CVE Detections
            </h3>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="text-xs font-semibold text-[var(--accent-purple)] hover:opacity-80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Findings ({recentFindings.length + critCount})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentFindings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--panel-border)] text-[var(--text-body)]">
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Severity</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">CVE / CWE</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Vulnerability Title</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Category</th>
                  <th className="py-2.5 px-3 font-semibold uppercase tracking-wider text-right">CVSS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--panel-border)]">
                {recentFindings.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onNavigate('results')}
                    className="hover:bg-[var(--subtle-bg)] transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : item.severity === 'HIGH'
                            ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                            : item.severity === 'MEDIUM'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[var(--accent-purple)] font-bold">
                      {item.cveId || 'CVE-2024-GEN'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[var(--text-heading)]">{item.title}</div>
                      <div className="text-[11px] text-[var(--text-body)] truncate max-w-md">
                        {item.detail}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[var(--text-body)] font-medium">
                      {item.category}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-[var(--text-heading)]">
                      {item.cvssScore?.toFixed(1) || '5.0'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>No critical vulnerabilities detected on target host.</span>
          </div>
        )}
      </div>

      <ThreatRadarMap
        currentScan={currentScan}
        onSelectCategory={onSelectCategory}
      />

      <RealtimeCharts
        history={history}
        currentScan={currentScan}
        isDarkMode={true}
        refreshIntervalSec={monitoringIntervalSec}
        onSetRefreshIntervalSec={onSetMonitoringInterval}
        isContinuousMonitoring={isContinuousMonitoring}
        onToggleContinuousMonitoring={onToggleContinuousMonitoring}
        onTriggerRefresh={onTriggerRefresh}
      />
    </div>
  );
};
