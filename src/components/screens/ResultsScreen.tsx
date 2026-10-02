import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  FileDown,
  Zap,
  Shield,
  EyeOff,
  Radio,
  Sparkles,
} from 'lucide-react';
import type { ScanResult, FindingItem, SeverityLevel, AiRemediationReport } from '../../types.js';
import { enrichFindingWithCve } from '../../utils/cveMapping.js';
import { AiRemediationPanel } from '../AiRemediationPanel.js';

interface ResultsScreenProps {
  currentScan: ScanResult | null;
  aiReport: AiRemediationReport | null;
  isLoadingAi: boolean;
  onGenerateAi: () => void;
  onOpenReporting: () => void;
  onOpenAnnotations?: () => void;
  onNavigate?: (screen: 'dashboard' | 'new-scan' | 'results' | 'history') => void;
  onUpdateReport?: (updated: AiRemediationReport) => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  currentScan,
  aiReport,
  isLoadingAi,
  onGenerateAi,
  onOpenReporting,
  onNavigate,
  onUpdateReport,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | SeverityLevel>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentScan) {
    return (
      <div className="p-12 text-center cyber-card rounded-2xl text-[#A0A0B0] space-y-4">
        <p className="text-sm">No scan results loaded. Please launch a scan from the New Scan screen.</p>
        {onNavigate && (
          <button
            id="results-empty-scan-now-btn"
            onClick={() => onNavigate('new-scan')}
            className="px-6 py-2.5 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-[0_0_15px_rgba(183,148,246,0.35)] inline-flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Scan Now</span>
          </button>
        )}
      </div>
    );
  }

  const allFindings: FindingItem[] = useMemo(() => {
    const raw = [
      ...(currentScan.sections.securityHeaders || []),
      ...(currentScan.sections.sslTls || []),
      ...(currentScan.sections.cookieSecurity || []),
      ...(currentScan.sections.bannerDisclosure || []),
      ...(currentScan.sections.httpsRedirect || []),
      ...(currentScan.sections.robotsTxt || []),
      ...(currentScan.sections.perimeterRouting || []),
      ...(currentScan.sections.premiumChecks || []),
    ];
    return raw.map(enrichFindingWithCve);
  }, [currentScan]);

  const filteredFindings = useMemo(() => {
    return allFindings.filter((item) => {
      if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDetail = item.detail.toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        const matchCve = (item.cveId || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDetail && !matchCategory && !matchCve) return false;
      }
      return true;
    });
  }, [allFindings, severityFilter, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const critCount = allFindings.filter((f) => f.severity === 'CRITICAL').length;
  const highCount = allFindings.filter((f) => f.severity === 'HIGH').length;
  const medCount = allFindings.filter((f) => f.severity === 'MEDIUM').length;
  const lowCount = allFindings.filter((f) => f.severity === 'LOW' || f.status === 'PASS').length;

  const isThroughWaf = currentScan.isThroughWaf !== undefined
    ? currentScan.isThroughWaf
    : currentScan.wafStrategy !== 'allowlist-origin';

  return (
    <div className="space-y-6">
      <div className="cyber-card rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#B794F6]" />
            <h2 className="text-xl font-bold text-white tracking-wide">
              Vulnerability Findings & CVE Audit
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#A0A0B0] mt-1.5">
            <span>Target: <strong className="font-mono text-white">{currentScan.url}</strong></span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1c1b2f] text-[#B794F6] border border-[#B794F6]/40">
              {currentScan.scanType === 'quick'
                ? '1. Quick Scan'
                : currentScan.scanType === 'stealth'
                ? '3. Stealth Mode (Premium Checks)'
                : '2. Full Assessment'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              !isThroughWaf
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {!isThroughWaf
                ? '5. Direct Origin (Bypass WAF)'
                : '4. Through WAF (Standard Mode)'}
            </span>
            <span>•</span>
            <span>{allFindings.length} checks</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {onNavigate && (
            <button
              id="results-header-scan-now-btn"
              onClick={() => onNavigate('new-scan')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#1c1b2f] hover:bg-[#252538] text-[#B794F6] border border-[#B794F6]/40 transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Scan Now</span>
            </button>
          )}

          <button
            onClick={onOpenReporting}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-[0_0_15px_rgba(183,148,246,0.3)]"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Audit Deck</span>
          </button>
        </div>
      </div>

      {/* Audit Profile & Perimeter Strategy Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cyber-card rounded-2xl p-4 sm:p-5 border border-[var(--panel-border)] bg-[var(--subtle-bg)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-body)] flex items-center gap-1.5">
              {currentScan.scanType === 'quick' ? (
                <Zap className="w-3.5 h-3.5 text-[#B794F6]" />
              ) : currentScan.scanType === 'stealth' ? (
                <EyeOff className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Audit Profile</span>
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1c1b2f] text-[#B794F6] border border-[#B794F6]/40">
              {currentScan.scanTypeName || (currentScan.scanType === 'quick' ? 'Quick Scan' : currentScan.scanType === 'stealth' ? 'Stealth Mode' : 'Full Assessment')}
            </span>
          </div>
          <p className="text-xs text-[var(--text-body)] leading-relaxed">
            {currentScan.scanType === 'quick'
              ? 'Fast perimeter check inspecting baseline HTTP response headers, immediate server banner exposure, and HTTPS upgrade.'
              : currentScan.scanType === 'stealth'
              ? 'Full Assessment including SSL certificates and all standard items, plus 3 Premium checks (DNSSEC & CAA, Ephemeral PFS, Subresource Integrity).'
              : 'Deep multi-vector audit covering all defensive security headers, cookie security flags, full SSL/TLS certificates, and robots.txt hygiene.'}
          </p>
          {currentScan.scanType === 'stealth' && (
            <div className="pt-2 border-t border-[var(--sidebar-border)] flex items-center gap-1.5 text-[11px] font-mono text-purple-400">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>3 Premium Checks Active: DNSSEC/CAA • PFS ECDHE • SRI CDN</span>
            </div>
          )}
        </div>

        <div className={`cyber-card rounded-2xl p-4 sm:p-5 border ${
          isThroughWaf ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-purple-500/30 bg-purple-950/10'
        } space-y-2`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-body)] flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
              <span>Perimeter WAF Strategy</span>
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              isThroughWaf
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
            }`}>
              {isThroughWaf ? '4. VA Scan Through WAF' : '5. Direct Origin / Allowlisted'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-body)] leading-relaxed">
            {isThroughWaf
              ? 'Through WAF (Standard Mode): External client traffic was routed through public reverse proxy/WAF layers (Cloudflare / AWS WAF / Akamai) to assess edge filtering rules and proxy defense.'
              : 'Direct Origin / Allowlisted Scan (Bypassing WAF): Scanner allowlisting headers were injected to audit raw backend origin server configurations directly without edge proxy masking.'}
          </p>
          <div className="pt-2 border-t border-[var(--sidebar-border)] flex items-center gap-1.5 text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${isThroughWaf ? 'bg-emerald-400' : 'bg-purple-400'}`} />
            <span className={isThroughWaf ? 'text-emerald-300' : 'text-purple-300'}>
              {isThroughWaf ? 'Status: Edge WAF Active & Filtering' : 'Status: Origin Audited (WAF Bypassed)'}
            </span>
          </div>
        </div>
      </div>

      <div className="cyber-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#A0A0B0] font-semibold mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#B794F6]" />
            Severity:
          </span>

          <button
            onClick={() => setSeverityFilter('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              severityFilter === 'ALL'
                ? 'bg-[#1e1e32] text-white border border-[#B794F6]'
                : 'text-[#A0A0B0] hover:text-white bg-[#0A0A0F] border border-[#252538]'
            }`}
          >
            All ({allFindings.length})
          </button>

          <button
            onClick={() => setSeverityFilter('CRITICAL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              severityFilter === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                : 'text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:border-rose-500/60'
            }`}
          >
            Critical ({critCount})
          </button>

          <button
            onClick={() => setSeverityFilter('HIGH')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              severityFilter === 'HIGH'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                : 'text-orange-400 bg-orange-500/10 border border-orange-500/30 hover:border-orange-500/60'
            }`}
          >
            High ({highCount})
          </button>

          <button
            onClick={() => setSeverityFilter('MEDIUM')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              severityFilter === 'MEDIUM'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                : 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 hover:border-yellow-500/60'
            }`}
          >
            Medium ({medCount})
          </button>

          <button
            onClick={() => setSeverityFilter('LOW')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              severityFilter === 'LOW'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60'
            }`}
          >
            Low / Passed ({lowCount})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
          <input
            type="text"
            placeholder="Search CVE, CWE, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#0A0A0F] border border-[#252538] rounded-xl text-white placeholder-[#A0A0B0]/50 focus:outline-none focus:border-[#B794F6]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filteredFindings.map((finding) => {
          const isExpanded = expandedItems[finding.id];

          return (
            <div
              key={finding.id}
              className="cyber-card rounded-2xl p-4 sm:p-5 transition-all space-y-3"
            >
              <div
                onClick={() => toggleExpand(finding.id)}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider font-mono border shrink-0 ${
                      finding.severity === 'CRITICAL'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                        : finding.severity === 'HIGH'
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.2)]'
                        : finding.severity === 'MEDIUM'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/40 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                    }`}
                  >
                    {finding.severity}
                  </span>

                  <span className="font-mono text-xs font-bold text-[#B794F6] px-2 py-0.5 rounded bg-[#1c1b2f] border border-[#B794F6]/30">
                    {finding.cveId || 'CVE-2024-GEN'}
                  </span>

                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {finding.title}
                    </h4>
                    <p className="text-xs text-[#A0A0B0] mt-0.5 line-clamp-1">
                      {finding.detail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-[#A0A0B0] uppercase font-mono">CVSS v3.1</div>
                    <div className="text-xs font-bold font-mono text-white">
                      {finding.cvssScore?.toFixed(1) || '5.0'}
                    </div>
                  </div>

                  <div className="p-1 rounded-lg text-[#A0A0B0] hover:text-white">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="pt-3 border-t border-[#252538] space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#252538] space-y-1">
                      <div className="text-[10px] uppercase font-bold text-[#A0A0B0]">
                        Deficiency Detail
                      </div>
                      <p className="text-slate-300 font-sans leading-relaxed">
                        {finding.detail}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0A0A0F] border border-[#252538] space-y-1">
                      <div className="text-[10px] uppercase font-bold text-[#A0A0B0]">
                        CWE Classification & Category
                      </div>
                      <p className="text-[#B794F6] font-mono font-medium">
                        {finding.cweId || 'CWE-693'} • {finding.category}
                      </p>
                    </div>
                  </div>

                  {finding.remediationHint && (
                    <div className="p-3 rounded-xl bg-[#1c1b2f]/60 border border-[#B794F6]/30 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#B794F6]">
                        <span>Recommended Remediation Code</span>
                        <button
                          onClick={() => handleCopyText(finding.id, finding.remediationHint || '')}
                          className="flex items-center gap-1 text-[10px] text-[#A0A0B0] hover:text-white cursor-pointer font-mono"
                        >
                          {copiedId === finding.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedId === finding.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 rounded-lg bg-[#08080C] border border-[#252538] font-mono text-xs text-[#B794F6] overflow-x-auto whitespace-pre-wrap">
                        {finding.remediationHint}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredFindings.length === 0 && (
          <div className="cyber-card rounded-2xl p-8 text-center text-[#A0A0B0] space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-white">No findings matched your filter</p>
            <p className="text-xs">Adjust your severity filters or search criteria above.</p>
          </div>
        )}
      </div>

      <AiRemediationPanel
        report={aiReport}
        isLoading={isLoadingAi}
        onGenerate={onGenerateAi}
        currentScan={currentScan}
        onUpdateReport={onUpdateReport}
      />
    </div>
  );
};
