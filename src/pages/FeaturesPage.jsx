import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Brain,
  Bot,
  FileText,
  Pill,
  Star,
  Award,
  Video,
  CalendarCheck,
  ShieldCheck,
  Check,
  CheckCircle2,
  Lock,
  Activity,
  TrendingUp,
  HeartPulse,
  Clock,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  Users,
  CheckCheck,
  Zap,
  RefreshCw,
  Search,
  Stethoscope,
  Microscope,
  Sliders,
  Eye,
} from 'lucide-react';

import featuresHeroImg from '../assets/features-hero.webp';
import robotImg from '../assets/ai-robot-mascot.webp';
import doctorMaleImg from '../assets/doctor-male-hero.webp';

/* ── Interactive Demo Samples ────────────────────────────────────────────── */
const SAMPLE_REPORTS = [
  {
    id: 'cbc',
    name: 'Complete Blood Count (CBC)',
    patient: 'Sarah Khan, 32',
    rawItems: [
      { param: 'Hemoglobin', value: '11.2 g/dL', ref: '12.0 - 15.5', status: 'Low', isAlert: true },
      { param: 'RBC Count', value: '4.1 M/uL', ref: '3.8 - 5.2', status: 'Normal', isAlert: false },
      { param: 'MCV', value: '78 fL', ref: '80 - 100', status: 'Low', isAlert: true },
      { param: 'WBC Count', value: '6.4 K/uL', ref: '4.5 - 11.0', status: 'Normal', isAlert: false },
      { param: 'Platelets', value: '240 K/uL', ref: '150 - 450', status: 'Normal', isAlert: false },
    ],
    doctorSummary: 'Mild iron-deficiency microcytic anemia detected. Hemoglobin 11.2 g/dL with reduced MCV (78 fL). No acute infection or hematologic concern.',
    patientExplanation: 'Your blood count shows slight iron deficiency (anemia), which explains why you may be feeling fatigued. Your white cells and platelets are healthy.',
    recommendation: 'Oral iron supplement (Ferrous Sulfate 325mg daily) with Vitamin C. Repeat CBC in 8 weeks.',
  },
  {
    id: 'lipid',
    name: 'Lipid Profile Panel',
    patient: 'Ali Raza, 45',
    rawItems: [
      { param: 'Total Cholesterol', value: '235 mg/dL', ref: '< 200', status: 'High', isAlert: true },
      { param: 'HDL (Good)', value: '42 mg/dL', ref: '> 40', status: 'Optimal', isAlert: false },
      { param: 'LDL (Bad)', value: '158 mg/dL', ref: '< 100', status: 'Elevated', isAlert: true },
      { param: 'Triglycerides', value: '175 mg/dL', ref: '< 150', status: 'Borderline', isAlert: true },
    ],
    doctorSummary: 'Primary dyslipidemia with elevated LDL (158 mg/dL) and total cholesterol (235 mg/dL). 10-year ASCVD risk warrants lifestyle intervention or low-dose statin.',
    patientExplanation: 'Your cholesterol levels are higher than target, especially LDL. We recommend heart-healthy dietary changes and cardio exercise.',
    recommendation: 'Mediterranean diet, reduce saturated fats, 30 min daily walking. Atorvastatin 10mg consideration.',
  },
  {
    id: 'thyroid',
    name: 'Thyroid Function (TSH)',
    patient: 'Fatima Noor, 29',
    rawItems: [
      { param: 'TSH', value: '5.8 mIU/L', ref: '0.4 - 4.2', status: 'High', isAlert: true },
      { param: 'Free T4', value: '1.2 ng/dL', ref: '0.8 - 1.8', status: 'Normal', isAlert: false },
      { param: 'Free T3', value: '3.1 pg/mL', ref: '2.0 - 4.4', status: 'Normal', isAlert: false },
    ],
    doctorSummary: 'Subclinical hypothyroidism. TSH 5.8 mIU/L with preserved Free T4 and T3. Check thyroid peroxidase (TPO) antibodies.',
    patientExplanation: 'Your thyroid stimulating hormone is slightly elevated, though your active thyroid hormones are normal. It can cause mild lethargy.',
    recommendation: 'Check Anti-TPO antibodies. Monitor TSH in 3 months before initiating Levothyroxine.',
  },
];

