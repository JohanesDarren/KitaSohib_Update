import React from 'react';

interface SohibCharacterProps {
  mood: number; // 1-5
  className?: string;
}

export const SohibCharacter: React.FC<SohibCharacterProps> = ({ mood, className = "" }) => {
  
  // Dynamic Mouth based on mood
  const getMouth = () => {
    switch (mood) {
      case 1: // Sad
        return <path d="M85 145 Q100 125 115 145" fill="none" stroke="#1F2937" strokeWidth="5" strokeLinecap="round" />;
      case 2: // Not good
        return <path d="M90 140 H110" fill="none" stroke="#1F2937" strokeWidth="5" strokeLinecap="round" />;
      case 3: // Neutral
        return <path d="M85 140 Q100 150 115 140" fill="none" stroke="#1F2937" strokeWidth="5" strokeLinecap="round" />;
      case 4: // Good (Open Smile)
        return <path d="M80 135 Q100 160 120 135 Z" fill="#7F1D1D" />;
      case 5: // Great (Big Grin)
        return (
           <g>
             <path d="M75 135 Q100 170 125 135 Z" fill="#7F1D1D" />
             <path d="M90 155 Q100 162 110 155" fill="#EF4444" />
           </g>
        );
      default:
        return <path d="M85 140 Q100 150 115 140" fill="none" stroke="#1F2937" strokeWidth="5" strokeLinecap="round" />;
    }
  };

  // Dynamic Eyes based on mood
  const getLeftEye = () => {
      if (mood <= 2) { // Droopy/Sad
          return (
             <g>
                <circle cx="70" cy="95" r="22" fill="white" />
                <circle cx="70" cy="100" r="10" fill="#1F2937" />
                <path d="M45 80 Q70 105 95 80" fill="#1E3A8A" /> {/* Eyelid */}
             </g>
          )
      }
      return (
         <g>
            <circle cx="70" cy="95" r="24" fill="white" />
            <ellipse cx="76" cy="95" rx="12" ry="14" fill="#0F172A" />
            <circle cx="82" cy="88" r="5" fill="white" opacity="0.9" />
            <circle cx="72" cy="102" r="3" fill="white" opacity="0.4" />
         </g>
      );
  };

  const getRightEye = () => {
      if (mood <= 2) {
          return (
             <g>
                <circle cx="130" cy="95" r="22" fill="white" />
                <circle cx="130" cy="100" r="10" fill="#1F2937" />
                <path d="M105 80 Q130 105 155 80" fill="#1E3A8A" /> {/* Eyelid */}
             </g>
          )
      }
      if (mood === 5) { // Wink
          return (
              <g>
                  <path d="M110 100 Q130 85 150 100" fill="none" stroke="#1F2937" strokeWidth="7" strokeLinecap="round" />
              </g>
          )
      }
      return (
         <g>
            <circle cx="130" cy="95" r="24" fill="white" />
            <ellipse cx="124" cy="95" rx="12" ry="14" fill="#0F172A" />
            <circle cx="118" cy="88" r="5" fill="white" opacity="0.9" />
            <circle cx="128" cy="102" r="3" fill="white" opacity="0.4" />
         </g>
      );
  };

  return (
    <svg viewBox="0 0 200 220" className={className} xmlns="http://www.w3.org/2000/svg">
       <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stopColor="#3B82F6" /> {/* Blue 500 */}
             <stop offset="100%" stopColor="#1E3A8A" /> {/* Blue 900 */}
          </linearGradient>
          <linearGradient id="armGradient" x1="0%" y1="0%" x2="0%" y2="100%">
             <stop offset="0%" stopColor="#2563EB" />
             <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
       </defs>
       
       {/* Handle */}
       <path d="M75 45 V25 A25 25 0 0 1 125 25 V45" fill="none" stroke="#475569" strokeWidth="14" strokeLinecap="round" />

       {/* Arms */}
       <g transform="translate(0, 5)">
          <ellipse cx="25" cy="120" rx="14" ry="28" fill="url(#armGradient)" transform="rotate(-25 25 120)" />
          <ellipse cx="175" cy="120" rx="14" ry="28" fill="url(#armGradient)" transform="rotate(25 175 120)" />
       </g>

       {/* Body (Squircle with tail) */}
       <path d="M40 45 H160 A35 35 0 0 1 195 80 V140 A35 35 0 0 1 160 175 H90 L55 210 L65 175 H40 A35 35 0 0 1 5 140 V80 A35 35 0 0 1 40 45 Z" fill="url(#bodyGradient)" />

       {/* Tech Lines (Decoration) */}
       <path d="M20 75 H50 M50 75 V90" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none"/>
       <circle cx="50" cy="75" r="2" fill="rgba(255,255,255,0.4)" />
       
       <path d="M180 110 H155 V130" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none"/>
       <circle cx="155" cy="130" r="2" fill="rgba(255,255,255,0.4)" />
       
       <path d="M130 175 V160 H150" stroke="rgba(255,255,255,0.15)" strokeWidth="2" fill="none"/>
       <circle cx="130" cy="160" r="2" fill="rgba(255,255,255,0.4)" />

       {/* Face Shadow Area */}
       <ellipse cx="100" cy="110" rx="70" ry="40" fill="black" opacity="0.1" filter="url(#glow)" />

       {/* Face Features */}
       {getLeftEye()}
       {getRightEye()}
       {getMouth()}
       
       {/* Cheeks */}
       {(mood >= 3) && (
         <>
           <ellipse cx="55" cy="125" rx="8" ry="5" fill="#F87171" opacity="0.5" filter="url(#glow)" />
           <ellipse cx="145" cy="125" rx="8" ry="5" fill="#F87171" opacity="0.5" filter="url(#glow)" />
         </>
       )}
    </svg>
  );
};