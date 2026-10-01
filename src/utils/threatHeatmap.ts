import type { ScanResult, ThreatVectorMetric } from '../types.js';

export function calculateThreatVectors(scan: ScanResult): ThreatVectorMetric[] {
  const sections = scan.sections;

  // 1. Insecure Transport & TLS (V1)
  const sslIssues = (sections.sslTls || []).filter((f) => f.status === 'WARN' || f.status === 'FAIL');
  const redirectIssues = (sections.httpsRedirect || []).filter((f) => f.status === 'WARN' || f.status === 'FAIL');
  const v1Score = Math.min(100, (sslIssues.length * 40) + (redirectIssues.length * 30));

  // 2. Clickjacking & Frame Control (V2)
  const xfo = (sections.securityHeaders || []).find((h) => h.id.includes('x-frame') || h.title.includes('Frame'));
  const csp = (sections.securityHeaders || []).find((h) => h.id.includes('csp') || h.title.includes('Content-Security'));
  let v2Score = 0;
  if (!xfo || xfo.status !== 'PASS') v2Score += 50;
  if (!csp || csp.status !== 'PASS') v2Score += 30;

  // 3. Client-Side Injection & XSS (V3)
  let v3Score = 0;
  if (!csp || csp.status !== 'PASS') v3Score += 65;
  const xcto = (sections.securityHeaders || []).find((h) => h.id.includes('content-type') || h.title.includes('Content-Type'));
  if (!xcto || xcto.status !== 'PASS') v3Score += 25;

  // 4. Session & Cookie Hijacking (V4)
  const cookieIssues = (sections.cookieSecurity || []).filter((c) => c.status === 'WARN' || c.status === 'FAIL');
  const v4Score = Math.min(100, cookieIssues.length * 35);

  // 5. Server Reconnaissance & Leaks (V5)
  const bannerIssues = (sections.bannerDisclosure || []).filter((b) => b.status === 'WARN' || b.status === 'FAIL');
  const robotsIssues = (sections.robotsTxt || []).filter((r) => r.status === 'WARN' || r.status === 'FAIL');
  const v5Score = Math.min(100, (bannerIssues.length * 40) + (robotsIssues.length * 30));

  // 6. Perimeter & Downgrade Attacks (V6)
  const hsts = (sections.securityHeaders || []).find((h) => h.id.includes('hsts') || h.title.includes('Strict-Transport'));
  let v6Score = 0;
  if (!hsts || hsts.status !== 'PASS') v6Score += 60;
  if (redirectIssues.length > 0) v6Score += 35;

  // 7. Feature Abuse & Permissions (V7)
  const perm = (sections.securityHeaders || []).find((h) => h.id.includes('permissions') || h.title.includes('Permissions'));
  const referrer = (sections.securityHeaders || []).find((h) => h.id.includes('referrer') || h.title.includes('Referrer'));
  let v7Score = 0;
  if (!perm || perm.status !== 'PASS') v7Score += 45;
  if (!referrer || referrer.status !== 'PASS') v7Score += 35;

  const toStatus = (score: number): ThreatVectorMetric['status'] => {
    if (score >= 80) return 'CRITICAL';
    if (score >= 60) return 'HIGH';
    if (score >= 35) return 'MEDIUM';
    if (score > 0) return 'LOW';
    return 'CLEAN';
  };

  return [
    {
      id: 'v1-tls',
      name: 'Transport & Protocol Encryption',
      category: 'SSL/TLS',
      exposureScore: Math.min(100, v1Score),
      status: toStatus(v1Score),
      vulnerabilitiesCount: sslIssues.length + redirectIssues.length,
    },
    {
      id: 'v2-clickjacking',
      name: 'Clickjacking & Framing',
      category: 'Headers',
      exposureScore: Math.min(100, v2Score),
      status: toStatus(v2Score),
      vulnerabilitiesCount: (v2Score > 0 ? 1 : 0) + (xfo?.status === 'WARN' ? 1 : 0),
    },
    {
      id: 'v3-injection',
      name: 'Client-Side Injection & XSS',
      category: 'Headers',
      exposureScore: Math.min(100, v3Score),
      status: toStatus(v3Score),
      vulnerabilitiesCount: (csp?.status !== 'PASS' ? 1 : 0) + (xcto?.status !== 'PASS' ? 1 : 0),
    },
    {
      id: 'v4-session',
      name: 'Session Security & Cookie Theft',
      category: 'Cookies',
      exposureScore: Math.min(100, v4Score),
      status: toStatus(v4Score),
      vulnerabilitiesCount: cookieIssues.length,
    },
    {
      id: 'v5-recon',
      name: 'Information Disclosure & Recon',
      category: 'Banners',
      exposureScore: Math.min(100, v5Score),
      status: toStatus(v5Score),
      vulnerabilitiesCount: bannerIssues.length + robotsIssues.length,
    },
    {
      id: 'v6-downgrade',
      name: 'Man-in-the-Middle & Downgrade',
      category: 'Redirect',
      exposureScore: Math.min(100, v6Score),
      status: toStatus(v6Score),
      vulnerabilitiesCount: (hsts?.status !== 'PASS' ? 1 : 0) + redirectIssues.length,
    },
    {
      id: 'v7-permissions',
      name: 'Permissions & Referrer Leaks',
      category: 'Headers',
      exposureScore: Math.min(100, v7Score),
      status: toStatus(v7Score),
      vulnerabilitiesCount: (perm?.status !== 'PASS' ? 1 : 0) + (referrer?.status !== 'PASS' ? 1 : 0),
    },
  ];
}
