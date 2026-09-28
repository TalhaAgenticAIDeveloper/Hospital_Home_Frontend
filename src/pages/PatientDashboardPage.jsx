import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { Button } from '../components/common/Button';
import { DoctorDirectory } from '../components/patient/DoctorDirectory';
import { PatientMeetingsList } from '../components/patient/PatientMeetingsList';
import { PatientDocumentsManager } from '../components/patient/PatientDocumentsManager';
import { PatientProfileEditor } from '../components/patient/PatientProfileEditor';
import { PatientPrescriptionsList } from '../components/patient/PatientPrescriptionsList';
import { ReportExplainer } from '../components/patient/report_explainer/ReportExplainer';
import { PlanMaker } from '../components/patient/plan_maker/PlanMaker';
import { ConsultationHistory } from '../components/patient/ConsultationHistory';
import {
  Video,
  Stethoscope,
  FolderOpen,
  PlusCircle,
  UserCheck,
  AlertCircle,
  ArrowRight,
  Pill,
  Sparkles,
  HeartPulse,
  ClipboardList,
} from 'lucide-react';

const VALID_TABS = ['book', 'appointments', 'prescriptions', 'history', 'documents', 'reports', 'plans', 'profile'];

export function PatientDashboardPage() {
  const { user } = useAuth();
  const { section } = useParams();
  const navigate = useNavigate();

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Active tab strictly follows URL section; defaults to 'book'
  const activeTab = VALID_TABS.includes(section) ? section : 'book';

  // Redirect if section is invalid or removed
  useEffect(() => {
    if (section && !VALID_TABS.includes(section)) {
      navigate('/patient/dashboard/book', { replace: true });
    }
  }, [section, navigate]);

  const handleMeetingBooked = () => {
    setRefreshTrigger((prev) => prev + 1);
    navigate('/patient/dashboard/appointments');
  };

  const navItems = [
    { key: 'book', label: 'Find & Book Doctors', icon: Stethoscope },
    { key: 'appointments', label: 'My Consultations', icon: Video },
    { key: 'prescriptions', label: 'My Prescriptions', icon: Pill },
    { key: 'history', label: 'Visit History', icon: ClipboardList },
    { key: 'documents', label: 'Medical Records', icon: FolderOpen },
    { key: 'reports', label: 'AI Report Explainer', icon: Sparkles },
    { key: 'plans', label: 'AI Wellness Plan', icon: HeartPulse, badge: 'AI', badgeVariant: 'success' },
    { key: 'profile', label: 'My Health Profile', icon: UserCheck },
  ];

  const getPageMeta = () => {
    switch (activeTab) {
      case 'appointments':
        return { title: 'My Consultations' };
      case 'prescriptions':
        return { title: 'My Prescriptions' };
      case 'history':
        return { title: 'Visit History' };
      case 'documents':
        return { title: 'Medical Records' };
      case 'reports':
        return { title: 'AI Medical Report Explainer' };
      case 'plans':
        return { title: 'AI Health & Wellness Plan' };
      case 'profile':
        return { title: 'My Health Profile' };
      case 'book':
      default:
        return { title: 'Find Doctors' };
    }
  };

  const meta = getPageMeta();
  const isProfileIncomplete = user?.patient_profile && !user?.patient_profile?.is_completed;

  return (
    <DashboardLayout
      roleTitle="Patient Portal"
      roleBadge="Verified Patient"
      navItems={navItems}
      activeKey={activeTab}
      onSelectNav={(key) => navigate(`/patient/dashboard/${key}`)}
      pageTitle={meta.title}
      quickAction={{
        label: 'Book Doctor',
        icon: <Stethoscope size={16} />,
        onClick: () => navigate('/patient/dashboard/book'),
      }}
      headerActions={
        activeTab !== 'book' ? (
          <Button
            variant="primary"
            size="sm"
            icon={<PlusCircle size={15} />}
            onClick={() => navigate('/patient/dashboard/book')}
          >
            Book New
          </Button>
        ) : null
      }
    >
      {/* ── Incomplete Profile Alert Banner ── */}
      {isProfileIncomplete && activeTab !== 'profile' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1.25rem',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={18} color="var(--status-pending)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>
              Your baseline health profile is incomplete. Adding your details helps attending doctors provide safer, personalized care.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            icon={<ArrowRight size={14} />}
            onClick={() => navigate('/patient/dashboard/profile')}
            style={{ flexShrink: 0 }}
          >
            Complete Profile
          </Button>
        </div>
      )}

      {/* ── Tab Content: Book Consultation (Doctor Directory) ── */}
      {activeTab === 'book' && (
        <DoctorDirectory onMeetingBooked={handleMeetingBooked} />
      )}

      {/* ── Tab Content: Scheduled Consultations ── */}
      {activeTab === 'appointments' && (
        <PatientMeetingsList refreshTrigger={refreshTrigger} />
      )}

      {/* ── Tab Content: Prescriptions ── */}
      {activeTab === 'prescriptions' && (
        <PatientPrescriptionsList />
      )}

      {/* ── Tab Content: Visit History ── */}
      {activeTab === 'history' && (
        <ConsultationHistory />
      )}

      {/* ── Tab Content: Medical Documents Manager ── */}
      {activeTab === 'documents' && (
        <PatientDocumentsManager />
      )}

      {/* ── Tab Content: AI Medical Report Explainer (Patient Only) ── */}
      {activeTab === 'reports' && (
        <ReportExplainer />
      )}

      {/* ── Tab Content: AI Health & Wellness Plan Maker ── */}
      {activeTab === 'plans' && (
        <PlanMaker />
      )}

      {/* ── Tab Content: Patient Profile Editor ── */}
      {activeTab === 'profile' && (
        <PatientProfileEditor />
      )}
    </DashboardLayout>
  );
}
