import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doctorApi } from '../../src/api/doctor';
import { FeedbackBanner } from '../components/doctor/FeedbackBanner';
import { StatusCard } from '../components/doctor/StatusCard';
import { ProfileForm } from '../components/doctor/ProfileForm';
import { DocumentUploader } from '../components/doctor/DocumentUploader';
import { DoctorOnboardingModal } from '../components/doctor/DoctorOnboardingModal';
import { Loader } from '../components/common/Loader';
import { Toast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import {
  Stethoscope,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle2,
  Circle,
  Send,
  AlertTriangle,
  FileText,
  UserCheck,
} from 'lucide-react';

export function DoctorPortalPage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showResubmitModal, setShowResubmitModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.getProfile();
      setProfile(data);
      await refreshUser();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load doctor profile data.' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading doctor credentials and onboarding status..." />;
  }

  const isUnderReview = profile?.status === 'pending' && !!profile?.submitted_at;
  const isRejected = profile?.status === 'rejected';
  const isActive = profile?.status === 'active';
  const isDraft = profile?.status === 'pending' && !profile?.submitted_at;

  const handleResubmitCompleted = () => {
    setShowResubmitModal(false);
    loadProfile();
  };

  // ─── Under Review State ───────────────────────────────────────────────
  if (isUnderReview) {
    return (
      <div className="container page-wrapper">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem' }}>Doctor Verification Portal</h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Provider Account: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={loadProfile}
            icon={<RefreshCw size={14} />}
          >
            Refresh Status
          </Button>
        </div>

        {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

        {/* Main Under-Review Card */}
        <div className="card animate-slide-up" style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
          border: '1px solid #a7f3d0',
          marginBottom: '2rem',
        }}>
          <div style={{
            display: 'inline-flex',
            padding: '1.25rem',
            background: 'var(--status-pending-bg)',
            borderRadius: '50%',
            marginBottom: '1.25rem',
            animation: 'pulseGlow 2s ease-in-out infinite',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
          }}>
            <Clock size={44} color="var(--status-pending)" />
          </div>

          <h2 style={{ fontSize: '1.65rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Your Account Creation Request is Under Processing
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
            Our administration team is currently reviewing your submitted credentials and documents.
            You will be notified once a decision has been made.
          </p>

          {profile.submitted_at && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.25rem',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
            }}>
              <FileText size={14} />
              Submitted on: <strong>{new Date(profile.submitted_at).toLocaleString()}</strong>
            </div>
          )}
        </div>

        {/* Progress Timeline */}
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Application Progress
          </h3>
          <div className="review-timeline">
            <TimelineStep
              icon={CheckCircle2}
              label="Account Created"
              description="Your doctor account has been registered"
              status="completed"
            />
            <TimelineStep
              icon={CheckCircle2}
              label="Details & Documents Submitted"
              description={`Submitted on ${new Date(profile.submitted_at).toLocaleDateString()}`}
              status="completed"
            />
            <TimelineStep
              icon={Clock}
              label="Admin Review in Progress"
              description="Waiting for admin team to review your application"
              status="active"
            />
            <TimelineStep
              icon={ShieldCheck}
              label="Verification Complete"
              description="Your account will be activated after approval"
              status="pending"
              isLast
            />
          </div>
        </div>
      </div>
    );
  }

  // ─── Default State (Draft / Rejected / Active) ────────────────────────
  return (
    <div className="container page-wrapper">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
              <Stethoscope size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem' }}>Doctor Verification & Onboarding Portal</h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Provider Account: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadProfile}
          icon={<RefreshCw size={14} />}
        >
          Refresh Status
        </Button>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* 1. Rejection Feedback Banner (if rejected by SaaS Admin) */}
      {isRejected && profile?.admin_feedback && (
        <>
          <FeedbackBanner
            feedback={profile.admin_feedback}
            reviewedAt={profile.reviewed_at}
          />

          {/* Resubmit Button */}
          <div className="card animate-slide-up" style={{
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            borderLeft: '4px solid var(--status-pending)',
            background: 'linear-gradient(to right, #fef3c7, #fffbeb)',
          }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} color="var(--status-pending)" />
                Update & Resubmit Your Application
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Review the admin feedback above, update your details and documents, then resubmit for review.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowResubmitModal(true)}
              icon={<Send size={16} />}
            >
              Open Resubmit Form
            </Button>
          </div>
        </>
      )}

      {/* 2. Status & Submission Card */}
      <StatusCard
        status={profile?.status || 'pending'}
        submittedAt={profile?.submitted_at}
        reviewedAt={profile?.reviewed_at}
        onSubmitted={loadProfile}
      />

      {/* 3. Professional Profile Information Form */}
      <ProfileForm
        initialData={profile}
        onProfileUpdated={loadProfile}
        disabled={isUnderReview}
      />

      {/* 4. Verification Document Uploader */}
      <DocumentUploader
        documents={profile?.documents || []}
        onDocumentsChanged={loadProfile}
        disabled={isUnderReview}
      />

      {/* Resubmit Onboarding Modal (for rejected doctors) */}
      <DoctorOnboardingModal
        isOpen={showResubmitModal}
        onClose={() => setShowResubmitModal(false)}
        onCompleted={handleResubmitCompleted}
      />
    </div>
  );
}

// ─── Timeline Step Component ────────────────────────────────────────────
function TimelineStep({ icon: Icon, label, description, status, isLast = false }) {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';

  return (
    <div className={`timeline-step ${status}`}>
      <div className="timeline-indicator">
        <div className={`timeline-dot ${status}`}>
          <Icon
            size={18}
            color={
              isCompleted ? '#ffffff' :
              isActive ? 'var(--status-pending)' :
              'var(--text-muted)'
            }
          />
        </div>
        {!isLast && <div className={`timeline-connector ${isCompleted ? 'completed' : ''}`} />}
      </div>
      <div className="timeline-content">
        <div style={{
          fontWeight: 700,
          fontSize: '0.95rem',
          color: isCompleted ? 'var(--status-active-text)' : isActive ? 'var(--status-pending-text)' : 'var(--text-muted)',
        }}>
          {label}
        </div>
        <p style={{
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          margin: '0.15rem 0 0',
        }}>
          {description}
        </p>
      </div>
    </div>
  );
}
