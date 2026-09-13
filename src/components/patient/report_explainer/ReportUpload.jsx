import { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FlaskConical,
  X,
} from 'lucide-react';
import { SAMPLE_REPORTS, createSampleReportImageFile } from '../../../data/sampleReports';

const ALLOWED_EXTS = ['.pdf', '.png', '.jpg', '.jpeg'];
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 20 MB

export function ReportUpload({ onUpload, isProcessing }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isPreparingSample, setIsPreparingSample] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setErrorMsg(`Unsupported format '${ext}'. Please upload a PDF, PNG, JPG, or JPEG file.`);
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMsg('File size exceeds the 20 MB limit. Please select a smaller file.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = async (sample) => {
    setErrorMsg('');
    setIsPreparingSample(true);
    try {
      const file = await createSampleReportImageFile(sample.text, sample.filename);
      setSelectedFile(file);
      onUpload(file);
    } catch {
      setErrorMsg('Could not prepare sample report image.');
    } finally {
      setIsPreparingSample(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    onUpload(selectedFile);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="upload-container">
      {/* Hero Welcome Header */}
      <div className="upload-hero">
        <div className="hero-badge">
          <Sparkles size={14} />
          <span>Patient AI Medical Report Explainer</span>
        </div>
        <h1 className="hero-title">
          Understand Your <span className="gradient-text">Lab & Test Reports</span>
        </h1>
        <p className="hero-description">
          Upload your blood tests, pathology labs, or diagnostic summaries. Our clinical AI translates complex medical metrics into clear, easy-to-understand language and answers your follow-up questions.
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="upload-error-card">
          <AlertCircle size={20} className="error-icon" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Drag-and-Drop Card */}
      <div
        className={`dropzone-card ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              validateFile(e.target.files[0]);
            }
          }}
        />

        {!selectedFile ? (
          <div className="dropzone-content">
            <div className="upload-icon-circle">
              <UploadCloud size={38} className="upload-cloud-icon" />
            </div>

            <h3 className="dropzone-heading">
              Drag & drop your medical report here, or <span className="browse-link">browse</span>
            </h3>
            <p className="dropzone-subtext">
              Supports blood tests, metabolic panels, pathology labs, and imaging summaries.
            </p>

            <div className="file-format-tags">
              <span className="format-tag">
                <FileText size={14} /> PDF
              </span>
              <span className="format-tag">
                <ImageIcon size={14} /> PNG
              </span>
              <span className="format-tag">
                <ImageIcon size={14} /> JPG / JPEG
              </span>
              <span className="format-size-limit">Up to 20 MB</span>
            </div>
          </div>
        ) : (
          <div className="file-preview-card" onClick={(e) => e.stopPropagation()}>
            <div className="file-preview-icon">
              {selectedFile.name.endsWith('.pdf') ? (
                <FileText size={32} className="text-primary" />
              ) : (
                <ImageIcon size={32} className="text-accent" />
              )}
            </div>

            <div className="file-preview-info">
              <h4 className="file-preview-name">{selectedFile.name}</h4>
              <p className="file-preview-size">{formatFileSize(selectedFile.size)}</p>
            </div>

            <button
              className="btn-remove-file"
              onClick={() => setSelectedFile(null)}
              title="Remove file"
              disabled={isProcessing}
            >
              <X size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Action Button */}
      {selectedFile && (
        <div className="upload-action-row">
          <button
            className="btn-analyze-report"
            onClick={handleSubmit}
            disabled={isProcessing}
          >
            <Sparkles size={18} />
            <span>{isProcessing ? 'Analyzing...' : 'Generate Medical Explanation'}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Quick Test Samples */}
      <div className="sample-reports-section">
        <div className="samples-header">
          <FlaskConical size={18} className="samples-icon" />
          <span>Don't have a report handy? Try a sample report instantly:</span>
        </div>

        <div className="samples-grid">
          {SAMPLE_REPORTS.map((sample) => (
            <div
              key={sample.id}
              className="sample-card"
              onClick={() => !isProcessing && !isPreparingSample && handleSelectSample(sample)}
            >
              <div className="sample-card-top">
                <span className="sample-category">{sample.category}</span>
                <Sparkles size={14} className="sample-sparkle" />
              </div>
              <h4 className="sample-title">{sample.title}</h4>
              <p className="sample-desc">{sample.summary}</p>
              <div className="sample-cta">
                <span>Test this report</span>
                <ArrowRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
