import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Heart,
  CalendarCheck,
  Search,
  Stethoscope,
  FileText,
  ClipboardList,
  Pill,
  Bell,
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
  Clock,
  Eye,
  ChevronRight,
  CircleArrowRight,
  Bot,
} from 'lucide-react';

import patientHero from '../assets/patient-hero.jpg';
import doctorAvatar1 from '../assets/doctor-avatar-1.jpg';
import doctorAvatar2 from '../assets/doctor-avatar-2.jpg';
import doctorAvatar3 from '../assets/doctor-avatar-3.jpg';
import consultationImg from '../assets/consultation-illustration.jpg';
import robotImg from '../assets/ai-robot-mascot.jpg';

/* ── Static Mock Data ──────────────────────────────────────────────────── */
const MOCK_DOCTORS = [
  { id: 1, name: 'Dr. Sarah Khan', specialty: 'General Physician', rating: 4.8, reviews: '2.3k', avatar: doctorAvatar1 },
  { id: 2, name: 'Dr. Asad Raza', specialty: 'Cardiologist', rating: 4.9, reviews: '1.8k', avatar: doctorAvatar2 },
  { id: 3, name: 'Dr. Ayesha Malik', specialty: 'Dermatologist', rating: 4.7, reviews: '1.2k', avatar: doctorAvatar3 },
];

const SPECIALTIES = ['All', 'General Physician', 'Cardiologist', 'Dermatologist', 'Gynecologist'];

const MOCK_ACTIVITY = [
  { id: 1, icon: CalendarCheck, title: 'Appointment Completed', desc: 'Dr. Sarah Khan • General Physician', time: 'Today, 10:30 AM', status: 'Completed', statusColor: '#10b981' },
  { id: 2, icon: FileText, title: 'Lab Report Analysis', desc: 'CBC Report • Explained by AI', time: 'Yesterday, 4:20 PM', status: 'View', statusColor: '#2563eb' },
  { id: 3, icon: ClipboardList, title: 'Meal Plan Updated', desc: 'Weight Gain Plan • 7 Day Plan', time: 'Yesterday, 11:15 AM', status: 'Updated', statusColor: '#f59e0b' },
  { id: 4, icon: Pill, title: 'Prescription Reminder', desc: 'Metformin 500mg • 2 times daily', time: 'Yesterday, 9:00 AM', status: 'Upcoming', statusColor: '#8b5cf6' },
];

const AI_QUESTIONS = [
  'What does my lab report mean?',
  'What foods should I eat for weight gain?',
  'Can you replace this meal? (I\'m allergic)',
  'Remind me about my medication time',
  'I have a follow-up question about my report',
];

