"use client";

// Örnek Mühendislik (Demo) için basit, kod-tabanlı logo — gerçek TECHMP logosu yerine kullanılır.
export default function OrnekLogo({ size = 52 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id="omBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1c4a7a" />
          <stop offset="100%" stopColor="#0f2238" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="62" height="62" rx="14" fill="url(#omBg)" stroke="#e08a3c" strokeWidth="1.5" />
      {/* dişli / mühendislik motifi */}
      <g transform="translate(32,32)" fill="none" stroke="#e08a3c" strokeWidth="2.4" opacity="0.55">
        <circle r="20" strokeDasharray="4 5" />
      </g>
      <text x="32" y="39" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="22" fill="#ffffff" letterSpacing="0.5">
        ÖM
      </text>
    </svg>
  );
}
