import React from 'react';
import { AlertTriangle, PhoneOff, ArrowLeft } from 'lucide-react';

/**
 * LeaveWarningModal — Styled confirmation popup shown when a participant
 * attempts to leave the meeting room. Dark-themed to match the meeting UI.
 *
 * Props:
 *  - isOpen (boolean) — Controls visibility
 *  - onConfirm (function) — Called when user confirms leaving
 *  - onCancel (function) — Called when user cancels / stays
 *  - isDoctor (boolean) — Shows doctor-specific messaging about transcript
 */
export function LeaveWarningModal({ isOpen, onConfirm, onCancel, isDoctor = false }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'leaveModalFadeIn 0.2s ease-out',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onCancel}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '420px',
          background: '#1e293b',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          padding: '2rem',
          animation: 'leaveModalSlideUp 0.3s ease-out',
        }}
      >
        {/* Warning Icon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '2px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'leaveIconPulse 2s ease-in-out infinite',
            }}
          >
            <AlertTriangle size={30} color="#f59e0b" />
          </div>
        </div>

        {/* Title */}
        <h3
          style={{
            textAlign: 'center',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#f8fafc',
            margin: '0 0 0.5rem 0',
          }}
        >
          Leave Consultation?
        </h3>

        {/* Description */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: '0 0 0.75rem 0',
          }}
        >
          Are you sure you want to leave this consultation?
          {isDoctor
            ? ' Your current session transcript will be saved automatically.'
            : ' You can rejoin if the meeting time has not expired.'}
        </p>

        {/* Info badge */}
        <div
          style={{
            textAlign: 'center',
            fontSize: '0.78rem',
            color: '#60a5fa',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          💡 You can rejoin this consultation as long as the scheduled end time hasn't passed.
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
          }}
        >
          {/* Stay Button */}
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#f1f5f9',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
            }}
          >
            <ArrowLeft size={16} />
            Stay in Meeting
          </button>

          {/* Leave Button */}
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.7rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 38, 38, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
            }}
          >
            <PhoneOff size={16} />
            Leave Consultation
          </button>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes leaveModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes leaveModalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes leaveIconPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.2); }
          50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
        }
      `}</style>
    </div>
  );
}
