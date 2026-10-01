import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  X,
  Save,
  CheckCircle2,
  Tag,
  User,
  Clock,
} from 'lucide-react';
import type {
  ScanResult,
  ScanAnnotations,
  FindingAnnotation,
  FindingItem,
  TriageStatus,
} from '../types.js';

interface ScanAnnotationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScan: ScanResult | null;
  initialAnnotations?: ScanAnnotations | null;
  onSave: (updated: ScanAnnotations) => void;
}

const TRIAGE_OPTIONS: { value: TriageStatus; label: string; badgeClass: string }[] = [
  { value: 'UNASSIGNED', label: 'Untriaged', badgeClass: 'bg-slate-800 text-slate-300' },
  { value: 'VERIFIED', label: 'Verified Vulnerability', badgeClass: 'bg-rose-950 text-rose-300' },
  { value: 'FALSE_POSITIVE', label: 'False Positive', badgeClass: 'bg-emerald-950 text-emerald-300' },
  { value: 'ACCEPTED_RISK', label: 'Accepted Risk / Policy Waiver', badgeClass: 'bg-amber-950 text-amber-300' },
  { value: 'IN_REMEDIATION', label: 'In Remediation / Patching', badgeClass: 'bg-blue-950 text-blue-300' },
];

export const ScanAnnotationsModal: React.FC<ScanAnnotationsModalProps> = ({
  isOpen,
  onClose,
  currentScan,
  initialAnnotations,
  onSave,
}) => {
  const [overallNotes, setOverallNotes] = useState('');
  const [leadAnalyst, setLeadAnalyst] = useState('SecOps Lead Auditor');
  const [findingNotes, setFindingNotes] = useState<Record<string, { status: TriageStatus; note: string }>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (initialAnnotations) {
      setOverallNotes(initialAnnotations.overallNotes || '');
      setLeadAnalyst(initialAnnotations.leadAnalyst || 'SecOps Lead Auditor');
      const map: Record<string, { status: TriageStatus; note: string }> = {};
      if (initialAnnotations.findingAnnotations) {
        Object.entries(initialAnnotations.findingAnnotations).forEach(([k, v]: [string, FindingAnnotation]) => {
          map[k] = { status: v.status, note: v.note };
        });
      }
      setFindingNotes(map);
    } else {
      setOverallNotes('');
      setLeadAnalyst('SecOps Lead Auditor');
      setFindingNotes({});
    }
  }, [initialAnnotations, isOpen, currentScan?.id]);

  if (!isOpen || !currentScan) return null;

  const allFindings: FindingItem[] = [
    ...(currentScan.sections.securityHeaders || []),
    ...(currentScan.sections.bannerDisclosure || []),
    ...(currentScan.sections.cookieSecurity || []),
    ...(currentScan.sections.sslTls || []),
    ...(currentScan.sections.httpsRedirect || []),
    ...(currentScan.sections.robotsTxt || []),
  ].filter((f) => f.status === 'WARN' || f.status === 'FAIL');

  const handleStatusChange = (findingId: string, status: TriageStatus) => {
    setFindingNotes((prev) => ({
      ...prev,
      [findingId]: {
        ...(prev[findingId] || { note: '' }),
        status,
      },
    }));
  };

  const handleNoteChange = (findingId: string, note: string) => {
    setFindingNotes((prev) => ({
      ...prev,
      [findingId]: {
        ...(prev[findingId] || { status: 'UNASSIGNED' }),
        note,
      },
    }));
  };

  const handleSave = () => {
    const formattedFindingAnnotations: Record<string, FindingAnnotation> = {};
    Object.entries(findingNotes).forEach(
      ([fId, data]: [string, { status: TriageStatus; note: string }]) => {
        formattedFindingAnnotations[fId] = {
          findingId: fId,
          status: data.status,
          note: data.note,
          updatedBy: leadAnalyst,
          updatedAt: new Date().toISOString(),
        };
      },
    );

    const updated: ScanAnnotations = {
      scanId: currentScan.id,
      targetUrl: currentScan.url,
      overallNotes,
      leadAnalyst,
      lastUpdated: new Date().toISOString(),
      findingAnnotations: formattedFindingAnnotations,
    };

    onSave(updated);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl cyber-card rounded-2xl shadow-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] overflow-hidden my-8 transition-colors">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sidebar-border)] bg-[var(--navbar-bg)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-purple)]/15 border border-[var(--accent-purple)]/30 text-[var(--accent-purple)]">
              <FileEdit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)] leading-tight">
                Scan Annotations & Analyst Triage
              </h2>
              <p className="text-xs text-[var(--text-body)]">
                Record audit findings notes, assign verification status, and document remediation plans
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-body)] hover:text-[var(--text-heading)] p-1.5 rounded-lg hover:bg-[var(--subtle-bg)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 rounded-xl bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-[var(--text-heading)]">Target: </span>
              <span className="font-mono text-[var(--accent-purple)]">{currentScan.url}</span>
            </div>
            <div className="text-[var(--text-body)]">
              Score: <strong className="text-[var(--text-heading)]">{currentScan.score}/100</strong> (Grade {currentScan.grade})
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  Lead Auditor / Analyst Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-body)] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={leadAnalyst}
                    onChange={(e) => setLeadAnalyst(e.target.value)}
                    placeholder="e.g. Alex Vance, CISSP"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] rounded-xl text-[var(--text-heading)] focus:outline-none focus:border-[var(--accent-purple)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                  Last Assessment Timestamp
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-[var(--text-body)] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    readOnly
                    value={new Date(initialAnnotations?.lastUpdated || currentScan.timestamp).toLocaleString()}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] rounded-xl text-[var(--text-body)] opacity-70 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-heading)] mb-1">
                Executive Audit Commentary & Scope Notes
              </label>
              <textarea
                rows={3}
                value={overallNotes}
                onChange={(e) => setOverallNotes(e.target.value)}
                placeholder="Document overall context (e.g. 'Staging environment behind Cloudflare CDN; HSTS exception granted until sprint 24')..."
                className="w-full p-3 text-xs bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] rounded-xl text-[var(--text-heading)] focus:outline-none focus:border-[var(--accent-purple)]"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-heading)] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
              Finding Triage & Line-Item Notes ({allFindings.length} Items)
            </h3>

            {allFindings.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--text-body)]">
                No deficiencies or warnings found to annotate. All controls are compliant!
              </div>
            ) : (
              <div className="space-y-3 divide-y divide-[var(--sidebar-border)]">
                {allFindings.map((finding) => {
                  const entry = findingNotes[finding.id] || { status: 'UNASSIGNED', note: '' };
                  return (
                    <div key={finding.id} className="pt-3 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--text-heading)]">
                              {finding.title}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--subtle-bg)] text-[var(--text-body)]">
                              {finding.category}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-body)]">
                            {finding.detail}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <select
                            value={entry.status}
                            onChange={(e) => handleStatusChange(finding.id, e.target.value as TriageStatus)}
                            className="text-xs font-medium px-2.5 py-1.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] text-[var(--text-heading)] focus:outline-none cursor-pointer"
                          >
                            {TRIAGE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={entry.note}
                          onChange={(e) => handleNoteChange(finding.id, e.target.value)}
                          placeholder="Analyst note or Jira ticket link (e.g. 'JIRA-1029: fix in review')..."
                          className="w-full px-3 py-1.5 text-xs bg-[var(--subtle-bg)] border border-[var(--sidebar-border)] rounded-xl text-[var(--text-heading)] placeholder-[var(--text-body)]/40 focus:outline-none focus:border-[var(--accent-purple)]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--sidebar-border)] bg-[var(--navbar-bg)] flex items-center justify-between">
          <span className="text-xs text-[var(--text-body)]">
            Notes will appear in exported PDF and Word reports.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium rounded-xl text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--subtle-bg)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-annotations-btn"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl cyber-button-purple flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Annotations</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
