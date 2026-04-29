import { useState, useEffect, useRef } from 'react';
const R = 34;
const CIRC = 2 * Math.PI * R;

export default function Timer({ duration, active=true, onExpire, size=80 }) {
  const [remaining, setRemaining] = useState(duration);
  const ref = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    setRemaining(duration);
    done.current = false;
    if (!active) return;
    ref.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(ref.current);
          if (!done.current) { done.current = true; onExpire?.(); }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [duration, active]);

  const ratio = remaining / duration;
  const offset = CIRC * (1 - ratio);
  let stroke = '#22C55E';
  if (ratio < 0.5) stroke = '#F59E0B';
  if (ratio < 0.25) stroke = '#EF4444';

  return (
    <div className="timer-container" style={{ width:size, height:size, animation: remaining<=5&&remaining>0?'pulse 0.7s ease infinite':'none' }}>
      <svg className="timer-svg" width={size} height={size} viewBox="0 0 80 80">
        <circle className="timer-track" cx="40" cy="40" r={R}/>
        <circle className="timer-arc" cx="40" cy="40" r={R} stroke={stroke} strokeDasharray={CIRC} strokeDashoffset={offset}/>
      </svg>
      <div className="timer-label" style={{ color:stroke, fontSize: size<70?'1rem':'1.25rem' }}>{remaining}</div>
    </div>
  );
}
