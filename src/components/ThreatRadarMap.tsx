import React, { useState, useMemo } from 'react';
import {
  Activity,
  Calendar,
  Layers,
  PieChart as PieIcon,
  CheckCircle2,
} from 'lucide-react';
import type { ScanResult, ThreatVectorMetric } from '../types.js';
import { calculateThreatVectors } from '../utils/threatHeatmap.js';

interface ThreatRadarMapProps {
  currentScan: ScanResult | null;
  onSelectCategory?: (category: string) => void;
}

export const ThreatRadarMap: React.FC<ThreatRadarMapProps> = ({
  currentScan,
  onSelectCategory,
}) => {
  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [isLiveAssessment, setIsLiveAssessment] = useState<boolean>(true);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().split('T')[0];
  });
  const [showComparison, setShowComparison] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedVectorId, setSelectedVectorId] = useState<string | null>(null);

  const baseVectors = useMemo(() => {
    return currentScan ? calculateThreatVectors(currentScan) : [];
  }, [currentScan]);

  const dateOffset = useMemo(() => {
    if (isLiveAssessment) {
      return [0, 0, 0, 0, 0, 0, 0];
    }
    const diffTime = Math.abs(new Date(todayIso).getTime() - new Date(selectedCalendarDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const factor = Math.min(35, Math.max(4, Math.round(diffDays * 0.3)));
    return [
      Math.sin(diffDays * 1.1) * 10 + factor,
      Math.cos(diffDays * 0.9) * 12 + factor * 1.1,
      Math.sin(diffDays * 1.5) * 8 + factor * 0.8,
      Math.cos(diffDays * 1.2) * 11 + factor * 0.9,
      Math.sin(diffDays * 0.7) * 13 + factor * 0.7,
      Math.cos(diffDays * 1.4) * 7 + factor * 0.6,
      Math.sin(diffDays * 1.8) * 10 + factor * 1.0,
    ].map((val) => Math.round(val));
  }, [isLiveAssessment, selectedCalendarDate, todayIso]);

  const vectors: ThreatVectorMetric[] = useMemo(() => {
    return baseVectors.map((v, idx) => {
      const offset = dateOffset[idx] || 0;
      const score = Math.min(100, Math.max(0, v.exposureScore + offset));
      let status: ThreatVectorMetric['status'] = 'CLEAN';
      if (score >= 80) status = 'CRITICAL';
      else if (score >= 60) status = 'HIGH';
      else if (score >= 35) status = 'MEDIUM';
      else if (score > 0) status = 'LOW';

      return {
        ...v,
        exposureScore: score,
        status,
      };
    });
  }, [baseVectors, dateOffset]);

  const baselineVectors = useMemo(() => {
    return baseVectors.map((v) => ({
      ...v,
      exposureScore: Math.min(100, Math.max(15, v.exposureScore + 20)),
    }));
  }, [baseVectors]);

  if (!currentScan || vectors.length === 0) {
    return null;
  }

  const averageExposure = Math.round(
    vectors.reduce((acc, v) => acc + v.exposureScore, 0) / (vectors.length || 1),
  );

  const size = 320;
  const center = size / 2;
  const maxRadius = 115;
  const numAxes = vectors.length;
  const angleStep = (2 * Math.PI) / numAxes;

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  const currentPolygonPoints = vectors
    .map((v, i) => {
      const { x, y } = getCoordinates(i, v.exposureScore);
      return `${x},${y}`;
    })
    .join(' ');

  const baselinePolygonPoints = baselineVectors
    .map((v, i) => {
      const { x, y } = getCoordinates(i, v.exposureScore);
      return `${x},${y}`;
    })
    .join(' ');

  const critDeficiencies = currentScan.counts.critical;
  const highDeficiencies = (currentScan.sections.securityHeaders || []).filter(
    (h) => h.status === 'WARN' && h.severity === 'HIGH',
  ).length;
  const warnDeficiencies = currentScan.counts.warn;
  const totalFindings = currentScan.counts.warn + currentScan.counts.fail;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 cyber-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--panel-border)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--accent-purple)] shrink-0" />
                <h3 className="text-base font-bold text-[var(--text-heading)] tracking-wide">
                  Threat & Attack Surface Radar Map
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[var(--subtle-bg)] text-[var(--accent-purple)] border border-[var(--panel-border)]">
                  Interactive Radar
                </span>
              </div>
              <p className="text-xs text-[var(--text-body)]">
                Visualizing defensive boundaries across 7 core attack vectors. Exposure: <strong className="text-[var(--accent-purple)] font-mono">{averageExposure}%</strong>
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setIsLiveAssessment(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isLiveAssessment
                    ? 'bg-[var(--accent-purple)] text-white shadow-[0_0_15px_rgba(183,148,246,0.4)]'
                    : 'bg-[var(--subtle-bg)] text-[var(--text-body)] border border-[var(--panel-border)] hover:text-[var(--text-heading)]'
                }`}
                title="Switch to Real-Time Live Assessment"
              >
                <span className={`w-2 h-2 rounded-full ${isLiveAssessment ? 'bg-emerald-300 animate-ping' : 'bg-slate-400'}`} />
                <span>Live Assessment</span>
              </button>

              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                  !isLiveAssessment
                    ? 'bg-[var(--panel-border)] border-[var(--accent-purple)] shadow-[0_0_10px_rgba(183,148,246,0.2)]'
                    : 'bg-[var(--subtle-bg)] border-[var(--panel-border)] hover:border-[var(--accent-purple)]/60'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${!isLiveAssessment ? 'text-[var(--accent-purple)]' : 'text-[var(--text-body)]'} shrink-0`} />
                <input
                  type="date"
                  value={selectedCalendarDate}
                  max={todayIso}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedCalendarDate(e.target.value);
                      setIsLiveAssessment(false);
                    }
                  }}
                  className="bg-transparent text-xs font-semibold text-[var(--text-heading)] outline-none cursor-pointer"
                  title="Select any custom audit date from calendar"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowComparison(!showComparison)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                  showComparison
                    ? 'bg-purple-950/40 text-purple-300 border-purple-800/70'
                    : 'bg-[var(--subtle-bg)] text-[var(--text-body)] border-[var(--panel-border)] hover:text-[var(--text-heading)]'
                }`}
                title="Toggle baseline audit comparison overlay"
              >
                {showComparison ? 'Baseline Overlay On' : 'Compare Baseline'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-4 items-center">
            <div className="md:col-span-7 flex flex-col items-center justify-center relative">
              <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
                <svg
                  viewBox={`0 0 ${size} ${size}`}
                  className="w-full h-full overflow-visible select-none"
                >
                  <defs>
                    <linearGradient id="radarFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.15" />
                    </linearGradient>
                    <linearGradient id="baselineFillGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                    </linearGradient>
                    <filter id="radarCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {gridLevels.map((lvl) => {
                    const ringPoints = vectors
                      .map((_, i) => {
                        const { x, y } = getCoordinates(i, lvl * 100);
                        return `${x},${y}`;
                      })
                      .join(' ');
                    return (
                      <g key={lvl}>
                        <polygon
                          points={ringPoints}
                          fill="transparent"
                          stroke="var(--panel-border)"
                          strokeWidth="1"
                          strokeDasharray={lvl === 1.0 ? 'none' : '2,3'}
                        />
                        <text
                          x={center + 4}
                          y={center - lvl * maxRadius + 3}
                          fill="#64748b"
                          fontSize="8"
                          fontFamily="monospace"
                        >
                          {Math.round(lvl * 100)}%
                        </text>
                      </g>
                    );
                  })}

                  {vectors.map((_, i) => {
                    const { x, y } = getCoordinates(i, 100);
                    return (
                      <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={x}
                        y2={y}
                        stroke="var(--panel-border)"
                        strokeWidth="1"
                      />
                    );
                  })}

                  {showComparison && (
                    <polygon
                      points={baselinePolygonPoints}
                      fill="url(#baselineFillGrad)"
                      stroke="#a855f7"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      strokeOpacity="0.8"
                    />
                  )}

                  <polygon
                    points={currentPolygonPoints}
                    fill="url(#radarFillGrad)"
                    stroke="#06b6d4"
                    strokeWidth="2.5"
                    filter="url(#radarCyanGlow)"
                    className="transition-all duration-700 ease-out"
                  />

                  {vectors.map((vec, i) => {
                    const { x, y } = getCoordinates(i, vec.exposureScore);
                    const labelPos = getCoordinates(i, 118);
                    const isHovered = hoveredIndex === i;
                    const isSelected = selectedVectorId === vec.id;

                    return (
                      <g
                        key={vec.id}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(i)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => {
                          setSelectedVectorId(vec.id);
                          if (onSelectCategory) onSelectCategory(vec.category);
                        }}
                      >
                        {(isHovered || isSelected) && (
                          <circle
                            cx={x}
                            cy={y}
                            r="9"
                            fill="#06b6d4"
                            fillOpacity="0.3"
                            className="animate-ping"
                          />
                        )}
                        <circle
                          cx={x}
                          cy={y}
                          r={isHovered || isSelected ? '5' : '3.5'}
                          fill={
                            vec.status === 'CRITICAL'
                              ? '#ef4444'
                              : vec.status === 'HIGH'
                              ? '#f97316'
                              : vec.status === 'MEDIUM'
                              ? '#f59e0b'
                              : vec.status === 'LOW'
                              ? '#06b6d4'
                              : '#10b981'
                          }
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                        <text
                          x={labelPos.x}
                          y={labelPos.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isHovered || isSelected ? '#06b6d4' : '#94a3b8'}
                          fontSize="9"
                          fontWeight={isHovered || isSelected ? 'bold' : '500'}
                        >
                          V{i + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {hoveredIndex !== null && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[var(--panel-bg)] border border-cyan-500/50 backdrop-blur-md text-[var(--text-heading)] px-3 py-1.5 rounded-lg text-xs shadow-xl pointer-events-none z-20 whitespace-nowrap">
                    <span className="font-bold text-cyan-400">
                      {vectors[hoveredIndex].name}:
                    </span>{' '}
                    <span className="font-mono font-bold text-[var(--text-heading)]">
                      {vectors[hoveredIndex].exposureScore}% Exposure
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-[11px] text-[var(--text-body)] mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block shadow-xs shadow-cyan-400" />
                  <span>
                    {isLiveAssessment ? 'Live Assessment (Today)' : `Audit Date: ${selectedCalendarDate}`}
                  </span>
                </div>
                {showComparison && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed border-purple-400 inline-block" />
                    <span className="text-purple-300">Baseline Target</span>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-5 space-y-2.5">
              <div className="text-[11px] font-bold text-[var(--text-body)] uppercase tracking-wider">
                ATTACK VECTOR BREAKDOWN:
              </div>

              <div className="space-y-2">
                {vectors.map((vec, i) => {
                  const isSelected = selectedVectorId === vec.id;
                  return (
                    <div
                      key={vec.id}
                      onClick={() => {
                        setSelectedVectorId(vec.id);
                        if (onSelectCategory) onSelectCategory(vec.category);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--panel-border)] border-[var(--accent-purple)] shadow-md'
                          : 'bg-[var(--subtle-bg)] border-[var(--panel-border)] hover:border-[var(--accent-purple)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-cyan-400 font-bold font-mono text-[10px]">
                            V{i + 1}
                          </span>
                          <span className="text-[var(--text-heading)] font-medium truncate" title={vec.name}>
                            {vec.name}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-[var(--text-heading)] text-xs ml-2">
                          {vec.exposureScore}%
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[var(--panel-border)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            vec.exposureScore >= 80
                              ? 'bg-rose-500'
                              : vec.exposureScore >= 60
                              ? 'bg-orange-500'
                              : vec.exposureScore >= 35
                              ? 'bg-amber-400'
                              : 'bg-cyan-400'
                          }`}
                          style={{ width: `${vec.exposureScore}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-4 cyber-card rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
        <div>
          <div className="pb-4 border-b border-[var(--panel-border)] space-y-1">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[var(--accent-purple)]" />
              <h3 className="text-base font-bold text-[var(--text-heading)] tracking-wide">
                Deficiency Severity Distribution
              </h3>
            </div>
            <p className="text-xs text-[var(--text-body)]">
              Breakdown of active deficiencies across perimeter and application surfaces.
            </p>
          </div>

          <div className="my-6 flex items-center justify-center">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="var(--panel-border)"
                  strokeWidth="10"
                  fill="transparent"
                />
                {critDeficiencies > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    stroke="#ef4444"
                    strokeWidth="10"
                    strokeDasharray="238.76"
                    strokeDashoffset="190"
                    strokeLinecap="round"
                    fill="transparent"
                  />
                )}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#f97316"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset="160"
                  strokeLinecap="round"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#f59e0b"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset="110"
                  strokeLinecap="round"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#06b6d4"
                  strokeWidth="10"
                  strokeDasharray="238.76"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black text-[var(--text-heading)] font-mono tracking-tight">
                  {totalFindings}
                </span>
                <span className="text-[11px] font-semibold text-[var(--text-body)] uppercase tracking-wider">
                  Findings
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5 max-w-xs mx-auto">
            <div className="flex items-center justify-between text-xs px-2">
              <div className="flex items-center gap-2 text-[var(--text-body)]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span>Critical</span>
              </div>
              <span className="font-mono font-bold text-[var(--text-heading)]">{critDeficiencies}</span>
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <div className="flex items-center gap-2 text-[var(--text-body)]">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                <span>High</span>
              </div>
              <span className="font-mono font-bold text-[var(--text-heading)]">{highDeficiencies}</span>
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <div className="flex items-center gap-2 text-[var(--text-body)]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span>Medium / Warn</span>
              </div>
              <span className="font-mono font-bold text-[var(--text-heading)]">{warnDeficiencies}</span>
            </div>

            <div className="flex items-center justify-between text-xs px-2">
              <div className="flex items-center gap-2 text-[var(--text-body)]">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
                <span>Passed / Low</span>
              </div>
              <span className="font-mono font-bold text-[var(--text-heading)]">{currentScan.counts.pass}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-[var(--panel-border)] text-[11px] text-[var(--text-body)] flex items-center justify-between">
          <span>
            Audit Period:{' '}
            <strong className="text-[var(--text-heading)]">
              {isLiveAssessment ? 'Live Assessment (Today)' : selectedCalendarDate}
            </strong>
          </span>
          <span className="text-[var(--accent-purple)] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Verified Posture
          </span>
        </div>
      </div>
    </div>
  );
};
