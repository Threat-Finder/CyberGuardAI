import React from 'react';

interface CyberGuardLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const CyberGuardLogo: React.FC<CyberGuardLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const dimensions = {
    sm: { emblemSize: 28, textScale: 'scale-75 origin-left' },
    md: { emblemSize: 38, textScale: 'scale-90 origin-left' },
    lg: { emblemSize: 48, textScale: 'scale-100 origin-left' },
    xl: { emblemSize: 64, textScale: 'scale-125 origin-left' },
  }[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* SHIELD & MAGNIFYING GLASS & LOCK EMBLEM */}
      <div className="relative shrink-0 flex items-center justify-center">
        <svg
          width={dimensions.emblemSize}
          height={dimensions.emblemSize}
          viewBox="0 0 120 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-[0_0_12px_rgba(183,148,246,0.65)] hover:drop-shadow-[0_0_18px_rgba(183,148,246,0.9)] transition-all duration-300"
        >
          <defs>
            {/* Outer neon purple glow */}
            <filter id="neonShieldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Shield Background Gradient */}
            <linearGradient id="shieldBg" x1="60" y1="5" x2="60" y2="125" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1C1036" />
              <stop offset="45%" stopColor="#130B24" />
              <stop offset="100%" stopColor="#080410" />
            </linearGradient>

            {/* Shield Outer Rim Gradient */}
            <linearGradient id="shieldRim" x1="10" y1="5" x2="110" y2="125" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#E9D5FF" />
              <stop offset="25%" stopColor="#A855F7" />
              <stop offset="50%" stopColor="#C084FC" />
              <stop offset="75%" stopColor="#7E22CE" />
              <stop offset="100%" stopColor="#B794F6" />
            </linearGradient>

            {/* Magnifying Glass Rim Gradient */}
            <linearGradient id="glassRim" x1="30" y1="30" x2="90" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#C084FC" />
              <stop offset="70%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#E9D5FF" />
            </linearGradient>

            {/* Lock Gradient */}
            <linearGradient id="lockGrad" x1="45" y1="50" x2="75" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#DDD6FE" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#6D28D9" />
            </linearGradient>

            {/* Circuit Traces Glow */}
            <linearGradient id="circuitGrad" x1="20" y1="30" x2="100" y2="90" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#C084FC" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Outer Shield Shell */}
          <path
            d="M60 4 L108 24 C108 72 88 106 60 126 C32 106 12 72 12 24 Z"
            fill="url(#shieldBg)"
            stroke="url(#shieldRim)"
            strokeWidth="3.5"
            strokeLinejoin="round"
            filter="url(#neonShieldGlow)"
          />

          {/* Inner Shield Bevel Line */}
          <path
            d="M60 12 L101 29 C101 70 83 99 60 117 C37 99 19 70 19 29 Z"
            fill="none"
            stroke="#9333EA"
            strokeWidth="1.2"
            strokeOpacity="0.75"
          />

          {/* Central Vertical Energy Seam */}
          <line x1="60" y1="12" x2="60" y2="116" stroke="#C084FC" strokeWidth="1" strokeOpacity="0.5" />

          {/* PCB / Circuit Traces on Left Side */}
          <g stroke="url(#circuitGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
            <path d="M26 38 H38 L45 45" />
            <circle cx="26" cy="38" r="2" fill="#E9D5FF" />
            <path d="M23 54 H35 L42 62" />
            <circle cx="23" cy="54" r="2" fill="#E9D5FF" />
            <path d="M28 72 H36 L43 78" />
            <circle cx="28" cy="72" r="2" fill="#E9D5FF" />
            <path d="M46 102 L46 92 L53 85" />
            <circle cx="46" cy="102" r="1.8" fill="#E9D5FF" />
          </g>

          {/* PCB / Circuit Traces on Right Side */}
          <g stroke="url(#circuitGrad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
            <path d="M94 38 H82 L75 45" />
            <circle cx="94" cy="38" r="2" fill="#E9D5FF" />
            <path d="M97 54 H85 L78 62" />
            <circle cx="97" cy="54" r="2" fill="#E9D5FF" />
            <path d="M92 72 H84 L77 78" />
            <circle cx="92" cy="72" r="2" fill="#E9D5FF" />
            <path d="M74 102 L74 92 L67 85" />
            <circle cx="74" cy="102" r="1.8" fill="#E9D5FF" />
          </g>

          {/* Central Magnifying Glass Lens Glow */}
          <circle cx="58" cy="58" r="27" fill="#241442" fillOpacity="0.8" />
          <circle cx="58" cy="58" r="27" stroke="url(#glassRim)" strokeWidth="4.5" />

          {/* Magnifying Glass Handle */}
          <g transform="rotate(45 58 58)">
            <rect
              x="53"
              y="85"
              width="10"
              height="24"
              rx="4"
              fill="url(#glassRim)"
              stroke="#581C87"
              strokeWidth="1.5"
            />
            <line x1="58" y1="88" x2="58" y2="105" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
          </g>

          {/* Padlock Shackle inside Lens */}
          <path
            d="M50 54 V46 C50 41.5 53.5 38 58 38 C62.5 38 66 41.5 66 46 V54"
            fill="none"
            stroke="#E9D5FF"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Padlock Body inside Lens */}
          <rect
            x="46"
            y="52"
            width="24"
            height="19"
            rx="3.5"
            fill="url(#lockGrad)"
            stroke="#C084FC"
            strokeWidth="1.5"
          />

          {/* Keyhole inside Padlock */}
          <circle cx="58" cy="60" r="2.2" fill="#1C1036" />
          <path d="M57 60.5 L56 66 H60 L59 60.5 Z" fill="#1C1036" />

          {/* Lens Specular Reflection */}
          <path
            d="M38 46 C42 39 49 35 58 35"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeOpacity="0.75"
          />
        </svg>
      </div>

      {/* 3D METALLIC TYPOGRAPHIC LOGO */}
      {showText && (
        <div className={`flex flex-col leading-none tracking-tight ${dimensions.textScale}`}>
          <span
            className="font-black text-[22px] tracking-wider uppercase"
            style={{
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.07em',
              background: 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 45%, #94A3B8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 1px #000000)',
              fontWeight: 900,
            }}
          >
            CYBER
          </span>

          <span
            className="font-black text-[22px] tracking-wider uppercase -mt-0.5"
            style={{
              fontFamily: "'Inter', sans-serif",
              letterSpacing: '0.07em',
              background: 'linear-gradient(180deg, #F3E8FF 0%, #D8B4FE 40%, #A855F7 80%, #7E22CE 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 2px 3px rgba(0, 0, 0, 0.85)) drop-shadow(0 0 1px #4C1D95)',
              fontWeight: 900,
            }}
          >
            GUARD
          </span>
        </div>
      )}
    </div>
  );
};
