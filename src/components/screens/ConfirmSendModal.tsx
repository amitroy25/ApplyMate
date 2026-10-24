import React from 'react';
import { Mail, Building2, Briefcase, Paperclip, Send, X, Loader2 } from 'lucide-react';

interface ConfirmSendModalProps {
  company: string;
  role: string;
  recipient: string;
  resumeFileName: string;
  resumeFileSize: string;
  errorMessage: string | null;
  isResumeAttached: boolean;
  isSending: boolean;
  onCancel: () => void;
  onConfirmSend: () => void;
}

export const ConfirmSendModal: React.FC<ConfirmSendModalProps> = ({
  company,
  role,
  recipient,
  resumeFileName,
  resumeFileSize,
  errorMessage,
  isResumeAttached,
  isSending,
  onCancel,
  onConfirmSend
}) => {
  return (
    <div className="modal-overlay" onClick={isSending ? undefined : onCancel}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        {!isSending && (
          <button
            onClick={onCancel}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-subtle)'
            }}
            type="button"
          >
            <X size={20} />
          </button>
        )}

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#EEF2FF',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              color: 'var(--primary)'
            }}
          >
            <Mail size={26} strokeWidth={2.2} />
          </div>

          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            Send Application?
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Please review the details before sending.
          </p>
        </div>

        {/* Summary Details Card */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginBottom: '20px'
          }}
        >
          {/* Company */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={16} color="var(--primary)" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Company</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{company}</span>
            </div>
          </div>

          {/* Role */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={16} color="var(--primary)" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Role</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{role}</span>
            </div>
          </div>

          {/* Recipient */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={16} color="var(--primary)" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Recipient</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#2563EB' }}>{recipient}</span>
            </div>
          </div>

          {/* Attachment */}
          {isResumeAttached && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Paperclip size={16} color="var(--primary)" />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Attachment</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                {resumeFileName} ({resumeFileSize})
              </span>
            </div>
          </div>
          )}
        </div>

        {errorMessage && (
          <div role="alert" style={{ color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', marginBottom: '16px' }}>
            {errorMessage}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onCancel}
            disabled={isSending}
            className="btn-secondary"
            style={{ flex: 1 }}
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={onConfirmSend}
            disabled={isSending}
            className="btn-primary"
            style={{ flex: 1.2 }}
            type="button"
          >
            {isSending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Now</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
