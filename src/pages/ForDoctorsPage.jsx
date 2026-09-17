import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  CalendarCheck,
  Calendar,
  Users,
  FileText,
  Pill,
  Star,
  Check,
  Upload,
  TrendingUp,
  Sparkles,
  HeartPulse,
  Video,
  Clock,
  ChevronRight,
  Bot,
  Zap,
  MoreVertical,
  CheckCircle2,
  Award,
  FolderOpen,
  ShieldCheck,
  Activity,
  Edit3,
  Search,
  CheckCheck,
  FileCheck,
  AlertCircle,
  X,
  Stethoscope,
  ThumbsUp,
} from 'lucide-react';

import doctorHeroImg from '../assets/doctor-male-hero.jpg';
import robotImg from '../assets/ai-robot-mascot.jpg';
import doctorAvatar1 from '../assets/doctor-avatar-1.jpg';
import doctorAvatar2 from '../assets/doctor-avatar-2.jpg';
import doctorAvatar3 from '../assets/doctor-avatar-3.jpg';

/* ── Mock Data matching the design ────────────────────────────────────────── */
const APPOINTMENTS = [
  {
    id: 1,
    time: '09:00 AM',
    patient: 'Sarah Khan',
    type: 'General Checkup',
    status: 'In Progress',
    statusColor: '#10b981',
    avatar: doctorAvatar1,
    canJoin: true,
    reportAvailable: true,
    reportName: 'CBC & Lipid Profile.pdf',
    reportSummary: 'Mild iron deficiency detected (Hb: 11.2 g/dL). Normal cholesterol & lipid ratios. Liver function markers normal.',
  },
  {
    id: 2,
    time: '10:30 AM',
    patient: 'Ali Raza',
    type: 'Follow Up',
    status: 'Upcoming',
    statusColor: '#2563eb',
    avatar: doctorAvatar2,
    canJoin: false,
    reportAvailable: true,
    reportName: 'Fasting Blood Glucose.pdf',
    reportSummary: 'HbA1c 6.2% (Prediabetes range). Fasting glucose 118 mg/dL. Renal panel within normal limits.',
  },
  {
    id: 3,
    time: '12:00 PM',
    patient: 'Ayesha Malik',
    type: 'Diabetes Consultation',
    status: 'Upcoming',
    statusColor: '#2563eb',
    avatar: doctorAvatar3,
    canJoin: false,
    reportAvailable: false,
  },
  {
    id: 4,
    time: '02:30 PM',
    patient: 'Usman Tariq',
    type: 'Skin Rash',
    status: 'Upcoming',
    statusColor: '#2563eb',
    avatar: doctorAvatar2,
    canJoin: false,
    reportAvailable: false,
  },
  {
    id: 5,
    time: '04:00 PM',
    patient: 'Fatima Noor',
    type: 'Lab Report Review',
    status: 'Upcoming',
    statusColor: '#2563eb',
    avatar: doctorAvatar1,
    canJoin: false,
    reportAvailable: true,
    reportName: 'Thyroid Profile (TSH).pdf',
    reportSummary: 'TSH elevated at 5.8 mIU/L (Mild subclinical hypothyroidism). Free T3 and T4 within baseline.',
  },
];

const RECENT_PATIENTS = [
  {
    id: 1,
    name: 'Sarah Khan',
    condition: 'General Checkup',
    lastVisit: 'Today, 09:00 AM',
    avatar: doctorAvatar1,
    rankingGiven: 5.0,
    feedback: 'Excellent doctor! Very attentive and explained the AI lab report clearly.',
  },
  {
    id: 2,
    name: 'Ali Raza',
    condition: 'Diabetes Consultation',
    lastVisit: 'Yesterday, 11:20 AM',
    avatar: doctorAvatar2,
    rankingGiven: 5.0,
    feedback: 'Auto prescription saved so much time. Clear dosage instructions.',
  },
  {
    id: 3,
    name: 'Ayesha Malik',
    condition: 'Follow Up',
    lastVisit: 'Apr 22, 2025',
    avatar: doctorAvatar3,
    rankingGiven: 4.8,
    feedback: 'Compassionate care and prompt digital follow up.',
  },
  {
    id: 4,
    name: 'Usman Tariq',
    condition: 'Skin Rash',
    lastVisit: 'Apr 20, 2025',
    avatar: doctorAvatar2,
    rankingGiven: 4.9,
    feedback: 'Accurate diagnosis and wonderful experience.',
  },
  {
    id: 5,
    name: 'Fatima Noor',
    condition: 'Lab Report Review',
    lastVisit: 'Apr 18, 2025',
    avatar: doctorAvatar1,
    rankingGiven: 5.0,
    feedback: 'Dr. Ahmed is simply the best in cardiology.',
  },
];

