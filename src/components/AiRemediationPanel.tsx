import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Code,
  AlertOctagon,
  ShieldAlert,
} from 'lucide-react';
import type { AiRemediationReport, ScanResult } from '../types.js';

interface AiRemediationPanelProps {
  report: AiRemediationReport | null;
  isLoading: boolean;
  onGenerate: () => void;
  currentScan: ScanResult | null;
}

export const AiRemediationPanel: React.FC<AiRemediationPanelProps> = ({
  report,
  isLoading,
  onGenerate,
  currentScan,
}) => {
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<number, number>>({});

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  if (!currentScan) return null;

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
              Deep threat modeling, attack vector breakdown, and step-by-step hardened configs
            </p>
          </div>
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-md shadow-purple-950/40 cursor-pointer"
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
              Gemini 3.8 Flash is modeling exploit vectors and synthesizing fixes...
            </p>
            <p className="text-xs text-[var(--text-body)] max-w-md">
              Evaluating target against OWASP Top 10, CWE vulnerability catalogues, and Nginx/Apache/Express defense snippets.
            </p>
          </div>
        ) : report ? (
          <>
            <div className="p-4 rounded-xl border border-purple-900/40 bg-purple-950/20 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300 uppercase tracking-wider">
                <span>CISO & Lead Architect Executive Risk Assessment</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/80 border border-purple-800 text-purple-300">
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

            <div className="space-y-3 pt-2">
              <div className="text-xs font-bold text-[var(--text-body)] uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                <span>Engineered Hardening Guides & Verified Config Snippets</span>
              </div>

              <div className="space-y-3">
                {report.guides.map((guide, gIdx) => {
                  const selectedSnippetIdx = activeTab[gIdx] || 0;
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
                          <span className="text-[11px] font-semibold text-[var(--text-body)]">Remediation Steps:</span>
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

                      {guide.snippets && guide.snippets.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center justify-between bg-[#04070e] px-3 py-1.5 rounded-t-lg border-t border-x border-slate-800 text-xs">
                            <div className="flex items-center gap-1.5">
                              {guide.snippets.map((sn, sIdx) => (
                                <button
                                  key={sIdx}
                                  onClick={() =>
                                    setActiveTab((prev) => ({ ...prev, [gIdx]: sIdx }))
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
                                onClick={() => handleCopy(snippetId, currentSnippet.code)}
                                className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-400 font-mono cursor-pointer"
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
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-[var(--text-body)] space-y-2">
            <p className="text-sm font-semibold text-[var(--text-heading)]">
              No AI remediation report generated yet for this scan.
            </p>
            <p className="text-xs">
              Click &quot;Run Gemini Threat Model&quot; above to synthesize expert technical remediation steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
