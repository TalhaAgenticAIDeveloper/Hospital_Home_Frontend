import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Clock, TimerOff } from 'lucide-react';
import { Button } from './Button';

/**
 * CountdownJoinButton — Shows a countdown timer (HH:MM:SS) until the meeting
 * start time. Once the start time arrives, the button enables for joining.
 * After end time passes, the button shows "Session Expired".
 *
 * Props:
 *  - startTime (string|Date) — ISO datetime of meeting start
 *  - endTime (string|Date) — ISO datetime of meeting end
 *  - meetingId (string) — Meeting ID for navigation
 *  - style (object) — Optional inline styles
 */
export function CountdownJoinButton({ startTime, endTime, meetingId, style }) {
  const navigate = useNavigate();

  const getTimeDiff = useCallback(() => {
    const now = Date.now();
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return { now, start, end };
  }, [startTime, endTime]);

  const computeState = useCallback(() => {
    const { now, start, end } = getTimeDiff();
    if (now >= end) return 'expired';
    if (now >= start) return 'active';
    return 'waiting';
  }, [getTimeDiff]);

  const computeRemaining = useCallback(() => {
    const { now, start } = getTimeDiff();
    return Math.max(0, Math.floor((start - now) / 1000));
  }, [getTimeDiff]);

  const [timerState, setTimerState] = useState(computeState);
  const [remaining, setRemaining] = useState(computeRemaining);

  useEffect(() => {
    const tick = () => {
      const newState = computeState();
      setTimerState(newState);
      if (newState === 'waiting') {
        setRemaining(computeRemaining());
      }
    };

    tick(); // initial
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [computeState, computeRemaining]);

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  };

  // ── Expired ────────────────────────────────────────────────────────────
  if (timerState === 'expired') {
    return (
      <button
        disabled
        style={{
          width: '100%',
          marginTop: '0.5rem',
          padding: '0.6rem 1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #e2e8f0',
          background: '#f1f5f9',
          color: '#94a3b8',
          fontWeight: 600,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          cursor: 'not-allowed',
          opacity: 0.7,
          ...style,
        }}
      >
        <TimerOff size={16} /> Session Time Passed
      </button>
    );
  }

  // ── Active — Can Join ──────────────────────────────────────────────────
  if (timerState === 'active') {
    return (
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate(`/meetings/${meetingId}`)}
        icon={<Video size={16} />}
        style={{ width: '100%', marginTop: '0.5rem', ...style }}
      >
        Join Video Consultation
      </Button>
    );
  }

  // ── Waiting — Countdown Timer ──────────────────────────────────────────
  const timeStr = formatTime(remaining);

  return (
    <button
      disabled
      style={{
        width: '100%',
        marginTop: '0.5rem',
        padding: '0.6rem 1rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #c7d2fe',
        background: 'linear-gradient(135deg, #eef2ff 0%, #f0f9ff 100%)',
        color: '#4338ca',
        fontWeight: 700,
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        cursor: 'not-allowed',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Subtle animated pulse border */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: '2px solid transparent',
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.15), transparent) border-box',
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation: 'countdownPulse 2s ease-in-out infinite',
        }}
      />

      <Clock size={16} style={{ flexShrink: 0 }} />

      <span>Starts in</span>

      {/* Countdown digits */}
      <span
        style={{
          fontFamily: "'Courier New', Consolas, monospace",
          fontSize: '1rem',
          fontWeight: 800,
          letterSpacing: '0.05em',
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          minWidth: '5.5rem',
          textAlign: 'center',
        }}
      >
        {timeStr}
      </span>

      {/* Inject keyframes if not already present */}
      <style>{`
        @keyframes countdownPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </button>
  );
}
