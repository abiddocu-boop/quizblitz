/**
 * Leaderboard.jsx
 * Displays sorted player scores with rank indicators.
 */

export default function Leaderboard({ players, title = '🏆 Leaderboard', compact = false }) {
  if (!players || players.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
        No scores yet.
      </div>
    );
  }

  const rankLabel = (i) => {
    if (i === 0) return { label: '🥇', cls: 'gold' };
    if (i === 1) return { label: '🥈', cls: 'silver' };
    if (i === 2) return { label: '🥉', cls: 'bronze' };
    return { label: `#${i + 1}`, cls: '' };
  };

  return (
    <div>
      {title && (
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          {title}
        </h3>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {players.map((player, i) => {
          const { label, cls } = rankLabel(i);
          return (
            <div
              key={player.name}
              className="leaderboard-item fade-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <span className={`lb-rank ${cls}`}>{label}</span>
              <span className="lb-name">{player.name}</span>
              {player.streak > 1 && !compact && (
                <span
                  style={{
                    fontSize: '0.75rem',
                    background: 'rgba(255,230,0,0.15)',
                    color: 'var(--neon-yellow)',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '100px',
                    fontWeight: 700,
                  }}
                >
                  🔥 ×{player.streak}
                </span>
              )}
              <span className="lb-score">{player.score.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
