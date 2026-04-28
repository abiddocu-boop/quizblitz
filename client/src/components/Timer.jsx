/**
 * Timer.jsx
 * Animated circular countdown timer.
 * Shows remaining time with color transitions: green → yellow → red.
 */

import { useState, useEffect, useRef } from 'react';
import { useSound } from '../hooks/useSound';

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer({ duration, onExpire, active = true }) {
  const [remaining, setRemaining] = useState(duration);
  const intervalRef = useRef(null);
  const { playTick } = useSound();
  const expiredRef = useRef(false);

  useEffect(() => {
    setRemaining(duration);
    expiredRef.current = false;

    if (!active) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        // Tick sound in last 5 seconds
        if (next <= 5 && next > 0) playTick();
        if (next <= 0) {
          clearInterval(intervalRef.current);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, active]);

  const ratio = remaining / duration;
  const offset = CIRCUMFERENCE * (1 - ratio);

  // Color: green → yellow → red
  let color = '#00ff9d';
  if (ratio < 0.5) color = '#ffe600';
  if (ratio < 0.25) color = '#ff2d78';

  const urgent = remaining <= 5 && remaining > 0;

  return (
    <div
      className="timer-wrap"
      style={urgent ? { animation: 'pulse 0.8s ease infinite' } : undefined}
    >
      <svg className="timer-svg" viewBox="0 0 80 80">
        <circle className="timer-track" cx="40" cy="40" r={RADIUS} />
        <circle
          className="timer-bar"
          cx="40"
          cy="40"
          r={RADIUS}
          stroke={color}
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="timer-number" style={{ color }}>
        {remaining}
      </div>
    </div>
  );
}
