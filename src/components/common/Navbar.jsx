import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  LogOut,
  LayoutDashboard,
  User,
  ArrowRight,
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

  // Compute dashboard destination based on user role
  const getDashboardPath = () => {
    if (isDoctor) return '/doctor/portal';
    if (isAdmin) return '/admin/dashboard';
    return '/patient/dashboard';
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'SaaS Admin';
    if (isDoctor) return 'Doctor';
    return 'Patient';
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="nav-brand" onClick={closeMenu}>
          <div className="nav-brand-icon">
            <Activity size={22} strokeWidth={2.5} />
          </div>
          <span className="nav-brand-text">
            MedTrust<span className="brand-accent">Pro</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {!isAuthenticated ? (
            <div className="nav-auth-actions">
              <Link to="/login" className="nav-link">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm nav-cta-btn">
                <span>Get Started</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="nav-user-actions">
              {/* Single direct link to user's dashboard */}
              <Link
                to={getDashboardPath()}
                className="btn btn-primary btn-sm nav-dashboard-btn"
              >
                <LayoutDashboard size={16} />
                <span>Open Dashboard</span>
              </Link>

              {/* Minimalist User Pill */}
              <div className="nav-user-pill">
                <div className="nav-user-avatar">
                  <User size={15} />
                </div>
                <div className="nav-user-meta">
                  <span className="nav-user-email" title={user?.email}>
                    {user?.email}
                  </span>
                  <span className="nav-user-role">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>

              {/* Clean Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="nav-logout-btn"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Toggle Button */}
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Dropdown Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav animate-fade-in">
          <div className="container mobile-nav-inner">
            {!isAuthenticated ? (
              <div className="mobile-auth-links">
                <Link
                  to="/login"
                  className="btn btn-secondary btn-block"
                  onClick={closeMenu}
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="btn btn-primary btn-block"
                  onClick={closeMenu}
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="mobile-user-panel">
                <div className="mobile-user-card">
                  <div className="nav-user-avatar">
                    <User size={16} />
                  </div>
                  <div className="nav-user-meta">
                    <span className="nav-user-email">{user?.email}</span>
                    <span className="nav-user-role">{getRoleLabel()}</span>
                  </div>
                </div>

                <Link
                  to={getDashboardPath()}
                  className="btn btn-primary btn-block"
                  onClick={closeMenu}
                >
                  <LayoutDashboard size={17} />
                  <span>Open Dashboard</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary btn-block"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
