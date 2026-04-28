/**
 * QuizBuilder.jsx
 * Allows the host to create custom quiz questions before starting.
 */

import { useState } from 'react';

const EMPTY_QUESTION = () => ({
  text: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  timeLimit: 20,
});

const OPTION_COLORS = ['var(--opt-a)', 'var(--opt-b)', 'var(--opt-c)', 'var(--opt-d)'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export default function QuizBuilder({ onStart }) {
  const [questions, setQuestions] = useState([EMPTY_QUESTION()]);
  const [errors, setErrors] = useState([]);

  function updateQuestion(qi, field, value) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, [field]: value } : q))
    );
  }

  function updateOption(qi, oi, value) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const opts = [...q.options];
        opts[oi] = value;
        return { ...q, options: opts };
      })
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, EMPTY_QUESTION()]);
  }

  function removeQuestion(qi) {
    if (questions.length === 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== qi));
  }

  function validate() {
    const errs = questions.map((q, qi) => {
      const e = [];
      if (!q.text.trim()) e.push('Question text is required.');
      const filledOptions = q.options.filter((o) => o.trim());
      if (filledOptions.length < 2) e.push('At least 2 answer options required.');
      if (!q.options[q.correctAnswer]?.trim())
        e.push('Correct answer option must have text.');
      return e;
    });
    setErrors(errs);
    return errs.every((e) => e.length === 0);
  }

  function handleStart() {
    if (!validate()) return;
    // Filter out empty options
    const cleaned = questions.map((q) => ({
      ...q,
      options: q.options.map((o) => o.trim() || '—'),
      text: q.text.trim(),
    }));
    onStart(cleaned);
  }

  return (
    <div>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.1rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        ✏️ Custom Quiz
        <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
          ({questions.length} question{questions.length !== 1 ? 's' : ''})
        </span>
      </h3>

      {questions.map((q, qi) => (
        <div key={qi} className="question-builder">
          {/* Question header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '0.9rem',
                color: 'var(--neon-cyan)',
              }}
            >
              Q{qi + 1}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Time:
              </label>
              <select
                value={q.timeLimit}
                onChange={(e) => updateQuestion(qi, 'timeLimit', Number(e.target.value))}
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--text-primary)',
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                {[5, 10, 15, 20, 30, 60].map((t) => (
                  <option key={t} value={t}>{t}s</option>
                ))}
              </select>
              {questions.length > 1 && (
                <button
                  className="btn btn-ghost"
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => removeQuestion(qi)}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Question text */}
          <div className="field">
            <textarea
              className="textarea"
              placeholder="Type your question here…"
              value={q.text}
              onChange={(e) => updateQuestion(qi, 'text', e.target.value)}
              rows={2}
            />
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {q.options.map((opt, oi) => (
              <div key={oi} className="option-row">
                <div
                  className={`option-dot ${q.correctAnswer === oi ? 'is-correct' : ''}`}
                  style={{ background: OPTION_COLORS[oi], color: '#fff' }}
                  title="Click to set as correct answer"
                  onClick={() => updateQuestion(qi, 'correctAnswer', oi)}
                >
                  {OPTION_LABELS[oi]}
                </div>
                <input
                  className="input"
                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                  type="text"
                  placeholder={`Option ${OPTION_LABELS[oi]}`}
                  value={opt}
                  onChange={(e) => updateOption(qi, oi, e.target.value)}
                  maxLength={80}
                />
                {q.correctAnswer === oi && (
                  <span style={{ color: 'var(--neon-green)', fontSize: '1rem' }}>✓</span>
                )}
              </div>
            ))}
          </div>

          {/* Errors for this question */}
          {errors[qi]?.length > 0 && (
            <div
              style={{
                marginTop: '0.5rem',
                color: 'var(--neon-pink)',
                fontSize: '0.8rem',
              }}
            >
              {errors[qi].map((e) => (
                <div key={e}>⚠ {e}</div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          className="btn btn-ghost"
          onClick={addQuestion}
          disabled={questions.length >= 30}
        >
          + Add Question
        </button>
        <button className="btn btn-primary" onClick={handleStart}>
          Create Game →
        </button>
      </div>
    </div>
  );
}
