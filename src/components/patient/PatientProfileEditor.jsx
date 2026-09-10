import React, { useState, useEffect } from 'react';
import { patientApi } from '../../api/patient';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import {
  User,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FolderOpen,
  MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

export function PatientProfileEditor() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    date_of_birth: '',
    gender: 'Male',
    blood_group: 'O+',
    address: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setIsLoading(true);
      try {
        const profile = await patientApi.getProfile();
        if (profile) {
          setFormData({
            full_name: profile.full_name || '',
            age: profile.age != null ? String(profile.age) : '',
            date_of_birth: profile.date_of_birth || '',
            gender: profile.gender || 'Male',
            blood_group: profile.blood_group || 'O+',
            address: profile.address || '',
          });
          setIsCompleted(profile.is_completed);
        }
      } catch (err) {
        setToast({ type: 'error', message: err.message || 'Failed to load profile details.' });
      } finally {
        setIsLoading(false);
      }
    }

    loadProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.full_name.trim()) {
      setToast({ type: 'warning', message: 'Full name is required.' });
      return;
    }

    setIsSaving(true);
    try {
      const updated = await patientApi.updateProfile({
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : null,
      });

      setIsCompleted(updated.is_completed);
      if (refreshUser) {
        await refreshUser();
      }
      setToast({ type: 'success', message: 'Health profile updated successfully!' });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
        Loading your health profile...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      {toast && (
        <div style={{ marginBottom: '1.25rem' }}>
          <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
        </div>
      )}

      {/* Header Profile Status Card */}
      <div
        className="card-aesthetic"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 700,
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
            }}
          >
            {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              {formData.full_name || 'Patient Health Profile'}
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {user?.email} • {formData.blood_group ? `Blood: ${formData.blood_group}` : 'Blood group not set'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              color: isCompleted ? 'var(--status-active)' : 'var(--status-pending)',
              border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            }}
          >
            {isCompleted ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {isCompleted ? 'Profile Complete' : 'Incomplete Details'}
          </span>
        </div>
      </div>

      {/* High-Trust Reassuring Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(99, 102, 241, 0.05) 100%)',
          border: '1px solid rgba(37, 99, 235, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '1.15rem 1.35rem',
          marginBottom: '1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start', flex: 1, minWidth: '280px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--primary)', marginBottom: '0.2rem' }}>
              Your Medical Privacy & Physician Sharing
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Upload your medical history documents once — we will securely encrypt and protect them, and automatically provide them to your attending doctors during consultations so you never have to repeat your medical history.
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<FolderOpen size={15} />}
          onClick={() => navigate('/patient/dashboard/documents')}
        >
          Manage Medical Records
        </Button>
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSave}>
        <div className="card-aesthetic" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <h4
            style={{
              margin: '0 0 1.25rem 0',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '1.05rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <User size={18} color="var(--primary)" />
            Personal & Demographic Details
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <Input
                label="Full Legal Name *"
                name="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="e.g. Sarah Khan"
                icon={<User size={16} />}
                required
              />
            </div>

            <div>
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
              <Input
                label="Date of Birth (YYYY-MM-DD)"
                name="date_of_birth"
                type="text"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                placeholder="e.g. 1996-05-14"
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

              <div style={{ gridColumn: 'span 2' }}>
                <Input
                  label="City / Residential Address"
                  name="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="e.g. Lahore, Pakistan"
                  icon={<MapPin size={16} />}
                />
              </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSaving}
            icon={<Save size={18} />}
          >
            Save Profile Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
