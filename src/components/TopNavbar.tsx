import React from 'react';
import {
  FileText,
  Bell,
  FileEdit,
  Sliders,
  Download,
  Terminal,
  Zap,
} from 'lucide-react';
import type { ScreenId } from './Sidebar.js';
import { ThemeToggle } from './ThemeToggle.js';
import { ApiHealthIndicator } from './ApiHealthIndicator.js';

interface TopNavbarProps {
  currentScreen: ScreenId;
  activeTargetUrl?: string;
  activeAlertCount: number;
  onOpenThresholds: () => void;
  onOpenReporting: () => void;
  onOpenAnnotations: () => void;
  onNavigate: (screen: ScreenId) => void;
  isScanning: boolean;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentScreen,
  activeTargetUrl,
  activeAlertCount,
  onOpenThresholds,
  onOpenReporting,
  onOpenAnnotations,
  onNavigate,
  isScanning,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'dashboard':
        return 'VAPT Security Posture Dashboard';
      case 'new-scan':
        return 'Configure & Launch Assessment';
      case 'results':
        return 'Vulnerability Results & CVE Intelligence';
      case 'history':
        return 'Audit Logs & Assessment History';
      default:
        return 'Cyber Guard Console';
    }
  };

  return (
    <header className="h-16 border-b border-[var(--sidebar-border)] bg-[var(--navbar-bg)] backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20 transition-colors duration-250">
      {/* Screen Title & Target */}
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold text-[var(--text-heading)] tracking-wide">
          {getScreenTitle()}
        </h2>

        {/* API Health Indicator placed right beside screen title */}
        <ApiHealthIndicator />
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5">
        {/* Quick Scan CTA in navbar if not in new-scan */}
        {currentScreen !== 'new-scan' && (
          <button
            id="navbar-scan-now-btn"
            onClick={() => onNavigate('new-scan')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-[0_0_15px_rgba(183,148,246,0.35)]"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Scan Now</span>
          </button>
        )}

        {/* Black & White Theme Toggle Button */}
        <ThemeToggle
          isDarkMode={isDarkMode}
          onToggle={onToggleDarkMode}
          variant="pill"
        />

        {/* Annotations */}
        <button
          onClick={onOpenAnnotations}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--panel-bg)] border border-[var(--panel-border)] hover:border-[var(--accent-purple)] text-xs font-semibold text-[var(--text-body)] hover:text-[var(--text-heading)] transition-all cursor-pointer shadow-sm"
          title="Auditor Triage Notes"
        >
          <FileEdit className="w-3.5 h-3.5 text-[var(--accent-purple)]" />
          <span className="hidden sm:inline">Notes</span>
        </button>

        {/* Alerts Bell */}
        <button
          onClick={onOpenThresholds}
          className={`relative p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
            activeAlertCount > 0
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-500'
              : 'bg-[var(--panel-bg)] border-[var(--panel-border)] text-[var(--text-body)] hover:text-[var(--text-heading)] hover:border-[var(--accent-purple)]'
          }`}
          title="Threshold Alert Violations"
        >
          <Bell className="w-4 h-4" />
          {activeAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold">
              {activeAlertCount}
            </span>
          )}
        </button>

        {/* Export Report */}
        <button
          onClick={onOpenReporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--panel-bg)] border border-[var(--accent-purple)] text-[var(--accent-purple)] hover:opacity-90 text-xs font-bold transition-all cursor-pointer shadow-sm"
          title="Export Assessment Report (PDF, HTML, Word)"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export Report</span>
        </button>
      </div>
    </header>
  );
};
