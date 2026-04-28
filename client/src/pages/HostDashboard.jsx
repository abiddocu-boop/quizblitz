/**
 * HostDashboard.jsx
 * Teacher/Host control panel.
 * Phases: setup → lobby → question → results → ended
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';
import Timer from '../components/Timer';
import Leaderboard from '../components/Leaderboard';
import AnswerStats from '../components/AnswerStats';
import QuizBuilder from '../components/QuizBuilder';
import { useSound } from '../hooks/useSound';

export default function HostDashboard() {
  const navigate = useNavigate();
  const { playStart } = useSound();

  const [phase, setPhase] = useState('setup'); // setup | lobby | question | results | ended
  const [showBuilder, setShowBuilder] = useState(false);

  // Game state
  const [pin, setPin] = useState('');
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);   // { text, options, correctAnswer, index, total, timeLimit }
  const [answerStats, setAnswerStats] = useState({ 0: 0, 1: 0, 2: 0, 3: 0 });
  const [answeredCount, setAnsweredCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [timerActive, setTimerActive] = useState(false);

  // ── Socket setup ──────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    socket.on('game:created', ({ pin: p, questionCount }) => {
      setPin(p);
      setPhase('lobby');
      console.log(`[Host] Game created: ${p}, ${questionCount} questions`);
    });

    socket.on('lobby:update', ({ players: pl }) => {
      setPlayers(pl);
    });

    socket.on('question:start', ({ question: q, isHost }) => {
      if (!isHost) return;
      setQuestion(q);
      setAnswerStats({ 0: 0, 1: 0, 2: 0, 3: 0 });
      setAnsweredCount(0);
      setTimerActive(true);
      setPhase('question');
      playStart();
    });

    socket.on('host:answer-update', ({ answeredCount: ac, totalPlayers, answerStats: as }) => {
      setAnsweredCount(ac);
      setAnswerStats(as);
    });

    socket.on('question:end', ({ correctAnswer, leaderboard: lb, answerStats: as, isLastQuestion: last }) => {
      setLeaderboard(lb);
      setAnswerStats(as);
      setIsLastQuestion(last);
      setTimerActive(false);
      setPhase('results');
    });

    socket.on('game:ended', ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setPhase('ended');
    });

    return () => {
      socket.off('game:created');
      socket.off('lobby:update');
      socket.off('question:start');
      socket.off('host:answer-update');
      socket.off('question:end');
      socket.off('game:ended');
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createGame = useCallback((questions) => {
    socket.emit('host:create', { questions });
    setShowBuilder(false);
  }, []);

  const createSampleGame = useCallback(() => {
    socket.emit('host:create', {}); // server uses sample quiz
  }, []);

  const startNextQuestion = useCallback(() => {
    socket.emit('host:next');
  }, []);

  const endQuestion = useCallback(() => {
    socket.emit('host:end-question');
  }, []);

  // ── PHASE: Setup ──────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="page" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
        <div
          className="bg-shapes"
          aria-hidden
        >
          <div className="bg-shape" style={{ width: 500, height: 500, background: 'var(--neon-purple)', top: '-20%', right: '-20%' }} />
          <div className="bg-shape" style={{ width: 300, height: 300, background: 'var(--neon-pink)', bottom: '-10%', left: '-10%', animationDelay: '3s' }} />
        </div>

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 600 }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="logo">
              <span>Quiz</span><span>Blitz</span>
            </div>
            <div className="badge badge-pink" style={{ marginTop: '0.5rem' }}>
              🎮 Host Mode
            </div>
          </div>

          {!showBuilder ? (
            <div className="card fade-up">
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  marginBottom: '0.5rem',
                  textAlign: 'center',
                }}
              >
                Set Up Your Quiz
              </h2>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Use our sample quiz to get started, or build your own.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <button className="btn btn-cyan btn-full btn-lg" onClick={createSampleGame}>
                  ⚡ Quick Start (Sample Quiz)
                </button>
                <button
                  className="btn btn-ghost btn-full"
                  onClick={() => setShowBuilder(true)}
                >
                  ✏️ Create Custom Quiz
                </button>
              </div>

              <hr className="divider" />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                The sample quiz has 6 general-knowledge questions
              </p>
            </div>
          ) : (
            <div className="card card-wide fade-up">
              <QuizBuilder onStart={createGame} />
              <button
                className="btn btn-ghost"
                style={{ marginTop: '1rem' }}
                onClick={() => setShowBuilder(false)}
              >
                ← Back
              </button>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              ← Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: Lobby ──────────────────────────────────────────────
  if (phase === 'lobby') {
    return (
      <div className="page">
        <div className="card card-wide fade-up" style={{ textAlign: 'center' }}>
          {/* PIN */}
          <div className="badge badge-pink" style={{ marginBottom: '1rem' }}>
            🎮 Lobby Open
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.2rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.25rem',
            }}
          >
            Share this PIN with your students:
          </h2>
          <div className="pin-display">{pin}</div>

          <div style={{ margin: '0.5rem 0 1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Students go to <strong style={{ color: 'var(--text-primary)' }}>quizblitz.app</strong> and enter the PIN
          </div>

          <hr className="divider" />

          {/* Player count */}
          <div className="badge badge-cyan" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            👥 {players.length} student{players.length !== 1 ? 's' : ''} joined
          </div>

          {/* Player chips */}
          {players.length > 0 && (
            <div className="player-grid" style={{ marginBottom: '1.5rem' }}>
              {players.map((p) => (
                <div key={p.name} className="player-chip">
                  {p.name}
                </div>
              ))}
            </div>
          )}

          {players.length === 0 && (
            <div
              style={{
                padding: '2rem',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
              }}
            >
              <div className="spinner" />
              Waiting for students to join…
            </div>
          )}

          <button
            className="btn btn-primary btn-lg btn-full"
            onClick={startNextQuestion}
            disabled={players.length === 0}
          >
            {players.length === 0 ? 'Waiting for players…' : '▶ Start Quiz!'}
          </button>
        </div>
      </div>
    );
  }

  // ── PHASE: Question ───────────────────────────────────────────
  if (phase === 'question' && question) {
    const COLORS = ['var(--opt-a)', 'var(--opt-b)', 'var(--opt-c)', 'var(--opt-d)'];
    const LABELS = ['A', 'B', 'C', 'D'];

    return (
      <div className="page" style={{ justifyContent: 'flex-start', paddingTop: '1.25rem' }}>
        <div style={{ width: '100%', maxWidth: 700 }}>
          {/* Top bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div>
              <div className="badge badge-pink">🎮 Host View</div>
              <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Q {question.index + 1} / {question.total}
              </div>
            </div>

            <Timer
              key={question.index}
              duration={question.timeLimit}
              active={timerActive}
              onExpire={() => setTimerActive(false)}
            />

            <div style={{ textAlign: 'right' }}>
              <div className="badge badge-cyan" style={{ marginBottom: '0.25rem' }}>
                {answeredCount} / {players.length} answered
              </div>
              <button
                className="btn btn-ghost"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                onClick={endQuestion}
              >
                Skip Timer
              </button>
            </div>
          </div>

          {/* Question */}
          <div className="card fade-up" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <p className="question-text">{question.text}</p>
          </div>

          {/* Options preview */}
          <div className="answer-grid fade-up" style={{ marginBottom: '1rem' }}>
            {question.options.map((opt, i) => (
              <div
                key={i}
                style={{
                  background: COLORS[i],
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  opacity: question.correctAnswer === i ? 1 : 0.7,
                  outline: question.correctAnswer === i ? '3px solid var(--neon-green)' : 'none',
                  position: 'relative',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>{LABELS[i]}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{opt}</span>
                {question.correctAnswer === i && (
                  <span style={{ position: 'absolute', top: 6, right: 8, color: 'var(--neon-green)', fontSize: '1rem' }}>✓</span>
                )}
              </div>
            ))}
          </div>

          {/* Live answer stats */}
          <div className="card fade-up">
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Live responses
            </div>
            <AnswerStats stats={answerStats} options={question.options} />
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: Results (between questions) ────────────────────────
  if (phase === 'results') {
    return (
      <div className="page" style={{ justifyContent: 'flex-start', paddingTop: '1.5rem' }}>
        <div style={{ width: '100%', maxWidth: 700, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>
              📊 Results
            </h2>
            <button
              className="btn btn-primary"
              onClick={startNextQuestion}
            >
              {isLastQuestion ? '🏁 Show Final Results' : 'Next Question →'}
            </button>
          </div>

          {/* Answer stats */}
          {question && (
            <div className="card fade-up">
              <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Answer Breakdown</div>
              <AnswerStats
                stats={answerStats}
                correctAnswer={question.correctAnswer}
                options={question.options}
              />
            </div>
          )}

          {/* Leaderboard */}
          <div className="card card-wide fade-up" style={{ animationDelay: '0.1s' }}>
            <Leaderboard players={leaderboard} title="🏆 Leaderboard" />
          </div>
        </div>
      </div>
    );
  }

  // ── PHASE: Ended ──────────────────────────────────────────────
  if (phase === 'ended') {
    return (
      <div className="page">
        <div className="card card-wide fade-up" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>🏁</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', marginBottom: '0.25rem' }}>
            Quiz Complete!
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            {leaderboard.length} players competed
          </p>

          <Leaderboard players={leaderboard} title="🏆 Final Leaderboard" />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => { setPhase('setup'); setPin(''); setPlayers([]); }}>
              New Game 🔄
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/')}>
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
