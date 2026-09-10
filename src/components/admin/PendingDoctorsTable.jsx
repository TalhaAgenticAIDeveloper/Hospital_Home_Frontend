import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { FileText, Eye, CheckCircle2, Trash2, Mail, Stethoscope } from 'lucide-react';

export function PendingDoctorsTable({
  doctors = [],
  isLoading = false,
  onDeleteDoctor,
  emptyMessage = 'No doctors found matching your filter criteria.',
}) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', marginBottom: '0.75rem' }} className="animate-spin">
          <Stethoscope size={36} color="var(--primary)" style={{ opacity: 0.6 }} />
        </div>
        <p style={{ fontWeight: 600 }}>Loading doctors directory...</p>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
        <CheckCircle2 size={44} strokeWidth={1.5} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '0.75rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>No Doctors Listed</h3>
        <p style={{ maxWidth: '450px', margin: '0.35rem auto 0', fontSize: '0.9rem' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="doctors-table-container">
      {/* ── Desktop & Tablet Table View (hidden on small mobile) ── */}
      <div className="card desktop-table-card" style={{ padding: '0.5rem', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Doctor & Email</th>
                <th>Status</th>
                <th>Specialization</th>
                <th>License No.</th>
                <th>Experience</th>
                <th>Documents</th>
                <th>Submitted</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc.doctor_id || doc.user_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {doc.full_name || 'Dr. (Name not set)'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {doc.email}
                    </div>
                  </td>
                  <td>
                    <Badge status={doc.status} />
                  </td>
                  <td>
                    <span className="badge badge-role" style={{ fontSize: '0.75rem' }}>
                      {doc.specialization || 'Not specified'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {doc.license_number || 'N/A'}
                  </td>
                  <td>
                    {doc.years_of_experience ? `${doc.years_of_experience} yrs` : 'N/A'}
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <FileText size={15} color="var(--primary)" />
                      <strong>{doc.document_count}</strong> files
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {doc.submitted_at
                      ? new Date(doc.submitted_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Draft'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/admin/doctors/${doc.user_id}`)}
                        icon={<Eye size={14} />}
                        title="View Full Profile, Documents & Review"
                      >
                        Inspect
                      </Button>
                      {onDeleteDoctor && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => onDeleteDoctor(doc)}
                          icon={<Trash2 size={14} />}
                          title="Delete Doctor Account"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Card View (shown on small screens <= 768px) ── */}
      <div className="mobile-cards-list">
        {doctors.map((doc) => (
          <div key={doc.doctor_id || doc.user_id} className="card mobile-doctor-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{doc.full_name || 'Dr. (Name not set)'}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                  <Mail size={13} />
                  <span>{doc.email}</span>
                </div>
              </div>
              <Badge status={doc.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--bg-alt)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginBottom: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Specialization</span>
                <span style={{ fontWeight: 600 }}>{doc.specialization || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>License No.</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{doc.license_number || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Documents</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FileText size={13} color="var(--primary)" />
                  <strong>{doc.document_count}</strong> files
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase' }}>Submitted</span>
                <span>{doc.submitted_at ? new Date(doc.submitted_at).toLocaleDateString() : 'Draft'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button
                variant="primary"
                size="sm"
                block
                onClick={() => navigate(`/admin/doctors/${doc.user_id}`)}
                icon={<Eye size={14} />}
              >
                Inspect & Review
              </Button>
              {onDeleteDoctor && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDeleteDoctor(doc)}
                  icon={<Trash2 size={14} />}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
