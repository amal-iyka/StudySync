export default function Doodles() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <g id="book">
          <rect x="2" y="6" width="36" height="26" rx="3" fill="none" stroke="rgba(100,100,100,0.28)" strokeWidth="2.5" />
          <line x1="20" y1="6" x2="20" y2="32" stroke="rgba(100,100,100,0.28)" strokeWidth="1.8" />
        </g>
        <g id="pencil">
          <rect x="0" y="6" width="30" height="8" rx="2" transform="rotate(-16 15 10)" fill="none" stroke="rgba(100,100,100,0.28)" strokeWidth="2" />
          <path d="M-2 8 l6 -6" stroke="rgba(100,100,100,0.24)" strokeWidth="1.8" fill="none" />
        </g>
        <g id="cap">
          <polygon points="18,4 44,12 18,22 -8,12" fill="none" stroke="rgba(100,100,100,0.26)" strokeWidth="2" />
          <line x1="18" y1="22" x2="18" y2="32" stroke="rgba(100,100,100,0.22)" strokeWidth="1.8" />
        </g>
        <g id="lightbulb">
          <path d="M18 6 a10 10 0 0 1 0 20 a6 6 0 0 0 0 6 h-8 a6 6 0 0 0 0 -6 a10 10 0 0 1 0 -20" fill="none" stroke="rgba(100,100,100,0.20)" strokeWidth="1.8" />
        </g>
        <g id="notebook">
          <rect x="0" y="0" width="30" height="40" rx="4" fill="none" stroke="rgba(100,100,100,0.28)" strokeWidth="1.8" />
          <line x1="8" y1="8" x2="8" y2="34" stroke="rgba(100,100,100,0.22)" strokeWidth="1.2" />
        </g>
        <g id="plane">
          <path d="M2 10 L30 18 L10 12 L2 10 Z" fill="none" stroke="rgba(100,100,100,0.26)" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
          <path d="M10 12 L16 26" fill="none" stroke="rgba(100,100,100,0.18)" strokeWidth="1.4" strokeLinecap="round" />
        </g>
        <g id="star">
          <path d="M0 -6 l2 4 l4 2 l-4 2 l-2 4 l-2 -4 l-4 -2 l4 -2 z" fill="rgba(100,100,100,0.16)" stroke="none" />
        </g>
        <g id="ruler">
          <rect x="0" y="0" width="40" height="8" rx="2" fill="none" stroke="rgba(100,100,100,0.22)" strokeWidth="1.6" />
          <g stroke="rgba(100,100,100,0.18)" strokeWidth="1">
            <line x1="4" y1="2" x2="4" y2="6" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="20" y1="2" x2="20" y2="6" />
            <line x1="28" y1="2" x2="28" y2="6" />
          </g>
        </g>
        <g id="eraser">
          <rect x="0" y="0" width="34" height="16" rx="3" transform="rotate(-12 17 8)" fill="none" stroke="rgba(100,100,100,0.22)" strokeWidth="1.6" />
          <path d="M22 2 l8 6" stroke="rgba(100,100,100,0.16)" strokeWidth="1.2" fill="none" />
        </g>
        <g id="mug">
          <rect x="0" y="0" width="30" height="22" rx="4" fill="none" stroke="rgba(100,100,100,0.22)" strokeWidth="1.6" />
          <path d="M30 6 a6 6 0 0 1 0 10" fill="none" stroke="rgba(100,100,100,0.18)" strokeWidth="1.6" />
        </g>
        <g id="bookmark">
          <path d="M0 0 h20 v28 l-10 -6 l-10 6 z" fill="none" stroke="rgba(100,100,100,0.22)" strokeWidth="1.6" />
        </g>
        <g id="magnifier">
          <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(100,100,100,0.20)" strokeWidth="1.6" />
          <line x1="16" y1="16" x2="26" y2="26" stroke="rgba(100,100,100,0.16)" strokeWidth="1.4" />
        </g>
        <g id="leaf">
          <path d="M0 12 C12 0 24 0 36 12 C24 18 12 18 0 12 z" fill="none" stroke="rgba(100,100,100,0.16)" strokeWidth="1.6" />
        </g>
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Balanced scatter across viewport */}
        <use href="#book" xlinkHref="#book" x="56" y="72" width="56" height="40" />
        <use href="#pencil" xlinkHref="#pencil" x="200" y="36" width="50" height="28" transform="rotate(-8 225 50)" />
        <use href="#notebook" xlinkHref="#notebook" x="360" y="110" width="54" height="64" transform="rotate(6 387 142)" />
        <use href="#cap" xlinkHref="#cap" x="760" y="64" width="64" height="50" transform="rotate(-6 792 89)" />
        <use href="#lightbulb" xlinkHref="#lightbulb" x="960" y="132" width="48" height="60" />
        <use href="#plane" xlinkHref="#plane" x="300" y="220" width="56" height="30" transform="rotate(-12 328 235)" />

        {/* denser scattering: additional notebooks, pencils, planes, stars, and accents */}
        <use href="#notebook" xlinkHref="#notebook" x="80" y="220" width="36" height="44" transform="rotate(-6 98 242)" />
        <use href="#pencil" xlinkHref="#pencil" x="140" y="320" width="48" height="26" transform="rotate(10 164 333)" />
        <use href="#plane" xlinkHref="#plane" x="220" y="60" width="58" height="32" transform="rotate(-22 249 76)" />
        <use href="#book" xlinkHref="#book" x="440" y="32" width="64" height="44" transform="rotate(8 472 54)" />
        <use href="#notebook" xlinkHref="#notebook" x="680" y="420" width="46" height="56" transform="rotate(-10 703 452)" />
        <use href="#plane" xlinkHref="#plane" x="820" y="80" width="44" height="24" transform="rotate(12 842 92)" />
        <use href="#pencil" xlinkHref="#pencil" x="980" y="220" width="36" height="18" transform="rotate(-4 1000 229)" />
        <use href="#star" xlinkHref="#star" x="520" y="480" width="18" height="18" />
        <use href="#star" xlinkHref="#star" x="260" y="480" width="12" height="12" />
        <use href="#star" xlinkHref="#star" x="360" y="380" width="10" height="10" />
        <use href="#book" xlinkHref="#book" x="1120" y="420" width="40" height="30" transform="rotate(-6 1140 435)" />
        <use href="#notebook" xlinkHref="#notebook" x="1040" y="240" width="46" height="56" transform="rotate(14 1063 268)" />
        <use href="#pencil" xlinkHref="#pencil" x="620" y="120" width="50" height="28" transform="rotate(4 645 134)" />

        {/* Soft abstract lines */}
        <path d="M20 700 q220 -160 440 0" stroke="rgba(34,197,94,0.18)" strokeWidth="12" strokeLinecap="round" />
        <path d="M120 560 q120 -80 240 0" stroke="rgba(236,72,153,0.16)" strokeWidth="8" strokeDasharray="12 10" />

        {/* Stars and small accents */}
        <use href="#star" xlinkHref="#star" x="720" y="420" width="20" height="20" />
        <circle cx="540" cy="260" r="6" fill="rgba(96,165,250,0.2)" />

        {/* Additional scattered repeats for balance */}
        <use href="#pencil" xlinkHref="#pencil" x="120" y="220" width="40" height="22" transform="rotate(6 140 231)" />
        <use href="#book" xlinkHref="#book" x="920" y="520" width="46" height="34" />
        <use href="#notebook" xlinkHref="#notebook" x="240" y="520" width="42" height="52" transform="rotate(-4 261 546)" />
        <use href="#plane" xlinkHref="#plane" x="980" y="540" width="48" height="26" transform="rotate(18 1004 553)" />

        {/* New additional doodles for more variety */}
        <use href="#ruler" xlinkHref="#ruler" x="40" y="420" width="64" height="14" transform="rotate(-6 72 427)" />
        <use href="#eraser" xlinkHref="#eraser" x="200" y="420" width="56" height="26" transform="rotate(10 228 433)" />
        <use href="#mug" xlinkHref="#mug" x="480" y="80" width="42" height="30" />
        <use href="#bookmark" xlinkHref="#bookmark" x="620" y="200" width="28" height="40" />
        <use href="#magnifier" xlinkHref="#magnifier" x="820" y="320" width="40" height="40" />
        <use href="#leaf" xlinkHref="#leaf" x="720" y="180" width="76" height="36" transform="rotate(-12 758 198)" />
        <use href="#ruler" xlinkHref="#ruler" x="1040" y="120" width="48" height="12" transform="rotate(18 1070 126)" />
        <use href="#mug" xlinkHref="#mug" x="140" y="100" width="34" height="28" transform="rotate(-8 157 114)" />
      </g>
    </svg>
  );
}
