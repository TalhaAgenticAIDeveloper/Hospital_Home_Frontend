import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  ShieldCheck,
  Bell,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export function DashboardLayout({
  roleTitle = 'Dashboard',
  roleBadge = 'User',
  navItems = [],
  activeKey = '',
  onSelectNav = () => {},
  pageTitle = 'Dashboard',
  pageSubtitle = '',
  headerActions = null,
  quickAction = null,
  children,
}) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('medtrust_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('medtrust_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  // Close mobile sidebar on window resize if resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 992) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`dashboard-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left Sidebar */}
      <DashboardSidebar
        roleTitle={roleTitle}
        roleBadge={roleBadge}
        navItems={navItems}
        activeKey={activeKey}
        onSelectNav={onSelectNav}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        quickAction={quickAction}
      />

      {/* Main Body (Top bar + Viewport) */}
      <div className="dashboard-main-wrap">
        {/* Top Header Bar */}
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-mobile-toggle mobile-only"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open Navigation"
            >
              <Menu size={20} />
            </button>

            <h1 className="topbar-title">{pageTitle}</h1>
          </div>

          <div className="topbar-right">
            {headerActions && (
              <div className="topbar-actions">
                {headerActions}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="dashboard-main-content">
          <div className="dashboard-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
