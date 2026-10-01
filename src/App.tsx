import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, ScreenId } from './components/Sidebar.js';
import { TopNavbar } from './components/TopNavbar.js';
import { DashboardScreen } from './components/screens/DashboardScreen.js';
import { NewScanScreen } from './components/screens/NewScanScreen.js';
import { ResultsScreen } from './components/screens/ResultsScreen.js';
import { HistoryScreen } from './components/screens/HistoryScreen.js';
import { AlertThresholdModal } from './components/AlertThresholdModal.js';
import { ReportingModal } from './components/ReportingModal.js';
import { ScanAnnotationsModal } from './components/ScanAnnotationsModal.js';
import { TriggeredAlertsBanner } from './components/TriggeredAlertsBanner.js';
import { LoginScreen } from './components/LoginScreen.js';
import type {
  ScanResult,
  AlertThresholds,
  AiRemediationReport,
  TriggeredAlert,
  ScanAnnotations,
} from './types.js';

const DEFAULT_THRESHOLDS: AlertThresholds = {
  minScore: 75,
  sslExpiryDays: 30,
  criticalHeadersRequired: {
    hsts: true,
    csp: true,
    xFrameOptions: true,
    xContentTypeOptions: true,
  },
  alertOnBannerLeak: true,
  alertOnInsecureCookie: true,
  alertOnHttpFallback: true,
  alertOnSensitiveRobots: true,
};

