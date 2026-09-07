import React, { useState, useEffect } from 'react';
import { meetingApi } from '../../api/meeting';
import { Button } from '../common/Button';
import { Toast } from '../common/Toast';
import { Loader } from '../common/Loader';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

export function AvailabilityManager() {
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // Form state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [slotDate, setSlotDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('13:00');
  const [slotDuration, setSlotDuration] = useState('30');

  useEffect(() => {
    loadSlots();
  }, []);

  const loadSlots = async () => {
    setIsLoading(true);
    try {
      const data = await meetingApi.getMyAvailability(true);
      setSlots(data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load availability slots.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBatch = async (e) => {
    e.preventDefault();
    if (startTime >= endTime) {
      setToast({ type: 'error', message: 'Start time must be strictly before end time.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const startDt = new Date(`${slotDate}T${startTime}:00`);
      const endDt = new Date(`${slotDate}T${endTime}:00`);

      const created = await meetingApi.createAvailabilityBatch({
        start_datetime: startDt.toISOString(),
        end_datetime: endDt.toISOString(),
        slot_duration_minutes: parseInt(slotDuration, 10),
      });

      setToast({
        type: 'success',
        message: `Successfully created ${created.length} available consultation slot(s)!`,
      });
      loadSlots();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to generate availability slots.' });
    } finally {
      setIsSubmitting(false);
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

  // Group slots by date for clear visual calendar layout
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

  return (
    <div className="availability-manager">
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Slot Generator Form */}
        <div className="card" style={{ borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Calendar size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Add Free Timings</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Select a date and time window when you are free for consultations. We will automatically generate bookable slots for patients.
          </p>

          <form onSubmit={handleGenerateBatch}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Consultation Date
              </label>
              <input
                type="date"
                value={slotDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSlotDate(e.target.value)}
                required
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  From (Time)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                  To (Time)
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.35rem' }}>
                Slot Duration
              </label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: '#fff' }}
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes (Recommended)</option>
                <option value="45">45 Minutes</option>
                <option value="60">60 Minutes</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Plus size={16} />}
              style={{ width: '100%' }}
            >
              Generate Availability Slots
            </Button>
          </form>
        </div>

        {/* Quick Tips & Info */}
        <div className="card" style={{ background: '#f8fafc', border: '1px dashed var(--border-color)' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--primary)" />
            How Availability Works
          </h4>
          <ul style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', lineHeight: '1.6' }}>
            <li>Patients can only book appointments during slots you have marked as available.</li>
            <li>Once a patient confirms a booking, the slot is automatically reserved and cannot be double-booked.</li>
            <li>You can delete any unbooked slot at any time if your schedule changes.</li>
            <li>At the meeting time, both you and the patient will see a direct <strong>"Join Video Call"</strong> button.</li>
          </ul>
        </div>
      </div>

      {/* Slots List */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>My Scheduled Free Slots</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Total upcoming: <strong>{slots.length}</strong>
          </span>
        </div>

        {isLoading ? (
          <Loader text="Loading your available slots..." />
        ) : slots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Calendar size={36} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
            <p>You haven't set any free consultation timings yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Use the form above to add your available hours for patients.</p>
          </div>
        ) : (
          Object.entries(groupedSlots).map(([dateLabel, dateSlots]) => (
            <div key={dateLabel} style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.35rem' }}>
                {dateLabel}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {dateSlots.map((slot) => {
                  const sTime = new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const eTime = new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                        <div style={{ fontSize: '0.75rem', color: slot.is_booked ? '#d97706' : '#059669', fontWeight: 600 }}>
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
