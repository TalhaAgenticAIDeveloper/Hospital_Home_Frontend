import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Toast } from '../components/common/Toast';
import { ShieldAlert, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setToast({ type: 'warning', message: 'Please enter administrator credentials.' });
      return;
    }

    setIsLoading(true);
    setToast(null);

    try {
      await adminLogin(email.trim(), password);
      navigate('/admin/dashboard');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Invalid admin credentials or access denied.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card auth-card auth-card-admin animate-slide-up" style={{ width: '100%', maxWidth: '440px', padding: '2.75rem 2.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '50%', marginBottom: '0.75rem' }}>
            <ShieldCheck size={32} />
          </div>
          <h2 className="auth-heading">SaaS Admin Portal</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Restricted access for platform administrators and doctor credential review officers.
          </p>
        </div>

        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        <form onSubmit={handleSubmit}>
          <Input
            label="Admin Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@platform.com"
            icon={<Mail size={16} />}
            required
            autoComplete="email"
          />

          <div style={{ position: 'relative' }}>
            <Input
              label="Admin Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure password"
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
            icon={<ShieldAlert size={16} />}
            block
            style={{ marginTop: '0.75rem', background: 'var(--accent)' }}
          >
            Authenticate Admin Session
          </Button>
        </form>

        <div style={{ marginTop: '1.5rem', background: 'var(--bg-alt)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Notice: Admin accounts cannot be created publicly. Initial admin credentials are provisioning via the backend CLI.
        </div>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)' }}>
            ← Return to Standard User Login
          </Link>
        </div>
      </div>
    </div>
  );
}
