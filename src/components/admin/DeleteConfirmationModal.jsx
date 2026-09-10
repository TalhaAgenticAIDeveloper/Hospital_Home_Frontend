import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Trash2, ShieldAlert } from 'lucide-react';

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  doctorName = '',
  doctorEmail = '',
  isDeleting = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isDeleting ? undefined : onClose}
      title="Delete Doctor Account"
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
            Permanently Delete Doctor
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
              Warning: Permanent Action
            </div>
            <p style={{ fontSize: '0.85rem', color: '#b91c1c', margin: 0, lineHeight: 1.5 }}>
              This will permanently delete the doctor's account, professional profile, and all uploaded verification documents from both the database and file storage.
            </p>
          </div>
        </div>

        {/* Doctor Info Card */}
        <div
          style={{
            background: 'var(--bg-alt)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            Doctor to be removed
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            {doctorName || 'Dr. (Name not set)'}
          </div>
          {doctorEmail && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {doctorEmail}
            </div>
          )}
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
          Are you sure you want to proceed? This action cannot be reversed.
        </p>
      </div>
    </Modal>
  );
}
