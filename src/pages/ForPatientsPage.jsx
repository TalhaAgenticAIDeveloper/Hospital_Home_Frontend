import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Heart,
  CalendarCheck,
  Stethoscope,
  FileText,
  Pill,
  Star,
  Check,
  Upload,
  TrendingUp,
  Dumbbell,
  Apple,
  Sparkles,
  HeartPulse,
  Video,
  MessageCircle,
  Bot,
  Bell,
  Shield,
  Clock,
  Users,
  ChevronRight,
  Zap,
  Search,
  Brain,
  Utensils,
  Activity,
  BadgeCheck,
  Smartphone,
} from 'lucide-react';

/* ── Patient Feature Images ─────────────────────────────────────────────── */
import heroImg from '../assets/patient/PMDC verified Doctors.webp';
import doctorProfileImg from '../assets/patient/Patient visiting Doctor profile.webp';
import videoConsultImg from '../assets/patient/Patient doctor meeting.webp';
import aiReportImg from '../assets/patient/Patient getting report analysis.webp';
import dietPlanImg from '../assets/patient/Diet plan discussion.webp';
import notificationImg from '../assets/patient/patient got notification.webp';
import robotImg from '../assets/ai-robot-mascot.webp';

/* ── Static Data ────────────────────────────────────────────────────────── */
const STATS = [
  { value: '500+', label: 'Verified Doctors', icon: BadgeCheck },
  { value: '24/7', label: 'AI Health Assistant', icon: Bot },
  { value: '50k+', label: 'Reports Analyzed', icon: FileText },
  { value: '99.9%', label: 'Uptime & Security', icon: Shield },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Search,
    title: 'Find Your Doctor',
    desc: 'Browse PMDC-verified specialists, check ratings, read patient reviews, and pick the perfect time slot.',
    color: '#2563eb',
  },
  {
    step: '02',
    icon: Video,
    title: 'Consult via HD Video',
    desc: 'Connect instantly with your doctor from home. No downloads needed — just one click from your browser.',
    color: '#7c3aed',
  },
  {
    step: '03',
    icon: Sparkles,
    title: 'Get AI Insights & Plans',
    desc: 'Upload lab reports for AI explanations, get personalized diet & fitness plans, and never miss your medication.',
    color: '#059669',
  },
];

const FEATURES_MINI = [
  { icon: CalendarCheck, label: 'Book Appointments', color: '#2563eb' },
  { icon: Video, label: 'HD Video Calls', color: '#7c3aed' },
  { icon: Bot, label: 'AI Report Analysis', color: '#0284c7' },
  { icon: Utensils, label: 'Custom Diet Plans', color: '#059669' },
  { icon: Pill, label: 'E-Prescriptions', color: '#ea580c' },
  { icon: Bell, label: 'Smart Reminders', color: '#d946ef' },
];

