import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { DoctorDirectory } from '../components/patient/DoctorDirectory';
import { PatientMeetingsList } from '../components/patient/PatientMeetingsList';
import { PatientDocumentsManager } from '../components/patient/PatientDocumentsManager';
import {
  User,
  Calendar,
  FileText,
  Activity,
  ShieldCheck,
  HeartPulse,
  Video,
  Stethoscope,
  FolderOpen,
  ArrowRight,
} from 'lucide-react';

export function PatientDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('book'); // 'book' | 'appointments' | 'documents' | 'overview'
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMeetingBooked = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('appointments');
  };

  return (
    <div className="container page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
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

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
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
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>End-to-End Encrypted Telemedicine</div>
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

      {/* Medical History Prompt Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '280px', flex: 1 }}>
          <div
            style={{
              padding: '0.75rem',
              background: '#2563eb',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              flexShrink: 0,
            }}
          >
            <FolderOpen size={24} />
          </div>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e3a8a', fontSize: '1.05rem', fontWeight: 700 }}>
              Upload Medical History Documents
            </h4>
            <p style={{ margin: 0, color: '#334155', fontSize: '0.88rem', lineHeight: 1.4 }}>
              Add your lab reports, prescriptions, or past records (up to 5 documents, 50MB max each). You can select which ones to share with the doctor when booking consultations.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => setActiveTab('documents')}
          style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <span>Manage Documents</span>
          <ArrowRight size={16} />
        </Button>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid var(--border-color)',
          marginBottom: '1.75rem',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('book')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'book' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'book' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '-2px',
          }}
        >
          <Stethoscope size={18} />
          Find Doctors & Free Timings
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('appointments')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'appointments' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'appointments' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '-2px',
          }}
        >
          <Video size={18} />
          My Scheduled Consultations
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'documents' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'documents' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '-2px',
          }}
        >
          <FolderOpen size={18} />
          My Medical Documents
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '-2px',
          }}
        >
          <Activity size={18} />
          Medical Services Overview
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'book' && <DoctorDirectory onMeetingBooked={handleMeetingBooked} />}

      {activeTab === 'appointments' && <PatientMeetingsList refreshTrigger={refreshTrigger} />}

      {activeTab === 'documents' && <PatientDocumentsManager />}

      {activeTab === 'overview' && (
        <div className="card">
          <h3>Platform Medical Services</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Your authenticated patient session is active and secure. You can book video/audio consultations with certified specialist doctors anytime.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '1.25rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <Video size={20} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
              <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>1-to-1 Video Consultations</h4>
              <p style={{ fontSize: '0.85rem' }}>High-definition encrypted video/audio consultations from any device.</p>
            </div>

            <div style={{ padding: '1.25rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <FileText size={20} color="var(--accent)" style={{ marginBottom: '0.5rem' }} />
              <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Medical Documents & AI Summary</h4>
              <p style={{ fontSize: '0.85rem' }}>Securely upload medical history records with AI-assisted clinical insights for doctors.</p>
            </div>

            <div style={{ padding: '1.25rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <Activity size={20} color="#10b981" style={{ marginBottom: '0.5rem' }} />
              <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>Health Tracking</h4>
              <p style={{ fontSize: '0.85rem' }}>Monitor vitals, prescription schedules, and wellness metrics.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
