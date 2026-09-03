import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { DoctorOnboardingModal } from '../components/doctor/DoctorOnboardingModal';
import { Mail, Lock, UserPlus, Stethoscope, User, CheckCircle2, Circle } from 'lucide-react';

export function SignupPage() {
  const [role, setRole] = useState('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Doctor onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { signup, login } = useAuth();
  const navigate = useNavigate();

  // Password policy checks
  const passwordChecks = {
    length: password.length >= 8 && password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setToast({ type: 'warning', message: 'Email address is required.' });
      return;
    }

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
      await signup(email.trim(), password, role);

      // Automatically log user in after successful signup
      await login(email.trim(), password);

      if (role === 'doctor') {
        // For doctors: open the onboarding modal instead of navigating directly
        setShowOnboarding(true);
      } else {
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Registration failed.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingCompleted = () => {
    setShowOnboarding(false);
    navigate('/doctor/portal');
  };

  const handleOnboardingClose = () => {
    // If doctor closes the modal without completing, still redirect to portal
    setShowOnboarding(false);
    navigate('/doctor/portal');
  };

  return (
    <div className="container page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2>Create Account</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Register as a patient or apply as a medical provider
          </p>
        </div>

        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        {/* Role Selection Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            onClick={() => setRole('patient')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.85rem 0.5rem',
              border: `2px solid ${role === 'patient' ? 'var(--primary)' : 'var(--border-color)'}`,
              background: role === 'patient' ? 'var(--primary-light)' : 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <User size={22} color={role === 'patient' ? 'var(--primary)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.35rem', color: role === 'patient' ? 'var(--primary-hover)' : 'var(--text-primary)' }}>
              Patient
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Immediate Access</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('doctor')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '0.85rem 0.5rem',
              border: `2px solid ${role === 'doctor' ? 'var(--primary)' : 'var(--border-color)'}`,
              background: role === 'doctor' ? 'var(--primary-light)' : 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            <Stethoscope size={22} color={role === 'doctor' ? 'var(--primary)' : 'var(--text-muted)'} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: '0.35rem', color: role === 'doctor' ? 'var(--primary-hover)' : 'var(--text-primary)' }}>
              Doctor
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Requires Verification</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            icon={<Mail size={16} />}
            required
            autoComplete="email"
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create strong password"
            icon={<Lock size={16} />}
            required
            autoComplete="new-password"
          />

          {/* Real-time Password Strength Checklist */}
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

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            icon={<Lock size={16} />}
            required
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            icon={<UserPlus size={16} />}
            block
            style={{ marginTop: '0.5rem' }}
          >
            {role === 'doctor' ? 'Register & Begin Onboarding' : 'Complete Patient Signup'}
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>

      {/* Doctor Onboarding Modal */}
      <DoctorOnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        onCompleted={handleOnboardingCompleted}
      />
    </div>
  );
}

function CheckItem({ checked, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: checked ? 'var(--status-active-text)' : 'var(--text-muted)' }}>
      {checked ? <CheckCircle2 size={13} color="var(--status-active)" /> : <Circle size={13} />}
      <span style={{ textDecoration: checked ? 'none' : 'none' }}>{text}</span>
    </div>
  );
}
