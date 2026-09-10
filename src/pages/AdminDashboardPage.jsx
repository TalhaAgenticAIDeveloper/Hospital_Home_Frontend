import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '../../src/api/admin';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { PendingDoctorsTable } from '../components/admin/PendingDoctorsTable';
import { DeleteConfirmationModal } from '../components/admin/DeleteConfirmationModal';
import { Toast } from '../components/common/Toast';
import { Button } from '../components/common/Button';
import {
  ShieldCheck,
  Users,
  FileCheck2,
  CheckCircle2,
  AlertOctagon,
  Search,
  X,
  UserPlus,
  Shield,
  Filter,
} from 'lucide-react';

const VALID_TABS = ['pending', 'active', 'rejected', 'all'];

export function AdminDashboardPage() {
  const { section } = useParams();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState({ total: 0, pending: 0, active: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Active tab strictly follows URL section
  const activeTab = VALID_TABS.includes(section) ? section : 'pending';

  // Redirect if section is invalid or missing
  useEffect(() => {
    if (section && !VALID_TABS.includes(section)) {
      navigate('/admin/dashboard/pending', { replace: true });
    }
  }, [section, navigate]);

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
      setStatusCounts(data.status_counts || data.counts || { total: 0, pending: 0, active: 0, rejected: 0 });
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

  const navItems = [
    {
      key: 'pending',
      label: 'Pending Verification',
      icon: FileCheck2,
      badge: statusCounts.pending > 0 ? statusCounts.pending : null,
      badgeVariant: 'warning',
    },
    {
      key: 'active',
      label: 'Verified & Active',
      icon: CheckCircle2,
      badge: statusCounts.active > 0 ? statusCounts.active : null,
      badgeVariant: 'success',
    },
    {
      key: 'rejected',
      label: 'Revision / Rejected',
      icon: AlertOctagon,
      badge: statusCounts.rejected > 0 ? statusCounts.rejected : null,
      badgeVariant: 'danger',
    },
    {
      key: 'all',
      label: 'All Registered Doctors',
      icon: Users,
      badge: statusCounts.total > 0 ? statusCounts.total : null,
    },
  ];

  const getPageMeta = () => {
    switch (activeTab) {
      case 'pending':
        return { title: 'Pending Verification Queue' };
      case 'active':
        return { title: 'Verified Active Doctors' };
      case 'rejected':
        return { title: 'Revision Queue' };
      case 'all':
      default:
        return { title: 'All Registered Doctors' };
    }
  };

  const meta = getPageMeta();

  return (
    <DashboardLayout
      roleTitle="Admin Suite"
      roleBadge="SaaS Administrator"
      navItems={navItems}
      activeKey={activeTab}
      onSelectNav={(key) => navigate(`/admin/dashboard/${key}`)}
      pageTitle={meta.title}
    >
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* KPI Stats Row */}
      <div className="dash-stat-grid">
        <div
          className={`dash-stat-card clickable ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => navigate('/admin/dashboard/pending')}
        >
          <div className="dash-stat-content">
            <span className="dash-stat-title" style={{ color: 'var(--status-pending-text)' }}>
              Awaiting Review
            </span>
            <span className="dash-stat-number" style={{ color: 'var(--status-pending-text)' }}>
              {statusCounts.pending}
            </span>
            <span className="dash-stat-subtitle">Needs immediate admin action</span>
          </div>
          <div className="dash-stat-icon" style={{ background: 'var(--status-pending-bg)', color: 'var(--status-pending)' }}>
            <FileCheck2 size={24} />
          </div>
        </div>

        <div
          className={`dash-stat-card clickable ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => navigate('/admin/dashboard/active')}
        >
          <div className="dash-stat-content">
            <span className="dash-stat-title" style={{ color: 'var(--status-active-text)' }}>
              Verified & Active
            </span>
            <span className="dash-stat-number" style={{ color: 'var(--status-active-text)' }}>
              {statusCounts.active}
            </span>
            <span className="dash-stat-subtitle">Approved practicing clinicians</span>
          </div>
          <div className="dash-stat-icon" style={{ background: 'var(--status-active-bg)', color: 'var(--status-active)' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div
          className={`dash-stat-card clickable ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => navigate('/admin/dashboard/rejected')}
        >
          <div className="dash-stat-content">
            <span className="dash-stat-title" style={{ color: 'var(--status-rejected-text)' }}>
              Revision Required
            </span>
            <span className="dash-stat-number" style={{ color: 'var(--status-rejected-text)' }}>
              {statusCounts.rejected}
            </span>
            <span className="dash-stat-subtitle">Feedback sent to doctor</span>
          </div>
          <div className="dash-stat-icon" style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected)' }}>
            <AlertOctagon size={24} />
          </div>
        </div>

        <div
          className={`dash-stat-card clickable ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => navigate('/admin/dashboard/all')}
        >
          <div className="dash-stat-content">
            <span className="dash-stat-title">Total Registered</span>
            <span className="dash-stat-number">
              {statusCounts.total}
            </span>
            <span className="dash-stat-subtitle">Total provider accounts</span>
          </div>
          <div className="dash-stat-icon" style={{ background: 'var(--bg-alt)', color: 'var(--text-secondary)' }}>
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Table Control Header (Search Bar & Filter Indicator) */}
      <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Filter size={17} color="var(--primary)" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {activeTab === 'pending' && 'Pending Verification Queue'}
              {activeTab === 'active' && 'Verified Active Providers'}
              {activeTab === 'rejected' && 'Applications Needing Revision'}
              {activeTab === 'all' && 'All Registered Doctors'}
            </span>
            <span
              style={{
                fontSize: '0.78rem',
                padding: '0.15rem 0.6rem',
                background: 'var(--bg-alt)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
              }}
            >
              {totalCount} {totalCount === 1 ? 'record' : 'records'}
            </span>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px', maxWidth: '380px' }}>
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
                  aria-label="Clear Search"
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

      {/* Pending Doctors Table Queue */}
      <PendingDoctorsTable
        doctors={doctors}
        isLoading={isLoading}
        onDeleteDoctor={handleDeleteClick}
        emptyMessage={
          searchQuery
            ? `No doctors found matching "${searchQuery}". Try clearing search.`
            : activeTab === 'pending'
            ? 'No pending applications waiting for review. All caught up!'
            : activeTab === 'active'
            ? 'No verified active doctors registered yet.'
            : activeTab === 'rejected'
            ? 'No rejected doctor applications.'
            : 'No doctors registered in the system.'
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!doctorToDelete}
        onClose={() => setDoctorToDelete(null)}
        onConfirm={handleConfirmDelete}
        doctorName={doctorToDelete?.full_name}
        doctorEmail={doctorToDelete?.email}
        isDeleting={isDeleting}
      />
    </DashboardLayout>
  );
}
