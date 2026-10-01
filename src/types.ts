export type FindingStatus = 'PASS' | 'WARN' | 'FAIL' | 'INFO';
export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type TriageStatus = 'UNASSIGNED' | 'VERIFIED' | 'FALSE_POSITIVE' | 'ACCEPTED_RISK' | 'IN_REMEDIATION';

export interface FindingItem {
  id: string;
  title: string;
  category: string;
  status: FindingStatus;
  severity: SeverityLevel;
  detail: string;
  remediationHint?: string;
  cveId?: string;
  cweId?: string;
  cvssScore?: number;
  observedValue?: string;
  expectedValue?: string;
}

export interface SslDetails {
  valid: boolean;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  daysRemaining: number;
  isExpired: boolean;
  protocol?: string;
  cipher?: string;
}

export interface AlertThresholds {
  minScore: number;
  sslExpiryDays: number;
  criticalHeadersRequired: {
    hsts: boolean;
    csp: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
  };
  alertOnBannerLeak: boolean;
  alertOnInsecureCookie: boolean;
  alertOnHttpFallback: boolean;
  alertOnSensitiveRobots: boolean;
}

export interface TriggeredAlert {
  id: string;
  rule: string;
  severity: SeverityLevel;
  message: string;
  targetUrl: string;
  timestamp: string;
}

export interface ScanSections {
  securityHeaders: FindingItem[];
  bannerDisclosure: FindingItem[];
  cookieSecurity: FindingItem[];
  sslTls: FindingItem[];
  httpsRedirect: FindingItem[];
  robotsTxt: FindingItem[];
}

export interface ScanResult {
  id: string;
  url: string;
  timestamp: string;
  responseTimeMs: number;
  score: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  scanType: 'quick' | 'full' | 'stealth';
  counts: {
    pass: number;
    warn: number;
    fail: number;
    critical: number;
  };
  sections: ScanSections;
  sslDetails?: SslDetails;
  triggeredAlerts: TriggeredAlert[];
  thresholdsUsed: AlertThresholds;
}

export interface RemediationSnippet {
  platform: string;
  code: string;
}

export interface RemediationGuide {
  title: string;
  category: string;
  severity: SeverityLevel;
  threatDescription: string;
  steps: string[];
  snippets: RemediationSnippet[];
}

export interface AiRemediationReport {
  executiveSummary: string;
  riskRating: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  keyThreats: string[];
  guides: RemediationGuide[];
  generatedAt: string;
  modelUsed: string;
}

export interface FindingAnnotation {
  findingId: string;
  status: TriageStatus;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ScanAnnotations {
  scanId: string;
  targetUrl: string;
  overallNotes: string;
  leadAnalyst: string;
  lastUpdated: string;
  findingAnnotations: Record<string, FindingAnnotation>;
}

export interface ThreatVectorMetric {
  id: string;
  name: string;
  category: string;
  exposureScore: number; // 0 to 100
  status: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  vulnerabilitiesCount: number;
}

export interface ApiHealthStatus {
  live: boolean;
  status: 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';
  model: string;
  latencyMs: number;
  message: string;
  timestamp: string;
  quotaStatus: 'Healthy' | 'Warning' | 'Exceeded';
  endpoint: string;
  proxyProtected: boolean;
}
