import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Stethoscope, Lock, FileCheck2, ArrowRight } from 'lucide-react';

export function HomePage() {
  const { isAuthenticated, isDoctor, isPatient, isAdmin } = useAuth();

  return (
    <div className="container page-wrapper">
      <section className="hero-section animate-fade-in">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary-hover)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.5rem' }}>
          <ShieldCheck size={16} />
          Enterprise-Grade Healthcare Authentication & Onboarding
        </div>

        <h1 className="hero-title">
          Secure Identity & Verification for <span>Modern Healthcare</span>
        </h1>

        <p className="hero-subtitle">
          Engineered with Argon2id password security, short-lived JWTs with refresh token rotation, structured doctor credential verification, and administrative audit workflows.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {!isAuthenticated ? (
            <>
              <Link to="/signup" className="btn btn-primary btn-lg">
                Create Account <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In to Platform
              </Link>
            </>
          ) : (
            <>
              {isPatient && (
                <Link to="/patient/dashboard" className="btn btn-primary btn-lg">
                  Go to Patient Dashboard <ArrowRight size={18} />
                </Link>
              )}
              {isDoctor && (
                <Link to="/doctor/portal" className="btn btn-primary btn-lg">
                  Go to Doctor Verification Portal <ArrowRight size={18} />
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" className="btn btn-primary btn-lg">
                  Open Admin Review Queue <ArrowRight size={18} />
                </Link>
              )}
            </>
          )}
        </div>
      </section>

      {/* Feature Architecture Cards */}
      <section style={{ marginTop: '3rem' }}>
        <div className="grid-cards">
          <div className="card">
            <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Lock size={24} />
            </div>
            <h3>Argon2id & JWT Auth</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Stateless short-lived access tokens backed by SHA-256 hashed refresh token rotation, anti-theft revocation, and timing-safe authentication.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '48px', height: '48px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Stethoscope size={24} />
            </div>
            <h3>Doctor Verification Flow</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              Doctors register in pending state, complete clinical profile information, upload license and degree credentials (PDF/Image), and submit for verification.
            </p>
          </div>

          <div className="card">
            <div style={{ width: '48px', height: '48px', background: '#fef3c7', color: '#d97706', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <FileCheck2 size={24} />
            </div>
            <h3>SaaS Admin Review & Feedback</h3>
            <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
              SaaS Admins inspect pending doctor applications, approve verified providers, or reject with concrete feedback reasons so doctors can correct documents and re-submit.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
