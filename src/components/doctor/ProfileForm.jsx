import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { doctorApi } from '../../api/doctor';
import {
  Save,
  User,
  Users,
  ShieldCheck,
  Phone,
  Award,
  Clock,
  GraduationCap,
  Coins,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export function ProfileForm({ initialData, onProfileUpdated, disabled = false }) {
  const isApproved = initialData?.status === 'active';

  const [formData, setFormData] = useState({
    full_name: '',
    father_name: '',
    pmdc_registration_number: '',
    consultation_fee: '',
    phone_number: '',
    specialization: '',
    years_of_experience: 0,
    qualification: '',
    bio: '',
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        full_name: initialData.full_name || '',
        father_name: initialData.father_name || '',
        pmdc_registration_number: initialData.pmdc_registration_number || '',
        consultation_fee: initialData.consultation_fee != null ? initialData.consultation_fee : '',
        phone_number: initialData.phone_number || '',
        specialization: initialData.specialization || '',
        years_of_experience: initialData.years_of_experience ?? 0,
        qualification: initialData.qualification || '',
        bio: initialData.bio || '',
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? value === '' ? '' : parseFloat(value) || 0
          : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!isApproved) {
      if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
      if (!formData.father_name.trim()) errs.father_name = "Father's name is required";
      if (!formData.pmdc_registration_number.trim()) errs.pmdc_registration_number = 'PMDC registration number is required';
    }

    if (formData.consultation_fee === '' || formData.consultation_fee === null || isNaN(formData.consultation_fee)) {
      errs.consultation_fee = 'Consultation fee is required';
    } else if (Number(formData.consultation_fee) < 0) {
      errs.consultation_fee = 'Consultation fee cannot be negative';
    }

    if (formData.years_of_experience < 0) errs.years_of_experience = 'Experience cannot be negative';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast({
        type: 'error',
        message: 'Please provide all mandatory fields (Full Name, Father Name, PMDC Reg No, Consultation Fee).',
      });
      return;
    }

    setIsSaving(true);
    setToast(null);

    try {
      const payload = {
        ...formData,
        consultation_fee: Number(formData.consultation_fee),
      };
      const updatedProfile = await doctorApi.updateProfile(payload);
      setToast({ type: 'success', message: 'Profile details saved successfully!' });
      if (onProfileUpdated) onProfileUpdated(updatedProfile);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Doctor Profile & Practice Settings</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {isApproved
              ? 'Your account is approved. Legal credentials are locked, but Consultation Fee and professional details can be updated at any time.'
              : 'Full Name, Father Name, PMDC Registration Number, and Consultation Fee are mandatory for regulatory verification.'}
          </p>
        </div>
      </div>

      {isApproved && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.85rem 1rem',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1.25rem',
            fontSize: '0.85rem',
            color: '#334155',
          }}
        >
          <Lock size={18} color="var(--primary)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Verified Account:</strong> Your <strong>Full Name</strong>, <strong>Father's Name</strong>, and <strong>PMDC Registration Number</strong> are fixed and cannot be edited. Your <strong>Consultation Fee</strong> and other details remain fully editable.
          </span>
        </div>
      )}

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* Mandatory: Full Name (Locked when approved) */}
          <div>
            <Input
              label={
                isApproved ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    Full Doctor Name <Lock size={13} color="var(--text-muted)" /> (Locked)
                  </span>
                ) : (
                  'Full Doctor Name *'
                )
              }
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="e.g. Dr. Sarah Jenkins"
              error={errors.full_name}
              icon={<User size={16} />}
              required
              disabled={disabled || isApproved}
            />
          </div>

          {/* Mandatory: Father Name (Locked when approved) */}
          <div>
            <Input
              label={
                isApproved ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    Father's Name <Lock size={13} color="var(--text-muted)" /> (Locked)
                  </span>
                ) : (
                  "Father's Name *"
                )
              }
              name="father_name"
              value={formData.father_name}
              onChange={handleChange}
              placeholder="e.g. Muhammad Jenkins"
              error={errors.father_name}
              icon={<Users size={16} />}
              required
              disabled={disabled || isApproved}
            />
          </div>

          {/* Mandatory: PMDC Registration Number (Locked when approved) */}
          <div>
            <Input
              label={
                isApproved ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    PMDC Registration Number <Lock size={13} color="var(--text-muted)" /> (Locked)
                  </span>
                ) : (
                  'PMDC Registration Number *'
                )
              }
              name="pmdc_registration_number"
              value={formData.pmdc_registration_number}
              onChange={handleChange}
              placeholder="e.g. 12345-P or 98765-S"
              error={errors.pmdc_registration_number}
              icon={<ShieldCheck size={16} />}
              required
              disabled={disabled || isApproved}
            />
          </div>

          {/* Mandatory: Consultation Fee (Always Editable!) */}
          <div>
            <Input
              label="Consultation Fee (PKR) *"
              name="consultation_fee"
              type="number"
              value={formData.consultation_fee}
              onChange={handleChange}
              placeholder="e.g. 2000"
              error={errors.consultation_fee}
              icon={<Coins size={16} />}
              required
              min="0"
              step="50"
              disabled={disabled}
            />
          </div>

          {/* Optional: Specialization */}
          <Input
            label="Specialization / Department"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            placeholder="e.g. General Physician, Cardiology"
            error={errors.specialization}
            icon={<Award size={16} />}
            disabled={disabled}
          />

          {/* Optional: Phone */}
          <Input
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="e.g. +92 300 1234567"
            error={errors.phone_number}
            icon={<Phone size={16} />}
            disabled={disabled}
          />

          {/* Optional: Experience */}
          <Input
            label="Years of Experience"
            name="years_of_experience"
            type="number"
            value={formData.years_of_experience}
            onChange={handleChange}
            placeholder="0"
            error={errors.years_of_experience}
            icon={<Clock size={16} />}
            disabled={disabled}
          />

          {/* Optional: Qualifications */}
          <div style={{ gridColumn: 'span 2' }}>
            <Input
              label="Qualifications & Degrees"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="e.g. MBBS, FCPS, MRCP"
              error={errors.qualification}
              icon={<GraduationCap size={16} />}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Optional: Bio */}
        <div className="form-group" style={{ marginTop: '0.75rem' }}>
          <label className="form-label">Professional Biography & Summary</label>
          <textarea
            name="bio"
            rows="3"
            className="form-control"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Brief overview of clinical practice and areas of medical expertise..."
            disabled={disabled}
          />
        </div>

        {!disabled && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
            <Button
              type="submit"
              variant="primary"
              loading={isSaving}
              icon={<Save size={16} />}
            >
              Save Profile Details
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
