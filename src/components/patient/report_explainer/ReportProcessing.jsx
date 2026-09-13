import React, { useEffect, useState } from 'react';
import { Check, Loader2, Sparkles, FileSearch, ShieldCheck, HeartPulse } from 'lucide-react';

const STAGES = [
  { id: 1, title: 'Document Validation', desc: 'Checking file structure and integrity', icon: ShieldCheck },
  { id: 2, title: 'Medical Text & OCR Extraction', desc: 'Running digital PDF parser & Vision OCR', icon: FileSearch },
  { id: 3, title: 'Synthesizing Layman Explanation', desc: 'Translating clinical markers into patient-friendly insights', icon: Sparkles },
];

const CLINICAL_TIPS = [
  "Did you know? Understanding your laboratory reference ranges helps you have more productive conversations with your doctor.",
  "Health Tip: Jot down any persistent symptoms alongside your report values before your consultation.",
  "AI explanations clarify test jargon into everyday words, making it easy to know what to ask your physician.",
  "Lifestyle Insight: Simple nutritional adjustments can often improve borderline cholesterol and blood sugar levels.",
];

export function ReportProcessing({ currentStage = 2, fileName = '' }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % CLINICAL_TIPS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const progressPercent = ((currentStage - 0.5) / STAGES.length) * 100;

  return (
    <div className="processing-card glass-panel">
      <div className="processing-glow-effect" />
      
      <div className="processing-spinner-wrapper">
        <div className="pulse-ring" />
        <div className="processing-core-icon">
          <HeartPulse size={28} className="beating-heart" />
        </div>
      </div>

      <h3 className="processing-title">
        Analyzing <span className="gradient-text">{fileName || 'Medical Report'}</span>
      </h3>
      <p className="processing-subtitle">
        Our medical AI is parsing test metrics, checking normal ranges, and preparing your simplified explanation.
      </p>

      {/* Stepper */}
      <div className="stepper-track">
        <div 
          className="stepper-fill-line" 
          style={{ width: `${Math.min(100, Math.max(15, progressPercent))}%` }} 
        />
        
        <div className="stepper-nodes">
          {STAGES.map((s) => {
            const isCompleted = currentStage > s.id;
            const isActive = currentStage === s.id;
            const Icon = s.icon;

            return (
              <div 
                key={s.id} 
                className={`step-node ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
              >
                <div className="step-circle">
                  {isCompleted ? (
                    <Check size={16} strokeWidth={2.5} />
                  ) : isActive ? (
                    <Loader2 size={16} className="spin-icon" />
                  ) : (
                    <Icon size={16} />
                  )}
                </div>
                <div className="step-label">
                  <span className="step-title">{s.title}</span>
                  <span className="step-desc">{s.desc}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rotating Health Tip */}
      <div className="tip-carousel">
        <Sparkles size={16} className="tip-star" />
        <p className="tip-text">{CLINICAL_TIPS[tipIndex]}</p>
      </div>
    </div>
  );
}