export function ForDoctorsPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeModal, setActiveModal] = useState(null); // 'summary' | 'rx' | 'rank' | null

  // Greeting name
  const doctorName = user?.name || 'Dr. Ahmed Khan';
  const doctorSpecialty = 'Cardiologist';

  return (
    <div className="fd-page">

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fd-hero">
        <div className="fd-hero-bg-dots" />
        <div className="fd-hero-bg-glow" />

        <div className="container fd-hero-grid">
          {/* Left Column — Text & Stats */}
          <div className="fd-hero-left">
            <span className="fd-hero-greeting">Good Morning, {doctorName.split(' ')[0] || 'Dr. Ahmed'}!</span>
            <h1 className="fd-hero-title">
              Better Care<br />
              <span className="fd-hero-title-accent">Through Smarter Tools</span>
            </h1>
            <p className="fd-hero-subtitle">
              Manage your patients, conduct consultations, and use AI-powered tools to provide personalized, smarter and faster care.
            </p>

            {/* 4 Stat Badges in Horizontal Row */}
            <div className="fd-hero-stats">
              <div className="fd-stat-card">
                <div className="fd-stat-icon-wrap">
                  <CalendarCheck size={18} />
                </div>
                <div className="fd-stat-info">
                  <span className="fd-stat-label">Today's Appointments</span>
                  <span className="fd-stat-val">8</span>
                </div>
                <a href="#schedule" className="fd-stat-link">View Schedule <ArrowRight size={12} /></a>
              </div>

              <div className="fd-stat-card">
                <div className="fd-stat-icon-wrap">
                  <Users size={18} />
                </div>
                <div className="fd-stat-info">
                  <span className="fd-stat-label">Total Patients</span>
                  <span className="fd-stat-val">243</span>
                </div>
                <a href="#recent-patients" className="fd-stat-link">View All <ArrowRight size={12} /></a>
              </div>

              <div className="fd-stat-card">
                <div className="fd-stat-icon-wrap fd-stat-icon-amber">
                  <Star size={18} />
                </div>
                <div className="fd-stat-info">
                  <span className="fd-stat-label">Pending Reviews</span>
                  <span className="fd-stat-val">3</span>
                </div>
                <button onClick={() => setActiveModal('rank')} className="fd-stat-link">View <ArrowRight size={12} /></button>
              </div>

              <div className="fd-stat-card">
                <div className="fd-stat-icon-wrap fd-stat-icon-purple">
                  <Pill size={18} />
                </div>
                <div className="fd-stat-info">
                  <span className="fd-stat-label">Prescriptions Today</span>
                  <span className="fd-stat-val">6</span>
                </div>
                <button onClick={() => setActiveModal('rx')} className="fd-stat-link">View <ArrowRight size={12} /></button>
              </div>
            </div>
          </div>

          {/* Center Column — Doctor Hero Image */}
          <div className="fd-hero-center">
            <div className="fd-hero-img-box">
              <img src={doctorHeroImg} alt="Doctor in clinic" className="fd-hero-img" />
              {/* Floating Badge */}
              <div className="fd-hero-floating-pill">
                <span>Better Health<br />Together</span>
              </div>
            </div>
          </div>

          {/* Right Column — Quick Actions Card */}
          <div className="fd-hero-right">
            <div className="fd-quick-actions-card">
              <div className="fd-qa-header">
                <Zap size={18} className="fd-qa-header-icon" />
                <h3>Quick Actions</h3>
              </div>

              <div className="fd-qa-list">
                <Link to={isAuthenticated ? "/doctor/portal/consultations" : "/login?role=doctor"} className="fd-qa-btn fd-qa-btn-primary">
                  <div className="fd-qa-btn-left">
                    <Video size={18} />
                    <span>Start Consultation</span>
                  </div>
                  <ChevronRight size={16} />
                </Link>

                <a href="#appointments" className="fd-qa-btn">
                  <div className="fd-qa-btn-left">
                    <Calendar size={18} />
                    <span>View Appointments</span>
                  </div>
                  <ChevronRight size={16} />
                </a>

                <a href="#recent-patients" className="fd-qa-btn">
                  <div className="fd-qa-btn-left">
                    <FolderOpen size={18} />
                    <span>Check Patient Records</span>
                  </div>
                  <ChevronRight size={16} />
                </a>

                <a href="#ai-tools" className="fd-qa-btn">
                  <div className="fd-qa-btn-left">
                    <Bot size={18} />
                    <span>AI Assistant</span>
                  </div>
                  <ChevronRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — UPCOMING APPOINTMENTS + DOCTOR PROFILE & AI PROMO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fd-section-mid" id="appointments">
        <div className="container fd-mid-grid">
          
          {/* Left: Upcoming Appointments Card */}
          <div className="fd-appointments-card">
            <div className="fd-card-header">
              <div className="fd-card-header-title">
                <div className="fd-card-header-icon">
                  <CalendarCheck size={20} />
                </div>
                <div>
                  <h2>Upcoming Appointments</h2>
                  <p>View and manage your today's schedule</p>
                </div>
              </div>
              <a href="#schedule" className="fd-view-all-link">View All <ArrowRight size={14} /></a>
            </div>

            {/* Appointment List */}
            <div className="fd-app-list">
              {APPOINTMENTS.map((app) => (
                <div key={app.id} className="fd-app-row">
                  <div className="fd-app-time">{app.time}</div>

                  <div className="fd-app-patient">
                    <img src={app.avatar} alt={app.patient} className="fd-patient-thumb" />
                    <div>
                      <h4 className="fd-patient-name">{app.patient}</h4>
                      <span className="fd-patient-type">{app.type}</span>
                    </div>
                  </div>

                  <div className="fd-app-badge-wrap">
                    <span
                      className="fd-status-pill"
                      style={{
                        background: app.status === 'In Progress' ? '#ecfdf5' : '#eff6ff',
                        color: app.status === 'In Progress' ? '#059669' : '#2563eb',
                        border: `1px solid ${app.status === 'In Progress' ? '#a7f3d0' : '#bfdbfe'}`,
                      }}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="fd-app-action">
                    {app.canJoin ? (
                      <Link
                        to={isAuthenticated ? `/meetings/room-${app.id}` : "/login?role=doctor"}
                        className="btn btn-primary fd-join-btn"
                      >
                        <Video size={14} /> Join Call
                      </Link>
                    ) : (
                      <button
                        onClick={() => {
                          if (app.reportAvailable) {
                            setActiveModal('summary');
                          } else {
                            setActiveModal('rx');
                          }
                        }}
                        className="btn btn-secondary fd-details-btn"
                      >
                        View Details
                      </button>
                    )}
                  </div>

                  <button className="fd-menu-btn" aria-label="More options">
                    <MoreVertical size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Doctor Profile Card + Let AI Handle routine */}
          <div className="fd-right-cards">

            {/* Profile & Ranking Card */}
            <div className="fd-profile-card">
              <div className="fd-profile-header">
                <div className="fd-profile-avatar-wrap">
                  <img src={doctorHeroImg} alt="Dr. Ahmed Khan" className="fd-profile-avatar" />
                  <div className="fd-verified-badge" title="Verified Doctor">
                    <Check size={12} strokeWidth={3} />
                  </div>
                </div>
                <div className="fd-profile-info">
                  <div className="fd-profile-name-row">
                    <h3>Dr. Ahmed Khan</h3>
                    <CheckCircle2 size={16} className="fd-check-blue" />
                  </div>
                  <span className="fd-profile-specialty">{doctorSpecialty}</span>
                  <div className="fd-profile-rating">
                    <Star size={14} fill="#f59e0b" color="#f59e0b" />
                    <span className="fd-rating-score">4.9</span>
                    <span className="fd-reviews-count">(124 reviews)</span>
                  </div>
                  {/* Feedback Ranking Tag */}
                  <div className="fd-ranking-badge">
                    <Award size={13} />
                    <span>#1 Ranked Cardiologist</span>
                  </div>
                </div>
              </div>

              {/* 3 Stats */}
              <div className="fd-profile-stats-grid">
                <div className="fd-pstat-item">
                  <span className="fd-pstat-num">5+</span>
                  <span className="fd-pstat-lbl">Years Experience</span>
                </div>
                <div className="fd-pstat-divider" />
                <div className="fd-pstat-item">
                  <span className="fd-pstat-num">243</span>
                  <span className="fd-pstat-lbl">Total Patients</span>
                </div>
                <div className="fd-pstat-divider" />
                <div className="fd-pstat-item">
                  <span className="fd-pstat-num">98%</span>
                  <span className="fd-pstat-lbl">Patient Satisfaction</span>
                </div>
              </div>

              <button onClick={() => setActiveModal('rank')} className="btn btn-secondary fd-profile-edit-btn">
                <Award size={15} /> View Ranking & Feedback
              </button>
            </div>

            {/* AI Promo Card */}
            <div className="fd-ai-promo-card">
              <div className="fd-ai-promo-content">
                <h3>Let AI Handle the Routine.</h3>
                <p>
                  Get lab summaries, auto-drafted prescriptions and follow-ups — all with AI.
                </p>
                <a href="#ai-tools" className="btn btn-primary fd-ai-promo-btn">
                  Explore AI Tools <ArrowRight size={14} />
                </a>
              </div>
              <div className="fd-ai-promo-mascot">
                <img src={robotImg} alt="AI Assistant" className="fd-mascot-img" />
                <div className="fd-mascot-heart">
                  <HeartPulse size={14} />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — AI-POWERED CLINICAL TOOLS (Doctor Focused)
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fd-ai-tools-section" id="ai-tools">
        <div className="container">
          <div className="fd-section-header">
            <div className="fd-ai-tools-badge">
              <Sparkles size={16} />
              <span>DOCTOR-FIRST INTELLIGENCE</span>
            </div>
            <h2 className="fd-section-title">AI-Powered Clinical Tools</h2>
            <p className="fd-section-desc">
              Save time, eliminate manual paperwork, and provide high-accuracy guidance with tools built specifically for doctor workflows.
            </p>
          </div>

          <div className="fd-ai-cards-grid">
            
            {/* Tool 1: AI Lab Report Summarizer */}
            <div className="fd-ai-tool-card">
              <div className="fd-ai-tool-top">
                <div className="fd-ai-tool-icon fd-ai-icon-blue">
                  <FileText size={22} />
                </div>
                <span className="fd-tool-tag">Instant Summary</span>
              </div>
              <h3>Lab Report Explainer & Summary</h3>
              <p>
                When patients present lab reports during consultations, AI extracts abnormal values, trends, and clinical flags into a 5-second executive summary.
              </p>
              <ul className="fd-tool-bullets">
                <li><Check size={14} /> Instant abnormal marker detection</li>
                <li><Check size={14} /> Concise 5-second clinical summary</li>
                <li><Check size={14} /> Compare against patient historical baselines</li>
              </ul>
              <button onClick={() => setActiveModal('summary')} className="btn btn-primary fd-tool-btn">
                Try Report Summary <ArrowRight size={15} />
              </button>
            </div>

            {/* Tool 2: AI Prescription Generator (Doctor doesn't write manually) */}
            <div className="fd-ai-tool-card fd-ai-tool-featured">
              <div className="fd-ai-tool-top">
                <div className="fd-ai-tool-icon fd-ai-icon-purple">
                  <Pill size={22} />
                </div>
                <span className="fd-tool-tag fd-tool-tag-purple">Zero Manual Writing</span>
              </div>
              <h3>AI Prescription Assistant</h3>
              <p>
                Never type prescriptions manually again. AI listens to consultation dialogue, drafts structured Rx with dosages and instructions for your 1-click approval.
              </p>
              <ul className="fd-tool-bullets">
                <li><Check size={14} /> Auto-suggested medications from diagnosis</li>
                <li><Check size={14} /> Real-time allergy & contraindication warnings</li>
                <li><Check size={14} /> Doctor reviews and signs with single click</li>
              </ul>
              <button onClick={() => setActiveModal('rx')} className="btn btn-primary fd-tool-btn fd-btn-purple">
                Try Auto Prescription <ArrowRight size={15} />
              </button>
            </div>

            {/* Tool 3: Patient Feedback & Profile Ranking */}
            <div className="fd-ai-tool-card">
              <div className="fd-ai-tool-top">
                <div className="fd-ai-tool-icon fd-ai-icon-amber">
                  <Award size={22} />
                </div>
                <span className="fd-tool-tag fd-tool-tag-amber">Reputation & Ranking</span>
              </div>
              <h3>Patient Feedback & Profile Rank</h3>
              <p>
                Patients submit post-consultation ratings and reviews that directly fuel your profile ranking algorithm, showcasing your expertise to thousands of new patients.
              </p>
              <ul className="fd-tool-bullets">
                <li><Check size={14} /> Verified patient reviews boost search placement</li>
                <li><Check size={14} /> Top Doctor badge & credibility trust score</li>
                <li><Check size={14} /> Real-time satisfaction & performance insights</li>
              </ul>
              <button onClick={() => setActiveModal('rank')} className="btn btn-primary fd-tool-btn fd-btn-amber">
                View Profile Ranking <ArrowRight size={15} />
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — TODAY'S SCHEDULE + RECENT PATIENTS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fd-schedule-section" id="schedule">
        <div className="container fd-schedule-grid">

          {/* Left: Today's Schedule Card */}
          <div className="fd-schedule-card">
            <div className="fd-card-header">
              <div className="fd-card-header-title">
                <div className="fd-card-header-icon">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2>Today's Schedule</h2>
                  <span className="fd-date-tag">
                    <Clock size={13} /> April 26, 2025
                  </span>
                </div>
              </div>
              <a href="#appointments" className="fd-view-all-link">View Full Calendar <ArrowRight size={14} /></a>
            </div>

            <div className="fd-schedule-list">
              {APPOINTMENTS.map((item) => (
                <div key={item.id} className="fd-schedule-item">
                  <span className="fd-s-time">{item.time}</span>
                  <div className="fd-s-patient">
                    <img src={item.avatar} alt={item.patient} className="fd-s-avatar" />
                    <span className="fd-s-name">{item.patient}</span>
                  </div>
                  <span className="fd-s-type">{item.type}</span>
                  <span
                    className="fd-status-pill"
                    style={{
                      background: item.status === 'In Progress' ? '#ecfdf5' : '#eff6ff',
                      color: item.status === 'In Progress' ? '#059669' : '#2563eb',
                      border: `1px solid ${item.status === 'In Progress' ? '#a7f3d0' : '#bfdbfe'}`,
                    }}
                  >
                    {item.status}
                  </span>
                  <ChevronRight size={16} className="fd-s-arrow" />
                </div>
              ))}
            </div>
          </div>

          {/* Right: Recent Patients */}
          <div className="fd-patients-card" id="recent-patients">
            <div className="fd-card-header">
              <div className="fd-card-header-title">
                <div className="fd-card-header-icon">
                  <Users size={20} />
                </div>
                <div>
                  <h2>Recent Patients</h2>
                  <p>Recent consultations & feedback</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('rank')} className="fd-view-all-link">View All <ArrowRight size={14} /></button>
            </div>

            <div className="fd-patients-list">
              {RECENT_PATIENTS.map((p) => (
                <div key={p.id} className="fd-patient-row">
                  <img src={p.avatar} alt={p.name} className="fd-p-avatar" />
                  <div className="fd-p-info">
                    <h4 className="fd-p-name">{p.name}</h4>
                    <span className="fd-p-condition">{p.condition}</span>
                    <span className="fd-p-visit">Last visit: {p.lastVisit}</span>
                  </div>
                  <div className="fd-p-action-wrap">
                    <div className="fd-p-rating-pill">
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span>{p.rankingGiven}</span>
                    </div>
                    <button
                      onClick={() => setActiveModal('summary')}
                      className="btn btn-secondary fd-p-record-btn"
                    >
                      View Record
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — BANNER CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fd-cta-banner">
        <div className="container fd-cta-banner-inner">
          <div className="fd-cta-banner-left">
            <div className="fd-cta-banner-icon">
              <Stethoscope size={28} />
            </div>
            <div className="fd-cta-banner-text">
              <h2>Your Expertise + AI = Better Patient Outcomes</h2>
              <p>Leverage AI tools to save time, improve accuracy, and provide personalized care.</p>
            </div>
          </div>
          <a href="#ai-tools" className="btn btn-secondary btn-lg fd-cta-banner-btn">
            Explore AI Tools <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="hp-footer">
        <div className="container">
          <div className="hp-footer-top">
            <div className="hp-footer-brand">
              <Link to="/" className="hp-footer-logo">
                <div className="nav-brand-icon">
                  <HeartPulse size={20} strokeWidth={2.5} />
                </div>
                <div className="nav-brand-text-wrap">
                  <span className="nav-brand-text">Medi<span className="brand-accent">AI</span></span>
                  <span className="nav-brand-subtitle">Your Health, Our Priority</span>
                </div>
              </Link>
            </div>
            <div className="hp-footer-links">
              <Link to="/">Home</Link>
              <Link to="/for-patients">For Patients</Link>
              <Link to="/for-doctors">For Doctors</Link>
              <Link to="/features">Features</Link>
              <Link to="/about">About</Link>
            </div>
            <div className="hp-footer-social">
              <a href="#" aria-label="Facebook" className="hp-social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="hp-social-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="X" className="hp-social-icon">
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

      {/* ══════════════════════════════════════════════════════════════════
          INTERACTIVE MODALS (Demonstrating the 3 User-Requested Features)
      ══════════════════════════════════════════════════════════════════ */}

      {/* MODAL 1: AI Lab Report Summarizer Modal */}
      {activeModal === 'summary' && (
        <div className="fd-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="fd-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fd-modal-header">
              <div className="fd-modal-title-wrap">
                <FileText size={20} className="fd-modal-icon-blue" />
                <div>
                  <h3>AI Lab Report Executive Summary</h3>
                  <span>Patient: Sarah Khan • Comprehensive Metabolic & CBC Panel</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="fd-modal-close" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="fd-modal-body">
              <div className="fd-modal-alert">
                <Bot size={18} />
                <span>Generated by MediAI Clinical Engine in 1.4 seconds from 6-page PDF</span>
              </div>

              <div className="fd-summary-section">
                <h4>Key Clinical Findings</h4>
                <div className="fd-finding-item fd-finding-warning">
                  <AlertCircle size={16} />
                  <div>
                    <strong>Mild Microcytic Anemia:</strong> Hemoglobin 11.2 g/dL (Ref: 12.0 - 15.5 g/dL), MCV 78 fL.
                  </div>
                </div>
                <div className="fd-finding-item fd-finding-normal">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>Normal Metabolic & Renal Panel:</strong> eGFR &gt; 90, Serum Creatinine 0.8 mg/dL, Electrolytes balanced.
                  </div>
                </div>
                <div className="fd-finding-item fd-finding-normal">
                  <CheckCircle2 size={16} />
                  <div>
                    <strong>Lipid Profile:</strong> Total Cholesterol 182 mg/dL, Triglycerides 120 mg/dL (Desirable Range).
                  </div>
                </div>
              </div>

              <div className="fd-summary-section">
                <h4>AI Recommended Next Steps</h4>
                <p className="fd-summary-text">
                  Recommend oral iron supplementation (Ferrous Sulfate 325mg once daily) with Vitamin C for absorption. Recheck CBC in 8 weeks. No acute cardiology concerns.
                </p>
              </div>
            </div>

            <div className="fd-modal-footer">
              <button onClick={() => { setActiveModal('rx'); }} className="btn btn-primary">
                Generate Auto-Prescription with AI <ArrowRight size={14} />
              </button>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: AI Auto-Prescription Generator (Doctor doesn't type) */}
      {activeModal === 'rx' && (
        <div className="fd-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="fd-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fd-modal-header">
              <div className="fd-modal-title-wrap">
                <Pill size={20} className="fd-modal-icon-purple" />
                <div>
                  <h3>AI Auto-Prescription Draft</h3>
                  <span>Automated draft from consultation dialogue • Zero manual typing</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="fd-modal-close" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="fd-modal-body">
              <div className="fd-modal-alert fd-modal-alert-purple">
                <Sparkles size={18} />
                <span>Doctor does not type manually: AI drafted medicines, dosages, and safety checks for Dr. Ahmed's approval.</span>
              </div>

              <div className="fd-rx-list">
                <div className="fd-rx-card">
                  <div className="fd-rx-top">
                    <span className="fd-rx-name">Ferrous Sulfate 325 mg</span>
                    <span className="fd-rx-dose">1 tablet • Oral</span>
                  </div>
                  <span className="fd-rx-instr">Take once daily with meals and a glass of orange juice (Vit C).</span>
                  <div className="fd-rx-safety">
                    <Check size={13} />
                    <span>No known drug allergy for patient Sarah Khan</span>
                  </div>
                </div>

                <div className="fd-rx-card">
                  <div className="fd-rx-top">
                    <span className="fd-rx-name">Ascorbic Acid (Vitamin C) 500 mg</span>
                    <span className="fd-rx-dose">1 tablet • Oral</span>
                  </div>
                  <span className="fd-rx-instr">Take alongside iron supplement in the morning.</span>
                  <div className="fd-rx-safety">
                    <Check size={13} />
                    <span>Safe formulation verified</span>
                  </div>
                </div>
              </div>

              <div className="fd-rx-note">
                <strong>Doctor Action:</strong> Review the auto-generated items above. Click "Sign & Send" to instantly dispatch to patient's MediAI app and pharmacy.
              </div>
            </div>

            <div className="fd-modal-footer">
              <button onClick={() => { alert('Prescription approved and sent to patient!'); setActiveModal(null); }} className="btn btn-primary fd-btn-purple">
                <CheckCheck size={16} /> 1-Click Approve & Send to Patient
              </button>
              <button onClick={() => setActiveModal(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Patient Feedback & Profile Ranking */}
      {activeModal === 'rank' && (
        <div className="fd-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="fd-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="fd-modal-header">
              <div className="fd-modal-title-wrap">
                <Award size={20} className="fd-modal-icon-amber" />
                <div>
                  <h3>Patient Feedback & Profile Ranking</h3>
                  <span>How verified patient reviews rank Dr. Ahmed Khan's profile</span>
                </div>
              </div>
              <button onClick={() => setActiveModal(null)} className="fd-modal-close" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div className="fd-modal-body">
              <div className="fd-modal-alert fd-modal-alert-amber">
                <Star size={18} />
                <span>Your profile currently ranks <strong>#1 in Cardiology</strong> in your region based on 124 verified patient reviews.</span>
              </div>

              <div className="fd-rank-breakdown">
                <div className="fd-rank-metric">
                  <span className="fd-rm-num">4.9 ★</span>
                  <span className="fd-rm-lbl">Overall Rating</span>
                </div>
                <div className="fd-rank-metric">
                  <span className="fd-rm-num">98%</span>
                  <span className="fd-rm-lbl">Positive Feedback</span>
                </div>
                <div className="fd-rank-metric">
                  <span className="fd-rm-num">&lt; 3 min</span>
                  <span className="fd-rm-lbl">Avg Response Time</span>
                </div>
                <div className="fd-rank-metric">
                  <span className="fd-rm-num">#1</span>
                  <span className="fd-rm-lbl">Cardiology Rank</span>
                </div>
              </div>

              <div className="fd-summary-section">
                <h4>Recent Patient Reviews</h4>
                {RECENT_PATIENTS.slice(0, 3).map((p) => (
                  <div key={p.id} className="fd-review-item">
                    <div className="fd-ri-header">
                      <img src={p.avatar} alt={p.name} className="fd-ri-avatar" />
                      <div>
                        <strong>{p.name}</strong>
                        <div className="fd-ri-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={11} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="fd-ri-text">"{p.feedback}"</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="fd-modal-footer">
              <button onClick={() => setActiveModal(null)} className="btn btn-primary">
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ForDoctorsPage;
