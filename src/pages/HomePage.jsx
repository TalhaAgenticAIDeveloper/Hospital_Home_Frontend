import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Play,
  Star,
  Check,
  Video,
  Mic,
  Phone,
  Users,
  Stethoscope,
  FileText,
  Brain,
  BellRing,
  CalendarCheck,
  ClipboardList,
  HeartPulse,
  MessageCircle,
  CheckCircle2,
  Sparkles,
  Upload,
  Utensils,
  Clock,
  Bookmark,
  Bell,
} from 'lucide-react';

import heroDoctor from '../assets/home/hero-doctor.webp';
import patientImg from '../assets/home/patient-illustration.webp';
import doctorImg from '../assets/home/doctor-illustration.webp';
import robotImg from '../assets/home/ai-robot-mascot.webp';

export function HomePage() {
  const { isAuthenticated, isDoctor, isPatient, isAdmin } = useAuth();

  return (
    <div className="hp-page">

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="hp-hero">
        {/* Background decorative elements */}
        <div className="hp-hero-bg-dots" />
        <div className="hp-hero-bg-curve" />

        <div className="container hp-hero-grid">
          {/* Left Column — Text Content */}
          <div className="hp-hero-text">
            <h1 className="hp-hero-title">
              Smarter Healthcare<br />
              <span className="hp-hero-title-accent">With AI</span>
            </h1>

            <p className="hp-hero-subtitle">
              Book appointments, consult doctors, get AI-powered health insights, and stay on track with your health goals — all in one place.
            </p>

            <div className="hp-hero-actions">
              {!isAuthenticated ? (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg hp-hero-cta">
                    Get Started <ArrowRight size={18} />
                  </Link>
                  <button type="button" className="btn btn-secondary btn-lg hp-hero-video-btn">
                    <div className="hp-play-icon"><Play size={14} fill="currentColor" /></div>
                    Watch Video
                  </button>
                </>
              ) : (
                <>
                  {isPatient && (
                    <Link to="/patient/dashboard" className="btn btn-primary btn-lg hp-hero-cta">
                      Go to Patient Dashboard <ArrowRight size={18} />
                    </Link>
                  )}
                  {isDoctor && (
                    <Link to="/doctor/portal" className="btn btn-primary btn-lg hp-hero-cta">
                      Go to Doctor Portal <ArrowRight size={18} />
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin/dashboard" className="btn btn-primary btn-lg hp-hero-cta">
                      Open Admin Dashboard <ArrowRight size={18} />
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Social Proof */}
            <div className="hp-social-proof">
              <div className="hp-avatar-stack">
                <div className="hp-avatar" style={{ background: '#dbeafe' }}>👩</div>
                <div className="hp-avatar" style={{ background: '#fce7f3' }}>👨</div>
                <div className="hp-avatar" style={{ background: '#d1fae5' }}>👩‍⚕️</div>
                <div className="hp-avatar" style={{ background: '#fef3c7' }}>👨‍⚕️</div>
              </div>
              <div className="hp-social-text">
                <span className="hp-social-join">Join <strong>50,000+</strong> happy users</span>
                <div className="hp-stars">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Hero Image + Floating Cards */}
          <div className="hp-hero-visual">
            <div className="hp-hero-image-wrapper">
              <img
                src={heroDoctor}
                alt="Professional doctor ready to assist you"
                className="hp-hero-image"
              />

              {/* Floating Tooltip */}
              <div className="hp-floating-badge">
                <CheckCircle2 size={16} />
                <div>
                  <span>Better Care</span>
                  <span>Smarter Choices</span>
                  <span>Healthier You</span>
                </div>
              </div>

              {/* Floating Appointment Card */}
              <div className="hp-floating-card">
                <div className="hp-fc-header">
                  <CalendarCheck size={16} />
                  <span>Book Appointment</span>
                </div>
                <div className="hp-fc-body">
                  <Users size={20} className="hp-fc-icon" />
                  <p>Choose your doctor<br />and time</p>
                  <Link to="/signup" className="hp-fc-btn">Book Now</Link>
                </div>
              </div>

              {/* Action Icons Bar */}
              <div className="hp-action-bar">
                <button className="hp-action-icon hp-action-video" aria-label="Video Call"><Video size={18} /></button>
                <button className="hp-action-icon hp-action-mic" aria-label="Audio Call"><Mic size={18} /></button>
                <button className="hp-action-icon hp-action-phone" aria-label="Phone Call"><Phone size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 — WHO IS MEDIAI FOR?
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="hp-audience" id="patients">
        <div className="container">
          <div className="hp-section-header">
            <span className="hp-eyebrow">BUILT FOR EVERYONE</span>
            <h2 className="hp-section-title">Who is MediAI for?</h2>
            <p className="hp-section-desc">
              Whether you're a patient looking for better care or a doctor managing your patients, MediAI is here to help.
            </p>
          </div>

          <div className="hp-audience-grid" id="doctors">
            {/* For Patients Card */}
            <div className="hp-audience-card">
              <div className="hp-audience-card-inner">
                <div className="hp-audience-header">
                  <div className="hp-audience-icon hp-audience-icon-patient">
                    <Users size={22} />
                  </div>
                  <h3>For Patients</h3>
                </div>

                <ul className="hp-check-list">
                  <li><Check size={16} /> Book appointments with trusted doctors</li>
                  <li><Check size={16} /> Upload lab reports & get easy explanations</li>
                  <li><Check size={16} /> Create personalized health & nutrition plans</li>
                  <li><Check size={16} /> Get AI-powered reminders & follow-ups</li>
                </ul>

                <div className="hp-audience-img-wrap">
                  <img src={patientImg} alt="Patient using health app" className="hp-audience-img" />
                </div>

                <Link to="/signup" className="btn btn-primary hp-audience-btn">
                  Sign Up as Patient <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* For Doctors Card */}
            <div className="hp-audience-card">
              <div className="hp-audience-card-inner">
                <div className="hp-audience-header">
                  <div className="hp-audience-icon hp-audience-icon-doctor">
                    <Stethoscope size={22} />
                  </div>
                  <h3>For Doctors</h3>
                </div>

                <ul className="hp-check-list">
                  <li><Check size={16} /> Manage appointments & patient records</li>
                  <li><Check size={16} /> Access AI-powered insights</li>
                  <li><Check size={16} /> Get prescriptions & notes after calls</li>
                  <li><Check size={16} /> Provide better, data-driven care</li>
                </ul>

                <div className="hp-audience-img-wrap">
                  <img src={doctorImg} alt="Doctor reviewing patient data" className="hp-audience-img" />
                </div>

                <Link to="/signup" className="btn btn-primary hp-audience-btn">
                  Sign Up as Doctor <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 3 — AI FEATURES
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="hp-features" id="features">
        <div className="container">
          <div className="hp-features-header">
            <div>
              <span className="hp-eyebrow">POWERED BY AI</span>
              <h2 className="hp-section-title">
                Advanced AI Features for<br />a Healthier You
              </h2>
              <p className="hp-section-desc" style={{ textAlign: 'left', marginLeft: 0 }}>
                MediAI goes beyond appointments. Our AI features help you understand your health, plan better, and stay on track — every step of the way.
              </p>
              <Link to="/signup" className="btn btn-outline-primary hp-features-cta">
                Explore All Features <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="hp-features-grid">
            {/* Feature Card 1 — Lab Reports */}
            <div className="hp-feature-card">
              <h3 className="hp-feature-card-title">
                <Upload size={20} />
                Upload Lab Reports<br />& Get Simple Explanations
              </h3>
              <p className="hp-feature-card-desc">
                Upload your lab report and get easy-to-understand explanations, follow-up questions, and personalized advice like:
              </p>

              <ul className="hp-check-list hp-check-list-compact">
                <li><Check size={14} /> What you can eat</li>
                <li><Check size={14} /> What to avoid</li>
                <li><Check size={14} /> What the results mean</li>
                <li><Check size={14} /> Ask more questions if you're confused</li>
              </ul>

              {/* Mini Chat Preview */}
              <div className="hp-mini-chat">
                <div className="hp-mini-chat-row">
                  <div className="hp-mini-chat-icon">
                    <FileText size={16} />
                  </div>
                  <div className="hp-mini-chat-bubble">
                    <span className="hp-mini-chat-label">Lab Report</span>
                    <p>Your report looks normal for most values. However, your Vitamin D is low. Consider increasing sun exposure.</p>
                  </div>
                </div>
                <a href="#" className="hp-mini-chat-link">
                  <MessageCircle size={14} /> Ask a follow-up question
                </a>
              </div>
            </div>

            {/* Feature Card 2 — Health Plans */}
            <div className="hp-feature-card">
              <h3 className="hp-feature-card-title">
                <ClipboardList size={20} />
                Personalized Health Plans<br />& Smart Reminders
              </h3>
              <p className="hp-feature-card-desc">
                Set your goal (e.g. gain weight, lose weight, manage diabetes) and let AI create a plan for you. You can also:
              </p>

              <ul className="hp-check-list hp-check-list-compact">
                <li><Check size={14} /> Replace meals (if you have allergies)</li>
                <li><Check size={14} /> Change meal times (if you're busy)</li>
                <li><Check size={14} /> Save your plan in your profile</li>
                <li><Check size={14} /> Get timely notifications & reminders</li>
              </ul>

              {/* Mini Reminder Preview */}
              <div className="hp-mini-reminder">
                <div className="hp-mini-reminder-row">
                  <div className="hp-mini-reminder-icon">
                    <Bell size={18} />
                  </div>
                  <div className="hp-mini-reminder-body">
                    <span className="hp-mini-reminder-label">Reminder</span>
                    <span className="hp-mini-reminder-time">8:00 AM</span>
                  </div>
                </div>
                <p className="hp-mini-reminder-text">
                  It's time for your meal!<br />
                  <strong>High Protein Breakfast</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 4 — AI ASSISTANT CTA
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="hp-cta" id="about">
        <div className="container hp-cta-inner">
          {/* Left — Robot + Bullets */}
          <div className="hp-cta-left">
            <div className="hp-cta-robot-wrap">
              <img src={robotImg} alt="MediAI Assistant" className="hp-cta-robot" />
            </div>

            <div className="hp-cta-assistant-card">
              <div className="hp-cta-assistant-header">
                <Sparkles size={16} />
                <span>I'm your AI Health Assistant<br />— always here to help!</span>
              </div>
              <ul className="hp-check-list hp-check-list-compact">
                <li><Check size={14} /> Ask questions in simple language</li>
                <li><Check size={14} /> Get personalized recommendations</li>
                <li><Check size={14} /> Adjust plans anytime</li>
                <li><Check size={14} /> Stay informed with notifications</li>
              </ul>
            </div>
          </div>

          {/* Right — CTA Text */}
          <div className="hp-cta-right">
            <h2 className="hp-cta-title">
              Better Tools.<br />
              Better Decisions.<br />
              <span className="hp-cta-title-accent">Better Health.</span>
            </h2>
            <p className="hp-cta-desc">
              <HeartPulse size={18} className="hp-cta-heart" /> Your health journey, powered by AI.
            </p>
            {!isAuthenticated && (
              <Link to="/signup" className="btn btn-primary btn-lg hp-hero-cta">
                Get Started <ArrowRight size={18} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 5 — FOOTER
      ══════════════════════════════════════════════════════════════════════ */}
      <footer className="hp-footer">
        <div className="container">
          <div className="hp-footer-top">
            {/* Brand */}
            <div className="hp-footer-brand">
              <Link to="/" className="hp-footer-logo">
                <div className="nav-brand-icon">
                  <HeartPulse size={20} strokeWidth={2.5} />
                </div>
                <div className="nav-brand-text-wrap">
                  <span className="nav-brand-text">
                    Medi<span className="brand-accent">AI</span>
                  </span>
                  <span className="nav-brand-subtitle">Your Health, Our Priority</span>
                </div>
              </Link>
            </div>

            {/* Nav Links */}
            <div className="hp-footer-links">
              <Link to="/">Home</Link>
              <Link to="/for-patients">For Patients</Link>
              <Link to="/for-doctors">For Doctors</Link>
              <Link to="/features">Features</Link>
              <Link to="/about">About</Link>
            </div>

            {/* Social Icons */}
            <div className="hp-footer-social">
              <a href="#" aria-label="Facebook" className="hp-social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="hp-social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="X (Twitter)" className="hp-social-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="hp-social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z"/></svg>
              </a>
            </div>
          </div>

          <div className="hp-footer-bottom">
            <p>© {new Date().getFullYear()} MediAI. All rights reserved.</p>
            <div className="hp-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
