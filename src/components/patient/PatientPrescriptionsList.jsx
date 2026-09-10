import React, { useState, useEffect } from 'react';
import { Pill, Calendar, Clock, Stethoscope, Eye, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { prescriptionApi } from '../../api/prescription';
import { PrescriptionView } from './PrescriptionView';
import { Loader } from '../common/Loader';
import { Button } from '../common/Button';

export function PatientPrescriptionsList() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await prescriptionApi.getMyPrescriptions();
      setPrescriptions(data);
    } catch (err) {
      setError(err?.detail || err?.message || 'Failed to load prescriptions.');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="patient-prescriptions-list">
      {/* Header Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #0d9488 100%)',
          borderRadius: '14px',
          padding: '1.5rem',
          color: '#ffffff',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: '0 10px 15px -3px rgba(5, 150, 105, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pill size={26} color="#ffffff" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              My Medical Prescriptions
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              All doctor prescriptions issued during your teleconsultations
            </p>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(4px)',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <Clock size={15} />
          <span>Automated Email Reminders Active</span>
        </div>
      </div>

      {isLoading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Loader text="Loading your prescriptions..." />
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
          <p>{error}</p>
          <Button variant="secondary" size="sm" onClick={loadPrescriptions}>
            Retry
          </Button>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#94a3b8',
            }}
          >
            <Pill size={28} />
          </div>
          <h4 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.35rem' }}>
            No Prescriptions Found
          </h4>
          <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto' }}>
            When a doctor writes a prescription during or after your consultation, it will appear here along with full dosage timetables.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {prescriptions.map((rx) => (
            <div
              key={rx.id}
              className="card"
              style={{
                padding: '1.25rem',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        padding: '0.4rem',
                        borderRadius: '8px',
                        background: '#ecfdf5',
                        color: '#059669',
                      }}
                    >
                      <Stethoscope size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b' }}>
                        Dr. {rx.doctor_name || 'Consultation Doctor'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Issued on {formatDate(rx.created_at)}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.55rem',
                      borderRadius: 'var(--radius-full)',
                      background: '#dcfce7',
                      color: '#15803d',
                    }}
                  >
                    {rx.medicines?.length || 0} Medicine{rx.medicines?.length === 1 ? '' : 's'}
                  </span>
                </div>

                {/* Doctor Note Preview */}
                {rx.notes && (
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      color: '#475569',
                      marginBottom: '0.75rem',
                      border: '1px solid #f1f5f9',
                      lineHeight: 1.4,
                    }}
                  >
                    <strong>Advice:</strong> {rx.notes.length > 100 ? `${rx.notes.slice(0, 100)}...` : rx.notes}
                  </div>
                )}

                {/* Medicines List Preview */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                    Prescribed Items
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {rx.medicines?.slice(0, 3).map((m, idx) => (
                      <div
                        key={m.id || idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.85rem',
                          padding: '0.35rem 0.6rem',
                          background: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #f1f5f9',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#1e293b' }}>
                          💊 {m.medicine_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                          {[m.morning && 'Morn', m.afternoon && 'Aft', m.evening && 'Eve', m.night && 'Night'].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    ))}
                    {rx.medicines && rx.medicines.length > 3 && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                        + {rx.medicines.length - 3} more medicine(s)...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                icon={<Eye size={15} />}
                onClick={() => setSelectedPrescription(rx)}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                View Full Timetable & Print
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Prescription View Modal */}
      {selectedPrescription && (
        <PrescriptionView
          isOpen={Boolean(selectedPrescription)}
          onClose={() => setSelectedPrescription(null)}
          prescription={selectedPrescription}
        />
      )}
    </div>
  );
}
