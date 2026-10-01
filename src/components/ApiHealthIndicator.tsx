import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  X,
  Radio,
  Cpu,
  Play,
  Pause,
  ArrowUpRight,
  TrendingDown,
  Layers,
  Key,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { ApiHealthStatus, ApiTelemetryPoint } from '../types.js';

interface ApiHealthIndicatorProps {
  variant?: 'badge' | 'compact' | 'detailed';
  onHealthUpdate?: (health: ApiHealthStatus) => void;
}

export const ApiHealthIndicator: React.FC<ApiHealthIndicatorProps> = ({
  onHealthUpdate,
}) => {
  const [health, setHealth] = useState<ApiHealthStatus>({
    live: true,
    status: 'OPERATIONAL',
    model: 'gemini-3.8-flash',
    latencyMs: 142,
    message: 'Gemini 3.8 Flash Operational',
    timestamp: new Date().toISOString(),
    quotaStatus: 'Healthy',
    endpoint: 'google.ai.generativelanguage.v1beta',
    proxyProtected: true,
    history: [],
  });

  const [telemetry, setTelemetry] = useState<ApiTelemetryPoint[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const streamTimerRef = useRef<any>(null);

  // Runtime API Key Ingestion State
  const [inputApiKey, setInputApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputApiKey.trim() || isSavingKey) return;

    setIsSavingKey(true);
    setKeyFeedback(null);

    try {
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputApiKey.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate and activate Gemini API Key.');
      }

      setKeyFeedback({
        type: 'success',
        message: data.message || 'API Key validated and live! System is now OPERATIONAL.',
      });
      setInputApiKey('');
      await fetchHealth(true);
      window.dispatchEvent(new CustomEvent('gemini-key-updated'));
    } catch (err: any) {
      setKeyFeedback({
        type: 'error',
        message: err.message || 'Error configuring API Key.',
      });
    } finally {
      setIsSavingKey(false);
    }
  };

  const fetchHealth = async (isManualPing = false) => {
    setIsChecking(true);
    try {
      const res = await fetch(`/api/gemini-status${isManualPing ? '?fresh=true' : ''}`);
      if (res.ok) {
        const data: ApiHealthStatus = await res.json();
        setHealth(data);
        if (data.history && data.history.length > 0) {
          setTelemetry(data.history);
        } else {
          // If no history returned, append current reading
          const newPt: ApiTelemetryPoint = {
            id: 'pt-' + Date.now(),
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timestamp: Date.now(),
            latencyMs: data.latencyMs || 120,
            connectivityPercent: data.live ? (data.status === 'OPERATIONAL' ? 100 : 80) : 0,
            status: data.status,
            live: data.live,
          };
          setTelemetry((prev) => [...prev.slice(-24), newPt]);
        }
        if (onHealthUpdate) {
          onHealthUpdate(data);
        }
      }
    } catch {
      const failPt: ApiTelemetryPoint = {
        id: 'pt-' + Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: Date.now(),
        latencyMs: 0,
        connectivityPercent: 0,
        status: 'OFFLINE',
        live: false,
      };
      setTelemetry((prev) => [...prev.slice(-24), failPt]);
      setHealth((prev) => ({
        ...prev,
        live: false,
        status: 'OFFLINE',
        message: 'API Endpoint Unreachable',
      }));
    } finally {
      setIsChecking(false);
    }
  };

  // Initial fetch and global event listener
  useEffect(() => {
    fetchHealth();

    // Listen for custom event to open health modal from other screens if scan is blocked
    const handleOpenEvent = () => {
      setIsModalOpen(true);
      fetchHealth(true);
    };
    window.addEventListener('open-api-health', handleOpenEvent);

    const handleKeyUpdated = () => {
      fetchHealth(true);
    };
    window.addEventListener('gemini-key-updated', handleKeyUpdated);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('open-api-health', handleOpenEvent);
      window.removeEventListener('gemini-key-updated', handleKeyUpdated);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Real-time live graph polling when modal is open
  useEffect(() => {
    if (isModalOpen && isLiveStreaming) {
      // Poll every 3 seconds while modal is open for live graph motion
      streamTimerRef.current = setInterval(() => {
        fetchHealth(true);
      }, 3000);
    } else {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [isModalOpen, isLiveStreaming]);

  // Periodic background check every 30s when modal is closed
  useEffect(() => {
    if (!isModalOpen) {
      const interval = setInterval(() => fetchHealth(false), 30000);
      return () => clearInterval(interval);
    }
  }, [isModalOpen]);

  const getStatusColor = () => {
    if (health.status === 'OPERATIONAL' && health.live) {
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
        glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
        badge: 'Operational',
      };
    }
    if (health.status === 'DEGRADED' || health.live) {
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        dot: 'bg-amber-400',
        glow: 'shadow-[0_0_12px_rgba(245,158,11,0.25)]',
        badge: 'Degraded',
      };
    }
    return {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/30',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      glow: 'shadow-[0_0_12px_rgba(239,68,68,0.25)]',
      badge: 'Offline',
    };
  };

  const colors = getStatusColor();

  // Graph metrics calculation
  const totalSamples = telemetry.length;
  const successfulSamples = telemetry.filter((t) => t.live).length;
  const uptimeRate = totalSamples > 0 ? Math.round((successfulSamples / totalSamples) * 100) : 100;
  const avgLatency = totalSamples > 0
    ? Math.round(telemetry.reduce((acc, t) => acc + (t.latencyMs || 0), 0) / totalSamples)
    : health.latencyMs;

  return (
    <>
      {/* Navbar Pill Badge Trigger */}
      <button
        id="api-health-navbar-btn"
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${colors.bg} ${colors.border} ${colors.text} ${colors.glow} hover:opacity-95`}
        title="Click to view Live Real-Time API Health Graph & Diagnostics"
      >
        <span className="relative flex h-2 w-2">
          {health.live && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
        </span>

        <span className="font-mono tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">API Health:</span>
          <span>{colors.badge}</span>
        </span>

        <span className="hidden md:inline text-[10px] font-mono opacity-80 pl-1 border-l border-current/20">
          {health.latencyMs}ms
        </span>
      </button>

      {/* Diagnostics Modal with 1 Live Real-Time Graph */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-2xl p-4 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            id="api-health-modal"
            className="w-full max-w-2xl cyber-card rounded-3xl border-2 border-[var(--accent-purple)]/60 bg-[var(--panel-bg)] shadow-[0_25px_90px_rgba(0,0,0,0.95),0_0_60px_rgba(183,148,246,0.35),0_0_0_1px_rgba(183,148,246,0.5)] overflow-hidden transition-all animate-in fade-in-50 zoom-in-95 duration-250 ease-out relative my-auto max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--sidebar-border)] bg-[var(--navbar-bg)] shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${colors.bg} ${colors.border} ${colors.text}`}>
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text-heading)]">
                      Real-Time Gemini API Health & Connectivity
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${colors.bg} ${colors.border} ${colors.text}`}>
                      {health.live ? 'LIVE CONNECTED' : 'OFFLINE'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-body)]">
                    Direct telemetry streaming for <strong className="text-[var(--accent-purple)] font-mono">{health.model}</strong>
                  </p>
                </div>
              </div>
              <button
                id="close-api-health-modal-btn"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--subtle-bg)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Scan Dependency Enforcement Banner */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                health.live
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}>
                <div className="flex items-center gap-2.5">
                  {health.live ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>
                    <strong>Scan Gate Status: </strong>
                    {health.live
                      ? 'API Verified. Security assessment scans are fully authorized and enabled.'
                      : 'API Disconnected. Scanning is locked until API connection is restored.'}
                  </span>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-black/30 border border-current/20">
                  Strict Enforcement
                </span>
              </div>

              {/* Runtime API Key Ingestion & Activation Area */}
              <div className="p-4 rounded-2xl bg-[var(--subtle-bg)] border border-[var(--accent-purple)]/40 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[var(--accent-purple)]" />
                    <span className="text-xs font-bold text-[var(--text-heading)]">
                      Runtime Gemini API Key Configuration
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30 font-bold">
                    Zero Server Restart
                  </span>
                </div>

                <p className="text-[11px] text-[var(--text-body)]">
                  Forgot to set the API Key before launching? Enter or update your Google Gemini API key below to activate the scanner pipeline in real-time without restarting the server.
                </p>

                <form onSubmit={handleSaveApiKey} className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        id="runtime-gemini-key-input"
                        type={showApiKey ? 'text' : 'password'}
                        value={inputApiKey}
                        onChange={(e) => {
                          setInputApiKey(e.target.value);
                          setKeyFeedback(null);
                        }}
                        placeholder="Paste Gemini API Key (e.g., AIzaSy...)"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-xs font-mono text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-purple)] transition-colors shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-body)] hover:text-[var(--text-heading)] transition-colors p-1 cursor-pointer"
                        title={showApiKey ? 'Hide Key' : 'Show Key'}
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingKey || !inputApiKey.trim()}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-sm disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5"
                    >
                      {isSavingKey ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Activating...</span>
                        </>
                      ) : (
                        <>
                          <Key className="w-3.5 h-3.5" />
                          <span>Save & Activate Key</span>
                        </>
                      )}
                    </button>
                  </div>

                  {keyFeedback && (
                    <div
                      className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border animate-in fade-in ${
                        keyFeedback.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {keyFeedback.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span className="text-[11px] font-medium">{keyFeedback.message}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Real-time KPI Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)]">
                  <div className="text-[10px] font-mono text-[var(--text-body)] uppercase">
                    Current Latency
                  </div>
                  <div className="text-lg font-black font-mono text-[var(--accent-purple)] mt-1 flex items-baseline gap-1">
                    <span>{health.latencyMs}</span>
                    <span className="text-xs font-normal opacity-70">ms</span>
                  </div>
                  <div className="text-[10px] text-[var(--text-body)] mt-0.5">
                    Avg: {avgLatency} ms
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)]">
                  <div className="text-[10px] font-mono text-[var(--text-body)] uppercase">
                    Connectivity Score
                  </div>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-1">
                    {uptimeRate}%
                  </div>
                  <div className="text-[10px] text-[var(--text-body)] mt-0.5">
                    {successfulSamples}/{totalSamples} Samples
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)]">
                  <div className="text-[10px] font-mono text-[var(--text-body)] uppercase">
                    Active Model
                  </div>
                  <div className="text-xs font-bold font-mono text-[var(--text-heading)] mt-1.5 truncate" title={health.model}>
                    {health.model}
                  </div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">
                    {health.quotaStatus}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)]">
                  <div className="text-[10px] font-mono text-[var(--text-body)] uppercase">
                    Proxy Isolation
                  </div>
                  <div className="text-xs font-bold font-mono text-cyan-400 mt-1.5">
                    Zero-Exposure
                  </div>
                  <div className="text-[10px] text-[var(--text-body)] mt-0.5">
                    Server Enforced
                  </div>
                </div>
              </div>

              {/* 1 LIVE GRAPH OF REAL-TIME API HEALTH & CONNECTIVITY */}
              <div className="p-4 rounded-2xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--panel-border)]">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[var(--accent-purple)] animate-pulse" />
                    <span className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                      Live Telemetry & Latency Waveform
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent-purple)]/15 text-[var(--accent-purple)] border border-[var(--accent-purple)]/30">
                      Real-Time Graph
                    </span>
                  </div>

                  {/* Real-time Graph Stream Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsLiveStreaming(!isLiveStreaming)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        isLiveStreaming
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-[var(--panel-bg)] text-[var(--text-body)] border-[var(--panel-border)]'
                      }`}
                      title={isLiveStreaming ? 'Pause live stream' : 'Resume live stream'}
                    >
                      {isLiveStreaming ? (
                        <>
                          <Pause className="w-3 h-3 fill-current" />
                          <span>Stream: 3s</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current text-emerald-400" />
                          <span>Stream Paused</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => fetchHealth(true)}
                      disabled={isChecking}
                      className="p-1 px-2 rounded-lg bg-[var(--panel-bg)] hover:bg-[var(--sidebar-border)] border border-[var(--panel-border)] text-xs text-[var(--text-body)] hover:text-[var(--text-heading)] transition-colors cursor-pointer flex items-center gap-1"
                      title="Ping API Now"
                    >
                      <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                      <span>Ping</span>
                    </button>
                  </div>
                </div>

                {/* Graph Visualization Container */}
                <div className="h-52 w-full pt-1">
                  {telemetry.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={telemetry}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="apiLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                          </linearGradient>
                          <linearGradient id="apiConnectGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#252538" />
                        <XAxis
                          dataKey="time"
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="latency"
                          tick={{ fontSize: 10, fill: '#a855f7' }}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 'auto']}
                        />
                        <YAxis
                          yAxisId="connect"
                          orientation="right"
                          domain={[0, 100]}
                          tick={{ fontSize: 10, fill: '#06b6d4' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d: ApiTelemetryPoint = payload[0].payload;
                              return (
                                <div className="bg-[#0b121f] border border-[var(--accent-purple)]/50 text-white p-3 rounded-xl text-xs shadow-2xl space-y-1.5 font-sans">
                                  <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-1">
                                    <span className="font-bold text-[var(--accent-purple)]">
                                      Gemini Telemetry Sample
                                    </span>
                                    <span className="font-mono text-[10px] text-slate-400">
                                      {d.time}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-purple-300">
                                    <span>Latency:</span>
                                    <span className="font-mono font-bold">{d.latencyMs} ms</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-cyan-300">
                                    <span>Connectivity:</span>
                                    <span className="font-mono font-bold">{d.connectivityPercent}%</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-slate-300">
                                    <span>Status:</span>
                                    <span className={`font-mono font-bold text-[10px] ${
                                      d.status === 'OPERATIONAL' ? 'text-emerald-400' : 'text-amber-400'
                                    }`}>
                                      {d.status}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Area
                          yAxisId="latency"
                          type="monotone"
                          dataKey="latencyMs"
                          stroke="#8b5cf6"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#apiLatencyGrad)"
                          name="Response Latency (ms)"
                        />
                        <Area
                          yAxisId="connect"
                          type="monotone"
                          dataKey="connectivityPercent"
                          stroke="#06b6d4"
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                          fillOpacity={1}
                          fill="url(#apiConnectGrad)"
                          name="Connectivity %"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-xs text-[var(--text-body)]">
                      Sampling telemetry data points...
                    </div>
                  )}
                </div>

                {/* Graph Legend & Status */}
                <div className="flex items-center justify-between text-[11px] text-[var(--text-body)] pt-1 px-1">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] inline-block shadow-xs shadow-[#8b5cf6]" />
                      <span>Response Latency (ms)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-cyan-400 inline-block" />
                      <span>Connectivity Index (0-100%)</span>
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--accent-purple)]">
                    {telemetry.length} data samples streamed
                  </span>
                </div>
              </div>

              {/* Status Message & Endpoint Information */}
              <div className="p-3 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] text-xs text-[var(--text-body)] flex items-start gap-2.5">
                <Cpu className="w-4 h-4 text-[var(--accent-purple)] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold text-[var(--text-heading)]">Diagnostics Message: </span>
                  <p className="text-[11px] font-mono text-[var(--text-body)]">{health.message}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--sidebar-border)] bg-[var(--navbar-bg)] flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono text-[var(--text-body)]">
                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--subtle-bg)] transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  id="test-gemini-connection-btn"
                  onClick={() => fetchHealth(true)}
                  disabled={isChecking}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>{isChecking ? 'Pinging Gateway...' : 'Ping Live Gateway'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
