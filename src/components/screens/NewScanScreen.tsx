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
  Key,
  Eye,
} from 'lucide-react';
import type { ScanResult } from '../../types.js';
import { ScanProgressBar } from '../ScanProgressBar.js';

interface NewScanScreenProps {
  onStartScan: (
    targetUrl: string,
    scanType: 'quick' | 'full' | 'stealth',
    wafStrategy: 'through-waf' | 'allowlist-origin'
  ) => Promise<void>;
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

  // Quick API Key Activation state
  const [quickKeyInput, setQuickKeyInput] = useState('');
  const [showQuickKey, setShowQuickKey] = useState(false);
  const [isActivatingQuickKey, setIsActivatingQuickKey] = useState(false);
  const [quickKeyError, setQuickKeyError] = useState<string | null>(null);

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

    const handleKeyUpdated = () => {
      verifyApiStatus();
    };
    window.addEventListener('gemini-key-updated', handleKeyUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('gemini-key-updated', handleKeyUpdated);
    };
  }, []);

  const handleQuickActivateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickKeyInput.trim() || isActivatingQuickKey) return;

    setIsActivatingQuickKey(true);
    setQuickKeyError(null);

    try {
      const res = await fetch('/api/set-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: quickKeyInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to authenticate and activate Gemini API Key.');
      }

      setQuickKeyInput('');
      await verifyApiStatus();
      window.dispatchEvent(new CustomEvent('gemini-key-updated'));
    } catch (err: any) {
      setQuickKeyError(err.message || 'Failed to activate API Key.');
    } finally {
      setIsActivatingQuickKey(false);
    }
  };

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

    await onStartScan(targetInput.trim(), scanType, wafStrategy);
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
        <div className="p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/40 text-rose-300 shadow-xl space-y-3.5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-rose-200">
                  Scan Initiation Locked: API Connectivity Required
                </div>
                <p className="text-[11px] text-rose-300/90 mt-0.5">
                  {apiErrorMessage || 'Scanning is blocked because active Gemini API connectivity is required.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openHealthModal}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Open API Health Monitor</span>
            </button>
          </div>

          {/* Quick API Key Ingestion Area directly in the banner */}
          <div className="pt-3 border-t border-rose-500/20">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-[11px] font-bold text-rose-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-rose-400" />
                <span>Forgot to add API Key before starting? Add it here to unlock scans immediately:</span>
              </span>
              <span className="text-[10px] font-mono text-rose-300/70">
                Zero Restart Required
              </span>
            </div>
            <form onSubmit={handleQuickActivateKey} className="flex flex-col sm:flex-row gap-2 mt-1">
              <div className="relative flex-1">
                <input
                  type={showQuickKey ? 'text' : 'password'}
                  value={quickKeyInput}
                  onChange={(e) => {
                    setQuickKeyInput(e.target.value);
                    setQuickKeyError(null);
                  }}
                  placeholder="Paste Gemini API Key (e.g. AIzaSy...)"
                  className="w-full pl-3.5 pr-9 py-2 rounded-xl bg-black/50 border border-rose-500/40 text-xs font-mono text-white placeholder-rose-300/40 focus:outline-none focus:border-rose-400"
                />
                <button
                  type="button"
                  onClick={() => setShowQuickKey(!showQuickKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-300/70 hover:text-white p-1 cursor-pointer"
                  title={showQuickKey ? 'Hide Key' : 'Show Key'}
                >
                  {showQuickKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                type="submit"
                disabled={isActivatingQuickKey || !quickKeyInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
              >
                {isActivatingQuickKey ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Activate & Unlock Scanner</span>
                  </>
                )}
              </button>
            </form>
            {quickKeyError && (
              <p className="text-[11px] text-rose-400 mt-1.5">{quickKeyError}</p>
            )}
          </div>
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
                  <span className="font-bold text-white text-sm">1. Quick Scan</span>
                  <Zap className="w-4 h-4 text-[#B794F6]" />
                </div>
                <div className="text-[10px] text-[#B794F6] font-mono mt-0.5">Simple Basic Scan</div>
                <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                  Fast perimeter assessment checking baseline HTTP response headers, immediate server banner exposure, and HTTPS upgrade.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#252538] text-[10px] font-mono text-[#B794F6]">
                Duration: ~2-3 seconds • Essential Baseline
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
                  <span className="font-bold text-white text-sm">2. Full Assessment</span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Detailed Scan</div>
                <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                  Deep multi-vector audit covering all defensive security headers, cookie security flags, full SSL/TLS certificates, and robots.txt hygiene.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#252538] text-[10px] font-mono text-emerald-400">
                Recommended • Full Multi-Vector Depth
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
                  <span className="font-bold text-white text-sm">3. Stealth Mode</span>
                  <EyeOff className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-[10px] text-purple-400 font-mono mt-0.5">Full Assessment + Premium Checks</div>
                <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                  Full Assessment including SSL certificates and all standard controls, plus 3 Premium checks: DNSSEC & CAA authorization, Ephemeral Forward Secrecy (PFS), and SRI CDN dependency defense.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#252538] text-[10px] font-mono text-purple-400">
                Full SSL + Premium Deep Audit
              </div>
            </div>
          </div>
        </div>

        <div className="cyber-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#252538]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#B794F6]" />
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                WAF Routing & Perimeter Strategy
              </span>
            </div>
            <span className="text-[11px] text-[#B794F6] font-mono">
              2 Routing Modes
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
                <span className="font-bold text-white text-xs">4. VA Scan Through WAF</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Standard Mode
                </span>
              </div>
              <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                Scan through the WAF: Inspects external perimeter attack surface through active edge WAF layers (Cloudflare, AWS WAF, Akamai) to assess edge filtering rules.
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
                <span className="font-bold text-white text-xs">5. Direct Origin / Allowlisted Scan</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  Bypassing WAF
                </span>
              </div>
              <p className="mt-2 text-xs text-[#A0A0B0] leading-relaxed">
                Bypassing the WAF: Injects scanner allowlisting headers to audit underlying origin server logic and raw backend configurations without edge masking.
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
