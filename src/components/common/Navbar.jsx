import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from './Badge';
import {
  Activity,
  LogOut,
  ShieldCheck,
  Stethoscope,
  LayoutDashboard,
  Menu,
  X,
} from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, isDoctor, isPatient, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);
  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <Activity size={26} strokeWidth={2.5} />
          <span>MedTrust<span style={{ color: 'var(--accent)' }}>SaaS</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="nav-links desktop-nav">
          {!isAuthenticated ? (
            <>
              <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                Home
              </Link>
              <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`}>
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Register Account
              </Link>
              <Link
                to="/admin/login"
                className={`nav-link ${isActive('/admin/login') ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}
              >
                <ShieldCheck size={16} />
                Admin Portal
              </Link>
            </>
          ) : (
            <>
              {isPatient && (
                <Link
                  to="/patient/dashboard"
                  className={`nav-link ${isActive('/patient/dashboard') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <LayoutDashboard size={18} />
                  Patient Dashboard
                </Link>
              )}

              {isDoctor && (
                <Link
                  to="/doctor/portal"
                  className={`nav-link ${isActive('/doctor/portal') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Stethoscope size={18} />
                  Doctor Verification Portal
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ShieldCheck size={18} />
                  Admin Review Queue
                </Link>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '0.75rem', borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user?.email}
                  </span>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '2px' }}>
                    <Badge role={user?.role} />
                    {user?.status && user?.role !== 'saas_admin' && (
                      <Badge status={user?.status} />
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-sm"
                  title="Sign Out"
                  style={{ padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          )}
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav animate-fade-in">
          <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem 1.25rem 1.5rem' }}>
            {!isAuthenticated ? (
              <>
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeMenu}>
                  Home
                </Link>
                <Link to="/login" className={`nav-link ${isActive('/login') ? 'active' : ''}`} onClick={closeMenu}>
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary btn-block" onClick={closeMenu}>
                  Register Account
                </Link>
                <Link
                  to="/admin/login"
                  className={`nav-link ${isActive('/admin/login') ? 'active' : ''}`}
                  onClick={closeMenu}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}
                >
                  <ShieldCheck size={16} />
                  Admin Portal
                </Link>
              </>
            ) : (
              <>
                <div style={{ padding: '0.75rem', background: 'var(--bg-alt)', borderRadius: 'var(--radius-md)', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                    {user?.email}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    <Badge role={user?.role} />
                    {user?.status && user?.role !== 'saas_admin' && (
                      <Badge status={user?.status} />
                    )}
                  </div>
                </div>

                {isPatient && (
                  <Link
                    to="/patient/dashboard"
                    className={`nav-link ${isActive('/patient/dashboard') ? 'active' : ''}`}
                    onClick={closeMenu}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <LayoutDashboard size={18} />
                    Patient Dashboard
                  </Link>
                )}

                {isDoctor && (
                  <Link
                    to="/doctor/portal"
                    className={`nav-link ${isActive('/doctor/portal') ? 'active' : ''}`}
                    onClick={closeMenu}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <Stethoscope size={18} />
                    Doctor Verification Portal
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
                    onClick={closeMenu}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <ShieldCheck size={18} />
                    Admin Review Queue
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-block"
                  style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <LogOut size={16} />
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