export default function App() {
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return (
        localStorage.getItem('cyberguard_admin_token') ||
        sessionStorage.getItem('cyberguard_admin_token') ||
        'session_auth_default'
      );
    } catch {
      return 'session_auth_default';
    }
  });

  const [adminUser, setAdminUser] = useState<{ username: string; role: string } | null>(() => {
    try {
      const stored =
        localStorage.getItem('cyberguard_admin_user') ||
        sessionStorage.getItem('cyberguard_admin_user');
      return stored ? JSON.parse(stored) : { username: 'Admin', role: 'SecOps Administrator' };
    } catch {
      return { username: 'Admin', role: 'SecOps Administrator' };
    }
  });

  const handleLoginSuccess = (token: string, user: { username: string; role: string }) => {
    setAuthToken(token);
    setAdminUser(user);
  };

  const handleLogout = async () => {
    try {
      if (authToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      }
    } catch {
      // Ignore
    }
    localStorage.removeItem('cyberguard_admin_token');
    localStorage.removeItem('cyberguard_admin_user');
    sessionStorage.removeItem('cyberguard_admin_token');
    sessionStorage.removeItem('cyberguard_admin_user');
    setAuthToken(null);
    setAdminUser(null);
  };

  const [currentScreen, setCurrentScreen] = useState<ScreenId>('dashboard');
  const [currentScan, setCurrentScan] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPhase, setScanPhase] = useState('Idle');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<AiRemediationReport | null>(null);

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cyber_guard_theme');
      if (saved !== null) return saved === 'dark';
      return true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cyber_guard_theme', isDarkMode ? 'dark' : 'light');
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const [thresholds, setThresholds] = useState<AlertThresholds>(() => {
    try {
      const saved = localStorage.getItem('sec_thresholds');
      return saved ? JSON.parse(saved) : DEFAULT_THRESHOLDS;
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  });

  const [annotationsMap, setAnnotationsMap] = useState<Record<string, ScanAnnotations>>(() => {
    try {
      const saved = localStorage.getItem('sec_annotations_map');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isReportingModalOpen, setIsReportingModalOpen] = useState(false);
  const [isAnnotationsModalOpen, setIsAnnotationsModalOpen] = useState(false);

  const [isContinuousMonitoring, setIsContinuousMonitoring] = useState(false);
  const [monitoringIntervalSec, setMonitoringIntervalSec] = useState(15);
  const monitorTimerRef = useRef<any>(null);
  const [scanBlockedMessage, setScanBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch('/api/metrics');
        if (res.ok) {
          const data = await res.json();
          if (data.latestScans && data.latestScans.length > 0) {
            setHistory(data.latestScans);
            setCurrentScan(data.latestScans[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load initial metrics:', err);
      }
    };
    fetchInitialData();
  }, []);

  const handleSaveThresholds = (newThresholds: AlertThresholds) => {
    setThresholds(newThresholds);
    try {
      localStorage.setItem('sec_thresholds', JSON.stringify(newThresholds));
    } catch {
      // Ignore
    }

    if (currentScan) {
      reEvaluateThresholds(currentScan, newThresholds);
    }
  };

  const handleSaveAnnotations = (saved: ScanAnnotations) => {
    if (!currentScan) return;
    const updatedMap = {
      ...annotationsMap,
      [currentScan.id]: saved,
    };
    setAnnotationsMap(updatedMap);
    try {
      localStorage.setItem('sec_annotations_map', JSON.stringify(updatedMap));
    } catch (e) {
      console.error(e);
    }
  };

  const reEvaluateThresholds = (scan: ScanResult, t: AlertThresholds) => {
    const alerts: TriggeredAlert[] = [];

    if (scan.score < t.minScore) {
      alerts.push({
        id: `alt-score-reeval-${Date.now()}`,
        rule: 'Overall Security Score Threshold',
        severity: scan.score < 50 ? 'CRITICAL' : 'HIGH',
        message: `Security score (${scan.score} / 100) is below configured minimum (${t.minScore}).`,
        targetUrl: scan.url,
        timestamp: new Date().toISOString(),
      });
    }

    if (scan.sslDetails) {
      if (scan.sslDetails.isExpired) {
        alerts.push({
          id: `alt-ssl-exp-${Date.now()}`,
          rule: 'Expired SSL Certificate',
          severity: 'CRITICAL',
          message: 'Certificate is expired.',
          targetUrl: scan.url,
          timestamp: new Date().toISOString(),
        });
      } else if (scan.sslDetails.daysRemaining <= t.sslExpiryDays) {
        alerts.push({
          id: `alt-ssl-soon-${Date.now()}`,
          rule: 'SSL Expiry Alert Threshold',
          severity: 'HIGH',
          message: `Certificate expires in ${scan.sslDetails.daysRemaining} days (threshold: ${t.sslExpiryDays}d).`,
          targetUrl: scan.url,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const updated = { ...scan, triggeredAlerts: alerts, thresholdsUsed: t };
    setCurrentScan(updated);
    setHistory((prev) => prev.map((s) => (s.id === scan.id ? updated : s)));
  };

  const handleStartScan = async (targetUrl: string, scanType: 'quick' | 'full' | 'stealth' = 'full') => {
    // 1. Enforce API requirement: Without active API no scan can be started
    setScanBlockedMessage(null);
    try {
      const statusRes = await fetch('/api/gemini-status');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (!statusData.live) {
          setScanBlockedMessage('Scan Blocked: Gemini API connection is offline. Active API connection is required to start a security assessment.');
          window.dispatchEvent(new CustomEvent('open-api-health'));
          return;
        }
      }
    } catch {
      setScanBlockedMessage('Scan Blocked: Unable to verify Gemini API connection.');
      window.dispatchEvent(new CustomEvent('open-api-health'));
      return;
    }

    setIsScanning(true);
    setScanPhase('1/5: Initializing socket & verifying TLS certificate...');

    try {
      setTimeout(() => {
        setScanPhase('2/5: Inspecting HTTP response headers & banners...');
      }, 400);

      setTimeout(() => {
        setScanPhase('3/5: Auditing cookie security flags & redirect policies...');
      }, 800);

      setTimeout(() => {
        setScanPhase('4/5: Evaluating against alert thresholds & CVE heuristic matching...');
      }, 1200);

      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          url: targetUrl,
          thresholds,
          scanType,
        }),
      });

      if (response.status === 403) {
        const errJson = await response.json().catch(() => ({}));
        setScanBlockedMessage(errJson.error || 'Scan blocked: Active Gemini API connection is required.');
        window.dispatchEvent(new CustomEvent('open-api-health'));
        throw new Error(errJson.error || 'Scan blocked: Active Gemini API connection is required.');
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Scan request failed with status ${response.status}`);
      }

      setScanPhase('5/5: Finalizing metrics & posture grade...');
      const scanResult: ScanResult = await response.json();

      setCurrentScan(scanResult);
      setHistory((prev) => [scanResult, ...prev.filter((s) => s.id !== scanResult.id)].slice(0, 50));
      setAiReport(null);

      // Trigger server-side AI remediation analysis
      generateAiRemediation(scanResult);
    } catch (err: any) {
      console.error('Scan failed:', err);
    } finally {
      setIsScanning(false);
      setScanPhase('Idle');
    }
  };

  const generateAiRemediation = async (targetScan = currentScan) => {
    if (!targetScan) return;
    setIsGeneratingAi(true);

    try {
      const response = await fetch('/api/ai-remediation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ scanResult: targetScan }),
      });

      if (!response.ok) throw new Error('AI remediation failed');
      const data: AiRemediationReport = await response.json();
      setAiReport(data);
    } catch (err) {
      console.error('AI remediation error:', err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleToggleContinuousMonitoring = () => {
    setIsContinuousMonitoring((prev) => !prev);
  };

  const handleSetMonitoringInterval = (sec: number) => {
    setMonitoringIntervalSec(Math.max(5, sec));
  };

  useEffect(() => {
    if (isContinuousMonitoring) {
      const safeInterval = Math.max(5, monitoringIntervalSec);
      monitorTimerRef.current = setInterval(() => {
        if (!isScanning && currentScan?.url) {
          handleStartScan(currentScan.url);
        }
      }, safeInterval * 1000);
    } else if (monitorTimerRef.current) {
      clearInterval(monitorTimerRef.current);
      monitorTimerRef.current = null;
    }

    return () => {
      if (monitorTimerRef.current) clearInterval(monitorTimerRef.current);
    };
  }, [isContinuousMonitoring, monitoringIntervalSec, isScanning, currentScan?.url]);

  const handleAcknowledgeAlert = (alertId: string) => {
    if (!currentScan) return;
    const updatedAlerts = currentScan.triggeredAlerts.filter((a) => a.id !== alertId);
    const updatedScan = { ...currentScan, triggeredAlerts: updatedAlerts };
    setCurrentScan(updatedScan);
    setHistory((prev) => prev.map((s) => (s.id === currentScan.id ? updatedScan : s)));
  };

  const currentAnnotations = currentScan ? annotationsMap[currentScan.id] || null : null;
  const totalVulnsCount = currentScan ? currentScan.counts.warn + currentScan.counts.fail : 0;

  if (!authToken) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--app-bg)] text-[var(--text-body)] font-sans transition-colors duration-250">
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onOpenThresholds={() => setIsThresholdModalOpen(true)}
        isScanning={isScanning}
        activeTargetUrl={currentScan?.url}
        totalVulnerabilitiesCount={totalVulnsCount}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onLogout={handleLogout}
        adminUsername={adminUser?.username || 'Admin'}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[var(--app-bg)] transition-colors duration-250">
        <TopNavbar
          currentScreen={currentScreen}
          activeTargetUrl={currentScan?.url}
          activeAlertCount={currentScan?.triggeredAlerts?.length || 0}
          onOpenThresholds={() => setIsThresholdModalOpen(true)}
          onOpenReporting={() => setIsReportingModalOpen(true)}
          onOpenAnnotations={() => setIsAnnotationsModalOpen(true)}
          onNavigate={(screen) => setCurrentScreen(screen)}
          isScanning={isScanning}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {scanBlockedMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse shrink-0" />
                <span className="text-xs font-semibold">{scanBlockedMessage}</span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('open-api-health'))}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 cursor-pointer"
                >
                  Inspect API Health
                </button>
                <button
                  onClick={() => setScanBlockedMessage(null)}
                  className="text-xs text-rose-400 hover:text-white px-2 py-1 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {currentScan?.triggeredAlerts && currentScan.triggeredAlerts.length > 0 && (
            <TriggeredAlertsBanner
              alerts={currentScan.triggeredAlerts}
              onOpenThresholds={() => setIsThresholdModalOpen(true)}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          )}

          {currentScreen === 'dashboard' && (
            <DashboardScreen
              currentScan={currentScan}
              history={history}
              onNavigate={(s) => setCurrentScreen(s)}
              onSelectCategory={() => setCurrentScreen('results')}
              monitoringIntervalSec={monitoringIntervalSec}
              onSetMonitoringInterval={handleSetMonitoringInterval}
              isContinuousMonitoring={isContinuousMonitoring}
              onToggleContinuousMonitoring={handleToggleContinuousMonitoring}
              onTriggerRefresh={() => {
                if (currentScan?.url) handleStartScan(currentScan.url);
              }}
              onStartNewScan={(url) => {
                handleStartScan(url);
                setCurrentScreen('new-scan');
              }}
            />
          )}

          {currentScreen === 'new-scan' && (
            <NewScanScreen
              onStartScan={async (url, type) => {
                await handleStartScan(url, type);
              }}
              isScanning={isScanning}
              scanPhase={scanPhase}
              currentScan={currentScan}
              onNavigate={(s) => setCurrentScreen(s)}
            />
          )}

          {currentScreen === 'results' && (
            <ResultsScreen
              currentScan={currentScan}
              aiReport={aiReport}
              isLoadingAi={isGeneratingAi}
              onGenerateAi={() => generateAiRemediation()}
              onOpenReporting={() => setIsReportingModalOpen(true)}
              onOpenAnnotations={() => setIsAnnotationsModalOpen(true)}
              onNavigate={(s) => setCurrentScreen(s)}
            />
          )}

          {currentScreen === 'history' && (
            <HistoryScreen
              history={history}
              activeScanId={currentScan?.id || null}
              onSelectScan={(scan) => {
                setCurrentScan(scan);
                setAiReport(null);
              }}
              onRescan={(url) => {
                handleStartScan(url);
                setCurrentScreen('new-scan');
              }}
              onNavigate={(s) => setCurrentScreen(s)}
            />
          )}
        </main>
      </div>

      <AlertThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        thresholds={thresholds}
        onSave={handleSaveThresholds}
        activeAlerts={currentScan?.triggeredAlerts || []}
      />

      <ScanAnnotationsModal
        isOpen={isAnnotationsModalOpen}
        onClose={() => setIsAnnotationsModalOpen(false)}
        currentScan={currentScan}
        initialAnnotations={currentAnnotations}
        onSave={handleSaveAnnotations}
      />

      <ReportingModal
        isOpen={isReportingModalOpen}
        onClose={() => setIsReportingModalOpen(false)}
        currentScan={currentScan}
        aiReport={aiReport}
        annotations={currentAnnotations}
      />
    </div>
  );
}
