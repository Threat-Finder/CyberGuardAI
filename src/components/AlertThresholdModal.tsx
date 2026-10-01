import React from 'react';
import { Sliders, X, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import type { AlertThresholds, TriggeredAlert } from '../types.js';

interface AlertThresholdModalProps {
  isOpen: boolean;
  onClose: () => void;
  thresholds: AlertThresholds;
  onSave: (newThresholds: AlertThresholds) => void;
  activeAlerts: TriggeredAlert[];
  onAcknowledgeAlert?: (alertId: string) => void;
}

export const AlertThresholdModal: React.FC<AlertThresholdModalProps> = ({
  isOpen,
  onClose,
  thresholds,
  onSave,
  activeAlerts,
}) => {
  const [localThresholds, setLocalThresholds] = React.useState<AlertThresholds>(thresholds);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  React.useEffect(() => {
    setLocalThresholds(thresholds);
  }, [thresholds, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localThresholds);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const handleResetDefaults = () => {
    const defaults: AlertThresholds = {
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
    setLocalThresholds(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div
        id="alert-thresholds-modal"
        className="relative w-full max-w-2xl cyber-card rounded-2xl shadow-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] overflow-hidden my-8 transition-colors"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--sidebar-border)] bg-[var(--navbar-bg)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-purple)]/15 border border-[var(--accent-purple)]/30 text-[var(--accent-purple)]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-heading)] leading-tight">
                Security Alert Thresholds
              </h2>
              <p className="text-xs text-[var(--text-body)]">
                Customize sensitivity rules for automated vulnerability alerts
              </p>
            </div>
          </div>
          <button
            id="close-threshold-modal-btn"
            onClick={onClose}
            className="text-[var(--text-body)] hover:text-[var(--text-heading)] p-1.5 rounded-lg hover:bg-[var(--subtle-bg)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {activeAlerts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-semibold text-amber-300">
                  {activeAlerts.length} Threshold Violations Detected
                </div>
                <div className="text-amber-400/90 text-xs mt-0.5">
                  The current target triggers warnings based on these threshold parameters.
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold text-[var(--text-heading)]">
                  Minimum Acceptable Security Score
                </label>
                <p className="text-xs text-[var(--text-body)]">
                  Triggers high-priority alert if target rating falls below this percentage.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--subtle-bg)] text-[var(--accent-purple)] border border-[var(--panel-border)] font-mono">
                {localThresholds.minScore} / 100
              </span>
            </div>
            <input
              id="slider-min-score"
              type="range"
              min="40"
              max="95"
              step="5"
              value={localThresholds.minScore}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, minScore: Number(e.target.value) })
              }
              className="w-full accent-[var(--accent-purple)] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-body)] font-mono">
              <span>40 (Relaxed)</span>
              <span>75 (Standard)</span>
              <span>90 (Strict / Banking)</span>
            </div>
          </div>

          <div className="border-t border-[var(--sidebar-border)] pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold text-[var(--text-heading)]">
                  SSL/TLS Expiration Early Warning
                </label>
                <p className="text-xs text-[var(--text-body)]">
                  Warn administrators before certificates reach renewal deadline.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-[var(--subtle-bg)] text-[var(--accent-purple)] border border-[var(--panel-border)] font-mono">
                {localThresholds.sslExpiryDays} Days
              </span>
            </div>
            <input
              id="slider-ssl-days"
              type="range"
              min="7"
              max="90"
              step="1"
              value={localThresholds.sslExpiryDays}
              onChange={(e) =>
                setLocalThresholds({ ...localThresholds, sslExpiryDays: Number(e.target.value) })
              }
              className="w-full accent-[var(--accent-purple)] cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-body)] font-mono">
              <span>7 Days (Urgent)</span>
              <span>30 Days (Recommended)</span>
              <span>90 Days (Enterprise)</span>
            </div>
          </div>

          <div className="border-t border-[var(--sidebar-border)] pt-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                Mandatory Security Headers
              </h3>
              <p className="text-xs text-[var(--text-body)]">
                Raise explicit alerts when any of these mission-critical headers are omitted.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] hover:border-[var(--accent-purple)]/50 cursor-pointer text-xs font-medium text-[var(--text-heading)]">
                <input
                  type="checkbox"
                  checked={localThresholds.criticalHeadersRequired.hsts}
                  onChange={(e) =>
                    setLocalThresholds({
                      ...localThresholds,
                      criticalHeadersRequired: {
                        ...localThresholds.criticalHeadersRequired,
                        hsts: e.target.checked,
                      },
                    })
                  }
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
                <span>Require HSTS (Strict-Transport-Security)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] hover:border-[var(--accent-purple)]/50 cursor-pointer text-xs font-medium text-[var(--text-heading)]">
                <input
                  type="checkbox"
                  checked={localThresholds.criticalHeadersRequired.csp}
                  onChange={(e) =>
                    setLocalThresholds({
                      ...localThresholds,
                      criticalHeadersRequired: {
                        ...localThresholds.criticalHeadersRequired,
                        csp: e.target.checked,
                      },
                    })
                  }
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
                <span>Require CSP (Content-Security-Policy)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] hover:border-[var(--accent-purple)]/50 cursor-pointer text-xs font-medium text-[var(--text-heading)]">
                <input
                  type="checkbox"
                  checked={localThresholds.criticalHeadersRequired.xFrameOptions}
                  onChange={(e) =>
                    setLocalThresholds({
                      ...localThresholds,
                      criticalHeadersRequired: {
                        ...localThresholds.criticalHeadersRequired,
                        xFrameOptions: e.target.checked,
                      },
                    })
                  }
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
                <span>Require X-Frame-Options (Clickjacking)</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] hover:border-[var(--accent-purple)]/50 cursor-pointer text-xs font-medium text-[var(--text-heading)]">
                <input
                  type="checkbox"
                  checked={localThresholds.criticalHeadersRequired.xContentTypeOptions}
                  onChange={(e) =>
                    setLocalThresholds({
                      ...localThresholds,
                      criticalHeadersRequired: {
                        ...localThresholds.criticalHeadersRequired,
                        xContentTypeOptions: e.target.checked,
                      },
                    })
                  }
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
                <span>Require X-Content-Type-Options</span>
              </label>
            </div>
          </div>

          <div className="border-t border-[var(--sidebar-border)] pt-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-heading)]">
                Reconnaissance & Configuration Triggers
              </h3>
              <p className="text-xs text-[var(--text-body)]">
                Flag defensive hygiene issues that facilitate attacker reconnaissance.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] hover:border-[var(--accent-purple)]/50 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-heading)]">
                    Alert on Server Banner Disclosure
                  </div>
                  <div className="text-[11px] text-[var(--text-body)]">
                    Flag leakage of 'Server', 'X-Powered-By', or backend framework version.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localThresholds.alertOnBannerLeak}
                  onChange={(e) =>
                    setLocalThresholds({
                      ...localThresholds,
                      alertOnBannerLeak: e.target.checked,
                    })
                  }
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] hover:border-[var(--accent-purple)]/50 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-heading)]">
                    Alert on Insecure Cookies
                  </div>
                  <div className="text-[11px] text-[var(--text-body)]">
                    Trigger alert if Set-Cookie lacks 'Secure', 'HttpOnly', or 'SameSite' flags.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localThresholds.alertOnInsecureCookie}
                  onChange={(e) =>
                    setLocalThresholds({
                      ...localThresholds,
                      alertOnInsecureCookie: e.target.checked,
                    })
                  }
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] hover:border-[var(--accent-purple)]/50 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-heading)]">
                    Alert on Ineffective HTTPS Redirection
                  </div>
                  <div className="text-[11px] text-[var(--text-body)]">
                    Trigger alert if HTTP port 80 serves content without permanent 301 upgrade.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localThresholds.alertOnHttpFallback}
                  onChange={(e) =>
                    setLocalThresholds({
                      ...localThresholds,
                      alertOnHttpFallback: e.target.checked,
                    })
                  }
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[var(--sidebar-border)] bg-[var(--subtle-bg)] hover:border-[var(--accent-purple)]/50 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-[var(--text-heading)]">
                    Alert on Sensitive Paths in robots.txt
                  </div>
                  <div className="text-[11px] text-[var(--text-body)]">
                    Flag Disallow entries revealing administrative or internal endpoints.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localThresholds.alertOnSensitiveRobots}
                  onChange={(e) =>
                    setLocalThresholds({
                      ...localThresholds,
                      alertOnSensitiveRobots: e.target.checked,
                    })
                  }
                  className="rounded accent-[var(--accent-purple)] w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--sidebar-border)] bg-[var(--navbar-bg)]">
          <button
            id="reset-thresholds-btn"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 text-xs text-[var(--text-body)] hover:text-[var(--text-heading)] font-medium px-3 py-2 rounded-xl hover:bg-[var(--subtle-bg)] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              id="cancel-thresholds-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-body)] hover:text-[var(--text-heading)] hover:bg-[var(--subtle-bg)] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="save-thresholds-btn"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold cyber-button-purple rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                'Apply Thresholds'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
