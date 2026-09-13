import { useState } from 'react';
import {
  FileText,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Printer,
  ArrowRight,
  RotateCcw,
  Calendar,
  Layers,
  ShieldAlert,
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ReportChat } from './ReportChat';

export function ReportView({
  session,
  onReset,
  onMessageAdded,
}) {
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation' | 'chat'
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyExplanation = async () => {
    if (!session?.report_explanation) return;
    try {
      await navigator.clipboard.writeText(session.report_explanation);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy explanation:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const chatMessagesCount = (session?.messages || []).filter((m) => !m.is_report_summary).length;

  return (
    <div className="report-view-wrapper">
      {/* Top Header Card */}
      <div className="report-view-header">
        <div className="report-view-title-group">
          <div className="report-badge-icon">
            <FileText size={22} className="text-primary" />
          </div>
          <div>
            <h2 className="report-header-title">{session?.filename || 'Medical Report Analysis'}</h2>
            <div className="report-meta-tags">
              <span className="meta-tag">
                <Calendar size={13} />
                {session?.created_at
                  ? new Date(session.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : ''}
              </span>
              <span className="meta-tag method-tag">
                <Layers size={13} />
                {session?.extraction_method === 'vision_ocr' ? 'Vision OCR' : 'Digital PDF'}
              </span>
            </div>
          </div>
        </div>

        <div className="report-header-actions">
          <button
            className="btn-header-action"
            onClick={handleCopyExplanation}
            title="Copy medical explanation to clipboard"
          >
            {isCopied ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            className="btn-header-action"
            onClick={handlePrint}
            title="Print report summary"
          >
            <Printer size={15} />
            <span>Print</span>
          </button>

          <button
            className="btn-header-action secondary"
            onClick={onReset}
            title="Analyze another report"
          >
            <RotateCcw size={15} />
            <span>Upload New</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="report-nav-tabs">
        <button
          className={`report-tab-btn ${activeTab === 'explanation' ? 'active' : ''}`}
          onClick={() => setActiveTab('explanation')}
        >
          <FileText size={16} />
          <span>Medical Explanation</span>
        </button>

        <button
          className={`report-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={16} />
          <span>Interactive AI Chat</span>
          {chatMessagesCount > 0 && (
            <span className="tab-counter-badge">{chatMessagesCount}</span>
          )}
        </button>
      </div>

      {/* Tab Body */}
      {activeTab === 'explanation' ? (
        <div className="report-content-card">
          <div className="printable-report-area">
            <MarkdownRenderer content={session?.report_explanation} />
          </div>

          {/* Interactive Chat CTA Banner */}
          <div className="chat-cta-banner" onClick={() => setActiveTab('chat')}>
            <div className="chat-cta-info">
              <div className="chat-cta-sparkle">
                <Sparkles size={20} />
              </div>
              <div>
                <h4>Have questions about these test results?</h4>
                <p>Chat interactively with AI about food/diet (e.g. parathas, sweets), lifestyle tips, and what questions to ask your physician.</p>
              </div>
            </div>

            <button className="btn-chat-cta">
              <span>Start Follow-up Chat</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Medical Safety Disclaimer */}
          <div className="report-disclaimer-box">
            <ShieldAlert size={18} className="disclaimer-alert-icon" />
            <p>
              <strong>Educational Disclaimer:</strong> This AI explanation is designed to assist you in understanding clinical terms and is NOT a medical diagnosis or treatment prescription. Always discuss your lab results and treatment plan with your licensed healthcare provider.
            </p>
          </div>
        </div>
      ) : (
        <ReportChat
          sessionId={session?.id}
          messages={session?.messages || []}
          onMessageAdded={onMessageAdded}
        />
      )}
    </div>
  );
}