/* ── 8 Core Features Grid ────────────────────────────────────────────────── */
const FEATURES_LIST = [
  {
    id: 'lab-summary',
    category: 'ai',
    badge: 'Clinical AI',
    badgeColor: '#2563eb',
    icon: FileText,
    title: '5-Second AI Lab Report Summarizer',
    desc: 'Dense multi-page lab reports are instantly parsed into concise executive summaries with color-coded abnormal flags, diagnostic context, and baseline tracking.',
    bullets: [
      'Automatic normal vs abnormal marker detection',
      'Dual view: Clinical doctor notes & plain patient translation',
      'Historical trend comparison across previous visits',
    ],
  },
  {
    id: 'auto-rx',
    category: 'doctor',
    badge: 'Zero Manual Typing',
    badgeColor: '#7c3aed',
    icon: Pill,
    title: 'AI Auto-Prescription Assistant',
    desc: 'Doctors never have to write prescriptions from scratch. AI listens to consultation dialogue, automatically drafts structured prescriptions with dosages, and checks drug safety.',
    bullets: [
      'Auto-converts spoken diagnosis into structured Rx',
      'Instant allergy & contraindication safety checks',
      '1-Click doctor sign-off & digital patient dispatch',
    ],
  },
  {
    id: 'profile-rank',
    category: 'doctor',
    badge: 'Reputation Engine',
    badgeColor: '#d97706',
    icon: Award,
    title: 'Patient Feedback & Profile Ranking',
    desc: 'Doctor profiles dynamically rank based on verified patient ratings, consultation response times, and patient outcomes — giving top specialists deserved prominence.',
    bullets: [
      'Automated post-consultation patient review collection',
      'Higher ranking boosts visibility in patient search',
      'Verified top doctor badges & credibility index',
    ],
  },
  {
    id: 'telemedicine',
    category: 'general',
    badge: 'Virtual Care',
    badgeColor: '#0284c7',
    icon: Video,
    title: 'Ultra-HD Encrypted Telemedicine',
    desc: 'Direct browser-based 1-to-1 video consultations with end-to-end encryption, screen sharing, integrated medical notes, and live audio transcription.',
    bullets: [
      'Zero download required — works instantly on any device',
      'Side-by-side patient chart and live video feed',
      'Automatic recording & transcription options',
    ],
  },
  {
    id: 'health-plans',
    category: 'patient',
    badge: 'Personalized Care',
    badgeColor: '#10b981',
    icon: HeartPulse,
    title: 'AI Personalized Nutrition & Fitness Plans',
    desc: 'Custom diet, exercise, and wellness roadmaps built according to patient metabolic profiles, chronic conditions, and personal health goals.',
    bullets: [
      'Handles food allergies and dietary restrictions',
      'Adaptive weight gain, loss, or muscle targets',
      'Daily meal swap suggestions with calorie breakdown',
    ],
  },
  {
    id: 'smart-booking',
    category: 'general',
    badge: 'Smart Scheduling',
    badgeColor: '#6366f1',
    icon: CalendarCheck,
    title: 'Smart Scheduling & No-Show Reducer',
    desc: 'Patients easily discover verified doctors by specialty, view real-time availability slots, and receive automated SMS/WhatsApp reminders to eliminate no-shows.',
    bullets: [
      'Instant calendar sync across Google & Outlook',
      'Multi-timezone automatic conversion for remote care',
      'Automated reminder sequence 24h & 1h before call',
    ],
  },
  {
    id: 'ai-assistant',
    category: 'ai',
    badge: '24/7 Companion',
    badgeColor: '#ec4899',
    icon: Bot,
    title: '24/7 AI Health Companion & Triage',
    desc: 'Always-available AI conversational assistant answering patient queries about medications, symptoms, report findings, and directing urgent cases to doctors.',
    bullets: [
      'Instant medical triage & symptom evaluation',
      'Medication reminder schedules & dosage alerts',
      'Patient report Q&A in simple conversational words',
    ],
  },
  {
    id: 'security',
    category: 'security',
    badge: 'Enterprise Grade',
    badgeColor: '#059669',
    icon: ShieldCheck,
    title: 'HIPAA & GDPR Compliant Security',
    desc: 'Bank-grade AES-256 encryption at rest, TLS 1.3 in transit, strict role-based access control, and complete audit logging protect every piece of health data.',
    bullets: [
      'Verified healthcare provider license authentication',
      'Immutable audit trail for all medical record access',
      'Zero unauthorized data sharing or advertising',
    ],
  },
];

