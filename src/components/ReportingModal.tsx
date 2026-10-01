import React, { useState } from 'react';
import {
  FileText,
  X,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  AlertTriangle,
  Code,
  Flame,
  FileEdit,
  FileType,
} from 'lucide-react';
import type {
  ScanResult,
  AiRemediationReport,
  FindingItem,
  ScanAnnotations,
} from '../types.js';
import { calculateThreatVectors } from '../utils/threatHeatmap.js';

interface ReportingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScan: ScanResult | null;
  aiReport: AiRemediationReport | null;
  annotations?: ScanAnnotations | null;
}

export const ReportingModal: React.FC<ReportingModalProps> = ({
  isOpen,
  onClose,
  currentScan,
  aiReport,
  annotations,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [includeAi, setIncludeAi] = useState(true);
  const [includeThresholds, setIncludeThresholds] = useState(true);
  const [includeHeatmap, setIncludeHeatmap] = useState(true);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);

  const [isExportingHtml, setIsExportingHtml] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !currentScan) return null;

  let domain = 'target';
  try {
    domain = new URL(currentScan.url).hostname;
  } catch {
    domain = currentScan.url;
  }

  const fileNameBase = `Security_Assessment_${domain}_${new Date().toISOString().slice(0, 10)}`;
  const threatVectors = calculateThreatVectors(currentScan);

  const handleDownloadHtml = async () => {
    setIsExportingHtml(true);
    try {
      const response = await fetch('/api/reports/html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanResult: currentScan,
          aiAnalysis: includeAi ? aiReport : null,
          annotations: includeAnnotations ? annotations : null,
          threatVectors: includeHeatmap ? threatVectors : null,
        }),
      });

      if (!response.ok) throw new Error('Report generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Security_Report_${domain}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export HTML report:', err);
    } finally {
      setIsExportingHtml(false);
    }
  };

  const handleDownloadWord = async () => {
    setIsExportingWord(true);
    try {
      const response = await fetch('/api/reports/word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scanResult: currentScan,
          aiAnalysis: includeAi ? aiReport : null,
          annotations: includeAnnotations ? annotations : null,
          threatVectors: includeHeatmap ? threatVectors : null,
        }),
      });

      if (!response.ok) throw new Error('Word generation failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Security_Assessment_${domain}.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Word document:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      window.print();
    } catch (err) {
      console.error('Failed to print as PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadJson = () => {
    const reportData = {
      assessmentMeta: {
        target: currentScan.url,
        timestamp: currentScan.timestamp,
        score: currentScan.score,
        grade: currentScan.grade,
        tool: 'Cyber Guard - VAPT Dashboard',
      },
      counts: currentScan.counts,
      thresholdsUsed: currentScan.thresholdsUsed,
      triggeredAlerts: currentScan.triggeredAlerts,
      annotations: includeAnnotations ? annotations : undefined,
      threatHeatmap: includeHeatmap ? threatVectors : undefined,
      sections: currentScan.sections,
      sslDetails: currentScan.sslDetails,
      aiRemediation: includeAi ? aiReport : undefined,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileNameBase}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const generateMarkdown = () => {
    return `# Security Assessment & Vulnerability Audit
**Target:** ${currentScan.url}  
**Audit Timestamp:** ${new Date(currentScan.timestamp).toUTCString()}  
**Overall Score:** ${currentScan.score}/100 (Grade ${currentScan.grade})  
**Response Time:** ${currentScan.responseTimeMs}ms  

---

## Executive Risk Summary
- **Passed Controls:** ${currentScan.counts.pass}
- **Warnings:** ${currentScan.counts.warn}
- **Failures / Critical:** ${currentScan.counts.fail}
- **SSL Certificate Validity:** ${currentScan.sslDetails?.daysRemaining ?? 'N/A'} days remaining

${
  annotations && (annotations.overallNotes || annotations.leadAnalyst)
    ? `### Auditor Annotations
- **Lead Auditor:** ${annotations.leadAnalyst || 'Unassigned'}
- **Notes:** ${annotations.overallNotes || 'None'}
`
    : ''
}

${
  aiReport && includeAi
    ? `### AI Threat & Remediation Guidance (Gemini 3.8 Flash)
${aiReport.executiveSummary}

#### Key Attack Vectors
${aiReport.keyThreats.map((t) => `- ${t}`).join('\n')}
`
    : ''
}

## Triggered Alert Threshold Violations (${currentScan.triggeredAlerts?.length || 0})
${
  currentScan.triggeredAlerts?.length
    ? currentScan.triggeredAlerts
        .map((a) => `- [${a.severity}] **${a.rule}**: ${a.message}`)
        .join('\n')
    : '_No threshold violations detected._'
}

## Critical Findings & Deficiencies
${(Object.entries(currentScan.sections) as [string, FindingItem[]][])
  .flatMap(([_, list]) => list)
  .filter((f) => f.status === 'WARN' || f.status === 'FAIL')
  .map(
    (f) =>
      `### [${f.status}] ${f.title} (${f.category})
- **Detail:** ${f.detail}
${f.remediationHint ? `- **Remediation:** ${f.remediationHint}` : ''}
${annotations?.findingAnnotations?.[f.id] ? `- **Triage:** [${annotations.findingAnnotations[f.id].status}] ${annotations.findingAnnotations[f.id].note}` : ''}`,
  )
  .join('\n\n')}
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="reporting-export-modal"
        className="relative w-full max-w-2xl cyber-card rounded-2xl shadow-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] overflow-hidden my-8 transition-colors"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sidebar-border)] bg-[var(--navbar-bg)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-purple)]/15 border border-[var(--accent-purple)]/30 text-[var(--accent-purple)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)] leading-tight">
                Vulnerability Assessment Reporting & Export
              </h2>
              <p className="text-xs text-[var(--text-body)]">
                Export executive findings in PDF, Microsoft Word, HTML, and JSON formats for {domain}
              </p>
            </div>
          </div>
          <button
            id="close-reporting-modal-btn"
            onClick={onClose}
            className="text-[var(--text-body)] hover:text-[var(--text-heading)] p-1.5 rounded-lg hover:bg-[var(--subtle-bg)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="p-4 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[var(--text-body)] uppercase tracking-wider">
                Target Under Audit
              </div>
              <div className="font-bold text-[var(--text-heading)] text-sm font-mono">{currentScan.url}</div>
              <div className="text-xs text-[var(--text-body)]">
                Audited {new Date(currentScan.timestamp).toLocaleString()} • Latency {currentScan.responseTimeMs}ms
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-[var(--text-body)]">Score & Grade</div>
              <div className="text-2xl font-black text-[var(--text-heading)] font-mono">
                {currentScan.score}{' '}
                <span className="text-sm text-[var(--accent-purple)] font-bold">
                  ({currentScan.grade})
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
              Report Content Inclusions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 text-xs text-[var(--text-heading)] cursor-pointer p-2.5 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)]">
                <input
                  type="checkbox"
                  checked={includeHeatmap}
                  onChange={(e) => setIncludeHeatmap(e.target.checked)}
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  Threat Heatmap & Attack Vectors
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-[var(--text-heading)] cursor-pointer p-2.5 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)]">
                <input
                  type="checkbox"
                  checked={includeAnnotations}
                  onChange={(e) => setIncludeAnnotations(e.target.checked)}
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <FileEdit className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                  Auditor Annotations & Triage Notes
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-[var(--text-heading)] cursor-pointer p-2.5 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)]">
                <input
                  type="checkbox"
                  checked={includeAi}
                  onChange={(e) => setIncludeAi(e.target.checked)}
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
                  Gemini AI Threat Modeling & Guidance
                </span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-[var(--text-heading)] cursor-pointer p-2.5 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)]">
                <input
                  type="checkbox"
                  checked={includeThresholds}
                  onChange={(e) => setIncludeThresholds(e.target.checked)}
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
                <span className="flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Security Alert Threshold Violations
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
              Download Formats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-heading)]">
                    <Printer className="w-4 h-4 text-rose-500" />
                    PDF Document Export
                  </div>
                  <p className="text-xs text-[var(--text-body)]">
                    Executive PDF layout with summary, radar metrics, annotations, and finding tables.
                  </p>
                </div>
                <button
                  id="export-pdf-btn"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isGeneratingPdf ? 'Preparing PDF...' : 'Download PDF Document'}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-heading)]">
                    <FileType className="w-4 h-4 text-blue-500" />
                    Microsoft Word (.doc)
                  </div>
                  <p className="text-xs text-[var(--text-body)]">
                    Styled Word document formatted for compliance audits, security reviews, and editing.
                  </p>
                </div>
                <button
                  id="export-word-btn"
                  onClick={handleDownloadWord}
                  disabled={isExportingWord}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExportingWord ? 'Exporting Word...' : 'Download Word (.doc)'}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-heading)]">
                    <FileText className="w-4 h-4 text-[var(--accent-purple)]" />
                    Interactive HTML Report
                  </div>
                  <p className="text-xs text-[var(--text-body)]">
                    Self-contained standalone report file with embedded styling, ready to email or view.
                  </p>
                </div>
                <button
                  id="export-html-btn"
                  onClick={handleDownloadHtml}
                  disabled={isExportingHtml}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-bold text-[var(--text-heading)] bg-[var(--panel-bg)] hover:bg-[var(--sidebar-border)] border border-[var(--panel-border)] rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExportingHtml ? 'Generating...' : 'Download HTML (.html)'}
                </button>
              </div>

              <div className="p-4 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[var(--text-heading)]">
                    <Code className="w-4 h-4 text-emerald-500" />
                    Machine-Readable JSON
                  </div>
                  <p className="text-xs text-[var(--text-body)]">
                    Raw structured audit findings formatted for ingestion into SIEM or CI/CD pipelines.
                  </p>
                </div>
                <button
                  id="export-json-btn"
                  onClick={handleDownloadJson}
                  className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-bold text-[var(--text-heading)] bg-[var(--panel-bg)] hover:bg-[var(--sidebar-border)] border border-[var(--panel-border)] rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download JSON (.json)
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] flex items-center justify-between">
            <div className="text-xs text-[var(--text-body)]">
              Need quick copy-paste notes for Jira or Slack?
            </div>
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[var(--accent-purple)] bg-[var(--accent-purple)]/15 hover:bg-[var(--accent-purple)]/25 rounded-xl transition-colors border border-[var(--accent-purple)]/30 cursor-pointer"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedMd ? 'Copied Markdown!' : 'Copy Markdown'}
            </button>
          </div>
        </div>

        <div className="px-6 py-3.5 border-t border-[var(--sidebar-border)] bg-[var(--navbar-bg)] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--subtle-bg)] rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
