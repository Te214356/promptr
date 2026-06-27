type PromptrLogoProps = {
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
}

export default function PromptrLogo({ size = "md", showTagline = false }: PromptrLogoProps) {
  const iconSize = size === "sm" ? 28 : size === "lg" ? 44 : 36
  const pSize = size === "sm" ? 14 : size === "lg" ? 22 : 18
  const wordmarkSize = size === "sm" ? 14 : size === "lg" ? 22 : 17
  const taglineSize = size === "sm" ? 9 : size === "lg" ? 12 : 10
  const radius = size === "sm" ? 6 : size === "lg" ? 10 : 8
  const dotSize = size === "sm" ? 3 : size === "lg" ? 5 : 4

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: size === "sm" ? 7 : 10 }}>
      {/* Icon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="promptr-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6C2BFF" />
            <stop offset="100%" stopColor="#00CFFF" />
          </linearGradient>
        </defs>
        <rect width="36" height="36" rx={radius} fill="url(#promptr-grad)" />
        {/* P letterform */}
        <text
          x="10"
          y="26"
          fill="white"
          fontSize={pSize + 4}
          fontWeight="800"
          fontFamily="'Arial Black', Arial, sans-serif"
          letterSpacing="-1"
        >
          P
        </text>
        {/* Cyan dot */}
        <circle cx="27" cy="13" r={dotSize} fill="#00CFFF" />
      </svg>

      {/* Wordmark + tagline */}
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          style={{
            fontSize: wordmarkSize,
            fontWeight: 800,
            color: "#F5F5F5",
            letterSpacing: "0.2em",
            lineHeight: 1,
            fontFamily: "'Arial Black', Arial, sans-serif",
            textTransform: "uppercase",
          }}
        >
          PROMPTR
        </span>
        {showTagline && (
          <span
            style={{
              fontSize: taglineSize,
              color: "#00CFFF",
              letterSpacing: "0.08em",
              lineHeight: 1,
              fontFamily: "Arial, sans-serif",
              fontWeight: 400,
            }}
          >
            ضغطة وتتطور
          </span>
        )}
      </div>
    </div>
  )
}
