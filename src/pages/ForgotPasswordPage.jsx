import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { Mail, Lock, ShieldCheck, KeyRound, ArrowLeft, CheckCircle2, Circle, Eye, EyeOff, Loader2 } from 'lucide-react';

const RESEND_COOLDOWN = 60;

export function ForgotPasswordPage() {
  // Steps: 1 = email, 2 = OTP input, 3 = new password, 4 = success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // OTP state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef([]);

  // Password state
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 2 && otpRefs.current[0]) {
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    }
  }, [step]);

  // Password policy checks
  const passwordChecks = {
    length: password.length >= 8 && password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  };
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  // Step 1: Send reset OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setToast({ type: 'warning', message: 'Please enter your email address.' });
      return;
    }

    setIsLoading(true);
    setToast(null);

    try {
      await authApi.forgotPassword({ email: email.trim() });
      setToast({ type: 'success', message: 'If this email is registered, you will receive a reset code.' });
      setStep(2);
      setResendTimer(RESEND_COOLDOWN);
      setOtp(['', '', '', '', '', '']);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to send reset code.' });
    } finally {
      setIsLoading(false);
    }
  };

  // OTP handlers
  const handleOtpChange = useCallback((index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleOtpKeyDown = useCallback((index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handleOtpPaste = useCallback((e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  }, []);

  // Step 2: Proceed to password step (OTP will be verified on reset-password call)
  const handleProceedToPassword = (e) => {
    e?.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setToast({ type: 'warning', message: 'Please enter the complete 6-digit code.' });
      return;
    }
    setToast(null);
    setStep(3);
  };

  // Auto-proceed when all 6 digits entered
  useEffect(() => {
    if (step === 2 && otp.every((d) => d !== '')) {
      handleProceedToPassword();
    }
  }, [otp, step]);

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    setToast(null);

    try {
      await authApi.forgotPassword({ email: email.trim() });
      setToast({ type: 'success', message: 'New reset code sent!' });
      setResendTimer(RESEND_COOLDOWN);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to resend code.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset password (backend verifies OTP + sets new password in one call)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!isPasswordValid) {
      setToast({ type: 'warning', message: 'Please ensure your password meets all security requirements.' });
      return;
    }
    if (password !== confirmPassword) {
      setToast({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    setToast(null);

    try {
      const otpString = otp.join('');
      await authApi.resetPassword({
        email: email.trim(),
        otp: otpString,
        new_password: password,
      });
      setStep(4);
    } catch (err) {
      // If OTP was wrong, go back to OTP step
      if (err.message && (err.message.toLowerCase().includes('verification code') || err.message.toLowerCase().includes('expired'))) {
        setToast({ type: 'error', message: err.message });
        setOtp(['', '', '', '', '', '']);
        setStep(2);
      } else {
        setToast({ type: 'error', message: err.message || 'Failed to reset password.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step indicator
  const StepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
      {[1, 2, 3].map((s) => (
        <React.Fragment key={s}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              transition: 'all 0.3s ease',
              background: step >= s ? 'var(--primary)' : 'var(--bg-alt)',
              color: step >= s ? '#fff' : 'var(--text-muted)',
              border: step >= s ? '2px solid var(--primary)' : '2px solid var(--border-color)',
              transform: step === s ? 'scale(1.15)' : 'scale(1)',
              boxShadow: step === s ? '0 0 0 4px rgba(79, 70, 229, 0.15)' : 'none',
            }}
          >
            {step > s ? <CheckCircle2 size={16} /> : s}
          </div>
          {s < 3 && (
            <div
              style={{
                width: 40,
                height: 3,
                borderRadius: 2,
                background: step > s ? 'var(--primary)' : 'var(--border-color)',
                transition: 'background 0.3s ease',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className="container page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card auth-card animate-slide-up" style={{ width: '100%', maxWidth: '480px', padding: '2.75rem 2.25rem' }}>

        {step < 4 && <StepIndicator />}

        {/* ── Step 1: Email Input ── */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <KeyRound size={28} />
              </div>
              <h2 className="auth-heading">Forgot Password</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <form onSubmit={handleSendOTP}>
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                icon={<Mail size={16} />}
                required
                autoComplete="email"
              />

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                icon={<Mail size={16} />}
                block
                style={{ marginTop: '0.5rem' }}
              >
                Send Reset Code
              </Button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              <Link to="/login" style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </div>
        )}

        {/* ── Step 2: OTP Input ── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <ShieldCheck size={28} />
              </div>
              <h2 className="auth-heading">Enter Reset Code</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                We sent a 6-digit code to<br />
                <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <form onSubmit={handleProceedToPassword}>
              {/* OTP Input Boxes */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    style={{
                      width: 50,
                      height: 56,
                      textAlign: 'center',
                      fontSize: '1.5rem',
                      fontWeight: 700,
                      fontFamily: "'Courier New', monospace",
                      border: `2px solid ${digit ? 'var(--primary)' : 'var(--border-color)'}`,
                      borderRadius: 'var(--radius-md)',
                      background: digit ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      caretColor: 'var(--primary)',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = 'var(--primary)';
                      e.target.style.boxShadow = '0 0 0 3px rgba(79, 70, 229, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = digit ? 'var(--primary)' : 'var(--border-color)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>

              <Button
                type="submit"
                variant="primary"
                icon={<ShieldCheck size={16} />}
                block
                disabled={otp.join('').length !== 6}
              >
                Continue
              </Button>
            </form>

            {/* Resend + Timer */}
            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {resendTimer > 0 ? (
                <span>
                  Resend code in <strong style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{resendTimer}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px',
                  }}
                >
                  Resend Reset Code
                </button>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => { setStep(1); setToast(null); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <ArrowLeft size={14} /> Change email
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: New Password ── */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'inline-flex', padding: '0.75rem', background: '#ecfdf5', color: '#059669', borderRadius: '50%', marginBottom: '0.75rem' }}>
                <Lock size={28} />
              </div>
              <h2 className="auth-heading">New Password</h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Create a new secure password for your account.
              </p>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* Verified email badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 0.85rem',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '1.25rem',
              fontSize: '0.85rem',
              color: '#065f46',
              fontWeight: 500,
            }}>
              <CheckCircle2 size={16} color="#059669" />
              {email}
            </div>

            <form onSubmit={handleResetPassword}>
              <div style={{ position: 'relative' }}>
                <Input
                  label="New Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create new password"
                  icon={<Lock size={16} />}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '2.2rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.2rem',
                    borderRadius: '4px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {password.length > 0 && (
                <div style={{ background: 'var(--bg-alt)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                    Password Requirements:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                    <CheckItem checked={passwordChecks.length} text="8+ characters" />
                    <CheckItem checked={passwordChecks.uppercase} text="1 uppercase letter" />
                    <CheckItem checked={passwordChecks.lowercase} text="1 lowercase letter" />
                    <CheckItem checked={passwordChecks.number} text="1 number digit" />
                    <CheckItem checked={passwordChecks.special} text="1 special symbol" />
                  </div>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <Input
                  label="Confirm New Password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  icon={<Lock size={16} />}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '2.2rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.2rem',
                    borderRadius: '4px',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                icon={<KeyRound size={16} />}
                block
                style={{ marginTop: '0.5rem' }}
              >
                Reset Password
              </Button>
            </form>

            {/* Back to OTP step */}
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => { setStep(2); setToast(null); setOtp(['', '', '', '', '', '']); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <ArrowLeft size={14} /> Re-enter code
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <div className="animate-fade-in" style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              padding: '1rem',
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              borderRadius: '50%',
              marginBottom: '1.25rem',
              animation: 'pulse-success 2s ease-in-out infinite',
            }}>
              <CheckCircle2 size={48} color="#059669" />
            </div>

            <h2 className="auth-heading" style={{ color: '#059669' }}>Password Reset Successful!</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
              Your password has been updated successfully.<br />
              You can now sign in with your new password.
            </p>

            <Button
              variant="primary"
              block
              onClick={() => navigate('/login')}
              style={{ marginBottom: '0.75rem' }}
            >
              Sign In Now
            </Button>

            <style>{`
              @keyframes pulse-success {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.2); }
                50% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(5, 150, 105, 0); }
              }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckItem({ checked, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: checked ? 'var(--status-active-text)' : 'var(--text-muted)' }}>
      {checked ? <CheckCircle2 size={13} color="var(--status-active)" /> : <Circle size={13} />}
      <span>{text}</span>
    </div>
  );
}
