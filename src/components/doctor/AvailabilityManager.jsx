import React, { useState, useEffect } from 'react';
import { meetingApi } from '../../api/meeting';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Loader } from '../common/Loader';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  Zap,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_SCHEDULE = DAY_NAMES.map((_, idx) => ({
  day_of_week: idx,
  start_time: '09:00',
  end_time: '17:00',
  slot_duration_minutes: 30,
  is_active: idx < 5, // Mon-Fri active by default
}));

export function AvailabilityManager() {
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState(null);
  const [weeksAhead, setWeeksAhead] = useState(1);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Weekly schedule state — 7 days
  const [weeklySchedule, setWeeklySchedule] = useState(DEFAULT_SCHEDULE);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [slotsData, scheduleData] = await Promise.all([
        meetingApi.getMyAvailability(true),
        meetingApi.getWeeklySchedule().catch(() => []),
      ]);
      setSlots(slotsData);

      // Merge saved schedule with defaults
      if (scheduleData && scheduleData.length > 0) {
        const merged = DEFAULT_SCHEDULE.map((defaultDay) => {
          const saved = scheduleData.find((s) => s.day_of_week === defaultDay.day_of_week);
          if (saved) {
            return {
              day_of_week: saved.day_of_week,
              start_time: saved.start_time,
              end_time: saved.end_time,
              slot_duration_minutes: saved.slot_duration_minutes,
              is_active: saved.is_active,
            };
          }
          return { ...defaultDay, is_active: false };
        });
        setWeeklySchedule(merged);
        setScheduleLoaded(true);
      }
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load data.' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDay = (dayIndex, field, value) => {
    setWeeklySchedule((prev) =>
      prev.map((day) => (day.day_of_week === dayIndex ? { ...day, [field]: value } : day))
    );
    setHasUnsavedChanges(true);
  };

  const toggleDay = (dayIndex) => {
    setWeeklySchedule((prev) =>
      prev.map((day) => (day.day_of_week === dayIndex ? { ...day, is_active: !day.is_active } : day))
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveSchedule = async () => {
    // Validate active days have proper times
    for (const day of weeklySchedule) {
      if (day.is_active && day.start_time >= day.end_time) {
        setToast({
          type: 'error',
          message: `${DAY_NAMES[day.day_of_week]}: Start time must be before end time.`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await meetingApi.saveWeeklySchedule({ schedule: weeklySchedule });
      setToast({ type: 'success', message: 'Weekly schedule saved successfully!' });
      setHasUnsavedChanges(false);
      setScheduleLoaded(true);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save weekly schedule.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateSlots = async () => {
    setIsGenerating(true);
    try {
      const created = await meetingApi.generateSlotsFromSchedule({
        weeks_ahead: weeksAhead,
        timezone_offset_minutes: new Date().getTimezoneOffset(),
      });
      setToast({
        type: 'success',
        message: `Successfully generated ${created.length} consultation slot(s) for the next ${weeksAhead} week(s)!`,
      });
      // Reload slots list
      const slotsData = await meetingApi.getMyAvailability(true);
      setSlots(slotsData);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to generate slots from schedule.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await meetingApi.deleteAvailabilitySlot(slotId);
      setToast({ type: 'success', message: 'Availability slot removed.' });
      setSlots(slots.filter((s) => s.id !== slotId));
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Could not delete slot.' });
    }
  };

  // Group slots by date for visual layout
  const groupedSlots = slots.reduce((acc, slot) => {
    const d = new Date(slot.start_time).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot);
    return acc;
  }, {});

  if (isLoading) {
    return <Loader text="Loading availability settings..." />;
  }

  return (
    <div className="availability-manager">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* ─── Weekly Schedule Grid ─────────────────────────────────────────── */}
      <div className="card" style={{ borderTop: '4px solid var(--primary)', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Calendar size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Weekly Availability Schedule</h3>
          </div>
          {hasUnsavedChanges && (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#f59e0b',
                fontWeight: 600,
                background: '#fffbeb',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid #fde68a',
              }}
            >
              Unsaved Changes
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Set your weekly availability once — toggle days on/off, set times, then generate bookable slots for patients automatically.
        </p>

        {/* 7-Day Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.25rem' }}>
          {weeklySchedule.map((day) => (
            <div
              key={day.day_of_week}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.7rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid',
                borderColor: day.is_active ? 'var(--primary)' : 'var(--border-color)',
                background: day.is_active ? 'rgba(20, 184, 166, 0.04)' : '#fafafa',
                opacity: day.is_active ? 1 : 0.7,
                transition: 'all 0.2s ease',
              }}
            >
              {/* Day name + toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onClick={() => toggleDay(day.day_of_week)}
              >
                {day.is_active ? (
                  <ToggleRight size={22} color="var(--primary)" />
                ) : (
                  <ToggleLeft size={22} color="#94a3b8" />
                )}
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: day.is_active ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {DAY_NAMES[day.day_of_week]}
                </span>
              </div>

              {/* Time inputs (only if active) */}
              {day.is_active ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <input
                    type="time"
                    value={day.start_time}
                    step="60"
                    onChange={(e) => updateDay(day.day_of_week, 'start_time', e.target.value)}
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      minWidth: '110px',
                    }}
                  />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>to</span>
                  <input
                    type="time"
                    value={day.end_time}
                    step="60"
                    onChange={(e) => updateDay(day.day_of_week, 'end_time', e.target.value)}
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.85rem',
                      minWidth: '110px',
                    }}
                  />
                  <select
                    value={day.slot_duration_minutes}
                    onChange={(e) => updateDay(day.day_of_week, 'slot_duration_minutes', parseInt(e.target.value, 10))}
                    style={{
                      padding: '0.4rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.8rem',
                      background: '#fff',
                      minWidth: '85px',
                    }}
                  >
                    <option value={15}>15 min</option>
                    <option value={30}>30 min</option>
                    <option value={45}>45 min</option>
                    <option value={60}>60 min</option>
                  </select>
                </div>
              ) : (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Day off — click toggle to enable
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Save button */}
        <Button
          variant="primary"
          onClick={handleSaveSchedule}
          isLoading={isSubmitting}
          icon={<Save size={16} />}
          style={{ width: '100%', marginBottom: '1rem' }}
        >
          Save Weekly Schedule
        </Button>

        {/* Generate Slots Section */}
        {scheduleLoaded && (
          <div
            style={{
              padding: '1rem',
              background: 'linear-gradient(135deg, #f0fdfa, #ecfdf5)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #99f6e4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <Zap size={18} color="#0d9488" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f766e' }}>
                Generate Bookable Slots
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#115e59', marginBottom: '0.75rem', lineHeight: 1.5 }}>
              Based on your saved schedule, auto-create individual bookable slots for patients. 
              Already existing or conflicting slots will be skipped.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                value={weeksAhead}
                onChange={(e) => setWeeksAhead(parseInt(e.target.value, 10))}
                style={{
                  padding: '0.5rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid #99f6e4',
                  fontSize: '0.85rem',
                  background: '#fff',
                }}
              >
                <option value={1}>Next 1 Week</option>
                <option value={2}>Next 2 Weeks</option>
                <option value={3}>Next 3 Weeks</option>
                <option value={4}>Next 4 Weeks</option>
              </select>

              <Button
                variant="primary"
                onClick={handleGenerateSlots}
                isLoading={isGenerating}
                icon={<RefreshCw size={16} />}
                style={{ flex: 1 }}
              >
                Generate Slots
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ─── How It Works Info ────────────────────────────────────────────── */}
      <div className="card" style={{ background: '#f8fafc', border: '1px dashed var(--border-color)', marginBottom: '1.5rem' }}>
        <h4
          style={{
            fontSize: '1rem',
            color: 'var(--text-primary)',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Clock size={18} color="var(--primary)" />
          How It Works
        </h4>
        <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
          <li><strong>Step 1:</strong> Toggle on the days you are available and set your free hours for each day.</li>
          <li><strong>Step 2:</strong> Click <strong>"Save Weekly Schedule"</strong> to store your template.</li>
          <li><strong>Step 3:</strong> Click <strong>"Generate Slots"</strong> to create actual bookable slots for upcoming days.</li>
          <li>Slots are generated at <strong>exact minute precision</strong> (e.g., 12:10–12:25 with 15-min duration).</li>
          <li>You can delete any unbooked slot individually after generation.</li>
          <li>Run <strong>"Generate Slots"</strong> again anytime — duplicates are automatically skipped.</li>
        </ul>
      </div>

      {/* ─── Slots List ──────────────────────────────────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>My Scheduled Free Slots</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total upcoming: <strong>{slots.length}</strong>
          </span>
        </div>

        {slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p>No upcoming consultation slots yet.</p>
            <p style={{ fontSize: '0.85rem' }}>
              Save your weekly schedule above and click "Generate Slots" to create bookable timings.
            </p>
          </div>
        ) : (
          Object.entries(groupedSlots).map(([dateLabel, dateSlots]) => (
            <div key={dateLabel} style={{ marginBottom: '1.5rem' }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: 'var(--primary)',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.35rem',
                }}
              >
                {dateLabel}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {dateSlots.map((slot) => {
                  const sTime = new Date(slot.start_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const eTime = new Date(slot.end_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={slot.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor: slot.is_booked ? '#f59e0b' : '#10b981',
                        background: slot.is_booked ? '#fffbeb' : '#f0fdf4',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {sTime} - {eTime}
                        </div>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: slot.is_booked ? '#d97706' : '#059669',
                            fontWeight: 600,
                          }}
                        >
                          {slot.is_booked ? 'Booked' : 'Open for Booking'}
                        </div>
                      </div>

                      {!slot.is_booked && (
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          title="Remove slot"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            borderRadius: '4px',
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
