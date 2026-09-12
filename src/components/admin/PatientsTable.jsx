import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  Users,
  Trash2,
  Calendar,
  FileText,
  Video,
  MapPin,
  Droplet,
  User,
  CheckCircle2,
} from 'lucide-react';

export function PatientsTable({
  patients = [],
  isLoading = false,
  onDeletePatient,
  emptyMessage = 'No patients found matching your search criteria.',
}) {
  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
        <div style={{ display: 'inline-block', marginBottom: '0.75rem' }} className="animate-spin">
          <Users size={36} color="var(--primary)" style={{ opacity: 0.6 }} />
        </div>
        <p style={{ fontWeight: 600 }}>Loading patients directory...</p>
      </div>
    );
  }

  if (patients.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: 'var(--text-muted)' }}>
        <CheckCircle2 size={44} strokeWidth={1.5} color="var(--primary)" style={{ opacity: 0.6, marginBottom: '0.75rem' }} />
        <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>No Patients Found</h3>
        <p style={{ maxWidth: '450px', margin: '0.35rem auto 0', fontSize: '0.9rem' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="patients-table-container">
      {/* ── Desktop & Tablet Table View ── */}
      <div className="card desktop-table-card" style={{ padding: '0.5rem', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Patient & Email</th>
                <th>Demographics</th>
                <th>Blood Group</th>
                <th>Address</th>
                <th>Consultations</th>
                <th>Documents</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((pat) => (
                <tr key={pat.user_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'var(--primary-subtle, rgba(20, 184, 166, 0.1))',
                          color: 'var(--primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        {(pat.full_name || pat.email || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {pat.full_name || 'Patient (Name not set)'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {pat.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                      {pat.gender ? (
                        <span>{pat.gender}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                      {pat.age ? (
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.35rem' }}>
                          ({pat.age} yrs)
                        </span>
                      ) : null}
                    </div>
                  </td>

                  <td>
                    {pat.blood_group ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.15rem 0.55rem',
                          borderRadius: 'var(--radius-full)',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#dc2626',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      >
                        <Droplet size={11} />
                        {pat.blood_group}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                    )}
                  </td>

                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pat.address ? (
                      <span title={pat.address}>
                        <MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem', color: 'var(--text-muted)' }} />
                        {pat.address}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: pat.consultations_count > 0 ? 'var(--primary)' : 'var(--text-muted)',
                      }}
                    >
                      <Video size={13} />
                      {pat.consultations_count || 0}
                    </span>
                  </td>

                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: pat.documents_count > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      <FileText size={13} />
                      {pat.documents_count || 0}
                    </span>
                  </td>

                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {pat.created_at
                      ? new Date(pat.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>

                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDeletePatient(pat)}
                      icon={<Trash2 size={14} />}
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                      title="Permanently delete this patient"
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Responsive Card View ── */}
      <div className="mobile-cards-container" style={{ display: 'none' }}>
        <style>{`
          @media (max-width: 768px) {
            .desktop-table-card { display: none !important; }
            .mobile-cards-container { display: flex !important; flex-direction: column; gap: 0.85rem; }
          }
        `}</style>
        {patients.map((pat) => (
          <div
            key={pat.user_id}
            className="card"
            style={{ padding: '1rem', border: '1px solid var(--border-color)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  {pat.full_name || 'Patient (Name not set)'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{pat.email}</div>
              </div>
              {pat.blood_group && (
                <span
                  style={{
                    padding: '0.15rem 0.5rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#dc2626',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                  }}
                >
                  {pat.blood_group}
                </span>
              )}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.85rem' }}>
              <div>Gender: <strong style={{ textTransform: 'capitalize' }}>{pat.gender || '—'}</strong></div>
              <div>Age: <strong>{pat.age ? `${pat.age} yrs` : '—'}</strong></div>
              <div>Consultations: <strong>{pat.consultations_count || 0}</strong></div>
              <div>Documents: <strong>{pat.documents_count || 0}</strong></div>
            </div>

            {pat.address && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                <MapPin size={12} style={{ display: 'inline', marginRight: '0.25rem' }} />
                {pat.address}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDeletePatient(pat)}
                icon={<Trash2 size={14} />}
                block
              >
                Delete Patient
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
