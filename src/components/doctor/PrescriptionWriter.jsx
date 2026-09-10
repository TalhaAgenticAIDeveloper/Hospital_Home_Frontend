import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Trash2,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  X,
  FileText,
  Send,
} from 'lucide-react';
import { prescriptionApi } from '../../api/prescription';
import { Button } from '../common/Button';

const getTodayStr = () => new Date().toISOString().split('T')[0];
const getFutureDateStr = (days = 5) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const createEmptyMedicine = () => ({
  id: Math.random().toString(36).substring(2, 9),
  medicine_name: '',
  morning: false,
  morning_time: '08:00',
  morning_before_meal: true,
  afternoon: false,
  afternoon_time: '13:00',
  afternoon_before_meal: false,
  evening: false,
  evening_time: '18:00',
  evening_before_meal: true,
  night: false,
  night_time: '21:00',
  night_before_meal: false,
  start_date: getTodayStr(),
  end_date: getFutureDateStr(5),
});

export function PrescriptionWriter({ meetingId, patientName, isOpen, onClose, onSuccess }) {
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState([createEmptyMedicine()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddMedicine = () => {
    setMedicines([...medicines, createEmptyMedicine()]);
  };

  const handleRemoveMedicine = (index) => {
    if (medicines.length <= 1) {
      setError('Prescription must contain at least one medicine.');
      return;
    }
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicineField = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const validate = () => {
    if (medicines.length === 0) {
      setError('Please add at least one medicine.');
      return false;
    }

    for (let i = 0; i < medicines.length; i++) {
      const med = medicines[i];
      if (!med.medicine_name.trim()) {
        setError(`Medicine #${i + 1}: Name and dosage cannot be empty.`);
        return false;
      }
      if (!med.morning && !med.afternoon && !med.evening && !med.night) {
        setError(`Medicine #${i + 1} (${med.medicine_name}): Please check at least one dosage time (Morning, Afternoon, Evening, or Night).`);
        return false;
      }
      if (med.end_date < med.start_date) {
        setError(`Medicine #${i + 1} (${med.medicine_name}): End date cannot be before start date.`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setIsSubmitting(true);

    const payload = {
      meeting_id: meetingId,
      notes: notes.trim() || undefined,
      medicines: medicines.map((m) => ({
        medicine_name: m.medicine_name.trim(),
        morning: m.morning,
        morning_time: m.morning ? (m.morning_time ? `${m.morning_time}:00` : '08:00:00') : null,
        morning_before_meal: m.morning_before_meal,
        afternoon: m.afternoon,
        afternoon_time: m.afternoon ? (m.afternoon_time ? `${m.afternoon_time}:00` : '13:00:00') : null,
        afternoon_before_meal: m.afternoon_before_meal,
        evening: m.evening,
        evening_time: m.evening ? (m.evening_time ? `${m.evening_time}:00` : '18:00:00') : null,
        evening_before_meal: m.evening_before_meal,
        night: m.night,
        night_time: m.night ? (m.night_time ? `${m.night_time}:00` : '21:00:00') : null,
        night_before_meal: m.night_before_meal,
        start_date: m.start_date,
        end_date: m.end_date,
      })),
    };

    try {
      const res = await prescriptionApi.createPrescription(payload);
      setIsSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(res);
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to save prescription. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '1rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'modalSlideIn 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Pill size={22} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Write Medical Prescription
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                Patient: <strong>{patientName || 'Consultation Patient'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '0.35rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {isSuccess ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <CheckCircle2 size={36} />
              </div>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem', color: '#1e293b' }}>
                Prescription Issued Successfully!
              </h4>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
                The medicine schedule has been saved. Automated reminder emails are scheduled for the patient.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#dc2626',
                    fontSize: '0.875rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Notification Banner */}
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '10px',
                  padding: '0.75rem 1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  color: '#065f46',
                }}
              >
                <Clock size={16} color="#059669" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Timed Reminders:</strong> The patient will receive automated email alerts at each selected dosage time.
                </span>
              </div>

              {/* General Advice / Notes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '0.4rem',
                  }}
                >
                  <FileText size={15} color="#0d9488" />
                  <span>Doctor Notes & Dietary / General Advice</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Drink plenty of water, avoid spicy food, take 3 days bed rest..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    color: '#1e293b',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Medicines List */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <label style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                    Prescribed Medicines ({medicines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicine}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: '#f0fdf4',
                      color: '#16a34a',
                      border: '1px solid #bbf7d0',
                      borderRadius: '6px',
                      padding: '0.4rem 0.75rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={15} /> Add Medicine
                  </button>
                </div>

                {medicines.map((med, index) => (
                  <div
                    key={med.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      marginBottom: '1rem',
                      position: 'relative',
                    }}
                  >
                    {/* Top Row: Name + Dosage + Delete button */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>
                          Medicine Name & Dosage instructions *
                        </label>
                        <input
                          type="text"
                          value={med.medicine_name}
                          onChange={(e) => updateMedicineField(index, 'medicine_name', e.target.value)}
                          placeholder="e.g. Augmentin 625mg (1 tablet), Panadol 500mg (1 cap), etc."
                          style={{
                            width: '100%',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.9rem',
                            boxSizing: 'border-box',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {medicines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(index)}
                          style={{
                            marginTop: '1.4rem',
                            background: '#fee2e2',
                            border: 'none',
                            color: '#ef4444',
                            borderRadius: '6px',
                            padding: '0.55rem',
                            cursor: 'pointer',
                          }}
                          title="Remove Medicine"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    {/* 4 Timing Slots Grid */}
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                        Daily Intake Schedule (Select times when patient must take this) *
                      </label>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                          gap: '0.75rem',
                        }}
                      >
                        {/* Morning */}
                        <div
                          style={{
                            border: '1px solid',
                            borderColor: med.morning ? '#86efac' : '#e2e8f0',
                            background: med.morning ? '#f0fdf4' : '#ffffff',
                            borderRadius: '8px',
                            padding: '0.65rem 0.75rem',
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={med.morning}
                              onChange={(e) => updateMedicineField(index, 'morning', e.target.checked)}
                            />
                            <Sun size={15} color="#eab308" />
                            <span>Morning</span>
                          </label>

                          {med.morning && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <input
                                type="time"
                                value={med.morning_time}
                                onChange={(e) => updateMedicineField(index, 'morning_time', e.target.value)}
                                style={{ padding: '0.3rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                              <select
                                value={med.morning_before_meal ? 'before' : 'after'}
                                onChange={(e) => updateMedicineField(index, 'morning_before_meal', e.target.value === 'before')}
                                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              >
                                <option value="before">Before Breakfast</option>
                                <option value="after">After Breakfast</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Afternoon */}
                        <div
                          style={{
                            border: '1px solid',
                            borderColor: med.afternoon ? '#86efac' : '#e2e8f0',
                            background: med.afternoon ? '#f0fdf4' : '#ffffff',
                            borderRadius: '8px',
                            padding: '0.65rem 0.75rem',
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={med.afternoon}
                              onChange={(e) => updateMedicineField(index, 'afternoon', e.target.checked)}
                            />
                            <CloudSun size={15} color="#f97316" />
                            <span>Afternoon</span>
                          </label>

                          {med.afternoon && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <input
                                type="time"
                                value={med.afternoon_time}
                                onChange={(e) => updateMedicineField(index, 'afternoon_time', e.target.value)}
                                style={{ padding: '0.3rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                              <select
                                value={med.afternoon_before_meal ? 'before' : 'after'}
                                onChange={(e) => updateMedicineField(index, 'afternoon_before_meal', e.target.value === 'before')}
                                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              >
                                <option value="before">Before Lunch</option>
                                <option value="after">After Lunch</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Evening */}
                        <div
                          style={{
                            border: '1px solid',
                            borderColor: med.evening ? '#86efac' : '#e2e8f0',
                            background: med.evening ? '#f0fdf4' : '#ffffff',
                            borderRadius: '8px',
                            padding: '0.65rem 0.75rem',
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={med.evening}
                              onChange={(e) => updateMedicineField(index, 'evening', e.target.checked)}
                            />
                            <Sunset size={15} color="#ec4899" />
                            <span>Evening</span>
                          </label>

                          {med.evening && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <input
                                type="time"
                                value={med.evening_time}
                                onChange={(e) => updateMedicineField(index, 'evening_time', e.target.value)}
                                style={{ padding: '0.3rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                              <select
                                value={med.evening_before_meal ? 'before' : 'after'}
                                onChange={(e) => updateMedicineField(index, 'evening_before_meal', e.target.value === 'before')}
                                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              >
                                <option value="before">Before Snacks</option>
                                <option value="after">After Snacks</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Night */}
                        <div
                          style={{
                            border: '1px solid',
                            borderColor: med.night ? '#86efac' : '#e2e8f0',
                            background: med.night ? '#f0fdf4' : '#ffffff',
                            borderRadius: '8px',
                            padding: '0.65rem 0.75rem',
                          }}
                        >
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={med.night}
                              onChange={(e) => updateMedicineField(index, 'night', e.target.checked)}
                            />
                            <Moon size={15} color="#6366f1" />
                            <span>Night</span>
                          </label>

                          {med.night && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              <input
                                type="time"
                                value={med.night_time}
                                onChange={(e) => updateMedicineField(index, 'night_time', e.target.value)}
                                style={{ padding: '0.3rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              />
                              <select
                                value={med.night_before_meal ? 'before' : 'after'}
                                onChange={(e) => updateMedicineField(index, 'night_before_meal', e.target.value === 'before')}
                                style={{ padding: '0.3rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                              >
                                <option value="before">Before Dinner</option>
                                <option value="after">After Dinner</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Date Range: From -> To */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={med.start_date}
                          onChange={(e) => updateMedicineField(index, 'start_date', e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: '130px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '0.25rem' }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={med.end_date}
                          onChange={(e) => updateMedicineField(index, 'end_date', e.target.value)}
                          style={{ width: '100%', padding: '0.4rem', fontSize: '0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '1.25rem',
                }}
              >
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  icon={<Send size={16} />}
                >
                  Save & Send Prescription
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
