export default function Cover3() {
  // Orbital ring specs
  const rings = [
    { r: 520, opacity: 0.07, dash: '0' },
    { r: 420, opacity: 0.10, dash: '12 18' },
    { r: 320, opacity: 0.14, dash: '6 12' },
    { r: 220, opacity: 0.20, dash: '0' },
    { r: 120, opacity: 0.30, dash: '0' },
  ];

  // Floating prompt chips around center
  const promptChips = [
    { angle: -30,  dist: 360, text: 'cinematic lighting' },
    { angle: 45,   dist: 340, text: 'ultra detailed' },
    { angle: 120,  dist: 370, text: '8K resolution' },
    { angle: 195,  dist: 350, text: 'photorealistic' },
    { angle: 255,  dist: 340, text: 'deep shadows' },
    { angle: 315,  dist: 360, text: 'artstation' },
  ];

  const cx = 600, cy = 640;

  function chipPosition(angle, dist) {
    const rad = (angle * Math.PI) / 180;
    return {
      x: cx + dist * Math.cos(rad),
      y: cy + dist * Math.sin(rad),
    };
  }

  // Floating prompt text cards (Arabic)
  const arabicPrompts = [
    'صورة احترافية لمدينة مستقبلية، ضوء أزرق',
    'شخصية كرتونية بأسلوب ياباني، ألوان زاهية',
    'منظر طبيعي خيالي، أعلى جودة ممكنة',
    'تصميم شعار تجاري عصري، خلفية شفافة',
  ];

  return (
    <div
      style={{
        width: 1200,
        height: 1600,
        background: '#080810',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Arial, sans-serif',
        direction: 'rtl',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        .cover3-text { font-family: 'Cairo', Arial, sans-serif; }
      `}</style>

      {/* ── SVG layer: rings + connectors ── */}
      <svg
        width="1200" height="1600"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        viewBox="0 0 1200 1600"
      >
        {/* Deep center glow */}
        <radialGradient id="cg" cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#6C2BFF" stopOpacity="0.30" />
          <stop offset="50%"  stopColor="#00CFFF" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#080810" stopOpacity="0" />
        </radialGradient>
        <ellipse cx={cx} cy={cy} rx="560" ry="560" fill="url(#cg)" />

        {/* Orbital rings */}
        {rings.map((rg, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={rg.r}
            fill="none"
            stroke="#6C2BFF"
            strokeWidth={i === 3 ? 1.5 : 1}
            strokeOpacity={rg.opacity}
            strokeDasharray={rg.dash}
          />
        ))}

        {/* Connector lines from chips to center */}
        {promptChips.map((c, i) => {
          const pos = chipPosition(c.angle, c.dist);
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={pos.x} y2={pos.y}
              stroke="#6C2BFF"
              strokeWidth="0.8"
              strokeOpacity="0.2"
              strokeDasharray="4 6"
            />
          );
        })}

        {/* English prompt chips (en labels on the orbit) */}
        {promptChips.map((c, i) => {
          const pos = chipPosition(c.angle, c.dist);
          const isLeft = pos.x < cx;
          const w = 200, h = 36;
          return (
            <g key={i}>
              <rect
                x={pos.x - w / 2} y={pos.y - h / 2}
                width={w} height={h} rx="18"
                fill="rgba(108,43,255,0.12)"
                stroke="rgba(108,43,255,0.30)"
                strokeWidth="1"
              />
              <text
                x={pos.x} y={pos.y + 5}
                textAnchor="middle"
                fill="rgba(0,207,255,0.65)"
                fontSize="14"
                fontFamily="Arial, sans-serif"
                fontWeight="600"
              >{c.text}</text>
            </g>
          );
        })}

        {/* Central nucleus */}
        {/* Outer pulse ring */}
        <circle cx={cx} cy={cy} r="90" fill="none" stroke="#6C2BFF" strokeWidth="1" strokeOpacity="0.25" />
        <circle cx={cx} cy={cy} r="72" fill="none" stroke="#00CFFF" strokeWidth="1" strokeOpacity="0.30" />
        {/* Core glow fill */}
        <radialGradient id="nuc" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00CFFF" stopOpacity="0.55" />
          <stop offset="40%"  stopColor="#6C2BFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#080810" stopOpacity="0" />
        </radialGradient>
        <circle cx={cx} cy={cy} r="68" fill="url(#nuc)" />

        {/* Scattered mini star dots */}
        {[
          [140,200],[980,150],[60,500],[1100,420],[200,950],[1000,880],
          [350,160],[780,190],[100,750],[1080,700],[450,1050],[700,1020],
        ].map(([sx,sy],i) => (
          <circle key={i} cx={sx} cy={sy}
            r={i % 3 === 0 ? 2 : 1.2}
            fill={i % 2 === 0 ? '#6C2BFF' : '#00CFFF'}
            opacity={0.3 + (i % 4) * 0.1}
          />
        ))}

        {/* Scanning arc — partial ring highlight */}
        <path
          d={`M ${cx + 420} ${cy} A 420 420 0 0 1 ${cx + 420 * Math.cos(Math.PI * 0.6)} ${cy - 420 * Math.sin(Math.PI * 0.6)}`}
          fill="none"
          stroke="url(#scanLine)"
          strokeWidth="2"
          strokeOpacity="0.5"
        />
        <linearGradient id="scanLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#00CFFF" stopOpacity="0" />
          <stop offset="50%"  stopColor="#00CFFF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#00CFFF" stopOpacity="0" />
        </linearGradient>
      </svg>

      {/* Center nucleus icon text */}
      <div style={{
        position: 'absolute',
        top: cy - 30,
        left: cx - 36,
        fontSize: 60,
        lineHeight: 1,
        userSelect: 'none',
      }}>✦</div>

      {/* ── Arabic prompt cards — lower half ── */}
      <div style={{
        position: 'absolute',
        top: 1000, left: 60, right: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}>
        {arabicPrompts.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            padding: '18px 28px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(108,43,255,0.15)',
            borderRadius: 16,
          }}>
            {/* Prompt symbol */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(108,43,255,0.2)',
              flexShrink: 0,
            }}>
              <span style={{ color: '#6C2BFF', fontSize: 16, fontWeight: 900 }}>/p</span>
            </div>
            <span className="cover3-text" style={{
              color: 'rgba(245,245,245,0.6)',
              fontSize: 20,
              fontWeight: 500,
              direction: 'rtl',
              flex: 1,
            }}>{p}</span>
            {/* Quality badge */}
            <div style={{
              padding: '4px 14px',
              background: i % 2 === 0 ? 'rgba(0,207,255,0.08)' : 'rgba(108,43,255,0.1)',
              border: `1px solid ${i % 2 === 0 ? 'rgba(0,207,255,0.2)' : 'rgba(108,43,255,0.25)'}`,
              borderRadius: 100,
              flexShrink: 0,
            }}>
              <span className="cover3-text" style={{
                color: i % 2 === 0 ? '#00CFFF' : '#B48AFF',
                fontSize: 15,
                fontWeight: 700,
              }}>v6</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom title zone ── */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 360,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
        background: 'linear-gradient(0deg, rgba(8,8,16,0.95) 0%, transparent 100%)',
      }}>
        {/* AI badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '8px 24px',
          background: 'rgba(0,207,255,0.08)',
          border: '1px solid rgba(0,207,255,0.2)',
          borderRadius: 100,
          marginBottom: 28,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#00CFFF',
            boxShadow: '0 0 10px #00CFFF',
          }} />
          <span className="cover3-text" style={{
            color: '#00CFFF', fontSize: 18, fontWeight: 700, letterSpacing: 3,
          }}>ذكاء اصطناعي · إبداع لا حدود له</span>
        </div>

        {/* Title */}
        <h1 className="cover3-text" style={{
          color: '#F5F5F5',
          fontSize: 82,
          fontWeight: 900,
          textAlign: 'center',
          margin: '0 0 6px',
          lineHeight: 1.2,
        }}>بروميبتس ميدجرني</h1>
        <h2 className="cover3-text" style={{
          fontSize: 52,
          fontWeight: 700,
          textAlign: 'center',
          margin: '0 0 24px',
          background: 'linear-gradient(90deg, #00CFFF, #6C2BFF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.3,
        }}>أوامر احترافية بالعربي</h2>

        {/* Brand */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '12px 32px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 100,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6C2BFF,#00CFFF)',
          }} />
          <span className="cover3-text" style={{
            color: 'rgba(245,245,245,0.35)',
            fontSize: 20, fontWeight: 700, letterSpacing: 5,
          }}>PROMPTR</span>
        </div>
      </div>
    </div>
  );
}
