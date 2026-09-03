import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertTriangle, Shield, User } from 'lucide-react';

export function Badge({ status, role, children, className = '' }) {
  if (role) {
    const roleLabels = {
      patient: 'Patient',
      doctor: 'Doctor',
      saas_admin: 'SaaS Admin',
    };
    return (
      <span className={`badge badge-role ${className}`}>
        <User size={12} />
        {roleLabels[role] || role}
      </span>
    );
  }

  const statusConfig = {
    active: {
      label: 'Active / Approved',
      class: 'badge-active',
      icon: <CheckCircle2 size={12} />,
    },
    pending: {
      label: 'Pending Review',
      class: 'badge-pending',
      icon: <Clock size={12} />,
    },
    rejected: {
      label: 'Rejected',
      class: 'badge-rejected',
      icon: <XCircle size={12} />,
    },
    suspended: {
      label: 'Suspended',
      class: 'badge-suspended',
      icon: <AlertTriangle size={12} />,
    },
  };

  const config = statusConfig[status] || {
    label: status || 'Unknown',
    class: 'badge-suspended',
    icon: <Shield size={12} />,
  };

  return (
    <span className={`badge ${config.class} ${className}`}>
      {config.icon}
      {children || config.label}
    </span>
  );
}
