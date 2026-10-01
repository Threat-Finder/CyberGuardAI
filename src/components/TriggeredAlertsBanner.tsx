import React from 'react';
import { Sliders, Bell } from 'lucide-react';
import type { TriggeredAlert } from '../types.js';

interface TriggeredAlertsBannerProps {
  alerts: TriggeredAlert[];
  onOpenThresholds: () => void;
  onAcknowledgeAlert?: (alertId: string) => void;
}

export const TriggeredAlertsBanner: React.FC<TriggeredAlertsBannerProps> = ({
  alerts,
  onOpenThresholds,
  onAcknowledgeAlert,
}) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div
      id="active-threshold-alerts-banner"
      className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2 shadow-xs transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-amber-500/20 text-amber-300">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Security Alert Threshold Violations ({alerts.length})
          </h4>
        </div>
        <button
          onClick={onOpenThresholds}
          className="text-xs font-medium text-amber-300 hover:text-amber-100 underline flex items-center gap-1 cursor-pointer"
        >
          <Sliders className="w-3 h-3" />
          Adjust Threshold Rules
        </button>
      </div>

      <div className="space-y-1.5 pt-1">
        {alerts.slice(0, 4).map((alert) => (
          <div
            key={alert.id}
            className="flex items-start justify-between gap-3 text-xs bg-[var(--panel-bg)]/80 p-2.5 rounded-lg border border-amber-500/20"
          >
            <div className="flex items-start gap-2">
              <span
                className={`shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  alert.severity === 'CRITICAL'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : alert.severity === 'HIGH'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {alert.severity}
              </span>
              <div>
                <span className="font-semibold text-[var(--text-heading)]">{alert.rule}: </span>
                <span className="text-[var(--text-body)]">{alert.message}</span>
              </div>
            </div>

            {onAcknowledgeAlert && (
              <button
                onClick={() => onAcknowledgeAlert(alert.id)}
                className="text-[11px] text-[var(--text-body)] hover:text-[var(--text-heading)] font-medium whitespace-nowrap cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        ))}

        {alerts.length > 4 && (
          <div className="text-[11px] text-amber-300 font-medium text-center pt-1">
            + {alerts.length - 4} more threshold alerts triggered.
          </div>
        )}
      </div>
    </div>
  );
};
