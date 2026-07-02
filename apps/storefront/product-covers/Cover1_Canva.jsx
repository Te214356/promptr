export default function Cover1() {
  const cardData = [
    { top: 80,  left: 60,  w: 320, h: 200, rotate: -8,  bg: 'linear-gradient(135deg,#6C2BFF,#00CFFF)', label: 'ريلز' },
    { top: 120, left: 420, w: 280, h: 180, rotate: 5,   bg: 'linear-gradient(135deg,#00CFFF,#0066CC)', label: 'ستوري' },
    { top: 310, left: 30,  w: 260, h: 340, rotate: -4,  bg: 'linear-gradient(135deg,#4A1FBF,#6C2BFF)', label: 'بوست' },
    { top: 330, left: 350, w: 340, h: 220, rotate: 6,   bg: 'linear-gradient(135deg,#00CFFF,#6C2BFF)', label: 'كفر' },
    { top: 580, left: 80,  w: 300, h: 190, rotate: -5,  bg: 'linear-gradient(135deg,#6C2BFF,#B24BFF)', label: 'لينك' },
    { top: 600, left: 430, w: 250, h: 200, rotate: 4,   bg: 'linear-gradient(135deg,#00CFFF,#00A3CC)', label: 'إعلان' },
    { top: 820, left: 20,  w: 340, h: 180, rotate: -3,  bg: 'linear-gradient(135deg,#B24BFF,#6C2BFF)', label: 'هايلايت' },
    { top: 840, left: 400, w: 290, h: 210, rotate: 7,   bg: 'linear-gradient(135deg,#6C2BFF,#00CFFF)', label: 'قصة' },
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
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
        .cover1-text { font-family: 'Cairo', Arial, sans-serif; }
      `}</style>

      {/* Background grid noise */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(108,43,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(108,43,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />

      {/* Deep glow top-right */}
      <div style={{
        position: 'absolute', top: -200, right: -200,
        width: 700, height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,43,255,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Glow bottom-left */}
      <div style={{
        position: 'absolute', bottom: 200, left: -150,
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,207,255,0.15) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Scattered cards — upper zone */}
      <div style={{ position: 'absolute', top: 60, left: 0, width: 1200, height: 780 }}>
        {cardData.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: c.top, left: c.left,
              width: c.w, height: c.h,
              borderRadius: 20,
              background: c.bg,
              transform: `rotate(${c.rotate}deg)`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.88,
            }}
          >
            {/* Inner card frame */}
            <div style={{
              width: '88%', height: '76%',
              border: '1.5px solid rgba(255,255,255,0.25)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="cover1-text" style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 2,
              }}>{c.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Divider line */}
      <div style={{
        position: 'absolute', top: 900, left: 80, right: 80,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(108,43,255,0.6), rgba(0,207,255,0.6), transparent)',
      }} />

      {/* Bottom content zone */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 680,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
      }}>
        {/* Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(108,43,255,0.15)',
          border: '1px solid rgba(108,43,255,0.4)',
          borderRadius: 100,
          padding: '10px 28px',
          marginBottom: 40,
        }}>
          <div style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#00CFFF',
            boxShadow: '0 0 8px #00CFFF',
          }} />
          <span className="cover1-text" style={{
            color: '#00CFFF',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 3,
          }}>أكثر من 100 قالب</span>
        </div>

        {/* Main title */}
        <h1 className="cover1-text" style={{
          color: '#F5F5F5',
          fontSize: 96,
          fontWeight: 900,
          margin: '0 0 8px',
          textAlign: 'center',
          lineHeight: 1.15,
          letterSpacing: -1,
        }}>قوالب كانفا</h1>
        <h2 className="cover1-text" style={{
          color: '#F5F5F5',
          fontSize: 96,
          fontWeight: 900,
          margin: '0 0 32px',
          textAlign: 'center',
          lineHeight: 1.15,
          letterSpacing: -1,
          background: 'linear-gradient(90deg, #6C2BFF, #00CFFF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>العربية</h2>

        {/* Subtitle */}
        <p className="cover1-text" style={{
          color: 'rgba(245,245,245,0.55)',
          fontSize: 32,
          fontWeight: 400,
          textAlign: 'center',
          margin: '0 0 60px',
          maxWidth: 700,
          lineHeight: 1.7,
        }}>للسوشيال ميديا — جاهزة، احترافية، بالعربي</p>

        {/* Bottom brand row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          padding: '18px 40px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 100,
        }}>
          <div style={{
            width: 12, height: 12,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#6C2BFF,#00CFFF)',
          }} />
          <span className="cover1-text" style={{
            color: 'rgba(245,245,245,0.5)',
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 4,
          }}>PROMPTR</span>
        </div>
      </div>
    </div>
  );
}
