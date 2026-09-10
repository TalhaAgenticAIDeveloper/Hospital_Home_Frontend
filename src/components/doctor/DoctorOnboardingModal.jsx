import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { doctorApi } from '../../api/doctor';
import {
  Info,
  User,
  Users,
  ShieldCheck,
  Phone,
  Award,
  Clock,
  GraduationCap,
  Send,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

const STEPS = [
  { key: 'info', label: 'Requirements', icon: Info },
  { key: 'profile', label: 'Doctor Profile', icon: User },
  { key: 'review', label: 'Review & Submit', icon: Send },
];

export function DoctorOnboardingModal({ isOpen, onClose, onCompleted }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [toast, setToast] = useState(null);

  // Profile form state
  const [formData, setFormData] = useState({
    full_name: '',
    father_name: '',
    pmdc_registration_number: '',
    phone_number: '',
    specialization: '',
    years_of_experience: 0,
    qualification: '',
    bio: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load existing profile on open
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
          father_name: profile.father_name || '',
          pmdc_registration_number: profile.pmdc_registration_number || profile.license_number || '',
          phone_number: profile.phone_number || '',
          specialization: profile.specialization || '',
          years_of_experience: profile.years_of_experience ?? 0,
          qualification: profile.qualification || '',
          bio: profile.bio || '',
        });

        if (profile.full_name && profile.father_name && profile.pmdc_registration_number) {
          setProfileSaved(true);
        }
      }
    } catch (err) {
      // Profile might not be created yet, ignore
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
    setProfileSaved(false);
  };

  const validateProfileForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full Doctor Name is mandatory';
    if (!formData.father_name.trim()) errors.father_name = "Father's Name is mandatory";
    if (!formData.pmdc_registration_number.trim()) errors.pmdc_registration_number = 'PMDC Registration Number is mandatory';
    if (formData.years_of_experience < 0) errors.years_of_experience = 'Experience cannot be negative';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!validateProfileForm()) {
      setToast({ type: 'error', message: 'Please fill in all 3 mandatory fields (Full Name, Father Name, PMDC Number).' });
      return false;
    }

    setIsSavingProfile(true);
    setToast(null);

    try {
      await doctorApi.updateProfile(formData);
      setProfileSaved(true);
      setToast({ type: 'success', message: 'Profile details saved successfully!' });
      return true;
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save profile details.' });
      return false;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Must save profile before moving to review step
      const saved = await handleSaveProfile();
      if (!saved) return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmitApplication = async () => {
    if (!formData.full_name.trim() || !formData.father_name.trim() || !formData.pmdc_registration_number.trim()) {
      setToast({
        type: 'error',
        message: 'Full Name, Father Name, and PMDC Registration Number are mandatory to submit.',
      });
      return;
    }

    setIsSubmitting(true);
    setToast(null);

    try {
      const res = await doctorApi.submitApplication();
      setToast({ type: 'success', message: res.message || 'Application submitted successfully for review!' });
      setTimeout(() => {
        if (onCompleted) onCompleted();
        onClose();
      }, 1200);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to submit application. Please check your details.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.75rem' }}>
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx < currentStep;
        const isCurrent = idx === currentStep;

        return (
          <React.Fragment key={step.key}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: idx <= currentStep ? 'pointer' : 'default',
                opacity: isCurrent ? 1 : isCompleted ? 0.85 : 0.45,
              }}
              onClick={() => {
                if (idx <= currentStep) setCurrentStep(idx);
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isCurrent ? 'var(--primary)' : isCompleted ? 'var(--status-active)' : 'var(--border-color)',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 200ms ease',
                }}
              >
                {isCompleted ? <CheckCircle2 size={18} /> : <Icon size={16} />}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                style={{
                  width: '36px',
                  height: '2px',
                  background: idx < currentStep ? 'var(--status-active)' : 'var(--border-color)',
                  transition: 'all 200ms ease',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Credential Verification"
      maxWidth="680px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div>
            {currentStep > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrevStep}
                disabled={isSubmitting || isSavingProfile}
                icon={<ChevronLeft size={16} />}
              >
                Back
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNextStep}
                loading={isSavingProfile}
                icon={<ChevronRight size={16} />}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                onClick={handleSubmitApplication}
                loading={isSubmitting}
                icon={<Send size={16} />}
              >
                Submit Application
              </Button>
            )}
          </div>
        </div>
      }
    >
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {renderStepIndicator()}

      {/* ── STEP 0: Requirements ── */}
      {currentStep === 0 && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                display: 'inline-flex',
                padding: '0.85rem',
                borderRadius: '50%',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                marginBottom: '0.75rem',
              }}
            >
              <ShieldCheck size={36} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>PMDC Regulatory Verification</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto' }}>
              To ensure safety and patient trust, all healthcare practitioners must provide verified credentials registered with the Pakistan Medical and Dental Council (PMDC).
            </p>
          </div>

          <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={18} color="var(--primary)" />
              <span>Mandatory Information Required:</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ padding: '0.35rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
                  <User size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Full Doctor Name (Mandatory)</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    As registered in official medical council records and degrees.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ padding: '0.35rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
                  <Users size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Father's Name (Mandatory)</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Required for identity verification against council databases.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <div style={{ padding: '0.35rem', background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', color: 'var(--primary)' }}>
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>PMDC Registration Number (Mandatory)</strong>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Your valid registration number issued by Pakistan Medical and Dental Council.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: '#ecfdf5', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.85rem', color: '#065f46', margin: 0 }}>
              <strong>No document scans required!</strong> Verification is conducted directly using your PMDC Registration Number.
            </p>
          </div>
        </div>
      )}

      {/* ── STEP 1: Profile Details ── */}
      {currentStep === 1 && (
        <form onSubmit={handleSaveProfile}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Enter Your Details</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Full Name, Father Name, and PMDC Number are mandatory.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {/* Mandatory: Full Name */}
            <Input
              label="Full Doctor Name *"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="e.g. Dr. Sarah Jenkins"
              error={formErrors.full_name}
              icon={<User size={16} />}
              required
            />

            {/* Mandatory: Father Name */}
            <Input
              label="Father's Name *"
              name="father_name"
              value={formData.father_name}
              onChange={handleInputChange}
              placeholder="e.g. Muhammad Jenkins"
              error={formErrors.father_name}
              icon={<Users size={16} />}
              required
            />

            {/* Mandatory: PMDC Registration Number */}
            <Input
              label="PMDC Registration Number *"
              name="pmdc_registration_number"
              value={formData.pmdc_registration_number}
              onChange={handleInputChange}
              placeholder="e.g. 12345-P"
              error={formErrors.pmdc_registration_number}
              icon={<ShieldCheck size={16} />}
              required
            />

            {/* Optional: Specialization */}
            <Input
              label="Specialization / Department"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              placeholder="e.g. General Physician, Cardiology"
              error={formErrors.specialization}
              icon={<Award size={16} />}
            />

            {/* Optional: Phone */}
            <Input
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="e.g. +92 300 1234567"
              error={formErrors.phone_number}
              icon={<Phone size={16} />}
            />

            {/* Optional: Experience */}
            <Input
              label="Years of Experience"
              name="years_of_experience"
              type="number"
              value={formData.years_of_experience}
              onChange={handleInputChange}
              placeholder="0"
              error={formErrors.years_of_experience}
              icon={<Clock size={16} />}
            />

            {/* Optional: Qualification */}
            <div style={{ gridColumn: 'span 2' }}>
              <Input
                label="Qualifications & Degrees"
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                placeholder="e.g. MBBS, FCPS Cardiology"
                error={formErrors.qualification}
                icon={<GraduationCap size={16} />}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '0.75rem' }}>
            <label className="form-label">Professional Biography & Summary</label>
            <textarea
              name="bio"
              rows="3"
              className="form-control"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Brief summary of your clinical background and practice..."
            />
          </div>
        </form>
      )}

      {/* ── STEP 2: Review & Submit ── */}
      {currentStep === 2 && (
        <div>
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>Review & Confirm Submission</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Please verify your information before submitting to SaaS Administration for approval.
            </p>
          </div>

          {/* Details Overview Card */}
          <div style={{ background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Doctor Credentials</h4>
              <span
                style={{ fontSize: '0.75rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                onClick={() => setCurrentStep(1)}
              >
                Edit Details
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Full Name</span>
                <p style={{ fontWeight: 600, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  {formData.full_name || 'Not provided'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Father's Name</span>
                <p style={{ fontWeight: 600, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  {formData.father_name || 'Not provided'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>PMDC Reg. Number</span>
                <p style={{ fontWeight: 700, margin: '2px 0 0', color: 'var(--primary)', fontFamily: 'monospace' }}>
                  {formData.pmdc_registration_number || 'Not provided'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Specialization</span>
                <p style={{ fontWeight: 500, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  {formData.specialization || 'General Physician'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Phone</span>
                <p style={{ fontWeight: 500, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  {formData.phone_number || 'N/A'}
                </p>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Experience</span>
                <p style={{ fontWeight: 500, margin: '2px 0 0', color: 'var(--text-primary)' }}>
                  {formData.years_of_experience ? `${formData.years_of_experience} Years` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0.85rem 1rem', background: '#eff6ff', borderRadius: 'var(--radius-md)', borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={20} color="#2563eb" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.85rem', color: '#1e40af', margin: 0 }}>
              Upon submission, your application will be reviewed by the administration against official PMDC registration records. You will receive access upon approval.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
