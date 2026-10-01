import React, { useState, useEffect } from 'react';
import {
  Globe,
  Zap,
  Shield,
  EyeOff,
  Layers,
  Sliders,
  ChevronRight,
  Info,
  Play,
  RefreshCw,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import type { ScanResult } from '../../types.js';
import { ScanProgressBar } from '../ScanProgressBar.js';

interface NewScanScreenProps {
  onStartScan: (targetUrl: string, scanType: 'quick' | 'full' | 'stealth') => Promise<void>;
  isScanning: boolean;
  scanPhase: string;
  currentScan: ScanResult | null;
  onNavigate: (screen: 'dashboard' | 'new-scan' | 'results' | 'history') => void;
}

export const NewScanScreen: React.FC<NewScanScreenProps> = ({
  onStartScan,
  isScanning,
  scanPhase,
  currentScan,
  onNavigate,
}) => {
  const [targetInput, setTargetInput] = useState('');
  const [scanType, setScanType] = useState<'quick' | 'full' | 'stealth'>('full');
  const [wafStrategy, setWafStrategy] = useState<'through-waf' | 'allowlist-origin'>('through-waf');

  const [auditHeaders, setAuditHeaders] = useState(true);
  const [auditSsl, setAuditSsl] = useState(true);
  const [auditCookies, setAuditCookies] = useState(true);
  const [auditBanners, setAuditBanners] = useState(true);
  const [auditRobots, setAuditRobots] = useState(true);

  const [isApiLive, setIsApiLive] = useState<boolean>(true);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);

  // Check API status
  const verifyApiStatus = async () => {
    try {
      const res = await fetch('/api/gemini-status');
      if (res.ok) {
        const data = await res.json();
        setIsApiLive(!!data.live);
        if (!data.live) {
          setApiErrorMessage(data.message || 'Gemini API is currently unreachable.');
        } else {
          setApiErrorMessage(null);
        }
      }
    } catch {
      setIsApiLive(false);
      setApiErrorMessage('Failed to connect to API gateway.');
    }
  };

  useEffect(() => {
    verifyApiStatus();
    const interval = setInterval(verifyApiStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const openHealthModal = () => {
    window.dispatchEvent(new CustomEvent('open-api-health'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetInput.trim() || isScanning) return;

    if (!isApiLive) {
      openHealthModal();
      return;
    }

    await onStartScan(targetInput.trim(), scanType);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Configure & Launch Vulnerability Assessment
          </h2>
          <p className="text-xs text-[#A0A0B0] mt-1">
            Perform non-destructive passive reconnaissance, TLS handshake inspection, and CVE attack surface correlation.
          </p>
        </div>

        {currentScan && (
          <button
            type="button"
            id="top-view-full-results-btn"
            onClick={() => onNavigate('results')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-[0_0_15px_rgba(183,148,246,0.35)] shrink-0 self-start sm:self-auto"
          >
            <span>View Full Results</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Without API Warning Banner if offline */}
      {!isApiLive && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-200">
                Scan Initiation Locked: API Connectivity Required
              </div>
              <p className="text-[11px] text-rose-300/90 mt-0.5">
                {apiErrorMessage || 'Scanning is blocked because active Gemini API connectivity is required. Please check API Health & Diagnostics.'}
              </p>
            </div>
          </div>
          <button
            onClick={openHealthModal}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Open API Health Monitor</span>
          </button>
        </div>
      )}

      {(isScanning || currentScan) && (
        <ScanProgressBar
          isScanning={isScanning}
          scanPhase={scanPhase}
          currentScan={currentScan}
        />
      )}

      {currentScan && !isScanning && (
        <div className="cyber-card rounded-2xl p-5 border border-emerald-500/30 bg-emerald-950/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-bold text-lg text-emerald-400">
              {currentScan.grade}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#A0A0B0] font-medium">Completed Assessment:</span>
                <span className="font-mono text-xs font-bold text-white">{currentScan.url}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
                  Score: {currentScan.score}/100
                </span>
              </div>
              <p className="text-xs text-[#A0A0B0] mt-1">
                {currentScan.counts.pass} checks passed • {currentScan.counts.warn + currentScan.counts.fail} deficiencies identified
              </p>
            </div>
          </div>

          <button
            type="button"
            id="new-scan-view-full-results-btn"
            onClick={() => onNavigate('results')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-[0_0_20px_rgba(183,148,246,0.4)] whitespace-nowrap self-stretch sm:self-auto"
          >
            <span>View Full Results</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="cyber-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#B794F6]" />
              <label htmlFor="target-input-field" className="text-sm font-bold text-white uppercase tracking-wider">
                Target Domain or URL
              </label>
            </div>
            <span className="text-[11px] text-[#A0A0B0] font-mono">
              Passive External Surface
            </span>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#A0A0B0]">
              <Globe className="w-4 h-4 text-[#B794F6]" />
            </div>
            <input
              id="target-input-field"
              type="text"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder="e.g. example.com, https://my-target.com"
              disabled={isScanning}
              className="w-full pl-11 pr-4 py-3 bg-[var(--subtle-bg)] border border-[var(--panel-border)] rounded-xl text-sm font-mono text-[var(--text-heading)] placeholder-[var(--text-body)]/40 focus:outline-none focus:border-[var(--accent-purple)] focus:ring-1 focus:ring-[var(--accent-purple)] transition-all"
            />
          </div>
        </div>

        <div className="cyber-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#B794F6]" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Select Scan Profile
              </span>
            </div>
            <span className="text-[11px] text-[#B794F6] font-mono">
              3 Profiles Available
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setScanType('quick')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                scanType === 'quick'
                  ? 'bg-[#1c1b2f] border-[#B794F6] shadow-[0_0_15px_rgba(183,148,246,0.2)]'
                  : 'bg-[#0A0A0F] border-[#252538] hover:border-[#B794F6]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Quick Scan</span>
                  <Zap className="w-4 h-4 text-[#B794F6]" />
                </div>
                <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                  Perimeter & WAF assessment: Scans through active WAF layers, verifying edge filters, SSL expiry, and immediate perimeter leaks.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#252538] text-[10px] font-mono text-[#B794F6]">
                Duration: ~3-5 seconds • WAF-Aware
              </div>
            </div>

            <div
              onClick={() => setScanType('full')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                scanType === 'full'
                  ? 'bg-[#1c1b2f] border-[#B794F6] shadow-[0_0_15px_rgba(183,148,246,0.2)]'
                  : 'bg-[#0A0A0F] border-[#252538] hover:border-[#B794F6]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Full Assessment</span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                  Comprehensive audit evaluating all 7 vectors with origin analysis. Supports WAF allowlisting coordination for origin inspection.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#252538] text-[10px] font-mono text-emerald-400">
                Recommended • Origin Depth
              </div>
            </div>

            <div
              onClick={() => setScanType('stealth')}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                scanType === 'stealth'
                  ? 'bg-[#1c1b2f] border-[#B794F6] shadow-[0_0_15px_rgba(183,148,246,0.2)]'
                  : 'bg-[#0A0A0F] border-[#252538] hover:border-[#B794F6]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">Stealth Mode</span>
                  <EyeOff className="w-4 h-4 text-purple-400" />
                </div>
                <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                  Passive asset discovery: Maps host IPs, certificate SAN subdomains, TLS certificates, and header security benchmarks without alert noise.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#252538] text-[10px] font-mono text-purple-400">
                Zero Intrusion • Asset Recon
              </div>
            </div>
          </div>
        </div>

        <div className="cyber-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#B794F6]" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                WAF Routing & Inspection Strategy
              </span>
            </div>
            <span className="text-[11px] text-[#B794F6] font-mono">
              Perimeter Routing
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={() => setWafStrategy('through-waf')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                wafStrategy === 'through-waf'
                  ? 'bg-[#1c1b2f] border-[#B794F6] shadow-[0_0_15px_rgba(183,148,246,0.2)]'
                  : 'bg-[#0A0A0F] border-[#252538] hover:border-[#B794F6]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">VA Scan Through WAF</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Standard Mode
                </span>
              </div>
              <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                Inspects external attack surface through active WAF layers (Cloudflare, AWS WAF, Akamai) to assess edge filtering rules.
              </p>
            </div>

            <div
              onClick={() => setWafStrategy('allowlist-origin')}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                wafStrategy === 'allowlist-origin'
                  ? 'bg-[#1c1b2f] border-[#B794F6] shadow-[0_0_15px_rgba(183,148,246,0.2)]'
                  : 'bg-[#0A0A0F] border-[#252538] hover:border-[#B794F6]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-xs">Direct Origin / Allowlisted Scan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Authorized Audit
                </span>
              </div>
              <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                Applies scanner allowlisting headers to audit underlying origin server logic directly without edge masking.
              </p>
            </div>
          </div>
        </div>

        <div className="cyber-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#B794F6]" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Defensive Scope Boundaries
              </span>
            </div>
            <span className="text-[11px] text-[#A0A0B0] font-mono">
              Modular Inspection
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A0F] border border-[#252538] cursor-pointer">
              <input
                type="checkbox"
                checked={auditHeaders}
                onChange={(e) => setAuditHeaders(e.target.checked)}
                className="w-4 h-4 rounded accent-[#B794F6]"
              />
              <span className="text-xs text-white font-medium">Security Headers (HSTS, CSP, XFO)</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A0F] border border-[#252538] cursor-pointer">
              <input
                type="checkbox"
                checked={auditSsl}
                onChange={(e) => setAuditSsl(e.target.checked)}
                className="w-4 h-4 rounded accent-[#B794F6]"
              />
              <span className="text-xs text-white font-medium">TLS / SSL Handshake & Expiry</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A0F] border border-[#252538] cursor-pointer">
              <input
                type="checkbox"
                checked={auditCookies}
                onChange={(e) => setAuditCookies(e.target.checked)}
                className="w-4 h-4 rounded accent-[#B794F6]"
              />
              <span className="text-xs text-white font-medium">Cookie Security Flags</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A0F] border border-[#252538] cursor-pointer">
              <input
                type="checkbox"
                checked={auditBanners}
                onChange={(e) => setAuditBanners(e.target.checked)}
                className="w-4 h-4 rounded accent-[#B794F6]"
              />
              <span className="text-xs text-white font-medium">Banner & Server Disclosure</span>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0A0F] border border-[#252538] cursor-pointer">
              <input
                type="checkbox"
                checked={auditRobots}
                onChange={(e) => setAuditRobots(e.target.checked)}
                className="w-4 h-4 rounded accent-[#B794F6]"
              />
              <span className="text-xs text-white font-medium">Robots.txt Reconnaissance</span>
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2 text-xs text-[#A0A0B0]">
            <Info className="w-4 h-4 text-[#B794F6] shrink-0" />
            <span>
              {isApiLive
                ? 'Passive inspection with Gemini AI active. Production safe.'
                : 'API offline: Scan blocked until Gemini API connection is established.'}
            </span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {currentScan && !isScanning && (
              <button
                type="button"
                id="bottom-view-full-results-btn"
                onClick={() => onNavigate('results')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold bg-[#1c1b2f] hover:bg-[#252538] text-[#B794F6] border border-[#B794F6]/40 transition-colors cursor-pointer"
              >
                <span>View Full Results</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <button
              id="launch-scan-cta-btn"
              type="submit"
              disabled={isScanning || !targetInput.trim() || !isApiLive}
              className={`flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(183,148,246,0.4)] ${
                !isApiLive
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
                  : 'cyber-button-purple cursor-pointer'
              }`}
              title={!isApiLive ? 'API connectivity required to start scan' : 'Launch scan'}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : !isApiLive ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>API Required to Scan</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Scan Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
