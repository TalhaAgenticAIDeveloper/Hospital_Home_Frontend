import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  Sparkles,
  ShieldCheck,
  Award,
  Users,
  CheckCircle2,
  Stethoscope,
  TrendingUp,
  Brain,
  Lock,
  ArrowRight,
  Clock,
  Compass,
  Target,
  FileText,
  Pill,
  Check,
  Bot,
  Zap,
} from 'lucide-react';

import aboutTeamImg from '../assets/about-team.webp';
import doctorMaleImg from '../assets/doctor-male-hero.webp';
import doctorAvatar1 from '../assets/doctor-avatar-1.webp';
import doctorAvatar2 from '../assets/doctor-avatar-2.webp';
import doctorAvatar3 from '../assets/doctor-avatar-3.webp';

/* ── Leadership Team Data ────────────────────────────────────────────────── */
const TEAM_MEMBERS = [
  {
    name: 'Dr. Ahmed Khan, MD, FACC',
    role: 'Chief Medical Officer & Co-Founder',
    specialty: 'Cardiologist & Clinical AI Fellow',
    bio: 'Over 14 years of clinical practice in interventional cardiology. Passionate about eliminating bureaucratic paperwork so doctors can focus 100% on healing.',
    avatar: doctorMaleImg,
    badge: 'Clinical Lead',
  },
  {
    name: 'Dr. Sarah Johnson, MD, PhD',
    role: 'Head of Clinical AI & Diagnostic Informatics',
    specialty: 'Informatics & Medical Ethics',
    bio: 'Dual-degree physician-scientist leading our zero-hallucination clinical prompt architecture and lab report comprehension models.',
    avatar: doctorAvatar1,
    badge: 'AI Research',
  },
  {
    name: 'Tariq Mansoor',
    role: 'Chief Technology Officer',
    specialty: 'Distributed Systems & Healthcare Security',
    bio: 'Former senior engineer at top healthtech infrastructure providers. Architect of MediAI’s zero-latency WebRTC telemedicine and AES-256 data vault.',
    avatar: doctorAvatar2,
    badge: 'Engineering',
  },
  {
    name: 'Dr. Ayesha Malik, MD',
    role: 'Director of Patient Experience & Telehealth',
    specialty: 'General Practice & Preventative Medicine',
    bio: 'Dedicated to patient-centric medicine and remote care accessibility for underserved and rural communities.',
    avatar: doctorAvatar3,
    badge: 'Patient Advocacy',
  },
];

/* ── Core Values ─────────────────────────────────────────────────────────── */
const CORE_VALUES = [
  {
    icon: HeartPulse,
    color: '#2563eb',
    title: 'Patient Empowerment First',
    desc: 'We believe health information belongs to the patient. Every lab report and diagnosis should be understandable without requiring a medical degree.',
  },
  {
    icon: Stethoscope,
    color: '#7c3aed',
    title: 'Doctor-In-The-Loop Safety',
    desc: 'AI is an assistant, never a substitute for clinical judgment. All prescriptions, summaries, and plans require licensed doctor verification.',
  },
  {
    icon: Zap,
    color: '#d97706',
    title: 'Zero Administrative Waste',
    desc: 'Doctors spend up to 3 hours a day handwriting notes and typing prescriptions. We automate the routine paperwork so doctors can spend real time with patients.',
  },
  {
    icon: ShieldCheck,
    color: '#059669',
    title: 'Uncompromised Data Privacy',
    desc: 'Medical data is sacred. We enforce strict HIPAA and GDPR standards with AES-256 encryption at rest and zero advertising monetization.',
  },
];

/* ── Company Milestones ──────────────────────────────────────────────────── */
const MILESTONES = [
  {
    year: '2023',
    title: 'The Inception',
    desc: 'Founded by a team of practicing clinicians and healthtech engineers frustrated by patient confusion over dense lab reports and doctor burnout.',
  },
  {
    year: '2024',
    title: 'Telemedicine & Real-Time Encryption',
    desc: 'Launched our ultra-low latency browser-based 1-on-1 video consultation platform with integrated real-time transcription.',
  },
  {
    year: '2025',
    title: 'AI Clinical Engines Rollout',
    desc: 'Deployed the 5-second AI Lab Report Summarizer and Zero-Manual Typing Prescription Assistant across 50+ partner clinics.',
  },
  {
    year: '2026',
    title: 'National Network & Verified Ranking',
    desc: 'Surpassed 50,000 completed consultations with 1,200+ verified medical doctors ranked transparently through verified patient feedback.',
  },
];

