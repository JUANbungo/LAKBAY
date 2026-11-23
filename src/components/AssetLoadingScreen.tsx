import React from 'react';
import { AssetPreloadProgress } from '../game/assetPreloader';

interface AssetLoadingScreenProps {
  progress: AssetPreloadProgress;
}

export const AssetLoadingScreen: React.FC<AssetLoadingScreenProps> = ({ progress }) => {
  const pct = Math.max(0, Math.min(100, progress.percent));

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#0b192c] via-[#102542] to-[#08111f] text-slate-100 select-none px-6">
      <div className="w-full max-w-md rounded-2xl border border-amber-400/30 bg-slate-950/80 p-7 shadow-2xl backdrop-blur-md">
        {/* Emblem & Title */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400/70 bg-gradient-to-br from-blue-900 via-slate-900 to-red-900 shadow-lg shadow-amber-500/20">
            <svg viewBox="0 0 64 64" className="h-10 w-10 text-amber-300" fill="currentColor" aria-hidden="true">
              <circle cx="32" cy="32" r="10" />
              <g stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
                <line x1="32" y1="6" x2="32" y2="16" />
                <line x1="32" y1="48" x2="32" y2="58" />
                <line x1="6" y1="32" x2="16" y2="32" />
                <line x1="48" y1="32" x2="58" y2="32" />
                <line x1="13.6" y1="13.6" x2="20.7" y2="20.7" />
                <line x1="43.3" y1="43.3" x2="50.4" y2="50.4" />
                <line x1="50.4" y1="13.6" x2="43.3" y2="20.7" />
                <line x1="20.7" y1="43.3" x2="13.6" y2="50.4" />
              </g>
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-wide text-amber-300">
            BATAAN: LABAN SA KORAPSYON
          </h1>
          <p className="mt-1 text-xs font-medium text-sky-200/80">
            Preparing illustrated sprites, town parallax &amp; battle atlases...
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-2 h-3.5 w-full overflow-hidden rounded-full border border-slate-700/80 bg-slate-900/90 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-400 to-yellow-300 transition-all duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Status Footer */}
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="truncate pr-3 font-medium text-amber-200/90">{progress.stage}</span>
          <span className="shrink-0 font-mono font-bold text-sky-300">
            {pct}% ({progress.loaded}/{progress.total})
          </span>
        </div>
      </div>
    </div>
  );
};
