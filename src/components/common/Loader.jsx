import React from 'react';

export function Loader({ fullScreen = false, text = 'Loading...' }) {
  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(248, 250, 252, 0.9)',
        zIndex: 999,
        gap: '1rem',
      }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{text}</p>
        <style>{`
          .spinner {
            width: 44px;
            height: 44px;
            border: 4px solid var(--primary-light);
            border-top-color: var(--primary);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem' }}>
      <div className="spinner-sm" />
      {text && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{text}</span>}
      <style>{`
        .spinner-sm {
          width: 20px;
          height: 20px;
          border: 2px solid var(--primary-light);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
}
