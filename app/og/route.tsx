import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Amber radial glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '-100px',
            width: '700px',
            height: '700px',
            background: 'radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 65%)',
          }}
        />

        {/* Top section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.22em',
              color: '#f59e0b',
              fontFamily: 'sans-serif',
              textTransform: 'uppercase',
            }}
          >
            BEAT MARKETPLACE
          </div>
          <div
            style={{
              fontSize: '104px',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              fontFamily: 'sans-serif',
            }}
          >
            PRODKJ
            <br />
            BEATS
          </div>
          <div
            style={{
              fontSize: '20px',
              color: 'rgba(255,255,255,0.45)',
              fontFamily: 'sans-serif',
              marginTop: '8px',
            }}
          >
            Premium Beats · Trap · Drill · R&B · Afrobeats
          </div>
        </div>

        {/* Bottom section */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            {['GloRilla', 'DeeBaby', 'Shenseea'].map((artist) => (
              <div
                key={artist}
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.28)',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#f59e0b',
                  fontFamily: 'sans-serif',
                }}
              >
                {artist}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.25)',
              fontFamily: 'sans-serif',
            }}
          >
            prodkjbeats.com
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
