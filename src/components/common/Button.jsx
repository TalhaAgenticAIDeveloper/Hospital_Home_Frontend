import React from 'react';

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  icon = null,
  onClick,
  className = '',
  ...props
}) {
  const sizeClasses = {
    sm: 'btn-sm',
    md: '',
    lg: 'btn-lg',
  };

  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
    outline: 'btn-outline-primary',
  };

  const btnClass = `btn ${variantClasses[variant] || 'btn-primary'} ${sizeClasses[size] || ''} ${
    block ? 'btn-block' : ''
  } ${className}`;

  return (
    <button
      type={type}
      className={btnClass}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="btn-spinner" />
          <span>Processing...</span>
          <style>{`
            .btn-spinner {
              width: 16px;
              height: 16px;
              border: 2px solid rgba(255, 255, 255, 0.4);
              border-top-color: #ffffff;
              border-radius: 50%;
              animation: spin 0.6s linear infinite;
            }
          `}</style>
        </>
      ) : (
        <>
          {icon && <span style={{ display: 'inline-flex' }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
