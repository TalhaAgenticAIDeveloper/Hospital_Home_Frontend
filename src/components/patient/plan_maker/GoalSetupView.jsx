import React, { useState } from 'react';
import {
  Scale,
  Apple,
  Dumbbell,
  Moon,
  Heart,
  Sparkles,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { Button } from '../../common/Button';

const CATEGORIES = [
  {
    key: 'weight_management',
    label: 'Weight Management',
    desc: 'Targeted caloric surplus or deficit for healthy weight loss or muscle gain with macro tracking.',
    icon: Scale,
  },
  {
    key: 'nutrition',
    label: 'Diet & Calorie Tracking',
    desc: 'Wholesome balanced meals, calorie counts, protein targets, and dietary discipline.',
    icon: Apple,
  },
  {
    key: 'fitness_mobility',
    label: 'Fitness & Physical Activity',
    desc: 'Daily workouts, step targets, calories burned, and mobility enhancement routines.',
    icon: Dumbbell,
  },
  {
    key: 'sleep_optimization',
    label: 'Sleep Optimization',
    desc: 'Circadian rhythm synchronization, evening wind-down, and natural sleep hygiene.',
    icon: Moon,
  },
  {
    key: 'stress_reduction',
    label: 'Stress & Mental Wellness',
    desc: 'Mindful breathing, meditation routines, herbal tea guidance, and calm living.',
    icon: Heart,
  },
  {
    key: 'custom',
    label: 'Custom Health Objective',
    desc: 'Personalized wellness plan tailored to your specific daily lifestyle needs.',
    icon: Sparkles,
  },
];

export function GoalSetupView({ onSubmit, isSubmitting }) {
  const [category, setCategory] = useState('weight_management');
  const [title, setTitle] = useState('');
  const [targetDescription, setTargetDescription] = useState('');
  const [targetDurationWeeks, setTargetDurationWeeks] = useState(4);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your wellness goal.');
      return;
    }
    setError('');
    onSubmit({
      category,
      title: title.trim(),
      target_description: targetDescription.trim(),
      target_duration_weeks: Number(targetDurationWeeks),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });
  };

  return (
    <div className="pm-setup-container">
      <div className="pm-setup-hero">
        <div className="pm-setup-badge">
          <Sparkles size={14} />
          <span>AI Clinical Wellness & Plan Maker</span>
        </div>
        <h2 className="pm-setup-title">Set Your Health Objective</h2>
        <p className="pm-setup-desc">
          Tell us what you want to accomplish. Our AI clinician will design a personalized daily routine
          with exact calorie counts, protein macros, and realistic daily schedules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="pm-form-card">
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#b91c1c',
              fontSize: '0.875rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
            }}
          >
            {error}
          </div>
        )}

        {/* 1. Category Selection */}
        <div className="pm-form-group">
          <label className="pm-form-label">1. Choose Your Goal Focus</label>
          <div className="pm-category-grid">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.key;
              return (
                <div
                  key={cat.key}
                  className={`pm-category-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setCategory(cat.key)}
                >
                  <div className="pm-category-icon-box">
                    <Icon size={20} />
                  </div>
                  <div className="pm-category-name">{cat.label}</div>
                  <div className="pm-category-desc">{cat.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Goal Title */}
        <div className="pm-form-group">
          <label className="pm-form-label" htmlFor="goal-title">
            2. Goal Title
          </label>
          <input
            id="goal-title"
            type="text"
            className="pm-form-input"
            placeholder="e.g. Lose 5kg with Healthy Calorie Deficit or Build Muscle Mass"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            required
          />
        </div>

        {/* 3. Target Description (Optional) */}
        <div className="pm-form-group">
          <label className="pm-form-label" htmlFor="goal-desc">
            3. What specific outcome are you targeting? <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-secondary)' }}>(Optional)</span>
          </label>
          <textarea
            id="goal-desc"
            className="pm-form-textarea"
            rows={3}
            placeholder="e.g. I want to lose weight sustainably, maintain high energy for office work (optional)."
            value={targetDescription}
            onChange={(e) => setTargetDescription(e.target.value)}
          />
        </div>

        {/* 4. Target Duration */}
        <div className="pm-form-group" style={{ maxWidth: '320px' }}>
          <label className="pm-form-label" htmlFor="goal-duration">
            <Clock size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
            Plan Duration
          </label>
          <select
            id="goal-duration"
            className="pm-form-select"
            value={targetDurationWeeks}
            onChange={(e) => setTargetDurationWeeks(Number(e.target.value))}
          >
            <option value={2}>2 Weeks (Quick Kickstart)</option>
            <option value={4}>4 Weeks (Recommended Standard)</option>
            <option value={8}>8 Weeks (Deep Habit Transformation)</option>
            <option value={12}>12 Weeks (Long-Term Lifestyle Overhaul)</option>
          </select>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            icon={<ArrowRight size={18} />}
          >
            Continue to Questionnaire
          </Button>
        </div>
      </form>
    </div>
  );
}
