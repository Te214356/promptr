type PromptrLogoProps = {
  size?: "sm" | "md" | "lg"
  showTagline?: boolean
}

export default function PromptrLogo({ size = "md", showTagline = false }: PromptrLogoProps) {
  const wordmarkSize = size === "sm" ? 14 : size === "lg" ? 22 : 17
  const taglineSize = size === "sm" ? 9 : size === "lg" ? 12 : 10

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontSize: wordmarkSize,
          fontWeight: 900,
          letterSpacing: "0.25em",
          lineHeight: 1,
          fontFamily: "'Arial Black', Arial, sans-serif",
          textTransform: "uppercase",
          background: "linear-gradient(135deg, #6C2BFF 0%, #00CFFF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
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
  )
}
