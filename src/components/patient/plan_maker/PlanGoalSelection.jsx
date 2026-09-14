import React, { useState } from 'react';
import {
  Scale,
  Moon,
  Activity,
  Heart,
  Utensils,
  Sparkles,
  ArrowRight,
  Clock,
  Globe,
  Loader2,
} from 'lucide-react';
import { Button } from '../../common/Button';

const CATEGORIES = [
  {
    key: 'weight_management',
    title: 'Weight Management',
    desc: 'Sustainable caloric balance, high-protein meals, and gentle daily activity.',
    icon: Scale,
  },
  {
    key: 'sleep_optimization',
    title: 'Better Sleep Routine',
    desc: 'Circadian rhythm alignment, evening wind-down, and restful habits.',
    icon: Moon,
  },
  {
    key: 'fitness_mobility',
    title: 'Fitness & Mobility',
    desc: 'Daily physical movement, flexibility stretching, and functional strength.',
    icon: Activity,
  },
  {
    key: 'stress_reduction',
    title: 'Stress & Mental Balance',
    desc: 'Daily relaxation, breathing techniques, and balanced work-life pacing.',
    icon: Heart,
  },
  {
    key: 'nutrition',
    title: 'Nutrition & Gut Health',
    desc: 'Whole-foods meal timing, optimal hydration, and dietary balance.',
    icon: Utensils,
  },
  {
    key: 'custom',
    title: 'Custom Wellness Goal',
    desc: 'Personalized routine tailored to your unique lifestyle aspirations.',
    icon: Sparkles,
  },
];

export function PlanGoalSelection({ onGoalCreated }) {
  const detectedTz =
    typeof Intl !== 'undefined' && Intl.DateTimeFormat
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC';

  const [selectedCat, setSelectedCat] = useState('weight_management');
  const [title, setTitle] = useState('Healthy Weight Management Routine');
  const [description, setDescription] = useState(
    'I want to build a sustainable daily routine to improve my energy and reach a healthy body weight over the next month.'
  );
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [timezone, setTimezone] = useState(detectedTz);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleCategorySelect = (catKey) => {
    setSelectedCat(catKey);
    const cat = CATEGORIES.find((c) => c.key === catKey);
    if (cat) {
      if (catKey === 'weight_management') {
        setTitle('Healthy Weight Management Routine');
        setDescription(
          'I want to build a sustainable daily routine to improve my energy and reach a healthy body weight.'
        );
      } else if (catKey === 'sleep_optimization') {
        setTitle('Restorative Sleep & Evening Routine');
        setDescription(
          'I want to fall asleep earlier, sleep soundly through the night, and wake up refreshed.'
        );
      } else if (catKey === 'fitness_mobility') {
        setTitle('Daily Mobility & Active Living Plan');
        setDescription(
          'I want to increase my daily physical activity and feel more energetic and agile.'
        );
      } else if (catKey === 'stress_reduction') {
        setTitle('Daily Stress Relief & Mindful Living');
        setDescription(
          'I want to incorporate relaxation habits to reduce daily stress and feel more calm.'
        );
      } else if (catKey === 'nutrition') {
        setTitle('Whole-Foods Nutrition & Energy Plan');
        setDescription(
          'I want to eat healthier, balanced meals and improve my daily hydration.'
        );
      } else {
        setTitle('My Personalized Wellness Goal');
        setDescription('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a goal title.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setError('Please provide a brief description of what you wish to achieve.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onGoalCreated({
        title: title.trim(),
        category: selectedCat,
        target_description: description.trim(),
        timezone: timezone || 'UTC',
        target_duration_weeks: Number(durationWeeks) || 4,
      });
    } catch (err) {
      setError(err?.message || 'Failed to start goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pm-card">
      <div className="pm-card-header">
        <div>
          <h2 className="pm-card-title">
            <Sparkles size={24} color="var(--primary)" />
            Choose Your Health & Wellness Goal
          </h2>
          <p className="pm-card-subtitle">
            Select a target area below to start your guided, failure-safe questionnaire.
            Our AI will personalize your daily routine grounded in safe clinical rules.
          </p>
        </div>
      </div>

      {error && (
        <div className="pm-alert pm-alert-error" style={{ marginBottom: '1.25rem' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Category Grid */}
      <div className="pm-category-grid">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCat === cat.key;
          return (
            <div
              key={cat.key}
              className={`pm-category-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCategorySelect(cat.key)}
              role="button"
              tabIndex={0}
            >
              <div className="pm-cat-icon">
                <Icon size={22} />
              </div>
              <div className="pm-cat-title">{cat.title}</div>
              <div className="pm-cat-desc">{cat.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Form Details */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Goal Title
          </label>
          <input
            type="text"
            className="pm-input-field"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Healthy Weight Management Routine"
            disabled={isSubmitting}
            maxLength={255}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            What would you like to achieve in your own words?
          </label>
          <textarea
            className="pm-input-field"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your current lifestyle and what success looks like for you..."
            disabled={isSubmitting}
            maxLength={2000}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              <Clock size={15} color="var(--primary)" /> Target Duration
            </label>
            <select
              className="pm-input-field"
              value={durationWeeks}
              onChange={(e) => setDurationWeeks(e.target.value)}
              disabled={isSubmitting}
            >
              <option value={2}>2 Weeks (Jumpstart)</option>
              <option value={4}>4 Weeks (Standard Habit)</option>
              <option value={8}>8 Weeks (Deep Transformation)</option>
              <option value={12}>12 Weeks (Long-Term Lifestyle)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              <Globe size={15} color="var(--primary)" /> Timezone (for daily schedule)
            </label>
            <input
              type="text"
              className="pm-input-field"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g., UTC, Asia/Karachi, America/New_York"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            icon={isSubmitting ? <Loader2 className="spinner" size={18} /> : <ArrowRight size={18} />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Starting Questionnaire...' : 'Start Personalized Questionnaire'}
          </Button>
        </div>
      </form>
    </div>
  );
}
