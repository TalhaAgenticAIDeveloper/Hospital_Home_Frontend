import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Trash2, ShieldAlert } from 'lucide-react';

export function DeletePatientConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  patient = null,
  isDeleting = false,
}) {
  if (!patient) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? undefined : onClose}
      title="Delete Patient Account"
      maxWidth="540px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={isDeleting}
            icon={<Trash2 size={16} />}
          >
            Permanently Delete Patient
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Warning Callout */}
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderLeft: '4px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.85rem',
          }}
        >
          <ShieldAlert size={24} color="#dc2626" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#991b1b', marginBottom: '0.25rem' }}>
              Warning: Irreversible Action
            </div>
            <p style={{ fontSize: '0.85rem', color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>
              This will permanently delete the patient's account, demographic profile, uploaded medical documents, and cascade all consultation records. Physical files stored on disk will also be erased.
            </p>
          </div>
        </div>

        {/* Patient Details Card */}
        <div
          style={{
            background: 'var(--bg-alt)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Patient to be deleted
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            {patient.full_name || 'Patient (Name not set)'}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
            {patient.email}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '0.6rem',
              marginTop: '0.85rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)',
              fontSize: '0.82rem',
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Gender / Age</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                {patient.gender || '—'} {patient.age ? `(${patient.age} yrs)` : ''}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Blood Group</span>
              <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                {patient.blood_group || '—'}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Consultations</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {patient.consultations_count || 0}
              </span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Documents</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {patient.documents_count || 0}
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          Are you sure you want to delete this patient? This action cannot be undone.
        </p>
      </div>
    </Modal>
  );
}
