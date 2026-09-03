import React from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export function Toast({ type = 'info', message, onClose, className = '' }) {
  if (!message) return null;

  const typeConfig = {
    success: {
      bg: '#ecfdf5',
      border: '#a7f3d0',
      text: '#065f46',
      icon: <CheckCircle2 size={18} color="#059669" />,
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      icon: <AlertCircle size={18} color="#dc2626" />,
    },
    warning: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      icon: <AlertCircle size={18} color="#d97706" />,
    },
    info: {
      bg: '#f0f9ff',
      border: '#bae6fd',
      text: '#075985',
      icon: <Info size={18} color="#0284c7" />,
    },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem 1rem',
        marginBottom: '1.25rem',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: config.text, fontSize: '0.9rem', fontWeight: 500 }}>
        {config.icon}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: config.text,
            opacity: 0.7,
            padding: '2px',
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
