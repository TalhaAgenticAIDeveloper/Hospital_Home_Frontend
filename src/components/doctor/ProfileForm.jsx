import React, { useState, useEffect } from 'react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { doctorApi } from '../../api/doctor';
import { Save, User, Phone, Award, FileText, Clock, GraduationCap } from 'lucide-react';

export function ProfileForm({ initialData, onProfileUpdated, disabled = false }) {
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    specialization: '',
    license_number: '',
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
        phone_number: initialData.phone_number || '',
        specialization: initialData.specialization || '',
        license_number: initialData.license_number || '',
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
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.phone_number.trim()) errs.phone_number = 'Phone number is required';
    if (!formData.specialization.trim()) errs.specialization = 'Medical specialization is required';
    if (!formData.license_number.trim()) errs.license_number = 'Medical license number is required';
    if (formData.years_of_experience < 0) errs.years_of_experience = 'Experience cannot be negative';
    if (!formData.qualification.trim()) errs.qualification = 'Qualifications (e.g. MBBS, MD) are required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setToast({ type: 'error', message: 'Please fix the errors before saving.' });
      return;
    }

    setIsSaving(true);
    setToast(null);

    try {
      const updatedProfile = await doctorApi.updateProfile(formData);
      setToast({ type: 'success', message: 'Professional information saved successfully!' });
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
          <h3>Professional Profile Details</h3>
          <p style={{ fontSize: '0.85rem' }}>Enter your clinical qualifications and medical registration information.</p>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <Input
            label="Full Doctor Name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="e.g. Dr. Sarah Jenkins"
            error={errors.full_name}
            icon={<User size={16} />}
            required
            disabled={disabled}
          />

          <Input
            label="Phone Number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="e.g. +1 555-019-2834"
            error={errors.phone_number}
            icon={<Phone size={16} />}
            required
            disabled={disabled}
          />

          <Input
            label="Specialization / Department"
            name="specialization"
            value={formData.specialization}
            onChange={handleChange}
            placeholder="e.g. Cardiology, Neurology, General Surgery"
            error={errors.specialization}
            icon={<Award size={16} />}
            required
            disabled={disabled}
          />

          <Input
            label="Medical License / Registration No."
            name="license_number"
            value={formData.license_number}
            onChange={handleChange}
            placeholder="e.g. MED-REG-2024-889"
            error={errors.license_number}
            icon={<FileText size={16} />}
            required
            disabled={disabled}
          />

          <Input
            label="Years of Experience"
            name="years_of_experience"
            type="number"
            value={formData.years_of_experience}
            onChange={handleChange}
            placeholder="0"
            error={errors.years_of_experience}
            icon={<Clock size={16} />}
            required
            disabled={disabled}
          />

          <Input
            label="Qualifications & Degrees"
            name="qualification"
            value={formData.qualification}
            onChange={handleChange}
            placeholder="e.g. MBBS, MD - Cardiology, Fellow of ACC"
            error={errors.qualification}
            icon={<GraduationCap size={16} />}
            required
            disabled={disabled}
          />
        </div>

        <div className="form-group" style={{ marginTop: '0.5rem' }}>
          <label className="form-label">Professional Biography & Summary</label>
          <textarea
            name="bio"
            rows="3"
            className="form-control"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Brief overview of clinical background, areas of expertise, and medical research interests..."
            disabled={disabled}
          />
        </div>

        {!disabled && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
