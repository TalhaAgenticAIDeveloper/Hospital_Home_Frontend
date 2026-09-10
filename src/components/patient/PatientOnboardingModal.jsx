import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { patientApi } from '../../api/patient';
import { patientDocumentsApi } from '../../api/patientDocuments';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  FileText,
  Upload,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  AlertCircle,
  File,
  Lock,
  Sparkles,
} from 'lucide-react';

const STEPS = [
  { key: 'details', label: 'Basic Details', icon: User },
  { key: 'documents', label: 'Medical History (Optional)', icon: Upload },
  { key: 'complete', label: 'All Set', icon: CheckCircle2 },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

export function PatientOnboardingModal({ isOpen, onClose, onCompleted }) {
  const { refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [toast, setToast] = useState(null);

  // Step 1: Form state
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'O+',
    address: '',
  });
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  // Step 2: Medical records upload state
  const [documents, setDocuments] = useState([]);
  const [documentLabel, setDocumentLabel] = useState('Past Prescription / Lab Report');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const fileInputRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveDetails = async (e) => {
    e?.preventDefault();

    if (!formData.full_name.trim()) {
      setToast({ type: 'warning', message: 'Please enter your full name.' });
      return;
    }

    setIsSavingDetails(true);
    try {
      await patientApi.updateProfile({
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
      });
      if (refreshUser) {
        await refreshUser();
      }
      setToast({ type: 'success', message: 'Basic details saved successfully!' });
      setCurrentStep(1);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save basic details.' });
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setToast({ type: 'error', message: 'File size must not exceed 50 MB.' });
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      setToast({ type: 'warning', message: 'Please select a file to upload.' });
      return;
    }

    setIsUploadingDoc(true);
    try {
      const newDoc = await patientDocumentsApi.uploadDocument(selectedFile, documentLabel);
      setDocuments((prev) => [...prev, newDoc]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setToast({ type: 'success', message: 'Medical document uploaded and encrypted!' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to upload document.' });
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    setDeletingDocId(docId);
    try {
      await patientDocumentsApi.deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setToast({ type: 'info', message: 'Document removed.' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete document.' });
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleFinishOnboarding = () => {
    if (onCompleted) {
      onCompleted();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to MedTrust — Patient Onboarding"
      maxWidth="680px"
    >
      <div style={{ padding: '0.5rem 0' }}>
        {toast && (
          <div style={{ marginBottom: '1rem' }}>
            <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
          </div>
        )}

        {/* Step Indicator Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.75rem',
            padding: '0.75rem 1rem',
            background: 'var(--bg-alt)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCurrent = idx === currentStep;
            const isDone = idx < currentStep;
            return (
              <React.Fragment key={step.key}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      background: isCurrent
                        ? 'var(--primary)'
                        : isDone
                        ? 'var(--status-active)'
                        : 'var(--border-color)',
                      color: isCurrent || isDone ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--primary)' : isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      background: idx < currentStep ? 'var(--status-active)' : 'var(--border-color)',
                      margin: '0 0.75rem',
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── STEP 1: Basic Details ── */}
        {currentStep === 0 && (
          <form onSubmit={handleSaveDetails}>
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                Tell us about yourself
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                These details will help our doctors provide accurate medical care and personalize your consultations.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <Input
                  label="Full Name *"
                  name="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="e.g. Sarah Khan"
                  icon={<User size={16} />}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <Input
                  label="Age (Years)"
                  name="age"
                  type="number"
                  min="0"
                  max="130"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="e.g. 28"
                  icon={<Calendar size={16} />}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                >
                  {GENDERS.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem', fontWeight: 600 }}>
                  Blood Group
                </label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => handleInputChange('blood_group', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem' }}>
              <Button
                type="submit"
                variant="primary"
                loading={isSavingDetails}
                icon={<ChevronRight size={16} />}
              >
                Save & Continue
              </Button>
            </div>
          </form>
        )}

        {/* ── STEP 2: Optional Medical History Documents Upload ── */}
        {currentStep === 1 && (
          <div>
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.35rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                Medical History & Prior Records
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                You can upload past prescriptions, lab tests, discharge summaries, or X-rays now, or skip and upload later.
              </p>
            </div>

            {/* Reassuring High-Trust Explanation Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.15rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0,
                  boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  Upload once — we take care of the rest!
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  <strong>Upload your medical history documents once</strong> — we will securely encrypt and protect them, and automatically provide them to your attending doctors during consultations so you never have to repeat your medical history.
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  🔒 <em>End-to-end encrypted • Strictly accessible only by you and your approved consulting doctors.</em>
                </div>
              </div>
            </div>

            {/* Document Uploader Area */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.825rem', fontWeight: 600 }}>
                    Document Label / Description
                  </label>
                  <input
                    type="text"
                    value={documentLabel}
                    onChange={(e) => setDocumentLabel(e.target.value)}
                    placeholder="e.g. Recent CBC Blood Test, Cardiology Report"
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.875rem',
                      background: 'var(--bg-alt)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="onboarding-file-input"
                  />
                  <label
                    htmlFor="onboarding-file-input"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.55rem 0.9rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-alt)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Upload size={14} />
                    {selectedFile ? 'Change File' : 'Choose File'}
                  </label>
                </div>
              </div>

              {selectedFile && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--primary-light)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '0.75rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <File size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 600, color: 'var(--primary)' }} className="truncate">
                      {selectedFile.name}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    loading={isUploadingDoc}
                    onClick={handleUploadDocument}
                  >
                    Upload Now
                  </Button>
                </div>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Accepted formats: PDF, JPEG, PNG (Max 50 MB each).
              </div>
            </div>

            {/* Uploaded Documents List */}
            {documents.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Uploaded Documents ({documents.length}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CheckCircle2 size={16} color="var(--status-active)" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {doc.label || doc.original_filename}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {doc.original_filename} • {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteDocument(doc.id)}
                        disabled={deletingDocId === doc.id}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--status-error)',
                          cursor: 'pointer',
                          padding: '0.25rem',
                          borderRadius: '4px',
                        }}
                        title="Delete Document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(0)}
                icon={<ChevronLeft size={16} />}
              >
                Back
              </Button>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCurrentStep(2)}
                  style={{ color: 'var(--text-muted)' }}
                >
                  Skip for Now
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCurrentStep(2)}
                  icon={<ChevronRight size={16} />}
                >
                  {documents.length > 0 ? 'Continue' : 'Skip & Continue'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Complete / Ready ── */}
        {currentStep === 2 && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Sparkles size={32} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              You're all set, {formData.full_name || 'Patient'}!
            </h3>
            <p
              style={{
                fontSize: '0.925rem',
                color: 'var(--text-secondary)',
                maxWidth: '440px',
                margin: '0 auto 1.75rem auto',
                lineHeight: 1.5,
              }}
            >
              Your personal health profile is ready. You can easily book online video consultations with verified doctors, and your health details will automatically assist your consulting physicians.
            </p>

            <div
              style={{
                background: 'var(--bg-alt)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                maxWidth: '440px',
                margin: '0 auto 2rem auto',
                textAlign: 'left',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Summary of your profile:
              </div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <div>• <strong>Name:</strong> {formData.full_name || 'Not provided'}</div>
                <div>• <strong>Age / Blood:</strong> {formData.age ? `${formData.age} yrs` : 'N/A'} • {formData.blood_group || 'N/A'}</div>
                <div>• <strong>Uploaded Documents:</strong> {documents.length} records attached</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '0.35rem' }}>
                  ℹ️ You can edit these details anytime from <strong>"My Health Profile"</strong> in your dashboard.
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleFinishOnboarding}
              style={{ minWidth: '220px' }}
            >
              Enter Patient Dashboard
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
