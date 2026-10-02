import type {
  ScanResult,
  AiRemediationReport,
  ScanAnnotations,
  FindingItem,
  FindingEvidenceItem,
} from '../types.js';

export interface ReportOptions {
  scanResult: ScanResult;
  aiAnalysis?: AiRemediationReport | null;
  annotations?: ScanAnnotations | null;
  threatVectors?: any[] | null;
  collectedEvidence?: FindingEvidenceItem[] | null;
}

export function generateReportHtml({
  scanResult,
  aiAnalysis,
  annotations,
  collectedEvidence,
}: ReportOptions): string {
  const scoreColor =
    scanResult.score >= 80 ? '#166534' : scanResult.score >= 60 ? '#b45309' : '#b91c1c';

  // Aggregate all findings across all sections
  const allFindings: FindingItem[] = Object.values(scanResult.sections || {}).flat();

  // Sort: FAIL first, then WARN, then PASS, then INFO
  const severityOrder: Record<string, number> = { FAIL: 0, WARN: 1, PASS: 2, INFO: 3 };
  allFindings.sort(
    (a, b) => (severityOrder[a.status] ?? 4) - (severityOrder[b.status] ?? 4)
  );

  const formattedUtcDate = new Date(scanResult.timestamp).toUTCString();
  const formattedLocalDate = new Date(scanResult.timestamp).toLocaleString();
  const latency = scanResult.responseTimeMs || 0;
  const httpStatus = (scanResult as any).httpStatus || 200;
  const sslDays =
    scanResult.sslDetails?.daysRemaining !== undefined
      ? `${scanResult.sslDetails.daysRemaining}d`
      : 'N/A';

  // Calculate high-fidelity Threat Surface Heatmap Analysis vectors matching uploaded format
  const sections = scanResult.sections || ({} as any);
  const sslIssues = (sections.sslTls || []).filter((f: any) => f.status === 'WARN' || f.status === 'FAIL');
  const hsts = (sections.securityHeaders || []).find((h: any) => h.id.includes('hsts') || h.title.includes('Strict-Transport'));
  const csp = (sections.securityHeaders || []).find((h: any) => h.id.includes('csp') || h.title.includes('Content-Security'));
  const xfo = (sections.securityHeaders || []).find((h: any) => h.id.includes('x-frame') || h.title.includes('Frame'));
  const xcto = (sections.securityHeaders || []).find((h: any) => h.id.includes('content-type') || h.title.includes('nosniff') || h.title.includes('Content-Type'));
  const cookieIssues = (sections.cookieSecurity || []).filter((c: any) => c.status === 'WARN' || c.status === 'FAIL');
  const bannerIssues = (sections.bannerDisclosure || []).filter((b: any) => b.status === 'WARN' || b.status === 'FAIL');
  const robotsIssues = (sections.robotsTxt || []).filter((r: any) => r.status === 'WARN' || r.status === 'FAIL');

  const v1Exposure = sslIssues.length > 0 || !hsts || hsts.status !== 'PASS' ? (sslIssues.length > 0 ? 80 : 65) : 0;
  const v2Exposure = !csp || csp.status !== 'PASS' ? 65 : 0;
  const v3Exposure = !xfo || xfo.status !== 'PASS' ? 70 : 0;
  const v4Exposure = bannerIssues.length > 0 ? 100 : 0;
  const v5Exposure = cookieIssues.length > 0 ? 75 : 0;
  const v6Exposure = !xcto || xcto.status !== 'PASS' ? 50 : 0;
  const v7Exposure = robotsIssues.length > 0 ? 100 : 0;

  const toStatus = (exp: number): 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    if (exp >= 90) return 'CRITICAL';
    if (exp >= 60) return 'HIGH';
    if (exp >= 35) return 'MEDIUM';
    if (exp > 0) return 'LOW';
    return 'CLEAN';
  };

  const isThroughWaf = (scanResult as any).isThroughWaf !== undefined
    ? (scanResult as any).isThroughWaf
    : (scanResult as any).wafStrategy !== 'allowlist-origin';

  const threatVectors = [
    {
      name: 'Transport Encryption & TLS',
      exposure: v1Exposure,
      status: toStatus(v1Exposure),
      impact: 'HIGH',
      exploitability: 'MEDIUM',
      recommendation: 'Verify strict TLS 1.2/1.3 and HSTS preloading.',
    },
    {
      name: 'Content & Script Injection (XSS)',
      exposure: v2Exposure,
      status: toStatus(v2Exposure),
      impact: 'CRITICAL',
      exploitability: 'HIGH',
      recommendation: 'Deploy restrictive CSP with script-src and object-src.',
    },
    {
      name: 'UI Redressing & Clickjacking',
      exposure: v3Exposure,
      status: toStatus(v3Exposure),
      impact: 'HIGH',
      exploitability: 'MEDIUM',
      recommendation: 'Configure X-Frame-Options: DENY or CSP frame-ancestors.',
    },
    {
      name: 'Server & Tech Fingerprinting',
      exposure: v4Exposure,
      status: toStatus(v4Exposure),
      impact: 'MEDIUM',
      exploitability: 'HIGH',
      recommendation: 'Suppress server signatures in reverse proxy settings.',
    },
    {
      name: 'Session & Cookie Hijacking',
      exposure: v5Exposure,
      status: toStatus(v5Exposure),
      impact: 'HIGH',
      exploitability: 'HIGH',
      recommendation: 'Enforce Secure, HttpOnly, and SameSite=Lax/Strict on cookies.',
    },
    {
      name: 'MIME Sniffing & Type Confusion',
      exposure: v6Exposure,
      status: toStatus(v6Exposure),
      impact: 'MEDIUM',
      exploitability: 'LOW',
      recommendation: 'Set X-Content-Type-Options: nosniff on all responses.',
    },
    {
      name: 'Endpoint Crawling & Reconnaissance',
      exposure: v7Exposure,
      status: toStatus(v7Exposure),
      impact: 'LOW',
      exploitability: 'HIGH',
      recommendation: 'Audit robots.txt to ensure admin or staging paths are not exposed.',
    },
    {
      name: isThroughWaf ? 'Perimeter WAF Shielding & Reverse Proxy' : 'Direct Origin Access & WAF Bypass Surface',
      exposure: isThroughWaf ? 0 : (bannerIssues.length > 0 ? 55 : 25),
      status: isThroughWaf ? 'CLEAN' : (bannerIssues.length > 0 ? 'HIGH' : 'LOW'),
      impact: 'HIGH',
      exploitability: isThroughWaf ? 'LOW' : 'HIGH',
      recommendation: isThroughWaf
        ? 'Traffic inspected through edge WAF reverse proxy. Continue maintaining managed CRS rulesets.'
        : 'Direct origin probed bypassing WAF. Enforce origin-level firewall rules and reject connections not originating from CDN reverse proxy CIDRs.',
    },
  ];

  const scanTypeLabel =
    scanResult.scanType === 'quick'
      ? '1. Quick Scan (Simple basic scan)'
      : scanResult.scanType === 'stealth'
      ? '3. Stealth Mode (Full Assessment + Premium Checks)'
      : '2. Full Assessment (Detailed scan)';

  const wafStrategyLabel = isThroughWaf
    ? '4. VA Scan Through WAF (Standard Mode - Through WAF)'
    : '5. Direct Origin / Allowlisted Scan (Bypassing WAF)';

  const wafModeSummary = isThroughWaf
    ? 'Through WAF (Standard Mode): Assessment probed the public edge WAF / CDN reverse proxy (e.g. Cloudflare, AWS WAF, Akamai). Edge filtering rules, DDoS mitigation, and reverse proxy caching were active during perimeter inspection.'
    : 'Bypassing WAF (Direct Origin / Allowlisted Scan): Assessment utilized authorized scanner allowlisting headers (X-Origin-Audit-Token, X-Bypass-WAF) to audit raw backend origin server configurations directly without edge proxy masking.';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Security Assessment Report - ${scanResult.url}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 32px; background: #f8fafc; color: #1e293b; }
    .container { max-width: 1040px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    @media print {
      body { background: #ffffff; padding: 0; }
      .container { box-shadow: none; padding: 0; max-width: 100%; border-radius: 0; }
    }
  </style>
</head>
<body>
  
    <div class="container">
      <div style="border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: #0f172a; font-size: 26px; font-weight: 700;">
          Security Assessment & Vulnerability Audit Report
        </h1>
        <div style="color: #64748b; font-size: 13px; margin-top: 6px;">
          Comprehensive Threat Surface Analysis & Defensive Verification
        </div>
      </div>

      <!-- Scope & Perimeter Routing Specification Callout Box -->
      <table style="width: 100%; margin-bottom: 20px; border-collapse: collapse; background: #f8fafc; border: 2px solid ${isThroughWaf ? '#10b981' : '#b794f6'}; border-radius: 8px;">
        <tr>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; width: 50%;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700;">Scan Profile Executed</div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px;">
              ${scanTypeLabel}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
              ${scanResult.scanType === 'quick'
                ? 'Rapid baseline surface scan verifying essential HTTP headers, port 80 to 443 upgrade, and immediate server banners.'
                : scanResult.scanType === 'stealth'
                ? 'Full Assessment including SSL certificates and all standard items + 3 Premium checks (DNSSEC & CAA, Perfect Forward Secrecy, Subresource Integrity) with evasion request profile.'
                : 'Deep multi-vector vulnerability audit covering all defensive security headers, cookie flags, full SSL/TLS certificates, and robots.txt hygiene.'}
            </div>
          </td>
          <td style="padding: 14px 16px; border-bottom: 1px solid #e2e8f0; width: 50%; border-left: 1px solid #e2e8f0; background: ${isThroughWaf ? '#f0fdf4' : '#faf5ff'};">
            <div style="font-size: 11px; text-transform: uppercase; color: ${isThroughWaf ? '#166534' : '#6b21a8'}; font-weight: 700;">Perimeter & WAF Routing Mode</div>
            <div style="font-size: 15px; font-weight: 800; color: ${isThroughWaf ? '#15803d' : '#7e22ce'}; margin-top: 2px;">
              ${wafStrategyLabel}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.4;">
              ${wafModeSummary}
            </div>
          </td>
        </tr>
      </table>

      <!-- Executive Overview -->
      <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
        <tr>
          <td style="padding: 16px; width: 65%; vertical-align: top;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Audit Target</div>
            <div style="font-size: 18px; font-weight: bold; color: #0f172a; word-break: break-all;">${scanResult.url}</div>
            <div style="font-size: 13px; color: #475569; margin-top: 4px;">
              Date: <strong>${formattedUtcDate}</strong> | Latency: <strong>${latency}ms</strong> | Status: <strong>${httpStatus}</strong>
            </div>
            <!-- Scan Type and WAF Routing Strategy Indicators -->
            <div style="margin-top: 10px; display: flex; gap: 8px; flex-wrap: wrap;">
              <span style="display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background: #ede9fe; color: #5b21b6; border: 1px solid #ddd6fe;">
                Profile: ${scanTypeLabel}
              </span>
              <span style="display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; background: ${isThroughWaf ? '#dcfce7' : '#fef3c7'}; color: ${isThroughWaf ? '#166534' : '#92400e'}; border: 1px solid ${isThroughWaf ? '#bbf7d0' : '#fde68a'};">
                Routing: ${isThroughWaf ? 'Through WAF (Standard Mode)' : 'Direct Origin (Bypassing WAF)'}
              </span>
            </div>
          </td>
          <td style="padding: 16px; width: 35%; text-align: center; border-left: 1px solid #e2e8f0; vertical-align: middle;">
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">Security Posture Score</div>
            <div style="font-size: 36px; font-weight: 800; color: ${scoreColor};">
              ${scanResult.score} <span style="font-size: 20px;">/ 100</span>
            </div>
            <div style="display: inline-block; padding: 2px 10px; border-radius: 9999px; background: #e2e8f0; font-size: 12px; font-weight: 700; color: #1e293b;">
              Grade: ${scanResult.grade}
            </div>
          </td>
        </tr>
      </table>

      <!-- Metrics Counter -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; text-align: center;">
        <tr>
          <td style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 12px; border-radius: 6px;">
            <div style="font-size: 22px; font-weight: bold; color: #166534;">${scanResult.counts?.pass ?? 0}</div>
            <div style="font-size: 11px; text-transform: uppercase; color: #15803d; font-weight: 600;">Passed Controls</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="background: #fffbeb; border: 1px solid #fde68a; padding: 12px; border-radius: 6px;">
            <div style="font-size: 22px; font-weight: bold; color: #b45309;">${scanResult.counts?.warn ?? 0}</div>
            <div style="font-size: 11px; text-transform: uppercase; color: #b45309; font-weight: 600;">Warnings</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="background: #fef2f2; border: 1px solid #fecaca; padding: 12px; border-radius: 6px;">
            <div style="font-size: 22px; font-weight: bold; color: #b91c1c;">${scanResult.counts?.fail ?? 0}</div>
            <div style="font-size: 11px; text-transform: uppercase; color: #b91c1c; font-weight: 600;">Failures / Risks</div>
          </td>
          <td style="width: 12px;"></td>
          <td style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px;">
            <div style="font-size: 22px; font-weight: bold; color: #334155;">${sslDays}</div>
            <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600;">SSL Validity</div>
          </td>
        </tr>
      </table>

      <!-- Auditor Annotations & Scope Notes -->
      ${
        annotations && (annotations.overallNotes || annotations.leadAnalyst)
          ? `
      <div style="margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px;">
        <h3 style="margin-top: 0; font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Auditor Triage & Scope Notes</h3>
        ${annotations.leadAnalyst ? `<div style="font-size: 12px; color: #475569; margin-bottom: 4px;"><strong>Lead Auditor:</strong> ${annotations.leadAnalyst}</div>` : ''}
        ${annotations.overallNotes ? `<div style="font-size: 13px; color: #334155; margin-bottom: 4px;">${annotations.overallNotes}</div>` : ''}
      </div>`
          : ''
      }

      <!-- Threat Heatmap Vectors -->
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">
          Threat Surface Heatmap Analysis
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Attack Vector</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Exposure</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Status</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Impact</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Exploitability</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Remediation Recommendation</th>
            </tr>
          </thead>
          <tbody>
            ${threatVectors
              .map((v) => {
                let statusBg = '#dcfce7';
                let statusColor = '#166534';
                if (v.status === 'CRITICAL') {
                  statusBg = '#fee2e2';
                  statusColor = '#991b1b';
                } else if (v.status === 'HIGH') {
                  statusBg = '#ffedd5';
                  statusColor = '#9a3412';
                } else if (v.status === 'MEDIUM') {
                  statusBg = '#ffedd5';
                  statusColor = '#9a3412';
                } else if (v.status === 'LOW') {
                  statusBg = '#fef3c7';
                  statusColor = '#92400e';
                }
                return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px; font-weight: 600; color: #1e293b;">${v.name}</td>
                <td style="padding: 8px 10px; font-weight: bold; font-family: monospace;">${v.exposure}%</td>
                <td style="padding: 8px 10px;">
                  <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${statusBg}; color:${statusColor};">${v.status}</span>
                </td>
                <td style="padding: 8px 10px; color: #475569;">${v.impact}</td>
                <td style="padding: 8px 10px; color: #475569;">${v.exploitability}</td>
                <td style="padding: 8px 10px; font-size: 12px; color: #334155;">${v.recommendation}</td>
              </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- AI Threat Modeling -->
      ${
        aiAnalysis && aiAnalysis.executiveSummary
          ? `
      <div style="margin-bottom: 28px; background: #f8fafc; border: 1px solid #cbd5e1; border-left: 5px solid #2563eb; padding: 18px; border-radius: 6px;">
        <h2 style="margin-top: 0; font-size: 16px; color: #1e40af; font-weight: 700;">
          Gemini AI Threat Modeling & Attack Scenario Assessment
        </h2>
        <div style="font-size: 13px; margin-bottom: 8px;">
          <strong>AI Risk Classification:</strong> <span style="color:${
            aiAnalysis.riskRating === 'HIGH'
              ? '#b91c1c'
              : aiAnalysis.riskRating === 'MODERATE'
              ? '#b45309'
              : '#15803d'
          }; font-weight:bold;">${aiAnalysis.riskRating || 'LOW'}</span>
        </div>
        <div style="font-size: 13px; color: #334155; line-height: 1.5; margin-bottom: 12px;">
          ${aiAnalysis.executiveSummary}
        </div>
        ${
          aiAnalysis.keyThreats && aiAnalysis.keyThreats.length > 0
            ? `
        <div style="font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 6px;">Identified Threat Vectors:</div>
        <ul style="font-size: 12px; color: #475569; margin: 0; padding-left: 20px;">
          ${aiAnalysis.keyThreats.map((t) => `<li style="margin-bottom:4px;">${t}</li>`).join('')}
        </ul>`
            : ''
        }
      </div>`
          : ''
      }

      <!-- Verified Technical Evidence & Proof-of-Concept Artifacts -->
      ${(() => {
        const evidenceList = (collectedEvidence && collectedEvidence.length > 0)
          ? collectedEvidence
          : (aiAnalysis?.evidenceItems ? aiAnalysis.evidenceItems.filter(e => e.isCollected) : []) || scanResult.collectedEvidence || [];

        if (!evidenceList || evidenceList.length === 0) return '';

        return `
      <div style="margin-bottom: 28px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">
            Verified Technical Evidence & Proof-of-Concept Artifacts (${evidenceList.length})
          </h2>
          <span style="font-size: 11px; font-weight: 700; color: #1e40af; background: #dbeafe; padding: 2px 8px; border-radius: 4px; border: 1px solid #bfdbfe;">
            Team Handoff Ready
          </span>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 14px; line-height: 1.4;">
          The following evidence artifacts were identified and correlated during vulnerability audit, providing technical reproduction commands and observed server outputs for DevOps and Engineering teams to verify before and after remediation.
        </p>

        ${evidenceList
          .map((ev) => {
            let sevBg = '#fef3c7';
            let sevColor = '#92400e';
            if (ev.severity === 'CRITICAL') {
              sevBg = '#fee2e2';
              sevColor = '#991b1b';
            } else if (ev.severity === 'HIGH') {
              sevBg = '#ffedd5';
              sevColor = '#9a3412';
            }

            return `
        <div style="margin-bottom: 16px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800; background: ${sevBg}; color: ${sevColor};">${ev.severity}</span>
              <span style="font-size: 13px; font-weight: 700; color: #0f172a;">${ev.title}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 10px; font-family: monospace; background: #ede9fe; color: #6b21a8; padding: 2px 6px; border-radius: 4px; font-weight: bold; border: 1px solid #ddd6fe;">
                ${ev.evidenceType}
              </span>
              <span style="font-size: 10px; color: #64748b; font-family: monospace;">
                ${ev.category}
              </span>
            </div>
          </div>
          <div style="padding: 12px 14px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #334155; line-height: 1.4;">
              ${ev.description}
            </p>
            ${ev.reproductionCommand ? `
              <div style="margin-top: 8px; margin-bottom: 8px;">
                <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; display: block; margin-bottom: 3px;">
                  Reproducibility Command (CLI / cURL):
                </span>
                <pre style="margin: 0; padding: 8px 10px; background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 11px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap;">${ev.reproductionCommand}</pre>
              </div>
            ` : ''}
            ${ev.rawOutput ? `
              <div style="margin-top: 8px;">
                <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; display: block; margin-bottom: 3px;">
                  Observed Server Response / Terminal Proof:
                </span>
                <pre style="margin: 0; padding: 8px 10px; background: #1e293b; color: #f1f5f9; font-family: monospace; font-size: 11px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap;">${ev.rawOutput}</pre>
              </div>
            ` : ''}
          </div>
        </div>`;
          })
          .join('')}
      </div>`;
      })()}

      <!-- Automated Shell Remediation Script (.sh) -->
      ${
        aiAnalysis && aiAnalysis.shellScript
          ? `
      <div style="margin-bottom: 28px;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-bottom: 12px;">
          <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0;">
            Automated Shell Remediation Script (Bash / CLI Fix)
          </h2>
          <span style="font-size: 11px; font-weight: 700; color: #15803d; background: #dcfce7; padding: 2px 8px; border-radius: 4px; border: 1px solid #bbf7d0;">
            Ready to Deploy
          </span>
        </div>
        <p style="font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 10px;">
          The following hardened shell script was synthesized to automatically remediate missing defensive headers, remove banner leaks, and verify configurations on ${scanResult.url}:
        </p>
        <pre style="margin: 0; padding: 14px; background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 11px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; line-height: 1.5; border: 1px solid #334155;">${aiAnalysis.shellScript}</pre>
      </div>`
          : ''
      }

      <!-- Triggered Alert Threshold Violations -->
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">
          Triggered Alert Threshold Violations (${scanResult.triggeredAlerts?.length || 0})
        </h2>
        ${
          scanResult.triggeredAlerts && scanResult.triggeredAlerts.length > 0
            ? `
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Rule Violations</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Severity</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Condition Details</th>
            </tr>
          </thead>
          <tbody>
            ${scanResult.triggeredAlerts
              .map((a) => {
                let sevBg = '#fef3c7';
                let sevColor = '#92400e';
                if (a.severity === 'CRITICAL') {
                  sevBg = '#fee2e2';
                  sevColor = '#991b1b';
                } else if (a.severity === 'HIGH') {
                  sevBg = '#ffedd5';
                  sevColor = '#9a3412';
                }
                return `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 8px 10px; font-weight: 600; color: #1e293b;">${a.rule}</td>
                <td style="padding: 8px 10px;">
                  <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${sevBg}; color:${sevColor};">${a.severity}</span>
                </td>
                <td style="padding: 8px 10px; color: #475569;">${a.message}</td>
              </tr>`;
              })
              .join('')}
          </tbody>
        </table>`
            : `<p style="font-size: 13px; color: #64748b; font-style: italic;">No threshold violations triggered during this assessment.</p>`
        }
      </div>

      <!-- Detailed Findings Table with Triage Annotations -->
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 10px;">
          Comprehensive Vulnerability Findings & Verification Log
        </h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left;">
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Status</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Category</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Finding Item</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Detail & Hardening Fix</th>
              <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Analyst Triage Note</th>
            </tr>
          </thead>
          <tbody>
            ${allFindings
              .map((f) => {
                let statusBg = '#dcfce7';
                let statusColor = '#166534';
                if (f.status === 'FAIL') {
                  statusBg = '#fee2e2';
                  statusColor = '#b91c1c';
                } else if (f.status === 'WARN') {
                  statusBg = '#fef3c7';
                  statusColor = '#92400e';
                } else if (f.status === 'INFO') {
                  statusBg = '#f1f5f9';
                  statusColor = '#475569';
                }

                const note = annotations?.findingAnnotations?.[f.id]?.note;
                const isPremium = f.category === 'Premium Controls';
                const isWafFinding = f.category === 'Perimeter & WAF';

                return `
              <tr style="border-bottom: 1px solid #e2e8f0; vertical-align: top;">
                <td style="padding: 8px 10px;">
                  <span style="display:inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${statusBg}; color:${statusColor};">${f.status}</span>
                </td>
                <td style="padding: 8px 10px; font-weight: 600; color: #334155;">
                  ${f.category}
                  ${isPremium ? `<br><span style="display:inline-block; font-size:9px; font-weight:800; color:#581c87; background:#ede9fe; border:1px solid #c4b5fd; padding:1px 5px; border-radius:3px; margin-top:3px;">PREMIUM</span>` : ''}
                  ${isWafFinding ? `<br><span style="display:inline-block; font-size:9px; font-weight:800; color:${isThroughWaf ? '#14532d' : '#78350f'}; background:${isThroughWaf ? '#dcfce7' : '#fef3c7'}; border:1px solid ${isThroughWaf ? '#86efac' : '#fde68a'}; padding:1px 5px; border-radius:3px; margin-top:3px;">${isThroughWaf ? 'THROUGH WAF' : 'BYPASS WAF'}</span>` : ''}
                </td>
                <td style="padding: 8px 10px; font-weight: 600; color: #0f172a;">
                  ${f.title}
                </td>
                <td style="padding: 8px 10px; color: #475569; font-size: 12px;">
                  <div>${f.detail}</div>
                  ${f.remediationHint ? `<div style="margin-top: 4px; color: #2563eb; font-weight: 500;">Remediation: ${f.remediationHint}</div>` : ''}
                </td>
                <td style="padding: 8px 10px; font-size: 12px;">
                  ${note ? `<span style="color:#0f172a; font-weight:500;">${note}</span>` : `<span style="color:#94a3b8;">Untriaged</span>`}
                </td>
              </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>

      <!-- Sign-off block -->
      <table style="width: 100%; border-top: 2px solid #cbd5e1; margin-top: 36px; padding-top: 16px; font-size: 12px; color: #64748b;">
        <tr>
          <td style="width: 55%;">
            Audit Generated By: <strong>Security Metrics & Vulnerability Dashboard</strong><br>
            Lead Auditor: <strong>${annotations?.leadAnalyst || 'SecOps Lead'}</strong><br>
            Assessment Profile: <strong>${scanTypeLabel}</strong><br>
            Perimeter Routing: <strong>${wafStrategyLabel}</strong> (${isThroughWaf ? 'Through WAF' : 'Standard / Direct Origin Bypass'})
          </td>
          <td style="width: 45%; text-align: right; vertical-align: top;">
            Assessment Date: ${formattedLocalDate}<br>
            Classification: Confidential / Security Assessment<br>
            Engine Mode: Verified Multi-Vector Security Inspection
          </td>
        </tr>
      </table>
    </div>
  
</body>
</html>`;
}
