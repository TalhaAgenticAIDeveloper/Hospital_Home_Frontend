import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Stethoscope,
  User,
  Moon,
  Sun,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export function DashboardSidebar({
  roleTitle = 'Workspace',
  roleBadge = 'User',
  navItems = [],
  activeKey = '',
  onSelectNav = () => {},
  collapsed = false,
  onToggleCollapse = () => {},
  isMobileOpen = false,
  onCloseMobile = () => {},
  quickAction = null,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleTheme = () => {
    if (user?.role === 'saas_admin') {
      return {
        accent: '#6366f1',
        accentDark: '#4f46e5',
        accentLight: 'rgba(99, 102, 241, 0.15)',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        shadowColor: 'rgba(99, 102, 241, 0.35)',
        badgeClass: 'admin',
        portalName: 'Admin Suite',
      };
    }
    if (user?.role === 'doctor') {
      return {
        accent: '#0284c7',
        accentDark: '#0369a1',
        accentLight: 'rgba(2, 132, 199, 0.15)',
        gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
        shadowColor: 'rgba(2, 132, 199, 0.35)',
        badgeClass: 'doctor',
        portalName: 'Doctor Hub',
      };
    }
    return {
      accent: '#2563eb',
      accentDark: '#1d4ed8',
      accentLight: 'rgba(37, 99, 235, 0.15)',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      shadowColor: 'rgba(37, 99, 235, 0.35)',
      badgeClass: 'patient',
      portalName: 'Patient Portal',
    };
  };

  const roleTheme = getRoleTheme();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="dashboard-mobile-backdrop"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''} ${
          isMobileOpen ? 'mobile-open' : ''
        }`}
        aria-label="Sidebar Navigation"
      >
        {/* Sidebar Header / Brand */}
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={onCloseMobile}>
            <div className="sidebar-brand-icon">
              <Activity size={22} strokeWidth={2.5} />
            </div>
            {!collapsed && (
              <div className="sidebar-brand-text">
                <span className="brand-title">MedTrust<span style={{ color: roleTheme.accent }}>Pro</span></span>
                <span className="brand-subtitle">{roleTheme.portalName}</span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Button */}
          <button
            type="button"
            className="sidebar-collapse-btn desktop-only"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Workspace Pill / Role Indicator */}
        {!collapsed && (
          <div className="sidebar-workspace-chip">
            <div className="workspace-dot" style={{ background: roleTheme.accent }} />
            <div className="workspace-info">
              <span className="workspace-name">{roleTitle}</span>
              <span className="workspace-status">
                {user?.status === 'active' ? '● Verified & Active' : user?.status ? `● ${user.status.toUpperCase()}` : '● Connected'}
              </span>
            </div>
          </div>
        )}

        {/* Quick Action Button (if provided) */}
        {quickAction && !collapsed && (
          <div className="sidebar-quick-action">
            <button
              type="button"
              className="btn btn-quick-action"
              onClick={() => {
                quickAction.onClick();
                onCloseMobile();
              }}
              style={{
                background: roleTheme.gradient,
                boxShadow: `0 4px 14px ${roleTheme.shadowColor}`,
                color: '#ffffff',
              }}
            >
              {quickAction.icon}
              <span>{quickAction.label}</span>
            </button>
          </div>
        )}

        {/* Navigation Items List */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-group">
            {!collapsed && <span className="sidebar-nav-heading">Main Navigation</span>}
            <ul className="sidebar-nav-list">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeKey === item.key;
                return (
                  <li key={item.key} className="sidebar-nav-item-wrapper">
                    <button
                      type="button"
                      className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onSelectNav(item.key);
                        onCloseMobile();
                      }}
                      title={collapsed ? item.label : undefined}
                      style={{
                        '--item-accent': roleTheme.accent,
                      }}
                    >
                      <div className="sidebar-btn-icon">
                        <Icon size={19} />
                      </div>
                      {!collapsed && (
                        <span className="sidebar-btn-label">{item.label}</span>
                      )}
                      {!collapsed && item.badge !== undefined && item.badge !== null && (
                        <span
                          className={`sidebar-btn-badge ${item.badgeVariant || 'default'}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      {collapsed && item.badge > 0 && (
                        <span className="sidebar-mini-dot" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar" style={{ background: roleTheme.accentLight, color: roleTheme.accent }}>
              <User size={18} />
            </div>

            {!collapsed && (
              <div className="user-details">
                <span className="user-email" title={user?.email}>
                  {user?.email || 'User'}
                </span>
                <span className="user-role-badge">
                  {roleBadge}
                </span>
              </div>
            )}

            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={handleLogout}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
