import React, { useState, useEffect } from 'react';
import { adminApi } from '../../src/api/admin';
import { PendingDoctorsTable } from '../components/admin/PendingDoctorsTable';
import { DeleteConfirmationModal } from '../components/admin/DeleteConfirmationModal';
import { Toast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import {
  ShieldCheck,
  RefreshCw,
  Users,
  FileCheck2,
  CheckCircle2,
  AlertOctagon,
  Search,
  X,
} from 'lucide-react';

export function AdminDashboardPage() {
  const [doctors, setDoctors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ total: 0, pending: 0, active: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Deletion modal state
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDoctors = async (searchOverride) => {
    setIsLoading(true);
    try {
      const search = searchOverride !== undefined ? searchOverride : searchQuery;
      const data = await adminApi.listDoctors({
        status: activeTab,
        search: search,
      });
      setDoctors(data.items || []);
      setTotalCount(data.total || 0);
      setStatusCounts(data.status_counts || { total: 0, pending: 0, active: 0, rejected: 0 });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load doctors.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDoctors();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadDoctors('');
  };

  const handleDeleteClick = (doctor) => {
    setDoctorToDelete(doctor);
  };

  const handleConfirmDelete = async () => {
    if (!doctorToDelete) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteDoctor(doctorToDelete.user_id);
      setToast({
        type: 'success',
        message: `Dr. ${doctorToDelete.full_name || doctorToDelete.email} was successfully deleted.`,
      });
      setDoctorToDelete(null);
      await loadDoctors();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete doctor account.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All Doctors', count: statusCounts.total, icon: Users },
    { key: 'pending', label: 'Pending Review', count: statusCounts.pending, icon: FileCheck2 },
    { key: 'active', label: 'Verified & Active', count: statusCounts.active, icon: CheckCircle2 },
    { key: 'rejected', label: 'Revision / Rejected', count: statusCounts.rejected, icon: AlertOctagon },
  ];

  return (
    <div className="container page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.6rem', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 'var(--radius-md)' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem' }}>SaaS Admin Control Center</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Doctor Credential Verification & Directory Management
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => loadDoctors()}
          loading={isLoading}
          icon={<RefreshCw size={14} />}
        >
          Refresh Directory
        </Button>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Metrics Row */}
      <div className="admin-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
        <div
          className="card"
          style={{ cursor: 'pointer', borderLeft: `4px solid ${activeTab === 'all' ? 'var(--primary)' : 'var(--border-color)'}` }}
          onClick={() => setActiveTab('all')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Doctors</span>
            <Users size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
            {statusCounts.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered providers</div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer', borderLeft: `4px solid ${activeTab === 'pending' ? 'var(--status-pending)' : 'var(--border-color)'}` }}
          onClick={() => setActiveTab('pending')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--status-pending-text)', textTransform: 'uppercase', fontWeight: 700 }}>Awaiting Review</span>
            <FileCheck2 size={20} color="var(--status-pending)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--status-pending-text)', marginTop: '0.25rem' }}>
            {statusCounts.pending}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Needs admin action</div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer', borderLeft: `4px solid ${activeTab === 'active' ? 'var(--status-active)' : 'var(--border-color)'}` }}
          onClick={() => setActiveTab('active')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--status-active-text)', textTransform: 'uppercase', fontWeight: 700 }}>Verified & Active</span>
            <CheckCircle2 size={20} color="var(--status-active)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--status-active-text)', marginTop: '0.25rem' }}>
            {statusCounts.active}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved providers</div>
        </div>

        <div
          className="card"
          style={{ cursor: 'pointer', borderLeft: `4px solid ${activeTab === 'rejected' ? 'var(--status-rejected)' : 'var(--border-color)'}` }}
          onClick={() => setActiveTab('rejected')}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--status-rejected-text)', textTransform: 'uppercase', fontWeight: 700 }}>Rejected / Revising</span>
            <AlertOctagon size={20} color="var(--status-rejected)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--status-rejected-text)', marginTop: '0.25rem' }}>
            {statusCounts.rejected}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Feedback provided</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Tabs */}
          <div className="admin-tabs" style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`admin-tab-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.5rem 0.9rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                    background: isActive ? 'var(--primary-light)' : 'transparent',
                    color: isActive ? 'var(--primary-hover)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 150ms ease',
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                  <span
                    style={{
                      background: isActive ? 'var(--primary)' : 'var(--bg-alt)',
                      color: isActive ? '#ffffff' : 'var(--text-muted)',
                      padding: '0.1rem 0.45rem',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      marginLeft: '0.2rem',
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 260px', maxWidth: '360px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.25rem', paddingRight: searchQuery ? '2rem' : '0.75rem', height: '38px', fontSize: '0.85rem' }}
                placeholder="Search name, email, license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Doctors Table Queue */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
            {activeTab === 'all' && 'All Doctors Directory'}
            {activeTab === 'pending' && 'Pending Verification Queue'}
            {activeTab === 'active' && 'Verified Active Doctors'}
            {activeTab === 'rejected' && 'Applications Under Revision'}
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500, marginLeft: '0.5rem' }}>
              ({totalCount} {totalCount === 1 ? 'doctor' : 'doctors'})
            </span>
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Click Inspect to view all uploaded files & info, or Delete to remove doctor.
          </span>
        </div>

        <PendingDoctorsTable
          doctors={doctors}
          isLoading={isLoading}
          onDeleteDoctor={handleDeleteClick}
          emptyMessage={
            searchQuery
              ? `No doctors found matching "${searchQuery}". Try clearing search.`
              : activeTab === 'pending'
              ? 'No pending applications waiting for review.'
              : activeTab === 'active'
              ? 'No verified active doctors yet.'
              : activeTab === 'rejected'
              ? 'No rejected doctor applications.'
              : 'No doctors registered in the system.'
          }
        />
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!doctorToDelete}
        onClose={() => setDoctorToDelete(null)}
        onConfirm={handleConfirmDelete}
        doctorName={doctorToDelete?.full_name}
        doctorEmail={doctorToDelete?.email}
        isDeleting={isDeleting}
      />
    </div>
  );
}
