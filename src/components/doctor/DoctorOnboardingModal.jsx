import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { doctorApi } from '../../api/doctor';
import {
  Info,
  User,
  Phone,
  Award,
  FileText,
  Clock,
  GraduationCap,
  Upload,
  Trash2,
  Send,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  FileCheck,
  Shield,
  Camera,
  File,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  { key: 'info', label: 'Requirements', icon: Info },
  { key: 'profile', label: 'Profile Details', icon: User },
  { key: 'documents', label: 'Upload Documents', icon: Upload },
  { key: 'review', label: 'Review & Submit', icon: Send },
];

const DOCUMENT_TYPES = [
  {
    value: 'medical_license',
    label: 'Medical Practice License',
    description: 'Your current, valid medical practice license issued by the regulatory authority.',
    icon: Shield,
    required: true,
  },
  {
    value: 'degree_certificate',
    label: 'Medical Degree / Certificate',
    description: 'MBBS, MD, or equivalent medical degree certificate from a recognized institution.',
    icon: GraduationCap,
    required: true,
  },
  {
    value: 'id_proof',
    label: 'Government ID / Passport',
    description: 'Valid government-issued photo identification or passport for identity verification.',
    icon: FileText,
    required: false,
  },
  {
    value: 'profile_photo',
    label: 'Professional Profile Photo',
    description: 'A clear, professional headshot for your provider profile.',
    icon: Camera,
    required: false,
  },
  {
    value: 'other',
    label: 'Other Supporting Document',
    description: 'Any additional certifications, fellowships, or recommendation letters.',
    icon: File,
    required: false,
  },
];