export function ForPatientsPage() {
  const { user } = useAuth();
  const [activeSpecialty, setActiveSpecialty] = useState('All');

  // Extract first name from email or name for greeting, default to Ahmed matching mockup
  const userName = user?.name || user?.email?.split('@')[0] || 'Ahmed';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="fp-page">

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-hero">
        <div className="fp-hero-bg-dots" />
        <div className="fp-hero-bg-wave" />

        <div className="container fp-hero-grid">
          {/* Left — Text */}
          <div className="fp-hero-text">
            <span className="hp-eyebrow">WELCOME BACK,</span>
            <h1 className="fp-hero-title">
              Your Health Journey<br />
              <span className="fp-hero-title-accent">Starts Here</span>
            </h1>
            <p className="fp-hero-subtitle">
              Book appointments, get AI-powered health insights, track your progress and achieve your goals — all in one place.
            </p>

            {/* Appointment Search Bar */}
            <Link to="/patient/dashboard/book" className="fp-search-bar">
              <div className="fp-search-icon">
                <CalendarCheck size={18} />
              </div>
              <div className="fp-search-text">
                <span className="fp-search-title">Book an Appointment</span>
                <span className="fp-search-desc">Find the right doctor, at the right time</span>
              </div>
              <div className="fp-search-dot" />
            </Link>
          </div>

          {/* Right — Hero Image + Floating Cards */}
          <div className="fp-hero-visual">
            <div className="fp-hero-img-wrap">
              <img src={patientHero} alt="Patient using health app" className="fp-hero-img" />

              {/* Floating Heart Badge */}
              <div className="fp-floating-heart">
                <Heart size={16} fill="#fff" />
                <span>Your health<br />matters</span>
              </div>

              {/* Speech Bubble */}
              <div className="fp-speech-bubble">
                Stay healthy,<br />Stay happy!
              </div>
            </div>

            {/* Floating Greeting Card */}
            <div className="fp-greeting-card">
              <div className="fp-greeting-header">
                <span>{getGreeting()},</span>
                <span className="fp-greeting-name">{displayName}! ☀️</span>
              </div>
              <div className="fp-health-score">
                <span className="fp-health-label">Health Score</span>
                <div className="fp-score-circle">
                  <svg viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#2563eb" strokeWidth="6"
                      strokeDasharray="213.6" strokeDashoffset="47" strokeLinecap="round"
                      transform="rotate(-90 40 40)" />
                  </svg>
                  <span className="fp-score-value">78%</span>
                </div>
                <span className="fp-score-status">Good</span>
                <span className="fp-score-tip">Keep going! 🚀</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — QUICK ACTIONS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-quick-actions">
        <div className="container">
          <div className="fp-qa-grid">
            {[
              { icon: CalendarCheck, title: 'Book Appointments', desc: 'Schedule with trusted doctors, anytime.', link: '/patient/dashboard/book', color: '#2563eb' },
              { icon: FileText, title: 'Upload Lab Reports', desc: 'Get AI explanations in simple language.', link: '/patient/dashboard/reports', color: '#0284c7' },
              { icon: ClipboardList, title: 'Personalized Plans', desc: 'AI built diet, fitness & health plans for your goals.', link: '/patient/dashboard/reports', color: '#7c3aed' },
              { icon: Pill, title: 'Your Prescriptions', desc: 'View & manage your medications and reminders.', link: '/patient/dashboard/prescriptions', color: '#059669' },
              { icon: Bell, title: 'Notifications', desc: 'Stay updated on your appointments & health.', link: '/patient/dashboard/appointments', color: '#ea580c' },
            ].map((item) => (
              <Link to={item.link} key={item.title} className="fp-qa-card">
                <div className="fp-qa-icon" style={{ background: `${item.color}10`, color: item.color }}>
                  <item.icon size={24} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <div className="fp-qa-arrow" style={{ color: item.color }}>
                  <CircleArrowRight size={20} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — BOOK APPOINTMENTS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-booking">
        <div className="container">
          <div className="fp-booking-grid">
            {/* Left — Doctor Cards */}
            <div className="fp-booking-left">
              <div className="fp-booking-header">
                <div>
                  <h2 className="fp-booking-title">
                    <Stethoscope size={24} className="fp-booking-title-icon" />
                    Book Appointments
                  </h2>
                  <p className="fp-booking-desc">Consult with top doctors, in-person or online.</p>
                </div>
              </div>

              {/* Specialty Tabs */}
              <div className="fp-specialty-tabs">
                {SPECIALTIES.map((spec) => (
                  <button
                    key={spec}
                    className={`fp-specialty-tab ${activeSpecialty === spec ? 'active' : ''}`}
                    onClick={() => setActiveSpecialty(spec)}
                  >
                    {spec}
                  </button>
                ))}
              </div>

              {/* Recommended Doctors */}
              <div className="fp-doctors-header">
                <span className="fp-doctors-label">Recommended Doctors</span>
                <Link to="/patient/dashboard/book" className="fp-view-all">View All <ArrowRight size={14} /></Link>
              </div>

              <div className="fp-doctors-grid">
                {MOCK_DOCTORS.map((doc) => (
                  <div key={doc.id} className="fp-doctor-card">
                    <img src={doc.avatar} alt={doc.name} className="fp-doctor-avatar" />
                    <h4 className="fp-doctor-name">{doc.name}</h4>
                    <p className="fp-doctor-specialty">{doc.specialty}</p>
                    <div className="fp-doctor-rating">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span className="fp-doctor-score">{doc.rating}</span>
                      <span className="fp-doctor-reviews">({doc.reviews} reviews)</span>
                    </div>
                    <Link to="/patient/dashboard/book" className="fp-doctor-book-btn">Book Now</Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Illustration */}
            <div className="fp-booking-right">
              <div className="fp-booking-badges">
                <span className="fp-booking-badge">Quick • Easy • Secure</span>
                <span className="fp-booking-badge fp-booking-badge-accent">
                  <Video size={14} /> Video or In-Person Appointments
                </span>
              </div>
              <img src={consultationImg} alt="Video consultation" className="fp-booking-illustration" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — AI FEATURES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-ai-features">
        <div className="container">
          <div className="fp-ai-grid">
            {/* AI Lab Report Analysis */}
            <div className="fp-ai-card">
              <div className="fp-ai-card-header">
                <div className="fp-ai-card-icon">
                  <Bot size={20} />
                </div>
                <div>
                  <h3>AI Lab Report Analysis</h3>
                  <p>Upload your lab reports and get easy-to-understand explanations, with follow-up questions.</p>
                </div>
              </div>

              <div className="fp-ai-card-body">
                {/* Upload Area */}
                <div className="fp-upload-area">
                  <Upload size={28} className="fp-upload-icon" />
                  <p>Drag & drop your lab report here<br /><span>or</span></p>
                  <Link to="/patient/dashboard/reports" className="fp-upload-btn">Upload File</Link>
                  <span className="fp-upload-hint">Supported formats: PDF, JPG, PNG (Max 10MB)</span>
                </div>

                {/* AI Explain Card */}
                <div className="fp-explain-card">
                  <h4><Sparkles size={16} /> AI Will Explain In Simple Words</h4>
                  <ul className="hp-check-list hp-check-list-compact">
                    <li><Check size={14} /> Normal / Abnormal results</li>
                    <li><Check size={14} /> What it means for your health</li>
                    <li><Check size={14} /> Diet & lifestyle suggestions</li>
                    <li><Check size={14} /> Follow-up questions</li>
                  </ul>
                  <div className="fp-explain-tip">
                    <MessageCircle size={14} />
                    <span>You can also ask me anything about your report!</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Personalized Health Plans */}
            <div className="fp-ai-card">
              <div className="fp-ai-card-header">
                <div className="fp-ai-card-icon fp-ai-card-icon-purple">
                  <HeartPulse size={20} />
                </div>
                <div>
                  <h3>Personalized Health Plans</h3>
                  <p>Set your goal, and let AI create a custom plan just for you.</p>
                </div>
              </div>

              <div className="fp-ai-card-body">
                {/* Goal Icons */}
                <div className="fp-goals-grid">
                  {[
                    { icon: TrendingUp, label: 'Gain Weight', color: '#2563eb' },
                    { icon: Apple, label: 'Lose Weight', color: '#10b981' },
                    { icon: Dumbbell, label: 'Build Muscle', color: '#7c3aed' },
                    { icon: Heart, label: 'Better Health', color: '#ef4444' },
                  ].map((goal) => (
                    <div key={goal.label} className="fp-goal-item">
                      <div className="fp-goal-icon" style={{ background: `${goal.color}10`, color: goal.color }}>
                        <goal.icon size={20} />
                      </div>
                      <span>{goal.label}</span>
                    </div>
                  ))}
                </div>

                <Link to="/patient/dashboard/reports" className="btn btn-primary" style={{ borderRadius: 10, width: '100%', marginTop: '0.5rem' }}>
                  Create My Plan <ArrowRight size={16} />
                </Link>

                {/* Mini Plan Card */}
                <div className="fp-plan-preview">
                  <h4>Your Plan</h4>
                  <ul>
                    <li><Check size={13} /> Meal Plan</li>
                    <li><Check size={13} /> Workout Plan</li>
                    <li><Check size={13} /> Daily Reminders</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — RECENT ACTIVITY + AI ASSISTANT
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-activity-section">
        <div className="container">
          <div className="fp-activity-grid">
            {/* Left — Recent Activity */}
            <div className="fp-activity-card">
              <div className="fp-activity-header">
                <div className="fp-activity-header-left">
                  <Clock size={18} />
                  <h3>Your Recent Activity</h3>
                </div>
                <Link to="/patient/dashboard/appointments" className="fp-view-all">View All <ArrowRight size={14} /></Link>
              </div>

              <div className="fp-activity-list">
                {MOCK_ACTIVITY.map((item) => (
                  <div key={item.id} className="fp-activity-item">
                    <div className="fp-activity-icon">
                      <item.icon size={18} />
                    </div>
                    <div className="fp-activity-info">
                      <span className="fp-activity-title">{item.title}</span>
                      <span className="fp-activity-desc">{item.desc}</span>
                    </div>
                    <div className="fp-activity-meta">
                      <span className="fp-activity-time">{item.time}</span>
                      <span className="fp-activity-status" style={{ color: item.statusColor, background: `${item.statusColor}12` }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — AI Assistant */}
            <div className="fp-assistant-card">
              <div className="fp-assistant-header">
                <h3>Your AI Health Assistant</h3>
                <p>Ask anything about your health, reports, plans or medications.</p>
              </div>

              {/* Suggested Questions */}
              <div className="fp-assistant-questions">
                {AI_QUESTIONS.map((q, i) => (
                  <div key={i} className="fp-assistant-q">
                    <div className="fp-assistant-q-dot" />
                    <span>{q}</span>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="fp-assistant-input">
                <input type="text" placeholder="Type your question here..." readOnly />
                <button className="fp-assistant-send" aria-label="Send">
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Robot Image */}
              <div className="fp-assistant-robot">
                <div className="fp-assistant-bubble">
                  <span>Hi! I'm your<br /><strong>AI Health Assistant.</strong><br />How can I help you today?</span>
                </div>
                <img src={robotImg} alt="AI Assistant" className="fp-assistant-robot-img" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — CTA BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="fp-cta-banner">
        <div className="container fp-cta-banner-inner">
          <div className="fp-cta-banner-icon">
            <HeartPulse size={28} />
          </div>
          <div className="fp-cta-banner-text">
            <h2>Better Health. Brighter Future.</h2>
            <p>With MediAI, you're never alone in your health journey.</p>
          </div>
          <Link to="/patient/dashboard/book" className="btn btn-secondary btn-lg fp-cta-banner-btn">
            Explore Features <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — FOOTER
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
              <a href="#">About</a>
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