export function ForPatientsPage() {
  const { user } = useAuth();

  return (
    <div className="fp-page">

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-hero">
        <div className="fp-hero-bg-orb fp-hero-bg-orb-1" />
        <div className="fp-hero-bg-orb fp-hero-bg-orb-2" />
        <div className="fp-hero-bg-grid" />

        <div className="container fp-hero-grid">
          {/* Left — Text */}
          <div className="fp-hero-text">
            <span className="fp-hero-eyebrow">
              <HeartPulse size={14} />
              FOR PATIENTS
            </span>
            <h1 className="fp-hero-title">
              Healthcare That<br />
              <span className="fp-hero-title-accent">Revolves Around You</span>
            </h1>
            <p className="fp-hero-subtitle">
              Find top specialists, consult via HD video, get AI-powered lab report analysis,
              personalized health plans, and smart medication reminders — all in one place.
            </p>

            <div className="fp-hero-actions">
              <Link to="/patient/dashboard/book" className="fp-hero-btn fp-hero-btn-primary">
                <CalendarCheck size={18} />
                Book an Appointment
                <ArrowRight size={16} />
              </Link>
              <Link to="/patient/dashboard/reports" className="fp-hero-btn fp-hero-btn-outline">
                <Sparkles size={18} />
                Try AI Report Analysis
              </Link>
            </div>

            {/* Mini Feature Pills */}
            <div className="fp-hero-pills">
              {FEATURES_MINI.map((f) => (
                <div key={f.label} className="fp-hero-pill">
                  <f.icon size={14} style={{ color: f.color }} />
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Hero Image */}
          <div className="fp-hero-visual">
            <div className="fp-hero-img-wrap">
              <img src={heroImg} alt="Patient booking doctor appointment on tablet" className="fp-hero-img" />
              {/* Floating Badge: Verified */}
              <div className="fp-hero-float fp-hero-float-verified">
                <BadgeCheck size={16} />
                <span>PMDC Verified<br />Doctors</span>
              </div>
              {/* Floating Badge: AI */}
              <div className="fp-hero-float fp-hero-float-ai">
                <Bot size={16} />
                <span>24/7 AI<br />Assistant</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — TRUST STATS BAR
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-stats">
        <div className="container">
          <div className="fp-stats-grid">
            {STATS.map((s) => (
              <div key={s.label} className="fp-stat-item">
                <div className="fp-stat-icon">
                  <s.icon size={22} />
                </div>
                <div>
                  <span className="fp-stat-value">{s.value}</span>
                  <span className="fp-stat-label">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — FEATURE SHOWCASE (Zig-Zag)
      ══════════════════════════════════════════════════════════════════ */}

      {/* ── Feature 1: Smart Doctor Search & Booking ── */}
      <section className="fp-feature" id="fp-booking">
        <div className="container fp-feature-grid">
          <div className="fp-feature-img-wrap">
            <img src={doctorProfileImg} alt="Patient browsing doctor profiles on tablet" className="fp-feature-img" />
            <div className="fp-feature-img-glow fp-feature-img-glow-blue" />
          </div>
          <div className="fp-feature-content">
            <div className="fp-feature-badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <Stethoscope size={16} />
              <span>Smart Booking</span>
            </div>
            <h2 className="fp-feature-title">
              Find the Perfect Doctor,<br />
              <span style={{ color: '#2563eb' }}>Book in Seconds</span>
            </h2>
            <p className="fp-feature-desc">
              Browse through our network of PMDC-verified specialists. Read real patient reviews,
              check ratings, compare consultation fees, and pick the time slot that works for you.
              Your perfect doctor is just one click away.
            </p>
            <ul className="fp-feature-list">
              <li><Check size={16} /> <span>PMDC-verified specialist doctors across 20+ fields</span></li>
              <li><Check size={16} /> <span>Real patient reviews & transparent ratings</span></li>
              <li><Check size={16} /> <span>Instant slot selection — no phone calls needed</span></li>
              <li><Check size={16} /> <span>Attach your medical records before the visit</span></li>
            </ul>
            <Link to="/patient/dashboard/book" className="fp-feature-cta">
              Find Doctors <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature 2: HD Video Consultations ── */}
      <section className="fp-feature fp-feature-reverse fp-feature-alt" id="fp-video">
        <div className="container fp-feature-grid">
          <div className="fp-feature-img-wrap">
            <img src={videoConsultImg} alt="Patient on video call with doctor" className="fp-feature-img" />
            <div className="fp-feature-img-glow fp-feature-img-glow-purple" />
          </div>
          <div className="fp-feature-content">
            <div className="fp-feature-badge" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
              <Video size={16} />
              <span>Telemedicine</span>
            </div>
            <h2 className="fp-feature-title">
              See Your Doctor<br />
              <span style={{ color: '#7c3aed' }}>From the Comfort of Home</span>
            </h2>
            <p className="fp-feature-desc">
              No more waiting rooms. Connect with your doctor through encrypted, crystal-clear
              HD video — right from your browser. During the call, chat live, share your reports
              on-screen, and receive your digital prescription instantly.
            </p>
            <ul className="fp-feature-list">
              <li><Check size={16} /> <span>Zero downloads — works directly in your browser</span></li>
              <li><Check size={16} /> <span>End-to-end encrypted video for your privacy</span></li>
              <li><Check size={16} /> <span>Live chat & on-screen report sharing during call</span></li>
              <li><Check size={16} /> <span>Instant digital prescription after consultation</span></li>
            </ul>
            <Link to="/patient/dashboard/book" className="fp-feature-cta fp-feature-cta-purple">
              Book a Video Visit <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature 3: AI Lab Report Explainer ── */}
      <section className="fp-feature" id="fp-ai-reports">
        <div className="container fp-feature-grid">
          <div className="fp-feature-img-wrap">
            <img src={aiReportImg} alt="AI robot analyzing patient lab report" className="fp-feature-img" />
            <div className="fp-feature-img-glow fp-feature-img-glow-cyan" />
          </div>
          <div className="fp-feature-content">
            <div className="fp-feature-badge" style={{ background: '#ecfeff', color: '#0891b2' }}>
              <Brain size={16} />
              <span>AI-Powered</span>
            </div>
            <h2 className="fp-feature-title">
              Your Lab Reports,<br />
              <span style={{ color: '#0891b2' }}>Explained in Simple Words</span>
            </h2>
            <p className="fp-feature-desc">
              Confused by medical jargon? Just upload your lab report and our AI Medical
              Assistant will break it down in plain language. It highlights what's normal,
              what needs attention, suggests dietary changes, and lets you ask unlimited
              follow-up questions — like having a doctor available 24/7.
            </p>
            <ul className="fp-feature-list">
              <li><Check size={16} /> <span>Upload PDF, JPG, or PNG — AI reads it in seconds</span></li>
              <li><Check size={16} /> <span>Clear Normal / Abnormal indicators for every test</span></li>
              <li><Check size={16} /> <span>Personalized health tips based on your results</span></li>
              <li><Check size={16} /> <span>Unlimited follow-up questions via AI chat</span></li>
            </ul>
            <Link to="/patient/dashboard/reports" className="fp-feature-cta fp-feature-cta-cyan">
              Try AI Report Analysis <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature 4: Personalized Health Plans ── */}
      <section className="fp-feature fp-feature-reverse fp-feature-alt" id="fp-plans">
        <div className="container fp-feature-grid">
          <div className="fp-feature-img-wrap">
            <img src={dietPlanImg} alt="Patient customizing diet plan with AI assistant" className="fp-feature-img" />
            <div className="fp-feature-img-glow fp-feature-img-glow-green" />
          </div>
          <div className="fp-feature-content">
            <div className="fp-feature-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Utensils size={16} />
              <span>Personalized Plans</span>
            </div>
            <h2 className="fp-feature-title">
              Your Diet & Fitness Plan,<br />
              <span style={{ color: '#059669' }}>Built Around Your Preferences</span>
            </h2>
            <p className="fp-feature-desc">
              Tell our AI your goal — gain weight, lose weight, build muscle, or just eat healthier.
              Don't like eggs? No problem! Our AI nutritionist listens to your preferences and
              allergies, swaps items in real-time, and creates a plan that fits YOUR life, not the
              other way around.
            </p>
            <ul className="fp-feature-list">
              <li><Check size={16} /> <span>Custom meal plans based on your goals & taste</span></li>
              <li><Check size={16} /> <span>Real-time food swaps for allergies & preferences</span></li>
              <li><Check size={16} /> <span>Workout routines tailored to your fitness level</span></li>
              <li><Check size={16} /> <span>Daily macro & calorie targets tracked for you</span></li>
            </ul>
            <Link to="/patient/dashboard/reports" className="fp-feature-cta fp-feature-cta-green">
              Create My Plan <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Feature 5: Smart Medication Reminders ── */}
      <section className="fp-feature" id="fp-reminders">
        <div className="container fp-feature-grid">
          <div className="fp-feature-img-wrap">
            <img src={notificationImg} alt="Patient receiving medication reminder notification" className="fp-feature-img" />
            <div className="fp-feature-img-glow fp-feature-img-glow-orange" />
          </div>
          <div className="fp-feature-content">
            <div className="fp-feature-badge" style={{ background: '#fff7ed', color: '#ea580c' }}>
              <Bell size={16} />
              <span>Smart Reminders</span>
            </div>
            <h2 className="fp-feature-title">
              Never Miss Your Medicine,<br />
              <span style={{ color: '#ea580c' }}>Even on Your Busiest Days</span>
            </h2>
            <p className="fp-feature-desc">
              Life gets busy — but your health can't wait. MediAI sends you timely push notifications
              to take your medicine, reminds you about meals, and keeps your treatment on track. Whether
              you're at work, commuting, or anywhere — we've got your back.
            </p>
            <ul className="fp-feature-list">
              <li><Check size={16} /> <span>Automatic reminders synced with your prescription</span></li>
              <li><Check size={16} /> <span>Meal-aware timing — "take after lunch" reminders</span></li>
              <li><Check size={16} /> <span>One-tap "Mark as Taken" confirmation</span></li>
              <li><Check size={16} /> <span>Track your medication adherence over time</span></li>
            </ul>
            <Link to="/patient/dashboard/prescriptions" className="fp-feature-cta fp-feature-cta-orange">
              View Prescriptions <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-how-it-works">
        <div className="container">
          <div className="fp-section-header">
            <span className="fp-section-eyebrow">
              <Zap size={14} />
              SIMPLE & EASY
            </span>
            <h2 className="fp-section-title">How It Works</h2>
            <p className="fp-section-desc">Getting started takes less than 2 minutes. Here's how.</p>
          </div>
          <div className="fp-hiw-grid">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="fp-hiw-card">
                <div className="fp-hiw-step" style={{ color: item.color }}>{item.step}</div>
                <div className="fp-hiw-icon" style={{ background: `${item.color}10`, color: item.color }}>
                  <item.icon size={26} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && <div className="fp-hiw-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — CTA BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-final-cta">
        <div className="container">
          <div className="fp-final-cta-inner">
            <div className="fp-final-cta-glow" />
            <div className="fp-final-cta-content">
              <div className="fp-final-cta-robot">
                <img src={robotImg} alt="AI Health Assistant" />
              </div>
              <div className="fp-final-cta-text">
                <h2>Ready to Take Control of Your Health?</h2>
                <p>
                  Join thousands of patients who trust MediAI for their healthcare needs.
                  Book your first consultation, try our AI report analyzer, or create your personalized health plan — all for free.
                </p>
              </div>
              <div className="fp-final-cta-actions">
                <Link to="/signup" className="fp-hero-btn fp-hero-btn-primary">
                  Get Started Free <ArrowRight size={16} />
                </Link>
                <Link to="/patient/dashboard/book" className="fp-hero-btn fp-hero-btn-outline-white">
                  Book a Doctor <CalendarCheck size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
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