export function DoctorOnboardingModal({ isOpen, onClose, onCompleted }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [toast, setToast] = useState(null);

  // Profile form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    specialization: '',
    license_number: '',
    years_of_experience: 0,
    qualification: '',
    bio: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Document upload state
  const [documents, setDocuments] = useState([]);
  const [docType, setDocType] = useState('medical_license');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing profile and documents on open
  useEffect(() => {
    if (isOpen) {
      loadExistingData();
    }
  }, [isOpen]);

  const loadExistingData = async () => {
    try {
      const profile = await doctorApi.getProfile();
      if (profile) {
        setFormData({
          full_name: profile.full_name || '',
          phone_number: profile.phone_number || '',
          specialization: profile.specialization || '',
          license_number: profile.license_number || '',
          years_of_experience: profile.years_of_experience ?? 0,
          qualification: profile.qualification || '',
          bio: profile.bio || '',
        });
        setDocuments(profile.documents || []);

        // If profile already has data, mark as saved
        if (profile.full_name && profile.license_number) {
          setProfileSaved(true);
        }
      }
    } catch (err) {
      // Profile might not exist yet for new signups, that's fine
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateProfile = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.phone_number.trim()) errs.phone_number = 'Phone number is required';
    if (!formData.specialization.trim()) errs.specialization = 'Specialization is required';
    if (!formData.license_number.trim()) errs.license_number = 'License number is required';
    if (formData.years_of_experience < 0) errs.years_of_experience = 'Cannot be negative';
    if (!formData.qualification.trim()) errs.qualification = 'Qualifications are required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      setToast({ type: 'error', message: 'Please fix the errors before saving.' });
      return false;
    }

    setIsSavingProfile(true);
    setToast(null);

    try {
      await doctorApi.updateProfile(formData);
      setProfileSaved(true);
      setToast({ type: 'success', message: 'Profile details saved!' });
      return true;
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save profile.' });
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Document handling
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: 'File exceeds maximum size of 10MB.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setToast({ type: 'error', message: 'Only PDF, JPEG, and PNG files are accepted.' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
    setToast(null);
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setToast({ type: 'warning', message: 'Please select a file to upload.' });
      return;
    }

    setIsUploading(true);
    setToast(null);

    try {
      await doctorApi.uploadDocument(selectedFile, docType);
      setToast({ type: 'success', message: `"${selectedFile.name}" uploaded successfully!` });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh documents list
      const profile = await doctorApi.getProfile();
      setDocuments(profile.documents || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to upload document.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docId, fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    setDeletingId(docId);
    try {
      await doctorApi.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setToast({ type: 'info', message: 'Document removed.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete.' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setToast(null);

    try {
      await doctorApi.submitApplication();
      setToast({ type: 'success', message: 'Application submitted for review!' });
      setTimeout(() => {
        if (onCompleted) onCompleted();
      }, 1200);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to submit application.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step navigation
  const handleNext = async () => {
    if (currentStep === 1) {
      // Save profile before moving to documents
      const saved = await handleSaveProfile();
      if (!saved) return;
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setToast(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setToast(null);
    }
  };

  const canProceedFromStep = () => {
    switch (currentStep) {
      case 0:
        return true; // Info step, always can proceed
      case 1:
        return formData.full_name.trim() && formData.license_number.trim();
      case 2:
        return documents.length > 0;
      case 3:
        return profileSaved && documents.length > 0;
      default:
        return true;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocTypeLabel = (val) => {
    const item = DOCUMENT_TYPES.find((d) => d.value === val);
    return item ? item.label : val;
  };

  // ─── Step Renderers ───────────────────────────────────────────────────

  const renderInfoStep = () => (
    <div className="onboarding-step animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
        <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-lg)', marginBottom: '1rem' }}>
          <Shield size={36} color="var(--primary)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome to Doctor Verification</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
          To activate your medical provider account, you'll need to submit your professional details and verification documents for admin review.
        </p>
      </div>

      <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCheck size={18} color="var(--primary)" />
          Documents You Can Upload
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {DOCUMENT_TYPES.map((dt) => {
            const Icon = dt.icon;
            return (
              <div
                key={dt.value}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ padding: '0.35rem', background: dt.required ? 'var(--primary-light)' : 'var(--bg-alt)', borderRadius: 'var(--radius-sm)', marginTop: '2px' }}>
                  <Icon size={16} color={dt.required ? 'var(--primary)' : 'var(--text-muted)'} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {dt.label}
                    {dt.required && (
                      <span style={{ fontSize: '0.7rem', background: 'var(--status-pending-bg)', color: 'var(--status-pending-text)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
                        RECOMMENDED
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>{dt.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '180px', padding: '0.85rem', background: '#ecfdf5', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#065f46', marginBottom: '0.2rem' }}>ACCEPTED FORMATS</div>
          <div style={{ fontSize: '0.85rem', color: '#047857' }}>PDF, JPEG, PNG</div>
        </div>
        <div style={{ flex: 1, minWidth: '180px', padding: '0.85rem', background: '#eff6ff', borderRadius: 'var(--radius-sm)', border: '1px solid #bfdbfe' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#1e40af', marginBottom: '0.2rem' }}>MAX FILE SIZE</div>
          <div style={{ fontSize: '0.85rem', color: '#1d4ed8' }}>10 MB per file</div>
        </div>
        <div style={{ flex: 1, minWidth: '180px', padding: '0.85rem', background: '#fef3c7', borderRadius: 'var(--radius-sm)', border: '1px solid #fcd34d' }}>
          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#92400e', marginBottom: '0.2rem' }}>MINIMUM REQUIRED</div>
          <div style={{ fontSize: '0.85rem', color: '#b45309' }}>At least 1 document</div>
        </div>
      </div>
    </div>
  );

  const renderProfileStep = () => (
    <div className="onboarding-step animate-fade-in">
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Professional Profile Details</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Enter your clinical qualifications and medical registration information.
        </p>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          <Input
            label="Full Doctor Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleFormChange}
            placeholder="e.g. Dr. Sarah Jenkins"
            error={formErrors.full_name}
            icon={<User size={16} />}
            required
          />
          <Input
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleFormChange}
            placeholder="e.g. +92 300 1234567"
            error={formErrors.phone_number}
            icon={<Phone size={16} />}
            required
          />
          <Input
            label="Specialization / Department"
            name="specialization"
            value={formData.specialization}
            onChange={handleFormChange}
            placeholder="e.g. Cardiology, Neurology"
            error={formErrors.specialization}
            icon={<Award size={16} />}
            required
          />
          <Input
            label="Medical License / Registration No."
            name="license_number"
            value={formData.license_number}
            onChange={handleFormChange}
            placeholder="e.g. PMC-REG-2024-889"
            error={formErrors.license_number}
            icon={<FileText size={16} />}
            required
          />
          <Input
            label="Years of Experience"
            name="years_of_experience"
            type="number"
            value={formData.years_of_experience}
            onChange={handleFormChange}
            placeholder="0"
            error={formErrors.years_of_experience}
            icon={<Clock size={16} />}
          />
          <Input
            label="Qualifications & Degrees"
            name="qualification"
            value={formData.qualification}
            onChange={handleFormChange}
            placeholder="e.g. MBBS, FCPS Cardiology"
            error={formErrors.qualification}
            icon={<GraduationCap size={16} />}
            required
          />
        </div>

        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label">Professional Biography (Optional)</label>
          <textarea
            name="bio"
            rows="2"
            className="form-control"
            value={formData.bio}
            onChange={handleFormChange}
            placeholder="Brief overview of your clinical background and areas of expertise..."
          />
        </div>
      </form>
    </div>
  );

  const renderDocumentsStep = () => (
    <div className="onboarding-step animate-fade-in">
      <div style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.25rem' }}>Upload Verification Documents</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Upload certified copies of your medical license, degree certificates, and identity documents.
        </p>
      </div>

      {/* Upload Form */}
      <form
        onSubmit={handleUploadDoc}
        style={{
          background: 'var(--bg-alt)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          border: '1px dashed var(--border-color)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Document Category</label>
            <select className="form-control" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOCUMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Choose File (PDF, PNG, JPG &lt; 10MB)</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              className="form-control"
              style={{ padding: '0.45rem' }}
            />
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              loading={isUploading}
              disabled={!selectedFile}
              icon={<Upload size={16} />}
              block
            >
              Upload
            </Button>
          </div>
        </div>
      </form>

      {/* Uploaded Documents List */}
      <div>
        <h4 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileCheck size={18} color="var(--primary)" />
          <span>Uploaded Files ({documents.length})</span>
        </h4>

        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)' }}>
            <FileText size={36} strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
            <p>No documents uploaded yet.</p>
            <p style={{ fontSize: '0.8rem' }}>At least 1 document is required for submission.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 1rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileText size={18} color="var(--primary)" />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.original_filename}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {getDocTypeLabel(doc.document_type)} • {formatFileSize(doc.file_size)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDeleteDoc(doc.id, doc.original_filename)}
                  loading={deletingId === doc.id}
                  icon={<Trash2 size={13} />}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderReviewStep = () => (
    <div className="onboarding-step animate-fade-in">
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'inline-flex', padding: '0.75rem', background: '#ecfdf5', borderRadius: 'var(--radius-lg)', marginBottom: '0.75rem' }}>
          <CheckCircle2 size={32} color="#10b981" />
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>Review Your Application</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Please review your details below. Once submitted, your account will be pending until admin verification.
        </p>
      </div>

      {/* Profile Summary */}
      <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.03em' }}>
          Profile Information
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Full Name', value: formData.full_name },
            { label: 'Phone', value: formData.phone_number },
            { label: 'Specialization', value: formData.specialization },
            { label: 'License No.', value: formData.license_number },
            { label: 'Experience', value: formData.years_of_experience ? `${formData.years_of_experience} Years` : 'N/A' },
            { label: 'Qualification', value: formData.qualification },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{item.label}</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', fontSize: '0.9rem' }}>{item.value || 'Not provided'}</div>
            </div>
          ))}
        </div>
        {formData.bio && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Bio</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{formData.bio}</div>
          </div>
        )}
      </div>

      {/* Documents Summary */}
      <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.75rem', letterSpacing: '0.03em' }}>
          Uploaded Documents ({documents.length})
        </h4>
        {documents.length === 0 ? (
          <div style={{ padding: '1rem', background: 'var(--status-rejected-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--status-rejected-text)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            No documents uploaded. Go back and upload at least one document.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {documents.map((doc) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 0.75rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                <CheckCircle2 size={16} color="var(--status-active)" />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.original_filename}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getDocTypeLabel(doc.document_type)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderInfoStep();
      case 1:
        return renderProfileStep();
      case 2:
        return renderDocumentsStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Onboarding"
      maxWidth="820px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            {currentStep > 0 && (
              <Button
                variant="secondary"
                onClick={handleBack}
                icon={<ChevronLeft size={16} />}
                disabled={isSubmitting}
              >
                Back
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {currentStep < STEPS.length - 1 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceedFromStep()}
                loading={isSavingProfile && currentStep === 1}
                icon={<ChevronRight size={16} />}
              >
                {currentStep === 1 ? 'Save & Continue' : 'Continue'}
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={handleSubmitApplication}
                loading={isSubmitting}
                disabled={!canProceedFromStep()}
                icon={<Send size={16} />}
              >
                Submit Application for Review
              </Button>
            )}
          </div>
        </div>
      }
    >
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Stepper Header */}
      <div className="onboarding-stepper">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <React.Fragment key={step.key}>
              <div
                className={`stepper-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  if (isCompleted) {
                    setCurrentStep(idx);
                    setToast(null);
                  }
                }}
                style={{ cursor: isCompleted ? 'pointer' : 'default' }}
              >
                <div className="stepper-icon">
                  {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </div>
                <span className="stepper-label">{step.label}</span>
              </div>
              {idx < STEPS.length - 1 && <div className={`stepper-line ${isCompleted ? 'completed' : ''}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </Modal>
  );
}
