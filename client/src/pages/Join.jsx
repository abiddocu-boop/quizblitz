/**
 * Join.jsx
 * Student join flow — enter PIN + name, then wait in lobby.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import { useSound } from '../hooks/useSound';

export default function Join() {
  const navigate = useNavigate();
  const { playLobby } = useSound();

  const [step, setStep] = useState('form'); // form | lobby | game
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playerCount, setPlayerCount] = useState(0);

  // ── Socket setup ─────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('join:success', ({ playerCount: count }) => {
      setPlayerCount(count);
      setLoading(false);
      setStep('lobby');
    });

    socket.on('join:error', ({ message }) => {
      setError(message);
      setLoading(false);
    });

    socket.on('lobby:update', ({ players: pl, count }) => {
      setPlayers(pl);
      setPlayerCount(count);
      playLobby();
    });

    socket.on('question:start', ({ question }) => {
      navigate('/game', { state: { question, playerName: name, pin } });
    });

    socket.on('host:disconnected', ({ message }) => {
      alert(message);
      navigate('/');
    });

    return () => {
      socket.off('join:success');
      socket.off('join:error');
      socket.off('lobby:update');
      socket.off('question:start');
      socket.off('host:disconnected');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, name, pin]);

  const handleJoin = useCallback(
    (e) => {
      e.preventDefault();
      setError('');

      const cleanPin = pin.trim().replace(/\s/g, '');
      const cleanName = name.trim();

      if (cleanPin.length !== 6 || !/^\d+$/.test(cleanPin)) {
        return setError('PIN must be a 6-digit number.');
      }
      if (cleanName.length < 2 || cleanName.length > 20) {
        return setError('Name must be 2–20 characters.');
      }

      setLoading(true);
      socket.emit('player:join', { pin: cleanPin, name: cleanName });
    },
    [pin, name]
  );

  // ── Lobby view ───────────────────────────────────────────────
  if (step === 'lobby') {
    return (
      <div className="page">
        <div className="card card-wide fade-up" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎮</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            You're in, <span className="glow-cyan">{name}</span>!
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Waiting for the host to start…
          </p>

          <div
            style={{
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Game PIN
            </div>
            <div className="pin-display" style={{ fontSize: '2.5rem' }}>{pin}</div>
          </div>

          <div className="badge badge-cyan" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            👥 {playerCount} player{playerCount !== 1 ? 's' : ''} joined
          </div>

          {/* Live player grid */}
          {players.length > 0 && (
            <div className="player-grid">
              {players.map((p) => (
                <div key={p.name} className="player-chip">
                  {p.name}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
            Waiting for host…
          </div>
        </div>
      </div>
    );
  }

  // ── Form view ────────────────────────────────────────────────
  return (
    <div className="page">
      <div className="bg-shapes" aria-hidden>
        <div className="bg-shape" style={{ width: 300, height: 300, background: 'var(--neon-cyan)', top: '-10%', left: '-10%' }} />
        <div className="bg-shape" style={{ width: 200, height: 200, background: 'var(--neon-pink)', bottom: '-5%', right: '-5%', animationDelay: '3s' }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <a
            href="/"
            style={{ textDecoration: 'none' }}
            onClick={(e) => { e.preventDefault(); navigate('/'); }}
          >
            <div className="logo">
              <span>Quiz</span><span>Blitz</span>
            </div>
          </a>
        </div>

        <div className="card fade-up">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            Join the Game 🙋
          </h2>

          <form onSubmit={handleJoin}>
            <div className="field">
              <label className="label" htmlFor="pin">Game PIN</label>
              <input
                id="pin"
                className="input input-lg"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setError(''); }}
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="name">Your Name</label>
              <input
                id="name"
                className="input"
                type="text"
                maxLength={20}
                placeholder="Enter your name"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                autoComplete="off"
              />
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(255,45,120,0.1)',
                  border: '1px solid rgba(255,45,120,0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem',
                  color: 'var(--neon-pink)',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-cyan btn-full"
              disabled={loading || !pin || !name}
            >
              {loading ? 'Joining…' : 'Join Game →'}
            </button>
          </form>

          <hr className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Get the PIN from your teacher
          </p>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
