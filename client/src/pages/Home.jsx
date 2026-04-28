/**
 * Home.jsx
 * Landing page — choose to host or join a game.
 */

import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      {/* Background decorative shapes */}
      <div className="bg-shapes" aria-hidden>
        <div className="bg-shape" style={{ width: 400, height: 400, background: 'var(--neon-pink)', top: '-15%', right: '-10%', animationDelay: '0s' }} />
        <div className="bg-shape" style={{ width: 300, height: 300, background: 'var(--neon-cyan)', bottom: '-10%', left: '-10%', animationDelay: '2s' }} />
        <div className="bg-shape" style={{ width: 200, height: 200, background: 'var(--neon-purple)', top: '40%', left: '5%', animationDelay: '4s' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        {/* Logo */}
        <div className="float" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.25rem' }}>⚡</div>
          <div className="logo">
            <span>Quiz</span><span>Blitz</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '1rem' }}>
            Real-time quiz battles for your classroom
          </p>
        </div>

        {/* Action cards */}
        <div className="card fade-up" style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <button
              className="btn btn-primary btn-lg btn-full"
              onClick={() => navigate('/host')}
            >
              🎮 Host a Game
            </button>
            <button
              className="btn btn-cyan btn-lg btn-full"
              onClick={() => navigate('/join')}
            >
              🙋 Join a Game
            </button>
          </div>

          <hr className="divider" />

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            No account needed · Up to 100 players · Free forever
          </p>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.75rem',
            width: '100%',
          }}
          className="fade-up"
        >
          {[
            { icon: '⏱️', label: 'Live Timer' },
            { icon: '🏆', label: 'Leaderboard' },
            { icon: '🔥', label: 'Streaks' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
