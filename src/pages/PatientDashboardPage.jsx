import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { User, Calendar, FileText, Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export function PatientDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container page-wrapper">
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.6rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
            <HeartPulse size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem' }}>Patient Health Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Welcome back, <strong>{user?.email}</strong>
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)' }}>
            <User size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Account Status</div>
            <div style={{ marginTop: '4px' }}>
              <Badge status={user?.status} />
            </div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 'var(--radius-md)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Security Level</div>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>Argon2id + JWT Verified</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', background: '#fef3c7', color: '#d97706', borderRadius: 'var(--radius-md)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Member Since</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Modules Ready for Next Phases */}
      <div className="card">
        <h3>Platform Medical Services</h3>
        <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Your authenticated session is active and secure. Healthcare platform modules will be accessible as doctors complete verification.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <Calendar size={20} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Appointments</h4>
            <p style={{ fontSize: '0.85rem' }}>Schedule and manage consultations with verified specialist doctors.</p>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <FileText size={20} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Medical Reports</h4>
            <p style={{ fontSize: '0.85rem' }}>Access lab results, diagnostic histories, and doctor clinical summaries.</p>
          </div>

          <div style={{ padding: '1.25rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <Activity size={20} color="#10b981" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Health Tracking</h4>
            <p style={{ fontSize: '0.85rem' }}>Monitor vitals, prescription schedules, and wellness metrics.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
