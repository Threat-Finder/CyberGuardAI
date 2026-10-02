import React from 'react';
import {
  LayoutDashboard,
  PlayCircle,
  ShieldAlert,
  History,
  Sliders,
  Zap,
  LogOut,
} from 'lucide-react';
import { CyberGuardLogo } from './CyberGuardLogo.js';
import { ThemeToggle } from './ThemeToggle.js';

export type ScreenId = 'dashboard' | 'new-scan' | 'results' | 'history';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onOpenThresholds: () => void;
  isScanning: boolean;
  activeTargetUrl?: string;
  totalVulnerabilitiesCount: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onLogout?: () => void;
  adminUsername?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  onOpenThresholds,
  isScanning,
  totalVulnerabilitiesCount,
  isDarkMode,
  onToggleDarkMode,
  onLogout,
  adminUsername,
}) => {
  const navItems = [
    {
      id: 'dashboard' as ScreenId,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'new-scan' as ScreenId,
      label: 'New Scan',
      icon: PlayCircle,
      badge: isScanning ? 'Scanning' : null,
      pulse: isScanning,
    },
    {
      id: 'results' as ScreenId,
      label: 'Results & CVEs',
      icon: ShieldAlert,
      badge: totalVulnerabilitiesCount > 0 ? `${totalVulnerabilitiesCount}` : null,
    },
    {
      id: 'history' as ScreenId,
      label: 'Scan History',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col justify-between shadow-xl relative z-30 select-none transition-colors duration-250">
      <div>
        <div className="p-4 border-b border-[var(--sidebar-border)] flex items-center justify-between">
          <CyberGuardLogo size="md" showText={true} />
        </div>

        <div className="p-4 pb-2">
          <button
            onClick={() => onNavigate('new-scan')}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold cyber-button-purple cursor-pointer shadow-[0_0_15px_rgba(183,148,246,0.35)] hover:shadow-[0_0_25px_rgba(183,148,246,0.6)]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Scan Now</span>
          </button>
        </div>

        <nav className="p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-body)] opacity-70 uppercase tracking-wider">
            Navigation
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[var(--panel-border)] text-[var(--text-heading)] border border-[var(--accent-purple)] shadow-xs'
                    : 'text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--subtle-bg)] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-[var(--accent-purple)]' : 'text-[var(--text-body)]'
                    } ${item.pulse ? 'animate-pulse text-[var(--accent-purple)]' : ''}`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full font-mono ${
                      item.pulse
                        ? 'bg-[#B794F6]/20 text-[#B794F6] border border-[#B794F6]/40 animate-pulse'
                        : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={onOpenThresholds}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--subtle-bg)] transition-all cursor-pointer border border-transparent"
          >
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-[var(--accent-purple)]" />
              <span>Thresholds</span>
            </div>
            <span className="text-[10px] text-[var(--text-body)] opacity-70 font-mono">Config</span>
          </button>
        </nav>
      </div>

      <div className="p-4 border-t border-[var(--sidebar-border)] space-y-3">
        {onLogout && (
          <button
            id="sidebar-admin-logout-btn"
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-[var(--text-body)] hover:text-red-400 hover:bg-red-500/10 border border-[var(--sidebar-border)] transition-colors cursor-pointer"
            title="Sign Out of Console"
          >
            <span className="flex items-center gap-2">
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Sign Out</span>
            </span>
            <span className="text-[10px] font-mono text-[var(--text-body)] opacity-60">End Session</span>
          </button>
        )}

        <ThemeToggle
          isDarkMode={isDarkMode}
          onToggle={onToggleDarkMode}
          variant="sidebar"
        />

        <div className="flex items-center justify-between text-[11px] text-[var(--text-body)] px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Engine Online
          </span>
          <span className="font-mono text-[var(--accent-purple)] font-semibold">Gemini 3.8</span>
        </div>
      </div>
    </aside>
  );
};
