/**
 * StudentGame.jsx
 * The student's in-game view.
 * States: question → answered → results → (next question or game end)
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import socket from '../socket';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';
import { useSound } from '../hooks/useSound';

const OPTION_ICONS  = ['🔴', '🔵', '🟢', '🟠'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function StudentGame() {
  const navigate   = useNavigate();
  const { state }  = useLocation();
  const { playCorrect, playWrong, playStart } = useSound();

  // If no state, redirect to join
  useEffect(() => {
    if (!state?.question) navigate('/join', { replace: true });
  }, [state, navigate]);

  const [phase, setPhase] = useState('question'); // question | answered | results | ended
  const [question, setQuestion] = useState(state?.question || null);
  const [selected, setSelected] = useState(null);     // index of chosen answer
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [result, setResult] = useState(null);         // { correct, pointsEarned }
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [myRank, setMyRank] = useState(null);

  const playerName = state?.playerName || '';

  // ── Socket listeners ──────────────────────────────────────────
  useEffect(() => {
    playStart();

    socket.on('question:start', ({ question: q }) => {
      setQuestion(q);
      setPhase('question');
      setSelected(null);
      setCorrectAnswer(null);
      setResult(null);
      playStart();
    });

    socket.on('answer:result', (data) => {
      setResult(data);
      setCorrectAnswer(data.correctAnswer);
      if (data.correct) playCorrect();
      else playWrong();
      // Phase transitions to 'answered' — wait for question:end
      setPhase('answered');
    });

    socket.on('question:end', ({ correctAnswer: ca, leaderboard: lb, isLastQuestion: last }) => {
      setCorrectAnswer(ca);
      setLeaderboard(lb);
      setIsLastQuestion(last);
      // Find my rank
      const rank = lb.findIndex((p) => p.name === playerName) + 1;
      setMyRank(rank > 0 ? rank : null);
      setPhase('results');
    });

    socket.on('game:ended', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      const rank = lb.findIndex((p) => p.name === playerName) + 1;
      setMyRank(rank > 0 ? rank : null);
      setPhase('ended');
    });

    socket.on('host:disconnected', () => {
      alert('The host disconnected. Game over.');
      navigate('/');
    });

    return () => {
      socket.off('question:start');
      socket.off('answer:result');
      socket.off('question:end');
      socket.off('game:ended');
      socket.off('host:disconnected');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName]);

  const submitAnswer = useCallback(
    (index) => {
      if (selected !== null || phase !== 'question') return;
      setSelected(index);
      socket.emit('player:answer', { answerIndex: index });
    },
    [selected, phase]
  );

  // ── Phase: Question (live) ────────────────────────────────────
  if (phase === 'question' && question) {
    return (
      <div className="page" style={{ justifyContent: 'flex-start', paddingTop: '1rem' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
              padding: '0 0.25rem',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Q {question.index + 1} / {question.total}
            </div>
            <Timer
              duration={question.timeLimit}
              active
              onExpire={() => setPhase('answered')}
            />
            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                maxWidth: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}
            >
              {playerName}
            </div>
          </div>

          {/* Question card */}
          <div
            className="card fade-up"
            style={{ marginBottom: '1rem', textAlign: 'center', padding: '1.5rem' }}
          >
            <p className="question-text">{question.text}</p>
          </div>

          {/* Answer options */}
          <div className="answer-grid fade-up">
            {question.options.map((option, i) => (
              <button
                key={i}
                className={`answer-btn answer-btn-${['a', 'b', 'c', 'd'][i]}`}
                onClick={() => submitAnswer(i)}
                disabled={selected !== null}
              >
                <span className="answer-icon">{OPTION_ICONS[i]}</span>
                <span>{option}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Phase: Answered (waiting for round to end) ────────────────
  if (phase === 'answered') {
    return (
      <div className="page">
        <div className="card fade-up" style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: '4rem', marginBottom: '0.75rem' }}>
            {result?.correct ? '✅' : selected === null ? '⏰' : '❌'}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {result?.correct
              ? 'Correct!'
              : selected === null
              ? "Time's Up!"
              : 'Wrong!'}
          </h2>
          {result?.correct && (
            <div className="badge badge-green" style={{ fontSize: '1rem', padding: '0.4rem 1rem', margin: '0.5rem auto' }}>
              +{result.pointsEarned.toLocaleString()} pts
            </div>
          )}
          <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '0.9rem' }}>
            Waiting for the host to reveal the answer…
          </p>
          <div className="spinner" style={{ margin: '1.5rem auto 0' }} />
        </div>
      </div>
    );
  }

  // ── Phase: Results (after question) ──────────────────────────
  if (phase === 'results') {
    const myScore = leaderboard.find((p) => p.name === playerName)?.score || 0;
    const correct = correctAnswer === selected;

    return (
      <div className="page" style={{ justifyContent: 'flex-start', paddingTop: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 500, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Result feedback */}
          <div className="card fade-up" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {selected === null ? '⏰' : correct ? '🎉' : '😬'}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>
              {selected === null
                ? "Time's up!"
                : correct
                ? 'Correct answer!'
                : 'Not quite…'}
            </h3>

            {/* Show correct answer */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(0,255,157,0.1)',
                border: '1px solid rgba(0,255,157,0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '0.5rem 1rem',
                margin: '0.5rem 0',
              }}
            >
              <span style={{ color: 'var(--neon-green)', fontWeight: 700 }}>✓</span>
              <span style={{ fontWeight: 600 }}>
                {OPTION_LABELS[correctAnswer]}: {question?.options[correctAnswer]}
              </span>
            </div>

            {/* Score + rank */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Score</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                  {myScore.toLocaleString()}
                </div>
              </div>
              {myRank && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Rank</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--neon-yellow)' }}>
                    #{myRank}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card fade-up" style={{ animationDelay: '0.15s' }}>
            <Leaderboard players={leaderboard} title="🏆 Top Players" compact />
          </div>

          {isLastQuestion && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              This was the last question — final results coming soon!
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Phase: Game Ended ─────────────────────────────────────────
  if (phase === 'ended') {
    const myScore = leaderboard.find((p) => p.name === playerName)?.score || 0;

    return (
      <div className="page">
        <div className="card card-wide fade-up" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🏁</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '0.25rem' }}>
            Game Over!
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Final results are in
          </p>

          {myRank === 1 && (
            <div className="badge badge-yellow" style={{ marginBottom: '1rem', fontSize: '1rem', padding: '0.5rem 1.25rem' }}>
              🥇 You won! Amazing!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div className="label">Your Score</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--neon-cyan)' }}>
                {myScore.toLocaleString()}
              </div>
            </div>
            {myRank && (
              <div>
                <div className="label">Final Rank</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--neon-yellow)' }}>
                  #{myRank}
                </div>
              </div>
            )}
          </div>

          <hr className="divider" />
          <Leaderboard players={leaderboard} title="🏆 Final Leaderboard" />

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: '1.5rem' }}
            onClick={() => navigate('/')}
          >
            Play Again 🔄
          </button>
        </div>
      </div>
    );
  }

  return null;
}
