import { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle,
  MessageSquare,
  FileText,
  Trash2,
  AlertCircle,
  PanelLeftClose,
  PanelLeft,
  History,
} from 'lucide-react';
import { patientReportExplainerApi } from '../../../api/patientReportExplainer';
import { ReportUpload } from './ReportUpload';
import { ReportProcessing } from './ReportProcessing';
import { ReportView } from './ReportView';
import './reportExplainer.css';

export function ReportExplainer() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState(1);
  const [processingFileName, setProcessingFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const data = await patientReportExplainerApi.listSessions();
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to load past report sessions:', err);
    }
  }, []);

  // Load patient's sessions on mount
  useEffect(() => {
    let ignore = false;
    patientReportExplainerApi
      .listSessions()
      .then((data) => {
        if (!ignore) setSessions(data || []);
      })
      .catch((err) => console.error('Failed to load past report sessions:', err));

    return () => {
      ignore = true;
    };
  }, []);

  const handleUploadReport = async (file) => {
    setErrorMessage('');
    setIsProcessing(true);
    setProcessingStage(1);
    setProcessingFileName(file.name);

    // Progressive visual stages while AI analyses the document
    const stage2 = setTimeout(() => setProcessingStage(2), 1500);
    const stage3 = setTimeout(() => setProcessingStage(3), 3200);

    try {
      const res = await patientReportExplainerApi.uploadReport(file);
      clearTimeout(stage2);
      clearTimeout(stage3);

      if (res && res.session_id) {
        // Fetch full session details
        const sessionDetail = await patientReportExplainerApi.getSessionDetail(res.session_id);
        setActiveSession(sessionDetail);
        await loadSessions();
      }
    } catch (err) {
      clearTimeout(stage2);
      clearTimeout(stage3);
      setErrorMessage(err.message || 'Failed to analyze report.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectSession = async (sessionId) => {
    if (activeSession?.id === sessionId) return;
    setErrorMessage('');
    setIsProcessing(false);

    try {
      const sessionDetail = await patientReportExplainerApi.getSessionDetail(sessionId);
      setActiveSession(sessionDetail);
    } catch (err) {
      setErrorMessage(err.message || 'Could not load report session.');
    }
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this report session?')) return;

    try {
      await patientReportExplainerApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete session.');
    }
  };

  const handleStartNewReport = () => {
    setActiveSession(null);
    setErrorMessage('');
    setIsProcessing(false);
  };

  const handleMessageAdded = (newMsg) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      const existing = prev.messages || [];
      const filtered = existing.filter((m) => m.id !== newMsg.id);
      return {
        ...prev,
        messages: [...filtered, newMsg],
      };
    });

    // Update message count in local sessions list
    if (activeSession?.id) {
      setSessions((prev) =>
        prev.map((s) => {
          if (s.id === activeSession.id) {
            return { ...s, message_count: (s.message_count || 1) + 1 };
          }
          return s;
        })
      );
    }
  };

  return (
    <div className="report-explainer-page">
      {/* Sessions Left Sidebar */}
      <aside className={`explainer-sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-row">
            <History size={18} className="text-primary" />
            <span className="sidebar-heading">Past Reports</span>
          </div>
          <button
            className="btn-toggle-sidebar"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
          </button>
        </div>

        {/* New Report Action */}
        <div className="sidebar-action-wrap">
          <button
            className="btn-sidebar-new"
            onClick={handleStartNewReport}
            title="Upload a new report"
          >
            <PlusCircle size={16} />
            <span>Upload New Report</span>
          </button>
        </div>

        {/* Sessions Scroll List */}
        <div className="sidebar-sessions-list">
          {sessions.length === 0 ? (
            <div className="sidebar-empty-state">
              <FileText size={28} className="empty-icon" />
              <p>No previous reports</p>
              <span>Upload a lab test to view its explanation and chat history.</span>
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = activeSession?.id === s.id;
              return (
                <div
                  key={s.id}
                  className={`session-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectSession(s.id)}
                >
                  <div className="session-row-icon">
                    <MessageSquare size={16} />
                  </div>

                  <div className="session-row-body">
                    <h5 className="session-filename" title={s.filename}>
                      {s.filename}
                    </h5>
                    <div className="session-row-sub">
                      <span>
                        {new Date(s.updated_at || s.created_at).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>{s.message_count || 1} msgs</span>
                    </div>
                  </div>

                  <button
                    className="btn-delete-session"
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    title="Delete session"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Feature Body */}
      <div className="explainer-main-content">
        {/* Toggle button when sidebar is collapsed */}
        {!isSidebarOpen && (
          <button
            className="btn-expand-floating"
            onClick={() => setIsSidebarOpen(true)}
            title="Open past reports history"
          >
            <History size={16} />
            <span>History ({sessions.length})</span>
          </button>
        )}

        {/* Error notification banner */}
        {errorMessage && (
          <div className="explainer-alert-banner">
            <AlertCircle size={18} className="alert-icon" />
            <div className="alert-text">
              <strong>Notice:</strong> {errorMessage}
            </div>
          </div>
        )}

        {/* Dynamic Display: Processing vs Active Session vs Upload Zone */}
        {isProcessing ? (
          <ReportProcessing currentStage={processingStage} fileName={processingFileName} />
        ) : activeSession ? (
          <ReportView
            session={activeSession}
            onReset={handleStartNewReport}
            onMessageAdded={handleMessageAdded}
          />
        ) : (
          <ReportUpload onUpload={handleUploadReport} isProcessing={isProcessing} />
        )}
      </div>
    </div>
  );
}
