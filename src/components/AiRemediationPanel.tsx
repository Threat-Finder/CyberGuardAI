import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Code,
  AlertOctagon,
  ShieldAlert,
  Terminal,
  Download,
  FileCheck2,
  FilePlus,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { AiRemediationReport, ScanResult, FindingEvidenceItem } from '../types.js';

interface AiRemediationPanelProps {
  report: AiRemediationReport | null;
  isLoading: boolean;
  onGenerate: () => void;
  currentScan: ScanResult | null;
  onUpdateReport?: (updated: AiRemediationReport) => void;
}

export const AiRemediationPanel: React.FC<AiRemediationPanelProps> = ({
  report,
  isLoading,
  onGenerate,
  currentScan,
  onUpdateReport,
}) => {
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'evidence' | 'guides'>('script');
  const [guidePlatformTab, setGuidePlatformTab] = useState<Record<number, number>>({});
  const [isAddingCustomEvidence, setIsAddingCustomEvidence] = useState(false);

  // Custom evidence form state
  const [customTitle, setCustomTitle] = useState('');
  const [customCategory, setCustomCategory] = useState('Headers');
  const [customSeverity, setCustomSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [customType, setCustomType] = useState<'RAW_HEADER' | 'CURL_POC' | 'SSL_HANDSHAKE' | 'CONFIG_LEAK'>('RAW_HEADER');
  const [customRepro, setCustomRepro] = useState('');
  const [customRaw, setCustomRaw] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const handleCopyFullScript = (scriptText: string) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadScript = (scriptText: string, domain: string) => {
    const blob = new Blob([scriptText], { type: 'text/x-shellscript;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fix-security-headers-${domain}.sh`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleToggleEvidence = (evidenceId: string) => {
    if (!report || !onUpdateReport) return;
    const items = report.evidenceItems || [];
    const updated = items.map((item) =>
      item.id === evidenceId ? { ...item, isCollected: !item.isCollected } : item
    );
    onUpdateReport({ ...report, evidenceItems: updated });
  };

  const handleSelectAllEvidence = (selectAll: boolean) => {
    if (!report || !onUpdateReport) return;
    const items = report.evidenceItems || [];
    const updated = items.map((item) => ({ ...item, isCollected: selectAll }));
    onUpdateReport({ ...report, evidenceItems: updated });
  };

  const handleAddCustomEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !report || !onUpdateReport) return;

    const newEvidence: FindingEvidenceItem = {
      id: `ev-custom-${Date.now()}`,
      title: customTitle.trim(),
      category: customCategory,
      severity: customSeverity,
      evidenceType: customType,
      reproductionCommand: customRepro.trim() || undefined,
      rawOutput: customRaw.trim(),
      description: customDesc.trim() || 'Custom technical proof artifact documented by security analyst.',
      isCollected: true,
      timestamp: new Date().toISOString(),
    };

    const updatedItems = [...(report.evidenceItems || []), newEvidence];
    onUpdateReport({ ...report, evidenceItems: updatedItems });

    // Reset form
    setCustomTitle('');
    setCustomRepro('');
    setCustomRaw('');
    setCustomDesc('');
    setIsAddingCustomEvidence(false);
  };

  if (!currentScan) return null;

  let domain = 'target';
  try {
    domain = new URL(currentScan.url).hostname;
  } catch {
    domain = currentScan.url;
  }

  const evidenceItems = report?.evidenceItems || [];
  const collectedCount = evidenceItems.filter((e) => e.isCollected).length;

  return (
    <div className="cyber-card rounded-2xl overflow-hidden transition-colors border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-xl">
      <div className="p-5 border-b border-[var(--sidebar-border)] bg-[var(--navbar-bg)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[var(--text-heading)] tracking-wide">
                AI Threat & Remediation Intelligence
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/70 font-mono">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-[var(--text-body)]">
              Automated shell remediation scripts, verifiable PoC evidence collection, and engineering handoff decks
            </p>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-purple-950/40 cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing Target...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>{report ? 'Regenerate Analysis' : 'Run Gemini Threat Model'}</span>
            </>
          )}
        </button>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[var(--accent-purple)] animate-spin" />
            <p className="text-sm font-semibold text-[var(--text-heading)]">
              Gemini 3.8 Flash is synthesizing automated shell scripts and correlating vulnerability evidence...
            </p>
            <p className="text-xs text-[var(--text-body)] max-w-md">
              Evaluating target against OWASP Top 10, RFC standards, and generating copyable shell fix commands and proof-of-concept logs.
            </p>
          </div>
        ) : report ? (
          <>
            {/* Executive Risk Box */}
            <div className="p-4 rounded-xl border border-purple-900/40 bg-purple-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300 uppercase tracking-wider">
                <span>CISO & Lead Architect Executive Risk Assessment</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/80 border border-purple-800 text-purple-300 font-mono">
                  Risk Rating: {report.riskRating}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {report.executiveSummary}
              </p>
              <div className="text-[10px] text-slate-500 font-mono pt-1">
                Engine: {report.modelUsed || 'gemini-3.8-flash'} • Generated at {new Date(report.generatedAt).toLocaleTimeString()}
              </div>
            </div>

            {/* Primary Attack Vectors */}
            {report.keyThreats && report.keyThreats.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-[var(--text-body)] uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Primary Attack Vectors & Exploit Scenarios</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {report.keyThreats.map((threat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] flex items-start gap-2.5 text-xs text-[var(--text-heading)]"
                    >
                      <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{threat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Feature Tabs */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-[var(--sidebar-border)] pb-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('script')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'script'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                      : 'bg-[var(--subtle-bg)] text-[var(--text-body)] hover:text-white border border-[var(--sidebar-border)]'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Automated Shell Remediation Script (.sh)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('evidence')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'evidence'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                      : 'bg-[var(--subtle-bg)] text-[var(--text-body)] hover:text-white border border-[var(--sidebar-border)]'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  <span>AI Vulnerability Evidence Collector</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                    activeTab === 'evidence' ? 'bg-black/30 text-white' : 'bg-indigo-950/60 text-indigo-300'
                  }`}>
                    {collectedCount}/{evidenceItems.length} Added
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('guides')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'guides'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40'
                      : 'bg-[var(--subtle-bg)] text-[var(--text-body)] hover:text-white border border-[var(--sidebar-border)]'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  <span>Hardening Guides & Configs ({report.guides?.length || 0})</span>
                </button>
              </div>

              {/* TAB 1: AUTOMATED SHELL REMEDIATION SCRIPT */}
              {activeTab === 'script' && (
                <div className="space-y-3.5 animate-in fade-in">
                  <div className="p-4 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-bold text-white">
                          Automated Bash Remediation Script
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                          Copy & Run Ready
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-body)]">
                        Synthesized bash script that automatically deploys missing security headers (HSTS, CSP, XFO, XCTO) to Nginx/Apache and runs verification cURL tests.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {report.shellScript && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyFullScript(report.shellScript!)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white cursor-pointer transition-colors shadow-sm"
                          >
                            {copiedScript ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Copied Script!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Fix Commands</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadScript(report.shellScript!, domain)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#1c1b2f] hover:bg-[#252538] text-purple-300 border border-purple-500/30 cursor-pointer transition-colors"
                            title="Download as .sh file"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download .sh</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {report.shellScript ? (
                    <div className="relative rounded-xl border border-slate-800 bg-[#04070e] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800 text-xs text-slate-400">
                        <span className="font-mono text-[11px] text-purple-400 flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>fix-security-headers-{domain}.sh</span>
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          Executable on Linux / Ubuntu / Debian / RHEL
                        </span>
                      </div>
                      <pre className="p-4 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre leading-relaxed">
                        {report.shellScript}
                      </pre>
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-body)] italic">
                      No automated script synthesized yet. Click Regenerate Analysis to compile.
                    </p>
                  )}
                </div>
              )}

              {/* TAB 2: AI EVIDENCE COLLECTOR */}
              {activeTab === 'evidence' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileCheck2 className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-sm font-bold text-white">
                          AI-Identified Proof-of-Concept Evidence Artifacts
                        </h4>
                      </div>
                      <p className="text-xs text-[var(--text-body)] mt-0.5">
                        Selected evidence items are automatically embedded into the exported Security Audit Report (HTML, Word, PDF) for team handoff.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSelectAllEvidence(true)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1c1b2f] hover:bg-[#252538] text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
                      >
                        Select All for Report
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllEvidence(false)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#0A0A0F] hover:bg-[#1c1b2f] text-slate-400 border border-[#252538] transition-colors cursor-pointer"
                      >
                        Deselect All
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomEvidence(!isAddingCustomEvidence)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition-colors shadow-sm"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Add Custom Proof</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Custom Evidence Form */}
                  {isAddingCustomEvidence && (
                    <form
                      onSubmit={handleAddCustomEvidence}
                      className="p-4 rounded-xl border border-indigo-500/40 bg-indigo-950/20 space-y-3 animate-in fade-in"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                          <FilePlus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Add Technical Proof / Evidence Artifact</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomEvidence(false)}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-300 font-medium block mb-1">
                            Artifact Title
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Raw Response Header Dump"
                            value={customTitle}
                            onChange={(e) => setCustomTitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-300 font-medium block mb-1">
                            Severity
                          </label>
                          <select
                            value={customSeverity}
                            onChange={(e) => setCustomSeverity(e.target.value as any)}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                          >
                            <option value="CRITICAL">CRITICAL</option>
                            <option value="HIGH">HIGH</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="LOW">LOW</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-slate-300 font-medium block mb-1">
                            Evidence Type
                          </label>
                          <select
                            value={customType}
                            onChange={(e) => setCustomType(e.target.value as any)}
                            className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-400"
                          >
                            <option value="RAW_HEADER">RAW_HEADER (HTTP Headers)</option>
                            <option value="CURL_POC">CURL_POC (cURL Reproduction)</option>
                            <option value="CONFIG_LEAK">CONFIG_LEAK (Server Banner)</option>
                            <option value="SSL_HANDSHAKE">SSL_HANDSHAKE (TLS Ciphers)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 font-medium block mb-1">
                          Reproduction Command (cURL / CLI)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. curl -s -I https://my-target.com | grep -i server"
                          value={customRepro}
                          onChange={(e) => setCustomRepro(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700 text-xs font-mono text-cyan-300 focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-300 font-medium block mb-1">
                          Observed Server Output / Proof Log
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Paste observed response headers or command output..."
                          value={customRaw}
                          onChange={(e) => setCustomRaw(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-black/40 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-400"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingCustomEvidence(false)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-transparent text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm"
                        >
                          Add & Include in Report
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Evidence Cards List */}
                  <div className="space-y-3">
                    {evidenceItems.map((ev) => (
                      <div
                        key={ev.id}
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          ev.isCollected
                            ? 'bg-[var(--subtle-bg)] border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.1)]'
                            : 'bg-black/20 border-slate-800 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={ev.isCollected}
                              onChange={() => handleToggleEvidence(ev.id)}
                              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                              id={`check-${ev.id}`}
                            />
                            <label
                              htmlFor={`check-${ev.id}`}
                              className="font-bold text-white text-sm cursor-pointer hover:text-indigo-300 transition-colors"
                            >
                              {ev.title}
                            </label>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                ev.severity === 'CRITICAL'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : ev.severity === 'HIGH'
                                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                                  : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                              }`}
                            >
                              {ev.severity}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
                              {ev.evidenceType}
                            </span>
                            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                              ev.isCollected
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {ev.isCollected ? '✔ In Report Deck' : 'Excluded from Report'}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-[var(--text-body)]">
                          {ev.description}
                        </p>

                        {ev.reproductionCommand && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-semibold text-cyan-400">Reproduce Proof (CLI / cURL):</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(`repro-${ev.id}`, ev.reproductionCommand!)}
                                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer font-mono"
                              >
                                {copiedSnippetId === `repro-${ev.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy cURL</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-2.5 rounded-lg bg-[#04070e] border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                              {ev.reproductionCommand}
                            </pre>
                          </div>
                        )}

                        {ev.rawOutput && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-300">Observed Output / Evidence Log:</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(`raw-${ev.id}`, ev.rawOutput)}
                                className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white cursor-pointer font-mono"
                              >
                                {copiedSnippetId === `raw-${ev.id}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Log</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="p-2.5 rounded-lg bg-[#080d1a] border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-36">
                              {ev.rawOutput}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}

                    {evidenceItems.length === 0 && (
                      <p className="text-xs text-[var(--text-body)] italic py-4 text-center">
                        No evidence artifacts generated yet. Click &quot;Regenerate Analysis&quot; above to scan and extract proof.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: HARDENING GUIDES & CONFIG SNIPPETS */}
              {activeTab === 'guides' && (
                <div className="space-y-3 animate-in fade-in">
                  {report.guides.map((guide, gIdx) => {
                    const selectedSnippetIdx = guidePlatformTab[gIdx] || 0;
                    const currentSnippet = guide.snippets[selectedSnippetIdx];
                    const snippetId = `guide-${gIdx}-${selectedSnippetIdx}`;

                    return (
                      <div
                        key={gIdx}
                        className="rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] p-4 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-heading)] text-sm">
                              {guide.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                guide.severity === 'HIGH' || guide.severity === 'CRITICAL'
                                  ? 'bg-rose-950/60 text-rose-400 border-rose-800/70'
                                  : 'bg-amber-950/60 text-amber-400 border-amber-800/70'
                              }`}
                            >
                              {guide.severity}
                            </span>
                          </div>
                          <span className="text-[11px] text-[var(--text-body)] font-mono">
                            Category: {guide.category}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--text-body)]">
                          {guide.threatDescription}
                        </p>

                        {guide.steps && guide.steps.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-semibold text-[var(--text-body)]">
                              Remediation Steps:
                            </span>
                            <ul className="space-y-1 text-xs text-[var(--text-heading)]">
                              {guide.steps.map((st, sIdx) => (
                                <li key={sIdx} className="flex items-start gap-2">
                                  <span className="text-purple-400 font-bold">•</span>
                                  <span>{st}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {guide.shellSnippet && (
                          <div className="p-2.5 rounded-lg bg-[#04070e] border border-purple-900/30 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono text-purple-300 font-bold flex items-center gap-1.5">
                                <Terminal className="w-3 h-3 text-purple-400" />
                                <span>Quick Bash Fix Command</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(`shell-${gIdx}`, guide.shellSnippet!)}
                                className="flex items-center gap-1 text-[10px] text-purple-300 hover:text-white cursor-pointer font-mono"
                              >
                                {copiedSnippetId === `shell-${gIdx}` ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Command</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <pre className="text-xs font-mono text-purple-200 overflow-x-auto whitespace-pre-wrap">
                              {guide.shellSnippet}
                            </pre>
                          </div>
                        )}

                        {guide.snippets && guide.snippets.length > 0 && (
                          <div className="pt-2">
                            <div className="flex items-center justify-between bg-[#04070e] px-3 py-1.5 rounded-t-lg border-t border-x border-slate-800 text-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {guide.snippets.map((sn, sIdx) => (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    onClick={() =>
                                      setGuidePlatformTab((prev) => ({ ...prev, [gIdx]: sIdx }))
                                    }
                                    className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                      selectedSnippetIdx === sIdx
                                        ? 'bg-slate-800 text-cyan-400 font-bold'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    {sn.platform}
                                  </button>
                                ))}
                              </div>

                              {currentSnippet && (
                                <button
                                  type="button"
                                  onClick={() => handleCopy(snippetId, currentSnippet.code)}
                                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 font-mono cursor-pointer shrink-0"
                                >
                                  {copiedSnippetId === snippetId ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-400" />
                                      <span className="text-emerald-400">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy Snippet</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>

                            {currentSnippet && (
                              <pre className="p-3 bg-[#03050a] border border-slate-800 rounded-b-lg text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                                {currentSnippet.code}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-[var(--text-body)] space-y-2">
            <p className="text-sm font-semibold text-[var(--text-heading)]">
              No AI remediation report generated yet for this scan.
            </p>
            <p className="text-xs">
              Click &quot;Run Gemini Threat Model&quot; above to synthesize automated shell scripts and vulnerability evidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
