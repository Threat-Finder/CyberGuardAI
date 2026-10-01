import React, { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Clock,
  Filter,
  RefreshCw,
  Play,
  Pause,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import type { ScanResult } from '../types.js';

interface RealtimeChartsProps {
  history: ScanResult[];
  currentScan: ScanResult | null;
  isDarkMode?: boolean;
  refreshIntervalSec?: number;
  onSetRefreshIntervalSec?: (sec: number) => void;
  isContinuousMonitoring?: boolean;
  onToggleContinuousMonitoring?: () => void;
  onTriggerRefresh?: () => void;
}

type TimeFilterRange = 'ALL' | '15M' | '1H' | '6H' | '24H' | '7D' | 'CUSTOM';

export const RealtimeCharts: React.FC<RealtimeChartsProps> = ({
  history,
  currentScan,
  isDarkMode = true,
  refreshIntervalSec = 25,
  onSetRefreshIntervalSec,
  isContinuousMonitoring = false,
  onToggleContinuousMonitoring,
  onTriggerRefresh,
}) => {
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TimeFilterRange>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showCustomPicker, setShowCustomPicker] = useState<boolean>(false);

  const [localIntervalSec, setLocalIntervalSec] = useState<number>(() =>
    Math.max(5, refreshIntervalSec),
  );

  useEffect(() => {
    if (refreshIntervalSec) {
      setLocalIntervalSec(Math.max(5, refreshIntervalSec));
    }
  }, [refreshIntervalSec]);

  const TIMESLOT_OPTIONS = [
    { sec: 5, label: '05s (Fastest / API Protected)' },
    { sec: 10, label: '10s' },
    { sec: 15, label: '15s' },
    { sec: 30, label: '30s' },
    { sec: 60, label: '01m' },
    { sec: 300, label: '05m' },
  ];

  const handleIntervalChange = (newSec: number) => {
    const guardedSec = Math.max(5, newSec);
    setLocalIntervalSec(guardedSec);
    if (onSetRefreshIntervalSec) {
      onSetRefreshIntervalSec(guardedSec);
    }
  };

  const filteredHistory = useMemo(() => {
    if (selectedTimeFilter === 'ALL') return history;

    const now = Date.now();
    let cutoffMs = 0;

    switch (selectedTimeFilter) {
      case '15M':
        cutoffMs = now - 15 * 60 * 1000;
        break;
      case '1H':
        cutoffMs = now - 60 * 60 * 1000;
        break;
      case '6H':
        cutoffMs = now - 6 * 60 * 60 * 1000;
        break;
      case '24H':
        cutoffMs = now - 24 * 60 * 60 * 1000;
        break;
      case '7D':
        cutoffMs = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'CUSTOM':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate).getTime();
          const end = new Date(customEndDate).getTime() + 86400000;
          return history.filter((item) => {
            const t = new Date(item.timestamp).getTime();
            return t >= start && t <= end;
          });
        }
        return history;
      default:
        return history;
    }

    const filtered = history.filter((item) => new Date(item.timestamp).getTime() >= cutoffMs);
    return filtered.length > 0 ? filtered : history;
  }, [history, selectedTimeFilter, customStartDate, customEndDate]);

  const timelineData = useMemo(() => {
    return [...filteredHistory].reverse().map((item, idx) => {
      let hostname = 'Target';
      try {
        hostname = new URL(item.url).hostname.replace('www.', '');
      } catch {
        hostname = item.url;
      }
      const dateObj = new Date(item.timestamp);
      const timeLabel = dateObj.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      const dateLabel = dateObj.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
      return {
        index: idx + 1,
        target: hostname,
        displayLabel: `${hostname} (${timeLabel})`,
        time: timeLabel,
        fullDate: `${dateLabel} ${timeLabel}`,
        score: item.score,
        latency: item.responseTimeMs,
        vulns: item.counts.warn + item.counts.fail,
        passed: item.counts.pass,
      };
    });
  }, [filteredHistory]);

  const categoryData = currentScan
    ? [
        {
          category: 'Headers',
          pass: (currentScan.sections.securityHeaders || []).filter((h) => h.status === 'PASS').length,
          warn: (currentScan.sections.securityHeaders || []).filter((h) => h.status === 'WARN').length,
          fail: (currentScan.sections.securityHeaders || []).filter((h) => h.status === 'FAIL').length,
        },
        {
          category: 'Banners',
          pass: (currentScan.sections.bannerDisclosure || []).filter((b) => b.status === 'PASS').length,
          warn: (currentScan.sections.bannerDisclosure || []).filter((b) => b.status === 'WARN').length,
          fail: 0,
        },
        {
          category: 'Cookies',
          pass: (currentScan.sections.cookieSecurity || []).filter((c) => c.status === 'PASS').length,
          warn: (currentScan.sections.cookieSecurity || []).filter((c) => c.status === 'WARN').length,
          fail: (currentScan.sections.cookieSecurity || []).filter((c) => c.status === 'FAIL').length,
        },
        {
          category: 'SSL/TLS',
          pass: (currentScan.sections.sslTls || []).filter((s) => s.status === 'PASS').length,
          warn: (currentScan.sections.sslTls || []).filter((s) => s.status === 'WARN').length,
          fail: (currentScan.sections.sslTls || []).filter((s) => s.status === 'FAIL').length,
        },
        {
          category: 'Redirect',
          pass: (currentScan.sections.httpsRedirect || []).filter((r) => r.status === 'PASS').length,
          warn: (currentScan.sections.httpsRedirect || []).filter((r) => r.status === 'WARN').length,
          fail: (currentScan.sections.httpsRedirect || []).filter((r) => r.status === 'FAIL').length,
        },
      ]
    : [];

  const gridStroke = '#1e293b';
  const axisColor = '#94a3b8';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 cyber-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div className="flex flex-col gap-3 pb-3 border-b border-[var(--panel-border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--accent-purple)]" />
                <h3 className="text-base font-bold text-[var(--text-heading)] tracking-wide">
                  Real-Time Security Posture & Latency Trend
                </h3>
              </div>
              <p className="text-xs text-[var(--text-body)]">
                Audit score (0-100) and HTTP response latency (ms) across recent targets
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-xs shadow-indigo-500" />
                Score
              </span>
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-xs shadow-cyan-400" />
                Latency (ms)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1 bg-[#080d16] p-1 rounded-xl border border-slate-800 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3 text-cyan-400" />
                Filter:
              </span>
              {(['ALL', '15M', '1H', '6H', '24H', 'CUSTOM'] as TimeFilterRange[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    setSelectedTimeFilter(tf);
                    if (tf === 'CUSTOM') setShowCustomPicker(true);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedTimeFilter === tf
                      ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-500/50 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tf === 'ALL'
                    ? 'Live'
                    : tf === '15M'
                    ? '15m'
                    : tf === '1H'
                    ? '1h'
                    : tf === '6H'
                    ? '6h'
                    : tf === '24H'
                    ? '24h'
                    : 'Custom'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#080d16] px-2.5 py-1.5 rounded-xl border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="text-xs text-slate-400 font-medium">Timeslot:</span>
                <select
                  value={localIntervalSec}
                  onChange={(e) => handleIntervalChange(Number(e.target.value))}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer"
                >
                  {TIMESLOT_OPTIONS.map((opt) => (
                    <option key={opt.sec} value={opt.sec} className="bg-slate-900 text-white">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {onToggleContinuousMonitoring && (
                <button
                  onClick={onToggleContinuousMonitoring}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isContinuousMonitoring
                      ? 'bg-emerald-950/70 text-emerald-400 border-emerald-500/50 shadow-xs shadow-emerald-950'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                  title={isContinuousMonitoring ? 'Pause auto-monitoring' : 'Start auto-monitoring'}
                >
                  {isContinuousMonitoring ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>{localIntervalSec}s Loop</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-cyan-400" />
                      <span>Start Poll</span>
                    </>
                  )}
                </button>
              )}

              {onTriggerRefresh && (
                <button
                  onClick={onTriggerRefresh}
                  className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Trigger immediate scan update"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Telemetry Auto-Polling Active (&ge;05 seconds guardrail)</span>
            </span>
            <span className="font-mono text-cyan-400 font-bold">
              Interval: {localIntervalSec}s
            </span>
          </div>

          {selectedTimeFilter === 'CUSTOM' && showCustomPicker && (
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none"
              />
              <span className="text-slate-400">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 outline-none"
              />
            </div>
          )}
        </div>

        <div className="h-68 w-full">
          {timelineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="latencyGradNew" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#06b6d4' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#0b121f] border border-cyan-500/40 text-white p-3 rounded-xl text-xs shadow-2xl space-y-1.5">
                          <div className="font-bold text-cyan-400 border-b border-slate-800 pb-1">
                            {data.target}
                          </div>
                          <div className="text-purple-300 flex items-center justify-between gap-4">
                            <span>Security Score:</span>
                            <span className="font-mono font-bold">{data.score} / 100</span>
                          </div>
                          <div className="text-cyan-400 flex items-center justify-between gap-4">
                            <span>HTTP Latency:</span>
                            <span className="font-mono font-bold">{data.latency} ms</span>
                          </div>
                          <div className="text-slate-400 text-[10px] pt-1">
                            Timestamp: {data.fullDate}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="score"
                  stroke="#a855f7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreGradNew)"
                  name="Security Score"
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="latency"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#latencyGradNew)"
                  name="Latency (ms)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              No historical data available for selected filter
            </div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 cyber-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
        <div className="pb-3 border-b border-[var(--panel-border)] space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent-purple)]" />
            <h3 className="text-base font-bold text-[var(--text-heading)] tracking-wide">
              Vulnerability Breakdown by Domain
            </h3>
          </div>
          <p className="text-xs text-[var(--text-body)]">
            Pass vs Warn vs Fail across inspected security layers
          </p>
        </div>

        <div className="h-68 w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis
                  dataKey="category"
                  tick={{ fontSize: 11, fill: axisColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#0b121f] border border-slate-700 text-white p-2.5 rounded-xl text-xs shadow-xl space-y-1">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">
                            {label} Layer
                          </div>
                          <div className="text-emerald-400 flex items-center justify-between gap-4">
                            <span>Passed:</span>
                            <span className="font-mono font-bold">{payload[0]?.value}</span>
                          </div>
                          <div className="text-amber-400 flex items-center justify-between gap-4">
                            <span>Warnings:</span>
                            <span className="font-mono font-bold">{payload[1]?.value}</span>
                          </div>
                          <div className="text-rose-400 flex items-center justify-between gap-4">
                            <span>Failures:</span>
                            <span className="font-mono font-bold">{payload[2]?.value}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="pass" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} name="Passed" />
                <Bar dataKey="warn" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Warnings" />
                <Bar dataKey="fail" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failures" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Run scan to populate breakdown
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
