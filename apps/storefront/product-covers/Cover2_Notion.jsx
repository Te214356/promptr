export default function Cover2() {
  const rows = [
    { label: 'هدفي السنوي',     pct: 78, color: '#6C2BFF', indent: 0 },
    { label: 'ربع السنة الأول', pct: 100, color: '#00CFFF', indent: 1 },
    { label: 'ربع السنة الثاني',pct: 60,  color: '#00CFFF', indent: 1 },
    { label: 'المشاريع النشطة', pct: 45,  color: '#B24BFF', indent: 2 },
    { label: 'الإيرادات المستهدفة', pct: 90, color: '#6C2BFF', indent: 2 },
    { label: 'المهام اليومية',  pct: 55,  color: '#00CFFF', indent: 3 },
  ];

  const chips = ['المهام', 'الميزانية', 'الأولويات', 'الأهداف', 'التقدم'];

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
        .cover2-text { font-family: 'Cairo', Arial, sans-serif; }
      `}</style>

      {/* Subtle vertical lines — structural feel */}
      {[0,1,2,3,4].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: 80 + i * 260,
          width: 1,
          background: 'rgba(108,43,255,0.06)',
        }} />
      ))}

      {/* Top accent bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 5,
        background: 'linear-gradient(90deg, #6C2BFF 0%, #00CFFF 50%, #6C2BFF 100%)',
      }} />

      {/* Corner glow top-left */}
      <div style={{
        position: 'absolute', top: -100, left: -100,
        width: 450, height: 450,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,43,255,0.18) 0%, transparent 70%)',
      }} />

      {/* ---- UPPER HALF: Notion-style database panel ---- */}
      <div style={{
        position: 'absolute',
        top: 80, left: 60, right: 60,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 24,
        padding: '40px 50px',
      }}>
        {/* Panel header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 36,
          paddingBottom: 24,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Icon placeholder */}
            <div style={{
              width: 44, height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg,#6C2BFF,#00CFFF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>🎯</div>
            <span className="cover2-text" style={{
              color: '#F5F5F5', fontSize: 28, fontWeight: 700,
            }}>لوحة الأهداف</span>
          </div>
          {/* Status chips */}
          <div style={{ display: 'flex', gap: 10 }}>
            {chips.map((c, i) => (
              <div key={i} style={{
                padding: '6px 18px',
                borderRadius: 100,
                background: i === 0 ? 'rgba(108,43,255,0.25)' : 'rgba(255,255,255,0.05)',
                border: i === 0 ? '1px solid rgba(108,43,255,0.5)' : '1px solid rgba(255,255,255,0.07)',
              }}>
                <span className="cover2-text" style={{
                  color: i === 0 ? '#B48AFF' : 'rgba(245,245,245,0.4)',
                  fontSize: 18,
                  fontWeight: 600,
                }}>{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress rows */}
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 28,
            paddingRight: r.indent * 36,
          }}>
            {/* Hierarchy dot */}
            <div style={{
              width: r.indent === 0 ? 12 : 8,
              height: r.indent === 0 ? 12 : 8,
              borderRadius: '50%',
              background: r.color,
              flexShrink: 0,
              boxShadow: `0 0 ${r.indent === 0 ? 8 : 4}px ${r.color}`,
            }} />
            {/* Label */}
            <span className="cover2-text" style={{
              color: r.indent === 0 ? '#F5F5F5' : 'rgba(245,245,245,0.7)',
              fontSize: r.indent === 0 ? 26 : 22,
              fontWeight: r.indent === 0 ? 700 : 500,
              minWidth: 260,
              flexShrink: 0,
            }}>{r.label}</span>
            {/* Track */}
            <div style={{
              flex: 1,
              height: r.indent === 0 ? 10 : 7,
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 100,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${r.pct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${r.color}, ${r.color}99)`,
                borderRadius: 100,
              }} />
            </div>
            {/* Percent */}
            <span className="cover2-text" style={{
              color: r.color,
              fontSize: 22,
              fontWeight: 700,
              minWidth: 56,
              textAlign: 'left',
              flexShrink: 0,
            }}>{r.pct}%</span>
          </div>
        ))}
      </div>

      {/* ---- Second panel: mini calendar / timeline ---- */}
      <div style={{
        position: 'absolute',
        top: 730, left: 60, right: 60,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 24,
        padding: '32px 50px',
        display: 'flex',
        alignItems: 'stretch',
        gap: 0,
      }}>
        {/* Timeline months */}
        {['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'].map((m, i) => {
          const active = i < 6;
          const current = i === 5;
          return (
            <div key={i} style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              position: 'relative',
            }}>
              <span className="cover2-text" style={{
                color: current ? '#00CFFF' : active ? 'rgba(245,245,245,0.6)' : 'rgba(245,245,245,0.2)',
                fontSize: 14,
                fontWeight: current ? 700 : 500,
              }}>{m}</span>
              <div style={{
                width: current ? 14 : 8,
                height: current ? 14 : 8,
                borderRadius: '50%',
                background: current ? '#00CFFF' : active ? '#6C2BFF' : 'rgba(255,255,255,0.1)',
                boxShadow: current ? '0 0 12px #00CFFF' : 'none',
              }} />
              {i < 11 && (
                <div style={{
                  position: 'absolute',
                  right: 0, top: 30,
                  width: '50%', height: 2,
                  background: active && i < 5 ? 'rgba(108,43,255,0.4)' : 'rgba(255,255,255,0.05)',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ---- Mini stat cards ---- */}
      <div style={{
        position: 'absolute',
        top: 900, left: 60, right: 60,
        display: 'flex',
        gap: 24,
        marginTop: 0,
      }}>
        {[
          { val: '47', unit: 'مهمة', label: 'مكتملة', color: '#6C2BFF' },
          { val: '12', unit: 'مشروع', label: 'نشط', color: '#00CFFF' },
          { val: '89%', unit: '', label: 'معدل الإنجاز', color: '#B24BFF' },
          { val: '30+', unit: 'قالب', label: 'جاهز', color: '#00CFFF' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1,
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid ${s.color}22`,
            borderRadius: 20,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}>
            <span className="cover2-text" style={{
              color: s.color,
              fontSize: 52,
              fontWeight: 900,
              lineHeight: 1,
            }}>{s.val}</span>
            {s.unit && (
              <span className="cover2-text" style={{
                color: 'rgba(245,245,245,0.5)',
                fontSize: 18,
                fontWeight: 500,
              }}>{s.unit}</span>
            )}
            <span className="cover2-text" style={{
              color: 'rgba(245,245,245,0.35)',
              fontSize: 16,
              fontWeight: 400,
            }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ---- Bottom content ---- */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
      }}>
        {/* Label */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          marginBottom: 32,
        }}>
          <div style={{
            width: 40, height: 2,
            background: 'linear-gradient(90deg, transparent, #6C2BFF)',
          }} />
          <span className="cover2-text" style={{
            color: '#6C2BFF', fontSize: 22, fontWeight: 700, letterSpacing: 3,
          }}>نظام متكامل</span>
          <div style={{
            width: 40, height: 2,
            background: 'linear-gradient(90deg, #6C2BFF, transparent)',
          }} />
        </div>

        {/* Main title */}
        <h1 className="cover2-text" style={{
          color: '#F5F5F5',
          fontSize: 88,
          fontWeight: 900,
          textAlign: 'center',
          margin: '0 0 12px',
          lineHeight: 1.2,
        }}>قوالب نوشن</h1>
        <h2 className="cover2-text" style={{
          fontSize: 88,
          fontWeight: 900,
          textAlign: 'center',
          margin: '0 0 28px',
          lineHeight: 1.2,
          background: 'linear-gradient(90deg, #6C2BFF, #00CFFF)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>للأهداف</h2>

        <p className="cover2-text" style={{
          color: 'rgba(245,245,245,0.45)',
          fontSize: 30,
          textAlign: 'center',
          margin: '0 0 48px',
          lineHeight: 1.7,
          maxWidth: 660,
        }}>نظّم مشاريعك وتتبّع أهدافك — كل شيء في مكان واحد</p>

        {/* Brand tag */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 36px',
          background: 'rgba(108,43,255,0.08)',
          border: '1px solid rgba(108,43,255,0.2)',
          borderRadius: 100,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6C2BFF,#00CFFF)',
          }} />
          <span className="cover2-text" style={{
            color: 'rgba(245,245,245,0.4)',
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 5,
          }}>PROMPTR</span>
        </div>
      </div>
    </div>
  );
}
