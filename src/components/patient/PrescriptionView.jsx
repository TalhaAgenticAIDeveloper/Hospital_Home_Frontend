import React from 'react';
import {
  Pill,
  Calendar,
  Clock,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  X,
  FileText,
  User,
  Stethoscope,
  Printer,
} from 'lucide-react';
import { Button } from '../common/Button';

export function PrescriptionView({ prescription, isOpen, onClose }) {
  if (!isOpen || !prescription) return null;

  const formatDate = (dStr) => {
    if (!dStr) return '';
    try {
      return new Date(dStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dStr;
    }
  };

  const formatTime = (tStr) => {
    if (!tStr) return '';
    try {
      const parts = tStr.split(':');
      let h = parseInt(parts[0], 10);
      const m = parts[1] || '00';
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    } catch {
      return tStr;
    }
  };

  const handlePrint = () => {
    window.print();
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
          maxWidth: '750px',
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
            background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
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
                Digital Medical Prescription
              </h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.85)' }}>
                Issued on {formatDate(prescription.created_at)}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: '0.4rem 0.65rem',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Printer size={15} /> Print
            </button>
            <button
              onClick={onClose}
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
        </div>

        {/* Content - Scrollable */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Metadata Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1rem',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Stethoscope size={20} color="#0d9488" />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PRESCRIBED BY</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                  Dr. {prescription.doctor_name || 'Consultation Doctor'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <User size={20} color="#6366f1" />
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PATIENT</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>
                  {prescription.patient_name || 'Patient'}
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Advice / Notes */}
          {prescription.notes && (
            <div
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                borderRadius: '10px',
                background: '#fefce8',
                border: '1px solid #fef08a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: '#854d0e', marginBottom: '0.35rem' }}>
                <FileText size={15} color="#ca8a04" />
                <span>Doctor Advice & Instructions</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#713f12', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {prescription.notes}
              </p>
            </div>
          )}

          {/* Medicines Schedule */}
          <div>
            <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem', color: '#1e293b', fontWeight: 700 }}>
              Prescribed Medicines & Daily Timetable
            </h4>

            {(!prescription.medicines || prescription.medicines.length === 0) ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>No medicine schedules listed.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {prescription.medicines.map((med, idx) => (
                  <div
                    key={med.id || idx}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: '#ffffff',
                    }}
                  >
                    {/* Medicine Header */}
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#f0fdf4',
                        borderBottom: '1px solid #bbf7d0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Pill size={18} color="#16a34a" />
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: '#15803d' }}>
                          {med.medicine_name}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.8rem',
                          color: '#166534',
                          background: '#dcfce7',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          fontWeight: 600,
                        }}
                      >
                        <Calendar size={13} />
                        <span>{formatDate(med.start_date)} to {formatDate(med.end_date)}</span>
                      </div>
                    </div>

                    {/* Time Slots Grid */}
                    <div
                      style={{
                        padding: '1rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Morning */}
                      <div
                        style={{
                          padding: '0.65rem',
                          borderRadius: '8px',
                          background: med.morning ? '#fffbeb' : '#f8fafc',
                          border: '1px solid',
                          borderColor: med.morning ? '#fde68a' : '#f1f5f9',
                          opacity: med.morning ? 1 : 0.45,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8rem', color: '#b45309' }}>
                          <Sun size={14} color="#eab308" />
                          <span>Morning</span>
                        </div>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                          {med.morning ? formatTime(med.morning_time) : '—'}
                        </div>
                        {med.morning && (
                          <div style={{ fontSize: '0.75rem', color: '#78350f', marginTop: '0.2rem' }}>
                            {med.morning_before_meal ? 'Before breakfast' : 'After breakfast'}
                          </div>
                        )}
                      </div>

                      {/* Afternoon */}
                      <div
                        style={{
                          padding: '0.65rem',
                          borderRadius: '8px',
                          background: med.afternoon ? '#fff7ed' : '#f8fafc',
                          border: '1px solid',
                          borderColor: med.afternoon ? '#fed7aa' : '#f1f5f9',
                          opacity: med.afternoon ? 1 : 0.45,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8rem', color: '#c2410c' }}>
                          <CloudSun size={14} color="#f97316" />
                          <span>Afternoon</span>
                        </div>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                          {med.afternoon ? formatTime(med.afternoon_time) : '—'}
                        </div>
                        {med.afternoon && (
                          <div style={{ fontSize: '0.75rem', color: '#9a3412', marginTop: '0.2rem' }}>
                            {med.afternoon_before_meal ? 'Before lunch' : 'After lunch'}
                          </div>
                        )}
                      </div>

                      {/* Evening */}
                      <div
                        style={{
                          padding: '0.65rem',
                          borderRadius: '8px',
                          background: med.evening ? '#fdf2f8' : '#f8fafc',
                          border: '1px solid',
                          borderColor: med.evening ? '#fbcfe8' : '#f1f5f9',
                          opacity: med.evening ? 1 : 0.45,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8rem', color: '#be185d' }}>
                          <Sunset size={14} color="#ec4899" />
                          <span>Evening</span>
                        </div>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                          {med.evening ? formatTime(med.evening_time) : '—'}
                        </div>
                        {med.evening && (
                          <div style={{ fontSize: '0.75rem', color: '#831843', marginTop: '0.2rem' }}>
                            {med.evening_before_meal ? 'Before snacks' : 'After snacks'}
                          </div>
                        )}
                      </div>

                      {/* Night */}
                      <div
                        style={{
                          padding: '0.65rem',
                          borderRadius: '8px',
                          background: med.night ? '#eef2ff' : '#f8fafc',
                          border: '1px solid',
                          borderColor: med.night ? '#c7d2fe' : '#f1f5f9',
                          opacity: med.night ? 1 : 0.45,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, fontSize: '0.8rem', color: '#4338ca' }}>
                          <Moon size={14} color="#6366f1" />
                          <span>Night</span>
                        </div>
                        <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                          {med.night ? formatTime(med.night_time) : '—'}
                        </div>
                        {med.night && (
                          <div style={{ fontSize: '0.75rem', color: '#312e81', marginTop: '0.2rem' }}>
                            {med.night_before_meal ? 'Before dinner' : 'After dinner'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#f8fafc',
          }}
        >
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
