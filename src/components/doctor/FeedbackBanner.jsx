import React from 'react';
import { AlertOctagon, HelpCircle } from 'lucide-react';

export function FeedbackBanner({ feedback, reviewedAt }) {
  if (!feedback) return null;

  const formattedDate = reviewedAt
    ? new Date(reviewedAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div className="feedback-card animate-slide-up">
      <div className="feedback-header">
        <AlertOctagon size={22} />
        <span>Application Revision Requested by SaaS Admin</span>
      </div>
      <p style={{ fontSize: '0.9rem', color: '#4c0519', marginBottom: '0.25rem' }}>
        Your doctor application was rejected during administrative verification. Please review the specific feedback below, update your details or re-upload clear documents, and re-submit for approval.
      </p>

      <div className="feedback-text">
        <strong>Admin Feedback / Reason:</strong>
        <p style={{ marginTop: '0.25rem', whiteSpace: 'pre-wrap', color: '#1c1917', fontWeight: 500 }}>
          "{feedback}"
        </p>
        {formattedDate && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#9f1239' }}>
            Reviewed on: {formattedDate}
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#9f1239' }}>
        <HelpCircle size={15} />
        <span>Tip: Once you make changes below, click <strong>"Re-Submit Application"</strong> at the bottom of this page.</span>
      </div>
    </div>
  );
}
