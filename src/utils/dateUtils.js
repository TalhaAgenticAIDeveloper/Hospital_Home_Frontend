/**
 * Date and time formatting utilities anchored strictly to Pakistan Standard Time (PKT / Asia/Karachi).
 * Ensures consistency across patient and doctor portals regardless of client machine or server timezone.
 */

export const PKT_TIMEZONE = 'Asia/Karachi';

/**
 * Format a date object or ISO string to PKT time string (e.g. "09:30 AM").
 */
export function formatPktTime(dateInput, options = {}) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', {
    timeZone: PKT_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options,
  });
}

/**
 * Format a date object or ISO string to PKT date string (e.g. "Mon, Oct 12, 2026").
 */
export function formatPktDate(dateInput, options = {}) {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    timeZone: PKT_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
}

/**
 * Format a date object or ISO string to PKT date and time string (e.g. "Mon, Oct 12, 2026 at 09:30 AM").
 */
export function formatPktDateTime(dateInput, options = {}) {
  if (!dateInput) return '';
  const dStr = formatPktDate(dateInput, options.dateOptions);
  const tStr = formatPktTime(dateInput, options.timeOptions);
  return `${dStr} at ${tStr}`;
}
