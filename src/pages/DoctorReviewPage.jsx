import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { RejectConfirmationModal } from '../components/admin/RejectConfirmationModal';
import { DeleteConfirmationModal } from '../components/admin/DeleteConfirmationModal';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Toast } from '../components/common/Toast';
import { Loader } from '../components/common/Loader';
import {
  ArrowLeft,
  Check,
  X,
  FileText,
  User,
  Award,
  Phone,
  Clock,
  GraduationCap,
  FileCheck,
  Shield,
  AlertOctagon,
  Mail,
  Calendar,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export function DoctorReviewPage() {
  const { doctorUserId } = useParams();
  const navigate = useNavigate();

  const [doctorDetail, setDoctorDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (doctorUserId) {
      loadDoctorDetail();
    }
  }, [doctorUserId]);

  const handleDeleteDoctor = async () => {
    setIsDeleting(true);
    setToast(null);
    try {
      await adminApi.deleteDoctor(doctorUserId);
      setShowDeleteModal(false);
      navigate('/admin/dashboard');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete doctor account.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const loadDoctorDetail = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getDoctorDetail(doctorUserId);
      setDoctorDetail(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load doctor details.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to APPROVE this doctor? Their account will become active immediately.')) {
      return;
    }

    setIsApproving(true);
    setToast(null);

    try {
      await adminApi.reviewDoctor(doctorUserId, {
        action: 'approve',
        feedback: 'Approved by SaaS Administration.',
      });
      setToast({ type: 'success', message: 'Doctor application APPROVED successfully! Redirecting...' });
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to approve application.' });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectConfirm = async (feedback) => {
    setIsRejecting(true);
    setToast(null);

    try {
      await adminApi.reviewDoctor(doctorUserId, {
        action: 'reject',
        feedback: feedback,
      });
      setShowRejectModal(false);
      setToast({ type: 'success', message: 'Doctor application REJECTED with feedback. Redirecting...' });
      setTimeout(() => navigate('/admin/dashboard'), 1500);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to reject application.' });
    } finally {
      setIsRejecting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return <Loader fullScreen text="Loading doctor application details..." />;
  }

  if (!doctorDetail) {
    return (
      <div className="container page-wrapper">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertOctagon size={48} color="var(--status-rejected)" style={{ marginBottom: '1rem', opacity: 0.6 }} />
          <h2>Doctor Application Not Found</h2>
          <p style={{ marginTop: '0.5rem' }}>The requested doctor application could not be loaded.</p>
          <Button variant="primary" onClick={() => navigate('/admin/dashboard')} style={{ marginTop: '1.5rem' }}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const infoFields = [
    { icon: User, label: 'Full Name', value: doctorDetail.full_name },
    { icon: Mail, label: 'Email Address', value: doctorDetail.email },
    { icon: Phone, label: 'Phone Number', value: doctorDetail.phone_number },
    { icon: Award, label: 'Specialization', value: doctorDetail.specialization },
    { icon: FileText, label: 'Medical License No.', value: doctorDetail.license_number, mono: true },
    { icon: Clock, label: 'Years of Experience', value: doctorDetail.years_of_experience ? `${doctorDetail.years_of_experience} Years` : null },
    { icon: GraduationCap, label: 'Qualifications & Degrees', value: doctorDetail.qualification, span: true },
  ];

  const isDoctorActive = doctorDetail.status === 'active';

  return (
    <div className="container page-wrapper">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Back Button + Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/admin/dashboard')}
          icon={<ArrowLeft size={16} />}
          style={{ marginBottom: '1rem' }}
        >
          Back to Dashboard
        </Button>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
              <div style={{ padding: '0.5rem', background: 'var(--accent-light)', borderRadius: 'var(--radius-md)' }}>
                <Shield size={24} color="var(--accent)" />
              </div>
              <div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.1rem' }}>
                  {isDoctorActive ? 'Doctor Profile & Documents' : 'Review Application'}
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {isDoctorActive ? (
                    <span>Verified Active Provider — <strong>{doctorDetail.email}</strong></span>
                  ) : (
                    <span>{doctorDetail.full_name || 'Doctor'} — {doctorDetail.email}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          <Badge status={doctorDetail.status} />
        </div>
      </div>

      {/* Action Buttons Bar or Active Status Banner */}
      {isDoctorActive ? (
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, #f0fdf4, #ecfdf5)',
          borderLeft: '4px solid var(--status-active)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.6rem', background: 'var(--status-active-bg)', borderRadius: 'var(--radius-md)', color: 'var(--status-active-text)' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.15rem', color: 'var(--status-active-text)' }}>
                Application Approved & Active
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                This doctor is verified and currently active. Review actions are completed.
              </p>
            </div>
          </div>
          <div>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(true)}
              style={{ color: 'var(--status-rejected)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              icon={<Trash2 size={16} />}
            >
              Delete Doctor Account
            </Button>
          </div>
        </div>
      ) : (
        <div className="card" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
          background: 'linear-gradient(to right, #fffbeb, #fef3c7)',
          borderLeft: '4px solid var(--status-pending)',
        }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.15rem' }}>Review Decision</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Approve to activate the doctor's account, or reject with mandatory feedback.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteModal(true)}
              style={{ color: 'var(--status-rejected)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              icon={<Trash2 size={16} />}
            >
              Delete Doctor
            </Button>
            <Button
              variant="danger"
              onClick={() => setShowRejectModal(true)}
              disabled={isApproving}
              icon={<X size={16} />}
            >
              Reject with Feedback
            </Button>
            <Button
              variant="success"
              onClick={handleApprove}
              loading={isApproving}
              icon={<Check size={16} />}
            >
              Approve Doctor
            </Button>
          </div>
        </div>
      )}

      {/* Professional Credentials */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={20} color="var(--primary)" />
          Professional Credentials
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {infoFields.map((field) => {
            const Icon = field.icon;
            return (
              <div
                key={field.label}
                style={{
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-alt)',
                  borderRadius: 'var(--radius-md)',
                  borderLeft: '3px solid var(--primary-light)',
                  ...(field.span ? { gridColumn: 'span 2' } : {}),
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <Icon size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {field.label}
                  </span>
                </div>
                <p style={{
                  fontWeight: 600,
                  color: field.value ? 'var(--text-primary)' : 'var(--text-muted)',
                  margin: 0,
                  fontSize: '1rem',
                  fontFamily: field.mono ? 'monospace' : 'inherit',
                }}>
                  {field.value || 'Not provided'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bio */}
        {doctorDetail.bio && (
          <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--accent-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <FileText size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Professional Bio</span>
            </div>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>
              {doctorDetail.bio}
            </p>
          </div>
        )}

        {/* Submission Info */}
        {doctorDetail.submitted_at && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Calendar size={14} />
            <span>Submitted on: <strong>{new Date(doctorDetail.submitted_at).toLocaleString()}</strong></span>
          </div>
        )}
      </div>

      {/* Uploaded Documents */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCheck size={20} color="var(--primary)" />
          Uploaded Verification Documents ({doctorDetail.documents?.length || 0})
        </h3>

        {(!doctorDetail.documents || doctorDetail.documents.length === 0) ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            background: 'var(--status-rejected-bg)',
            borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--status-rejected)',
          }}>
            <AlertOctagon size={36} color="var(--status-rejected)" style={{ opacity: 0.6, marginBottom: '0.5rem' }} />
            <p style={{ fontWeight: 600, color: 'var(--status-rejected-text)', margin: 0 }}>
              No verification documents were uploaded by this applicant.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--status-rejected-text)', opacity: 0.8, marginTop: '0.25rem' }}>
              This is a critical flag — consider rejecting with feedback requesting document uploads.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {doctorDetail.documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  background: 'var(--bg-alt)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 150ms ease',
                  flexWrap: 'wrap',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '240px', flex: 1 }}>
                  <div style={{ padding: '0.6rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                    <FileText size={22} color="var(--primary)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      {doc.original_filename}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-role" style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                        {doc.document_type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* View & Download Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <a
                    href={adminApi.getDocumentViewUrl(doc.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    title="Open document in browser to view"
                  >
                    <Eye size={14} />
                    <span>View</span>
                  </a>
                  <a
                    href={adminApi.getDocumentDownloadUrl(doc.id)}
                    download={doc.original_filename}
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    title="Download document to your device"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Action Bar (duplicate for convenience on long pages) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem',
        marginTop: '1.5rem',
        paddingTop: '1.5rem',
        borderTop: '1px solid var(--border-color)',
        flexWrap: 'wrap',
      }}>
        <Button
          variant="secondary"
          onClick={() => navigate('/admin/dashboard')}
          icon={<ArrowLeft size={16} />}
        >
          Back to Dashboard
        </Button>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(true)}
            style={{ color: 'var(--status-rejected)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            icon={<Trash2 size={16} />}
          >
            Delete Doctor Account
          </Button>

          {!isDoctorActive && (
            <>
              <Button
                variant="danger"
                onClick={() => setShowRejectModal(true)}
                disabled={isApproving}
                icon={<X size={16} />}
              >
                Reject with Feedback
              </Button>
              <Button
                variant="success"
                onClick={handleApprove}
                loading={isApproving}
                icon={<Check size={16} />}
              >
                Approve Doctor
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      <RejectConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleRejectConfirm}
        doctorName={doctorDetail.full_name}
        isSubmitting={isRejecting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteDoctor}
        doctorName={doctorDetail.full_name}
        doctorEmail={doctorDetail.email}
        isDeleting={isDeleting}
      />
    </div>
  );
}
