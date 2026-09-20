import React from "react";

/**
 * Official DPWH Seal (Department of Public Works and Highways)
 * Features the iconic circular gear with 17 teeth representing Philippine administrative regions,
 * the central highway perspective, and the white doric column.
 */
export function DpwhSeal({ className = "size-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Department of Public Works and Highways Seal"
    >
      {/* Outer Gear Ring */}
      <circle cx="50" cy="50" r="46" fill="#0038A8" stroke="#FDB813" strokeWidth="2.5" />
      
      {/* Gear Teeth (17 teeth representing 17 administrative regions) */}
      {[...Array(17)].map((_, i) => {
        const angle = (i * 360) / 17;
        return (
          <rect
            key={i}
            x="47"
            y="1"
            width="6"
            height="6"
            rx="1"
            fill="#FDB813"
            transform={`rotate(${angle} 50 50)`}
          />
        );
      })}

      {/* Inner White Rim */}
      <circle cx="50" cy="50" r="38" fill="#FFFFFF" stroke="#002776" strokeWidth="1.5" />

      {/* Blue Central Field */}
      <circle cx="50" cy="50" r="32" fill="#002F87" />

      {/* Golden Horizon / Sun Rays */}
      <path
        d="M20 50 L50 24 L80 50 Z"
        fill="#FDB813"
        opacity="0.35"
      />

      {/* Receding Highway Perspective */}
      <path
        d="M50 36 L66 78 L34 78 Z"
        fill="#1e293b"
      />
      {/* Road Center Line Markings */}
      <line x1="50" y1="42" x2="50" y2="48" stroke="#FFFFFF" strokeWidth="1.5" />
      <line x1="50" y1="52" x2="50" y2="60" stroke="#FFFFFF" strokeWidth="2" />
      <line x1="50" y1="64" x2="50" y2="76" stroke="#FFFFFF" strokeWidth="2.5" />

      {/* Classical Doric Column (Construction Output) */}
      <rect x="44" y="34" width="12" height="2.5" rx="0.5" fill="#FFFFFF" />
      <rect x="46" y="36.5" width="8" height="15" fill="#F8FAFC" />
      <line x1="48" y1="37" x2="48" y2="51" stroke="#CBD5E1" strokeWidth="0.8" />
      <line x1="50" y1="37" x2="50" y2="51" stroke="#CBD5E1" strokeWidth="0.8" />
      <line x1="52" y1="37" x2="52" y2="51" stroke="#CBD5E1" strokeWidth="0.8" />
      <rect x="43" y="51.5" width="14" height="2.5" rx="0.5" fill="#FFFFFF" />

      {/* Outer Text Arc Placeholder / Agency Ring */}
      <circle cx="50" cy="50" r="37.5" stroke="#FDB813" strokeWidth="0.75" fill="none" strokeDasharray="2 1.5" />
    </svg>
  );
}

/**
 * Official Republic of the Philippines / GOVPH Badge
 */
export function GovphLogo({ className = "h-5" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 font-sans ${className}`}>
      <div className="flex items-center gap-0.5">
        <span className="size-2 rounded-full bg-[#0038A8]" />
        <span className="size-2 rounded-full bg-[#CE1126]" />
        <span className="size-2 rounded-full bg-[#FDB813]" />
      </div>
      <span className="font-extrabold tracking-wider text-xs uppercase text-slate-100 font-display">
        GOVPH
      </span>
    </div>
  );
}

/**
 * Standard Transparency Seal Badge
 */
export function TransparencySealBadge({ className = "size-12" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center rounded-full border-2 border-amber-400/80 bg-gradient-to-br from-amber-600 to-amber-900 text-amber-100 shadow-md ${className}`}>
      <div className="text-center">
        <p className="text-[7px] font-extrabold uppercase tracking-widest text-amber-300">Republic</p>
        <p className="text-[8px] font-black uppercase tracking-tight">Transparency</p>
        <p className="text-[7px] font-bold text-amber-200">Seal</p>
      </div>
    </div>
  );
}

/**
 * Freedom of Information (FOI) Badge
 */
export function FoiBadge({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1 rounded border border-blue-400/40 bg-blue-950/80 px-2 py-1 text-[10px] font-bold text-blue-200 shadow-sm ${className}`}>
      <span className="rounded bg-red-600 px-1 text-[9px] text-white">FOI</span>
      <span>Freedom of Information</span>
    </div>
  );
}

/**
 * Bagong Pilipinas Emblem
 */
export function BagongPilipinasBadge({ className = "h-5" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 ${className}`}>
      <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
      <span>Bagong Pilipinas</span>
    </div>
  );
}
