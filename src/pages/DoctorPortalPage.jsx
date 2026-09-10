import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorApi } from '../../src/api/doctor';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { FeedbackBanner } from '../components/doctor/FeedbackBanner';
import { StatusCard } from '../components/doctor/StatusCard';
import { ProfileForm } from '../components/doctor/ProfileForm';
import { DocumentUploader } from '../components/doctor/DocumentUploader';
import { DoctorOnboardingModal } from '../components/doctor/DoctorOnboardingModal';
import { AvailabilityManager } from '../components/doctor/AvailabilityManager';
import { DoctorMeetingsList } from '../components/doctor/DoctorMeetingsList';
import { Loader } from '../components/common/Loader';
import { Toast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import {
  Stethoscope,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Send,
  AlertTriangle,
  FileText,
  UserCheck,
  Calendar,
  Video,
  Sparkles,
} from 'lucide-react';

export function DoctorPortalPage() {
  const { user, refreshUser } = useAuth();
  const { section } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showResubmitModal, setShowResubmitModal] = useState(false);

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

  useEffect(() => {
    loadProfile();
  }, []);

  const isUnderReview = profile?.status === 'pending' && !!profile?.submitted_at;
  const isRejected = profile?.status === 'rejected';
  const isActive = profile?.status === 'active';

  // Compute active tab from URL and doctor status
  const allowedTabs = isActive
    ? ['consultations', 'availability', 'profile']
    : ['status', 'profile', 'documents'];
  const defaultTab = isActive ? 'consultations' : 'status';
  const activeTab = allowedTabs.includes(section) ? section : defaultTab;

  // Sync / sanitize route if user types invalid section
  useEffect(() => {
    if (!profile) return;
    if (section && !allowedTabs.includes(section)) {
      navigate(`/doctor/portal/${defaultTab}`, { replace: true });
    }
  }, [section, profile, allowedTabs, defaultTab, navigate]);

  if (isLoading) {
    return <Loader fullScreen text="Loading doctor credentials and onboarding status..." />;
  }

  const handleResubmitCompleted = () => {
    setShowResubmitModal(false);
    loadProfile();
  };

  // Determine nav items based on doctor status
  const getNavItems = () => {
    if (isActive) {
      return [
        { key: 'consultations', label: 'Appointments & Consultations', icon: Video },
        { key: 'availability', label: 'Availability & Schedule', icon: Calendar },
        { key: 'profile', label: 'Doctor Profile & Documents', icon: UserCheck },
      ];
    }
    if (isUnderReview) {
      return [
        { key: 'status', label: 'Verification Timeline', icon: Clock, badge: 'In Review', badgeVariant: 'warning' },
        { key: 'profile', label: 'Submitted Profile', icon: UserCheck },
        { key: 'documents', label: 'Uploaded Documents', icon: FileText },
      ];
    }
    if (isRejected) {
      return [
        { key: 'status', label: 'Application Feedback', icon: AlertTriangle, badge: 'Action Required', badgeVariant: 'danger' },
        { key: 'profile', label: 'Edit Profile Information', icon: UserCheck },
        { key: 'documents', label: 'Manage Documents', icon: FileText },
      ];
    }
    return [
      { key: 'status', label: 'Onboarding Checklist', icon: Clock },
      { key: 'profile', label: 'Doctor Profile Information', icon: UserCheck },
      { key: 'documents', label: 'Upload Credentials', icon: FileText },
    ];
  };

  const getPageMeta = () => {
    if (isActive) {
      switch (activeTab) {
        case 'availability':
          return { title: 'Availability & Schedule' };
        case 'profile':
          return { title: 'Doctor Profile & Documents' };
        case 'consultations':
        default:
          return { title: `Dr. ${profile?.full_name || 'Practitioner'}` };
      }
    }
    if (isUnderReview) {
      return { title: 'Verification In Progress' };
    }
    if (isRejected) {
      return { title: 'Application Revision' };
    }
    return { title: 'Doctor Onboarding' };
  };

  const navItems = getNavItems();
  const meta = getPageMeta();

  return (
    <DashboardLayout
      roleTitle="Doctor Portal"
      roleBadge={isActive ? 'Verified Doctor' : profile?.status ? profile.status.toUpperCase() : 'Doctor'}
      navItems={navItems}
      activeKey={activeTab}
      onSelectNav={(key) => navigate(`/doctor/portal/${key}`)}
      pageTitle={meta.title}
      quickAction={
        isActive
          ? {
              label: 'Set Free Timings',
              icon: <Calendar size={16} />,
              onClick: () => navigate('/doctor/portal/availability'),
            }
          : isRejected
          ? {
              label: 'Resubmit Application',
              icon: <Send size={16} />,
              onClick: () => setShowResubmitModal(true),
            }
          : null
      }
      headerActions={
        <span
          style={{
            fontSize: '0.78rem',
            padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            background: isActive ? '#dcfce7' : isRejected ? '#fee2e2' : '#fef3c7',
            color: isActive ? '#166534' : isRejected ? '#991b1b' : '#92400e',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          {isActive && '✓ Verified Active'}
          {isUnderReview && '⏳ Under Admin Review'}
          {isRejected && '⚠ Revision Needed'}
          {!isActive && !isUnderReview && !isRejected && '● Onboarding Draft'}
        </span>
      }
    >
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ── CASE 1: ACTIVE VERIFIED DOCTOR ── */}
      {isActive && (
        <>
          {activeTab === 'consultations' && <DoctorMeetingsList />}
          {activeTab === 'availability' && <AvailabilityManager />}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <ProfileForm
                initialData={profile}
                onProfileUpdated={loadProfile}
                disabled={false}
              />
              <DocumentUploader
                documents={profile?.documents || []}
                onDocumentsChanged={loadProfile}
                disabled={false}
              />
            </div>
          )}
        </>
      )}

      {/* ── CASE 2: UNDER REVIEW / PENDING ── */}
      {isUnderReview && (
        <>
          {activeTab === 'status' && (
            <div>
              {/* Main Under-Review Status Card */}
              <div
                className="card animate-slide-up"
                style={{
                  textAlign: 'center',
                  padding: '2.75rem 2rem',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)',
                  border: '1px solid #a7f3d0',
                  marginBottom: '1.75rem',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '1.25rem',
                    background: 'var(--status-pending-bg)',
                    borderRadius: '50%',
                    marginBottom: '1.25rem',
                    animation: 'pulseGlow 2s ease-in-out infinite',
                    boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <Clock size={40} color="var(--status-pending)" />
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                  Your Medical Verification is Under Processing
                </h2>
                <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', maxWidth: '580px', margin: '0 auto 1.25rem', lineHeight: 1.6 }}>
                  Our administrative verification team is reviewing your medical degree, state license, and submitted certificates. You will receive active clinical access as soon as it is approved.
                </p>

                {profile.submitted_at && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.45rem 1.25rem',
                      background: 'var(--bg-card)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <FileText size={14} />
                    Submitted on: <strong>{new Date(profile.submitted_at).toLocaleString()}</strong>
                  </div>
                )}
              </div>

              {/* Progress Timeline */}
              <div className="card" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Verification Roadmap
                </h3>
                <div className="review-timeline">
                  <TimelineStep
                    icon={CheckCircle2}
                    label="Account Created"
                    description="Provider user account registered"
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
                    label="Admin Credential Verification"
                    description="Waiting for SaaS admin team review"
                    status="active"
                  />
                  <TimelineStep
                    icon={ShieldCheck}
                    label="Practicing Activation"
                    description="Full video consultation and booking access unlocked"
                    status="pending"
                    isLast
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <ProfileForm
              initialData={profile}
              onProfileUpdated={loadProfile}
              disabled={true}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentUploader
              documents={profile?.documents || []}
              onDocumentsChanged={loadProfile}
              disabled={true}
            />
          )}
        </>
      )}

      {/* ── CASE 3: REJECTED / REVISION NEEDED ── */}
      {isRejected && (
        <>
          {activeTab === 'status' && (
            <div>
              {profile?.admin_feedback && (
                <FeedbackBanner
                  feedback={profile.admin_feedback}
                  reviewedAt={profile.reviewed_at}
                />
              )}

              <div
                className="card animate-slide-up"
                style={{
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderLeft: '4px solid var(--status-pending)',
                  background: 'linear-gradient(to right, #fef3c7, #fffbeb)',
                  padding: '1.5rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} color="var(--status-pending)" />
                    Update Credentials & Resubmit
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Please review the administrator notes above, rectify your details or re-upload clear license copies, then resubmit.
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

              <StatusCard
                status={profile?.status || 'pending'}
                submittedAt={profile?.submitted_at}
                reviewedAt={profile?.reviewed_at}
                onSubmitted={loadProfile}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <ProfileForm
              initialData={profile}
              onProfileUpdated={loadProfile}
              disabled={false}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentUploader
              documents={profile?.documents || []}
              onDocumentsChanged={loadProfile}
              disabled={false}
            />
          )}
        </>
      )}

      {/* ── CASE 4: DRAFT / UNINITIALIZED ── */}
      {!isActive && !isUnderReview && !isRejected && (
        <>
          {activeTab === 'status' && (
            <StatusCard
              status={profile?.status || 'pending'}
              submittedAt={profile?.submitted_at}
              reviewedAt={profile?.reviewed_at}
              onSubmitted={loadProfile}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileForm
              initialData={profile}
              onProfileUpdated={loadProfile}
              disabled={false}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentUploader
              documents={profile?.documents || []}
              onDocumentsChanged={loadProfile}
              disabled={false}
            />
          )}
        </>
      )}

      {/* Resubmit Onboarding Modal */}
      <DoctorOnboardingModal
        isOpen={showResubmitModal}
        onClose={() => setShowResubmitModal(false)}
        onCompleted={handleResubmitCompleted}
      />
    </DashboardLayout>
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
