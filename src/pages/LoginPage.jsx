import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { Mail, Lock, LogIn, Eye, EyeOff, Activity } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setToast({ type: 'warning', message: 'Please enter both email and password.' });
      return;
    }

    setIsLoading(true);
    setToast(null);

    try {
      const user = await login(email.trim(), password);
      // Route appropriately based on user role
      if (user.role === 'doctor') {
        navigate('/doctor/portal');
      } else if (user.role === 'patient') {
        navigate('/patient/dashboard');
      } else if (user.role === 'saas_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Invalid email or password.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card animate-slide-up" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50%', marginBottom: '0.75rem' }}>
            <Activity size={28} />
          </div>
          <h2>Welcome Back</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Sign in to access your Patient or Doctor portal
          </p>
        </div>

        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        <form onSubmit={handleSubmit}>
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

          <div style={{ position: 'relative' }}>
            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              icon={<Lock size={16} />}
              required
              autoComplete="current-password"
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
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={isLoading}
            icon={<LogIn size={16} />}
            block
            style={{ marginTop: '0.75rem' }}
          >
            Sign In
          </Button>
        </form>

        <div style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          Don't have an account yet?{' '}
          <Link to="/signup" style={{ fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}
