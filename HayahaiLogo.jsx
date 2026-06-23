export default function HayahaiLogo({ tagline = "learned predictions", scale = 1, className = "", onDark = false }) {
  const BASE_W = 344;
  const BASE_H = tagline ? 96 : 68;
  const w = BASE_W * scale;
  const h = BASE_H * scale;

  const arcColor      = onDark ? "#A1E4DB" : "#0a3d3a";
  const wordmarkColor = onDark ? "#faf7f5" : "#0a3d3a";
  const taglineColor  = onDark ? "rgba(255,255,255,0.55)" : "#7a9b96";

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${BASE_W} ${BASE_H}`}
      width={w}
      height={h}
      role="img"
      aria-label={`Hayah-AI${tagline ? ` — ${tagline}` : ""}`}
      className={className}
    >
      {/* Logo mark: arc + coral dot */}
      <path
        d="M 12 52 A 28 28 0 0 1 52 12"
        fill="none"
        stroke={arcColor}
        strokeWidth="8"
        strokeLinecap="round"
      />
      <circle cx="52" cy="12" r="6" fill="#ff6b47" />

      {/* Wordmark: hayah-ai — DM Serif Display */}
      <text
        x="68"
        y="48"
        fontFamily="'DM Serif Display', Georgia, serif"
        fontSize="44"
        fontWeight="400"
        fill={wordmarkColor}
        letterSpacing="-1.2"
      >
        hayah
        <tspan fill="#7a9b96">-</tspan>
        <tspan fill="#ff6b47" fontStyle="italic">ai</tspan>
      </text>

      {/* Tagline */}
      {tagline && (
        <text
          x="0"
          y="84"
          fontFamily="'Plus Jakarta Sans', Helvetica Neue, sans-serif"
          fontSize="15"
          fontWeight="300"
          fill={taglineColor}
          textLength="230"
          lengthAdjust="spacing"
        >
          {tagline}
        </text>
      )}
    </svg>
  );
}