export function AboutPage() {
  return (
    <div className="about-page">

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="about-hero">
        <div className="about-hero-bg-glow" />
        <div className="about-hero-bg-dots" />

        <div className="container about-hero-container">
          <div className="about-hero-text">
            <div className="about-eyebrow">
              <Sparkles size={15} />
              <span>ABOUT MEDIAI</span>
            </div>

            <h1 className="about-hero-title">
              Pioneering The Future of<br />
              <span className="about-hero-title-accent">Compassionate, Smarter Healthcare</span>
            </h1>

            <p className="about-hero-subtitle">
              We are bridging the gap between clinical complexity and patient understanding. By combining state-of-the-art medical AI with verified physician oversight, MediAI empowers patients with instant clarity and frees doctors from administrative fatigue.
            </p>

            <div className="about-hero-actions">
              <Link to="/for-patients" className="btn btn-primary btn-lg about-hero-btn">
                For Patients <ArrowRight size={17} />
              </Link>
              <Link to="/for-doctors" className="btn btn-secondary btn-lg about-hero-btn">
                For Doctors <ArrowRight size={17} />
              </Link>
            </div>
          </div>

          {/* Hero Visual Image Box */}
          <div className="about-hero-visual">
            <div className="about-hero-img-box">
              <img src={aboutTeamImg} alt="MediAI Innovation Lab and Clinical Team" className="about-hero-img" />

              {/* Floating Stat 1 */}
              <div className="about-floating-card about-fc-top-left">
                <CheckCircle2 size={18} color="#10b981" />
                <div>
                  <strong>50,000+ Consultations</strong>
                  <span>Across 45+ Specialties</span>
                </div>
              </div>

              {/* Floating Stat 2 */}
              <div className="about-floating-card about-fc-bottom-right">
                <Award size={18} color="#2563eb" />
                <div>
                  <strong>1,200+ Doctors</strong>
                  <span>Board Verified Specialists</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Impact Numbers Bar */}
        <div className="container">
          <div className="about-numbers-bar">
            <div className="about-number-item">
              <span className="about-num-val">50,000+</span>
              <span className="about-num-lbl">Patients Empowered</span>
            </div>
            <div className="about-num-divider" />
            <div className="about-number-item">
              <span className="about-num-val">1,200+</span>
              <span className="about-num-lbl">Verified Physicians</span>
            </div>
            <div className="about-num-divider" />
            <div className="about-number-item">
              <span className="about-num-val">5 sec</span>
              <span className="about-num-lbl">Avg Lab Analysis Time</span>
            </div>
            <div className="about-num-divider" />
            <div className="about-number-item">
              <span className="about-num-val">98%</span>
              <span className="about-num-lbl">Patient Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — MISSION & VISION
      ══════════════════════════════════════════════════════════════════ */}
      <section className="about-mission-section">
        <div className="container">
          <div className="about-mv-grid">
            {/* Mission Card */}
            <div className="about-mv-card about-card-mission">
              <div className="about-mv-header">
                <div className="about-mv-icon-box about-icon-blue">
                  <Target size={26} />
                </div>
                <div>
                  <span className="about-mv-tag">OUR PURPOSE</span>
                  <h3>Our Mission</h3>
                </div>
              </div>
              <p>
                To eliminate the fear, confusion, and delay from healthcare by translating complex clinical diagnostics into plain, actionable language for patients, while equipping doctors with frictionless AI tools that eliminate manual paperwork.
              </p>
              <ul className="about-mv-bullets">
                <li><Check size={16} color="#10b981" /> Universal access to rapid diagnostic summaries</li>
                <li><Check size={16} color="#10b981" /> Restoring physician joy in practicing medicine</li>
                <li><Check size={16} color="#10b981" /> 100% verified physician-in-the-loop safety</li>
              </ul>
            </div>

            {/* Vision Card */}
            <div className="about-mv-card about-card-vision">
              <div className="about-mv-header">
                <div className="about-mv-icon-box about-icon-purple">
                  <Compass size={26} />
                </div>
                <div>
                  <span className="about-mv-tag about-tag-purple">WHERE WE'RE HEADED</span>
                  <h3>Our Vision</h3>
                </div>
              </div>
              <p>
                A world where geographical distance, confusing jargon, and healthcare bureaucracy never stand between a human being and high-quality, compassionate clinical guidance — creating the gold standard for responsible medical AI.
              </p>
              <ul className="about-mv-bullets">
                <li><Check size={16} color="#7c3aed" /> Instant telemedicine across borders & time zones</li>
                <li><Check size={16} color="#7c3aed" /> Predictive preventative health tailored to genomics</li>
                <li><Check size={16} color="#7c3aed" /> Fully automated prescription & pharmacy logistics</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — CORE VALUES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="about-values-section">
        <div className="container">
          <div className="about-section-header">
            <span className="about-section-eyebrow">WHAT GUIDES US</span>
            <h2 className="about-section-title">Core Principles That Define MediAI</h2>
            <p className="about-section-desc">
              Healthcare requires the highest standard of integrity, accuracy, and ethics. These values inform every line of code we write and every feature we ship.
            </p>
          </div>

          <div className="about-values-grid">
            {CORE_VALUES.map((val, i) => (
              <div key={i} className="about-value-card">
                <div className="about-val-icon" style={{ background: `${val.color}14`, color: val.color }}>
                  <val.icon size={26} />
                </div>
                <h3>{val.title}</h3>
                <p>{val.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — LEADERSHIP TEAM
      ══════════════════════════════════════════════════════════════════ */}
      <section className="about-team-section">
        <div className="container">
          <div className="about-section-header">
            <span className="about-section-eyebrow">CLINICAL & TECH EXPERTISE</span>
            <h2 className="about-section-title">Led By Physicians & Engineers</h2>
            <p className="about-section-desc">
              Our multidisciplinary leadership combines decades of bedside clinical experience with cutting-edge artificial intelligence systems architecture.
            </p>
          </div>

          <div className="about-team-grid">
            {TEAM_MEMBERS.map((member, i) => (
              <div key={i} className="about-member-card">
                <div className="about-member-img-wrap">
                  <img src={member.avatar} alt={member.name} className="about-member-img" />
                  <span className="about-member-badge">{member.badge}</span>
                </div>

                <div className="about-member-body">
                  <h3 className="about-member-name">{member.name}</h3>
                  <span className="about-member-role">{member.role}</span>
                  <span className="about-member-spec">{member.specialty}</span>
                  <p className="about-member-bio">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — AI ETHICS & SAFETY COMMITMENT
      ══════════════════════════════════════════════════════════════════ */}
      <section className="about-ethics-section">
        <div className="container">
          <div className="about-ethics-box">
            <div className="about-ethics-header">
              <div className="about-ethics-icon">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2>Our Ethical AI & Clinical Safety Framework</h2>
                <p>How we ensure accuracy, eliminate hallucinations, and protect patient health.</p>
              </div>
            </div>

            <div className="about-ethics-grid">
              <div className="about-ethics-item">
                <div className="about-ei-top">
                  <Bot size={20} color="#2563eb" />
                  <h4>Doctor-In-The-Loop Standard</h4>
                </div>
                <p>MediAI never dispenses medications or final diagnoses independently. All AI drafts are reviewed, calibrated, and signed by a licensed doctor.</p>
              </div>

              <div className="about-ethics-item">
                <div className="about-ei-top">
                  <FileText size={20} color="#7c3aed" />
                  <h4>Evidence-Based Citations</h4>
                </div>
                <p>Every lab report interpretation references validated clinical standard ranges (e.g. WHO, AHA, ADA), ensuring grounded and reliable explanations.</p>
              </div>

              <div className="about-ethics-item">
                <div className="about-ei-top">
                  <Lock size={20} color="#059669" />
                  <h4>Zero Data Monetization</h4>
                </div>
                <p>We do not sell patient data, serve targeted third-party medical ads, or share private consultation recordings. Your data remains strictly yours.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — MILESTONE TIMELINE
      ══════════════════════════════════════════════════════════════════ */}
      <section className="about-timeline-section">
        <div className="container">
          <div className="about-section-header">
            <span className="about-section-eyebrow">OUR JOURNEY</span>
            <h2 className="about-section-title">From Concept to 50,000+ Consultations</h2>
            <p className="about-section-desc">
              How MediAI evolved from an experimental diagnostic summarizer into a complete clinical operating system.
            </p>
          </div>

          <div className="about-timeline-wrap">
            {MILESTONES.map((m, i) => (
              <div key={i} className="about-timeline-node">
                <div className="about-tl-year-badge">{m.year}</div>
                <div className="about-tl-card">
                  <h4>{m.title}</h4>
                  <p>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — DUAL CTA BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="about-cta-section">
        <div className="container about-cta-inner">
          <div className="about-cta-left">
            <div className="about-cta-icon-wrap">
              <HeartPulse size={32} />
            </div>
            <div className="about-cta-text">
              <h2>Join Us In Building The Future of Healthcare</h2>
              <p>Experience compassionate care as a patient or elevate your practice as a verified doctor.</p>
            </div>
          </div>

          <div className="about-cta-buttons">
            <Link to="/for-patients" className="btn btn-secondary btn-lg about-cta-btn">
              For Patients <ArrowRight size={17} />
            </Link>
            <Link to="/for-doctors" className="btn btn-secondary btn-lg about-cta-btn">
              For Doctors <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 8 — FOOTER
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

    </div>
  );
}

export default AboutPage;
