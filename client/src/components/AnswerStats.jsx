/**
 * AnswerStats.jsx
 * Visual bar chart showing how many players chose each option.
 * Displayed on the host screen during/after a question.
 */

const COLORS = ['var(--opt-a)', 'var(--opt-b)', 'var(--opt-c)', 'var(--opt-d)'];
const LABELS = ['A', 'B', 'C', 'D'];

export default function AnswerStats({ stats, correctAnswer, options }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div style={{ marginTop: '1rem' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '0.5rem',
          alignItems: 'end',
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const count = stats[i] || 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const isCorrect = correctAnswer === i;

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              {/* Bar */}
              <div
                style={{
                  width: '100%',
                  height: `${Math.max(pct * 1.2, 8)}px`,
                  minHeight: '8px',
                  background: COLORS[i],
                  borderRadius: '6px 6px 0 0',
                  transition: 'height 0.6s ease',
                  opacity: correctAnswer !== undefined && !isCorrect ? 0.4 : 1,
                  outline: isCorrect ? '3px solid var(--neon-green)' : 'none',
                  position: 'relative',
                }}
              >
                {isCorrect && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-24px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '1.1rem',
                    }}
                  >
                    ✓
                  </span>
                )}
              </div>
              {/* Label */}
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.85rem', color: COLORS[i] }}>
                {LABELS[i]}
              </div>
              {/* Count */}
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {count} ({pct}%)
              </div>
              {/* Option text */}
              {options && (
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                    maxWidth: '80px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {options[i]}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