export function FeaturesPage() {
  const [activeTab, setActiveTab] = useState('lab'); // 'lab' | 'rx' | 'rank' | 'tele'
  const [selectedReportId, setSelectedReportId] = useState('cbc');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ai' | 'doctor' | 'patient' | 'security'
  const [rxApproved, setRxApproved] = useState(false);

  const currentReport = SAMPLE_REPORTS.find((r) => r.id === selectedReportId) || SAMPLE_REPORTS[0];

  const filteredFeatures = activeFilter === 'all'
    ? FEATURES_LIST
    : FEATURES_LIST.filter((f) => f.category === activeFilter);

  return (
    <div className="feat-page">

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="feat-hero">
        <div className="feat-hero-bg-glow" />
        <div className="feat-hero-bg-dots" />

        <div className="container feat-hero-container">
          <div className="feat-hero-content">
            <div className="feat-hero-eyebrow">
              <Sparkles size={15} />
              <span>NEXT-GEN HEALTHCARE INTELLIGENCE</span>
            </div>

            <h1 className="feat-hero-title">
              Powerful Features Built For<br />
              <span className="feat-hero-title-accent">Smarter Healthcare</span>
            </h1>

            <p className="feat-hero-subtitle">
              From automated clinical notes and 5-second lab summaries to verified doctor profile rankings and HD telemedicine — explore how MediAI transforms the patient & doctor experience.
            </p>

            <div className="feat-hero-actions">
              <Link to="/signup" className="btn btn-primary btn-lg feat-hero-btn">
                Get Started Free <ArrowRight size={18} />
              </Link>
              <a href="#interactive-demo" className="btn btn-secondary btn-lg feat-hero-btn">
                <Zap size={18} /> Try Interactive Demo
              </a>
            </div>

            {/* Quick Metrics Bar */}
            <div className="feat-metrics-bar">
              <div className="feat-metric-item">
                <span className="feat-metric-val">5s</span>
                <span className="feat-metric-lbl">Lab Report Summary</span>
              </div>
              <div className="feat-metric-sep" />
              <div className="feat-metric-item">
                <span className="feat-metric-val">0</span>
                <span className="feat-metric-lbl">Manual Rx Typing</span>
              </div>
              <div className="feat-metric-sep" />
              <div className="feat-metric-item">
                <span className="feat-metric-val">4.9★</span>
                <span className="feat-metric-lbl">Feedback Ranking</span>
              </div>
              <div className="feat-metric-sep" />
              <div className="feat-metric-item">
                <span className="feat-metric-val">100%</span>
                <span className="feat-metric-lbl">HIPAA & AES-256</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="feat-hero-visual-wrap">
            <div className="feat-hero-img-box">
              <img src={featuresHeroImg} alt="MediAI Medical Technology" className="feat-hero-img" />

              {/* Floating Tag 1 */}
              <div className="feat-floating-tag feat-ft-top-left">
                <CheckCircle2 size={16} color="#10b981" />
                <div>
                  <strong>AI Accuracy: 99.4%</strong>
                  <span>Clinical Engine</span>
                </div>
              </div>

              {/* Floating Tag 2 */}
              <div className="feat-floating-tag feat-ft-bottom-right">
                <Pill size={16} color="#7c3aed" />
                <div>
                  <strong>Auto-Prescription</strong>
                  <span>1-Click Approval</span>
                </div>
              </div>

              {/* Floating Tag 3 */}
              <div className="feat-floating-tag feat-ft-bottom-left">
                <FileText size={16} color="#2563eb" />
                <div>
                  <strong>Instant Summary</strong>
                  <span>Normal / Abnormal Flags</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — INTERACTIVE LIVE DEMO SANDBOX
      ══════════════════════════════════════════════════════════════════ */}
      <section className="feat-demo-section" id="interactive-demo">
        <div className="container">
          <div className="feat-section-header">
            <span className="feat-section-eyebrow">HANDS-ON SIMULATION</span>
            <h2 className="feat-section-title">Experience MediAI In Action</h2>
            <p className="feat-section-desc">
              Interact with our core AI engines right now. See how clinical data is digested and transformed in seconds.
            </p>
          </div>

          {/* Interactive Tabs Header */}
          <div className="feat-demo-tabs">
            <button
              onClick={() => setActiveTab('lab')}
              className={`feat-demo-tab ${activeTab === 'lab' ? 'active' : ''}`}
            >
              <FileText size={18} />
              <span>AI Lab Report Explainer</span>
            </button>

            <button
              onClick={() => setActiveTab('rx')}
              className={`feat-demo-tab ${activeTab === 'rx' ? 'active' : ''}`}
            >
              <Pill size={18} />
              <span>AI Auto-Prescriptions</span>
            </button>

            <button
              onClick={() => setActiveTab('rank')}
              className={`feat-demo-tab ${activeTab === 'rank' ? 'active' : ''}`}
            >
              <Award size={18} />
              <span>Feedback & Profile Rank</span>
            </button>

            <button
              onClick={() => setActiveTab('tele')}
              className={`feat-demo-tab ${activeTab === 'tele' ? 'active' : ''}`}
            >
              <Video size={18} />
              <span>HD Telemedicine Room</span>
            </button>
          </div>

          {/* TAB 1: AI Lab Report Explainer */}
          {activeTab === 'lab' && (
            <div className="feat-demo-container animate-fade-in">
              <div className="feat-demo-top-bar">
                <div className="feat-demo-selector-wrap">
                  <span className="feat-selector-lbl">Select Sample Report:</span>
                  <div className="feat-report-buttons">
                    {SAMPLE_REPORTS.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedReportId(r.id)}
                        className={`feat-r-btn ${selectedReportId === r.id ? 'active' : ''}`}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="feat-patient-tag">Patient: {currentReport.patient}</span>
              </div>

              <div className="feat-demo-grid">
                {/* Left: Raw Lab Report Values */}
                <div className="feat-demo-panel">
                  <div className="feat-panel-header">
                    <h4>
                      <Microscope size={17} /> Raw Laboratory Results
                    </h4>
                    <span className="feat-panel-sub">Simulated from 5-page PDF</span>
                  </div>

                  <div className="feat-raw-table-wrap">
                    <table className="feat-raw-table">
                      <thead>
                        <tr>
                          <th>Parameter</th>
                          <th>Result</th>
                          <th>Reference</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentReport.rawItems.map((item, i) => (
                          <tr key={i} className={item.isAlert ? 'feat-row-alert' : ''}>
                            <td className="feat-td-param">{item.param}</td>
                            <td className="feat-td-val">{item.value}</td>
                            <td className="feat-td-ref">{item.ref}</td>
                            <td>
                              <span className={`feat-badge-status ${item.isAlert ? 'alert' : 'ok'}`}>
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right: Instant AI Clinical Executive Summary */}
                <div className="feat-demo-panel feat-panel-ai">
                  <div className="feat-panel-header">
                    <h4>
                      <Bot size={17} /> AI Clinical Executive Summary
                    </h4>
                    <span className="feat-ai-badge">Generated in 1.4s</span>
                  </div>

                  <div className="feat-ai-output-wrap">
                    {/* Doctor Clinical Summary */}
                    <div className="feat-ai-block">
                      <span className="feat-ai-block-title">
                        <Stethoscope size={14} /> Doctor Clinical Finding
                      </span>
                      <p className="feat-ai-text">{currentReport.doctorSummary}</p>
                    </div>

                    {/* Patient Plain English Explanation */}
                    <div className="feat-ai-block feat-ai-block-patient">
                      <span className="feat-ai-block-title">
                        <HeartPulse size={14} /> Plain English Patient Explanation
                      </span>
                      <p className="feat-ai-text">{currentReport.patientExplanation}</p>
                    </div>

                    {/* Recommended Action */}
                    <div className="feat-ai-block feat-ai-block-rec">
                      <span className="feat-ai-block-title">
                        <Sparkles size={14} /> AI Recommended Action
                      </span>
                      <p className="feat-ai-text">{currentReport.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI Auto-Prescription Assistant */}
          {activeTab === 'rx' && (
            <div className="feat-demo-container animate-fade-in">
              <div className="feat-demo-rx-grid">
                {/* Left: Clinical Dialogue & Diagnosis */}
                <div className="feat-demo-panel">
                  <div className="feat-panel-header">
                    <h4>
                      <Stethoscope size={17} /> Consultation Clinical Audio & Notes
                    </h4>
                    <span className="feat-ai-badge">Doctor Doesn't Type Rx</span>
                  </div>

                  <div className="feat-dialogue-box">
                    <div className="feat-dialogue-item">
                      <span className="feat-d-speaker">Dr. Ahmed:</span>
                      <p>"Sarah, your report shows mild iron deficiency. We'll start you on ferrous sulfate with Vitamin C to help absorption, once daily for 8 weeks."</p>
                    </div>
                    <div className="feat-dialogue-item">
                      <span className="feat-d-speaker">Sarah (Patient):</span>
                      <p>"Sounds good doctor, any timing or food guidelines?"</p>
                    </div>
                    <div className="feat-dialogue-item">
                      <span className="feat-d-speaker">Dr. Ahmed:</span>
                      <p>"Take it in the morning with a glass of orange juice. We will recheck your hemoglobin in two months."</p>
                    </div>
                  </div>

                  <div className="feat-ai-listening-bar">
                    <Activity size={18} className="feat-pulse-icon" />
                    <span>AI Transcribing & Auto-generating structured prescription in real time...</span>
                  </div>
                </div>

                {/* Right: Auto-Drafted Structured Prescription */}
                <div className="feat-demo-panel feat-panel-ai">
                  <div className="feat-panel-header">
                    <h4>
                      <Pill size={17} /> AI-Generated Structured Prescription
                    </h4>
                    <span className="feat-ai-badge feat-badge-purple">Zero Manual Writing</span>
                  </div>

                  <div className="feat-rx-draft-list">
                    <div className="feat-rx-item">
                      <div className="feat-rx-top">
                        <strong>1. Ferrous Sulfate 325 mg</strong>
                        <span className="feat-rx-chip">1 Tablet • Oral</span>
                      </div>
                      <span className="feat-rx-sub">Frequency: Once daily with breakfast</span>
                      <div className="feat-rx-safety">
                        <Check size={13} />
                        <span>Allergy check passed: No cross-reactivity detected</span>
                      </div>
                    </div>

                    <div className="feat-rx-item">
                      <div className="feat-rx-top">
                        <strong>2. Ascorbic Acid (Vitamin C) 500 mg</strong>
                        <span className="feat-rx-chip">1 Tablet • Oral</span>
                      </div>
                      <span className="feat-rx-sub">Frequency: Once daily with iron supplement for bioavailability</span>
                      <div className="feat-rx-safety">
                        <Check size={13} />
                        <span>Safe combination verified with clinical database</span>
                      </div>
                    </div>
                  </div>

                  <div className="feat-rx-action-bar">
                    <div className="feat-rx-approval-text">
                      <strong>Doctor Action:</strong> Click approve to sign with cryptographic signature and dispatch to patient's app.
                    </div>
                    <button
                      onClick={() => setRxApproved(!rxApproved)}
                      className={`btn btn-primary ${rxApproved ? 'feat-btn-approved' : 'feat-btn-purple'}`}
                    >
                      {rxApproved ? (
                        <>
                          <CheckCheck size={18} /> Approved & Dispatched to Patient!
                        </>
                      ) : (
                        <>
                          <Check size={18} /> 1-Click Review & Approve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Patient Feedback & Profile Rank */}
          {activeTab === 'rank' && (
            <div className="feat-demo-container animate-fade-in">
              <div className="feat-demo-rank-grid">
                {/* Left: How it Works */}
                <div className="feat-demo-panel">
                  <div className="feat-panel-header">
                    <h4>
                      <Award size={17} /> Verified Patient Review Ingestion
                    </h4>
                    <span className="feat-ai-badge feat-badge-amber">Reputation Engine</span>
                  </div>

                  <p className="feat-panel-intro">
                    Immediately following each consultation, patients rate their experience on communication, clarity, and care quality. These verified reviews directly power search ranking!
                  </p>

                  <div className="feat-review-cards-list">
                    <div className="feat-review-sim-card">
                      <div className="feat-rsc-top">
                        <strong>Sarah Khan</strong>
                        <div className="feat-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                      </div>
                      <p>"Dr. Ahmed explained my AI lab summary with extraordinary empathy. Auto-prescription was ready in seconds."</p>
                      <span className="feat-rsc-date">Verified Patient • Today</span>
                    </div>

                    <div className="feat-review-sim-card">
                      <div className="feat-rsc-top">
                        <strong>Ali Raza</strong>
                        <div className="feat-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={13} fill="#f59e0b" color="#f59e0b" />
                          ))}
                        </div>
                      </div>
                      <p>"Very punctual. He reviewed my blood sugar report instantly and updated my diet plan."</p>
                      <span className="feat-rsc-date">Verified Patient • Yesterday</span>
                    </div>
                  </div>
                </div>

                {/* Right: Resulting Rank & Profile Placement */}
                <div className="feat-demo-panel feat-panel-ai">
                  <div className="feat-panel-header">
                    <h4>
                      <TrendingUp size={17} /> Live Doctor Search Ranking Impact
                    </h4>
                    <span className="feat-rank-highlight">#1 Ranked Cardiologist</span>
                  </div>

                  <div className="feat-rank-display-card">
                    <div className="feat-rdc-profile">
                      <img src={doctorMaleImg} alt="Dr. Ahmed Khan" className="feat-rdc-avatar" />
                      <div>
                        <h4>Dr. Ahmed Khan <CheckCircle2 size={16} color="#2563eb" /></h4>
                        <span>Cardiologist • City Hospital</span>
                        <div className="feat-rdc-score">
                          <Star size={15} fill="#f59e0b" color="#f59e0b" />
                          <strong>4.9</strong>
                          <span>(124 verified patient reviews)</span>
                        </div>
                      </div>
                    </div>

                    <div className="feat-rank-metrics-row">
                      <div className="feat-rm-box">
                        <span className="feat-rmb-val">#1</span>
                        <span className="feat-rmb-lbl">Regional Rank</span>
                      </div>
                      <div className="feat-rm-box">
                        <span className="feat-rmb-val">98%</span>
                        <span className="feat-rmb-lbl">Patient Satisfaction</span>
                      </div>
                      <div className="feat-rm-box">
                        <span className="feat-rmb-val">&lt; 3 min</span>
                        <span className="feat-rmb-lbl">Avg Response Time</span>
                      </div>
                      <div className="feat-rm-box">
                        <span className="feat-rmb-val">+42%</span>
                        <span className="feat-rmb-lbl">More Bookings</span>
                      </div>
                    </div>

                    <div className="feat-rank-notice">
                      <Sparkles size={16} color="#d97706" />
                      <span>Doctors with &gt; 4.8★ rating receive 3x more patient appointment requests automatically.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HD Telemedicine Room */}
          {activeTab === 'tele' && (
            <div className="feat-demo-container animate-fade-in">
              <div className="feat-tele-demo-wrap">
                <div className="feat-tele-screen">
                  <div className="feat-tele-video-mock">
                    <img src={doctorMaleImg} alt="Doctor in consultation" className="feat-tele-doc-bg" />
                    <div className="feat-tele-live-badge">
                      <span className="feat-live-dot" /> LIVE 1080p ENCRYPTED
                    </div>
                    <div className="feat-tele-timer">08:42</div>
                    <div className="feat-tele-pip">
                      <span>Sarah Khan (Patient)</span>
                    </div>
                  </div>

                  {/* Integrated Telemedicine Sidebar */}
                  <div className="feat-tele-sidebar">
                    <div className="feat-ts-header">
                      <Activity size={16} />
                      <h4>Live Telehealth Assistant</h4>
                    </div>

                    <div className="feat-ts-notes">
                      <span className="feat-ts-lbl">Real-time Clinical Transcript:</span>
                      <p>"...reviewing CBC report. Iron deficiency identified. Ferrous sulfate recommended..."</p>
                    </div>

                    <div className="feat-ts-actions">
                      <button className="btn btn-primary btn-sm" style={{ width: '100%', marginBottom: '0.5rem' }}>
                        <Pill size={14} /> Open Auto-Rx Draft
                      </button>
                      <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                        <FileText size={14} /> View Shared Lab Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — ALL 8 CORE CAPABILITIES GRID
      ══════════════════════════════════════════════════════════════════ */}
      <section className="feat-grid-section">
        <div className="container">
          <div className="feat-section-header">
            <span className="feat-section-eyebrow">COMPLETE PLATFORM</span>
            <h2 className="feat-section-title">Built For Patients. Powered For Doctors.</h2>
            <p className="feat-section-desc">
              Explore our full ecosystem of modern healthcare features engineered for speed, accuracy, and patient trust.
            </p>

            {/* Filter Pills */}
            <div className="feat-filter-pills">
              {[
                { id: 'all', label: 'All Capabilities' },
                { id: 'ai', label: 'AI Intelligence' },
                { id: 'doctor', label: 'For Doctors' },
                { id: 'patient', label: 'For Patients' },
                { id: 'security', label: 'Security & HIPAA' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilter(pill.id)}
                  className={`feat-filter-btn ${activeFilter === pill.id ? 'active' : ''}`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* 8 Feature Cards Grid */}
          <div className="feat-cards-grid">
            {filteredFeatures.map((f) => (
              <div key={f.id} className="feat-card">
                <div className="feat-card-top">
                  <div className="feat-card-icon" style={{ background: `${f.badgeColor}12`, color: f.badgeColor }}>
                    <f.icon size={24} />
                  </div>
                  <span className="feat-card-badge" style={{ color: f.badgeColor, background: `${f.badgeColor}14` }}>
                    {f.badge}
                  </span>
                </div>

                <h3 className="feat-card-title">{f.title}</h3>
                <p className="feat-card-desc">{f.desc}</p>

                <ul className="feat-card-bullets">
                  {f.bullets.map((b, i) => (
                    <li key={i}>
                      <Check size={14} color="#10b981" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — COMPARISON TABLE: TRADITIONAL VS MEDIAI
      ══════════════════════════════════════════════════════════════════ */}
      <section className="feat-comparison-section">
        <div className="container">
          <div className="feat-section-header">
            <span className="feat-section-eyebrow">THE MEDIAI DIFFERENCE</span>
            <h2 className="feat-section-title">Traditional Healthcare vs MediAI</h2>
            <p className="feat-section-desc">
              See why modern practices and informed patients choose our intelligent clinical platform.
            </p>
          </div>

          <div className="feat-comparison-table-wrap">
            <table className="feat-comp-table">
              <thead>
                <tr>
                  <th className="feat-comp-th-feat">Clinical Workflow</th>
                  <th className="feat-comp-th-trad">Traditional Process</th>
                  <th className="feat-comp-th-mediai">MediAI Smart Experience</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Lab Report Review</strong></td>
                  <td className="feat-comp-trad">Doctor manually reads multi-page PDFs; patient left confused by jargon.</td>
                  <td className="feat-comp-mediai">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Instant 5-second AI summary with abnormal flags and plain-language explanation.</span>
                  </td>
                </tr>

                <tr>
                  <td><strong>Prescription Writing</strong></td>
                  <td className="feat-comp-trad">10-15 minutes handwriting or manual typing each prescription from scratch.</td>
                  <td className="feat-comp-mediai">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Zero manual typing. AI auto-drafts dosage & safety checks; doctor signs with 1 click.</span>
                  </td>
                </tr>

                <tr>
                  <td><strong>Doctor Discovery & Trust</strong></td>
                  <td className="feat-comp-trad">Unverified static listings with fake or paid recommendations.</td>
                  <td className="feat-comp-mediai">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Transparent ranking powered by verified post-consultation patient feedback and reviews.</span>
                  </td>
                </tr>

                <tr>
                  <td><strong>Telemedicine Quality</strong></td>
                  <td className="feat-comp-trad">Clunky third-party video apps without access to medical history.</td>
                  <td className="feat-comp-mediai">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Browser-based WebRTC HD video with live transcript and integrated patient chart.</span>
                  </td>
                </tr>

                <tr>
                  <td><strong>Follow-ups & Reminders</strong></td>
                  <td className="feat-comp-trad">Manual phone calls; high 25%+ patient appointment no-show rates.</td>
                  <td className="feat-comp-mediai">
                    <CheckCircle2 size={16} color="#10b981" />
                    <span>Automated smart reminder sequences reducing missed consultations to under 3%.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — SECURITY & COMPLIANCE TRUST BAR
      ══════════════════════════════════════════════════════════════════ */}
      <section className="feat-trust-section">
        <div className="container">
          <div className="feat-trust-grid">
            <div className="feat-trust-item">
              <ShieldCheck size={26} color="#2563eb" />
              <div>
                <h4>HIPAA & GDPR Ready</h4>
                <p>Strict patient privacy controls</p>
              </div>
            </div>

            <div className="feat-trust-item">
              <Lock size={26} color="#2563eb" />
              <div>
                <h4>AES-256 Encryption</h4>
                <p>Bank-grade data protection</p>
              </div>
            </div>

            <div className="feat-trust-item">
              <Award size={26} color="#2563eb" />
              <div>
                <h4>Verified Doctor Licenses</h4>
                <p>Medical board verification</p>
              </div>
            </div>

            <div className="feat-trust-item">
              <Zap size={26} color="#2563eb" />
              <div>
                <h4>99.9% Uptime SLA</h4>
                <p>High availability infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — CTA BANNER
      ══════════════════════════════════════════════════════════════════ */}
      <section className="feat-cta-section">
        <div className="container feat-cta-inner">
          <div className="feat-cta-left">
            <div className="feat-cta-icon-wrap">
              <Sparkles size={30} />
            </div>
            <div className="feat-cta-text">
              <h2>Ready to Experience Smarter Healthcare?</h2>
              <p>Join thousands of patients and leading medical specialists using MediAI today.</p>
            </div>
          </div>

          <div className="feat-cta-buttons">
            <Link to="/for-patients" className="btn btn-secondary btn-lg feat-cta-btn">
              For Patients <ArrowRight size={17} />
            </Link>
            <Link to="/for-doctors" className="btn btn-secondary btn-lg feat-cta-btn">
              For Doctors <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — BRAND FOOTER
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
              <a href="#about">About</a>
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

export default FeaturesPage;
