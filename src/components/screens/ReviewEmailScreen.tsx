import React, { useState } from 'react';
import { ArrowLeft, Send, FileText, X, Edit3, Paperclip } from 'lucide-react';
import { UserProfile } from '../../types';

interface ReviewEmailScreenProps {
  recipient: string;
  subject: string;
  body: string;
  userProfile: UserProfile;
  hasResume: boolean;
  onBack: () => void;
  onUpdateEmail: (recipient: string, subject: string, body: string) => void;
  onResumeAttachmentChange: (attached: boolean) => void;
  onGoToProfile: () => void;
  onRequestSend: () => void;
}

export const ReviewEmailScreen: React.FC<ReviewEmailScreenProps> = ({
  recipient,
  subject,
  body,
  userProfile,
  hasResume,
  onBack,
  onUpdateEmail,
  onResumeAttachmentChange,
  onGoToProfile,
  onRequestSend
}) => {
  const [recipientEmail, setRecipientEmail] = useState(recipient);
  const [emailSubject, setEmailSubject] = useState(subject);
  const [emailBody, setEmailBody] = useState(body);
  const [attached, setAttached] = useState(hasResume);

  const handleRecipientChange = (val: string) => {
    setRecipientEmail(val);
    onUpdateEmail(val, emailSubject, emailBody);
  };

  const handleSubjectChange = (val: string) => {
    setEmailSubject(val);
    onUpdateEmail(recipientEmail, val, emailBody);
  };

  const handleBodyChange = (val: string) => {
    setEmailBody(val);
    onUpdateEmail(recipientEmail, emailSubject, val);
  };

  return (
    <div className="screen-scroll-container no-nav" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
      <div>
        {/* Header */}
        <div className="app-header">
          <button onClick={onBack} className="back-btn" aria-label="Go back" type="button">
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
            Review Email
          </h2>
          <div style={{ width: '38px' }} />
        </div>

        <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Recipient Field */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              To
            </span>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => handleRecipientChange(e.target.value)}
              placeholder="recruiter@company.com"
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginTop: '4px',
                fontFamily: 'inherit',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          {/* Subject Field */}
          <div className="card" style={{ padding: '12px 14px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Subject
            </span>
            <input
              type="text"
              value={emailSubject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              placeholder="Application for role"
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--text-main)',
                marginTop: '4px',
                fontFamily: 'inherit',
                backgroundColor: 'transparent'
              }}
            />
          </div>

          {/* Email Body Card */}
          <div className="card" style={{ padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email Body
              </span>
              <Edit3 size={15} color="var(--primary)" />
            </div>

            <textarea
              value={emailBody}
              onChange={(e) => handleBodyChange(e.target.value)}
              rows={9}
              className="textarea-field"
              style={{
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
                fontSize: '13px',
                lineHeight: 1.5,
                padding: '12px'
              }}
            />
          </div>

          {/* Attached Resume */}
          {attached && hasResume ? (
            <div
              className="card"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: '#FEE2E2',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #FECACA'
                  }}
                >
                  <span style={{ fontSize: '8px', fontWeight: 800, color: '#DC2626' }}>PDF</span>
                  <FileText size={14} color="#DC2626" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {userProfile.resumeFileName}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {userProfile.resumeFileSize}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setAttached(false);
                  onResumeAttachmentChange(false);
                }}
                title="Remove attachment"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-subtle)',
                  padding: '4px'
                }}
                type="button"
              >
                <X size={18} />
              </button>
            </div>
          ) : hasResume ? (
            <button
              onClick={() => {
                setAttached(true);
                onResumeAttachmentChange(true);
              }}
              className="btn-secondary"
              style={{ borderStyle: 'dashed' }}
              type="button"
            >
              <Paperclip size={16} />
              <span>Attach Resume ({userProfile.resumeFileName})</span>
            </button>
          ) : (
            <div className="card" style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '12px' }}>
              Upload your PDF resume from Profile before sending an application.
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA Button */}
      <div style={{ padding: '20px' }}>
        {!hasResume && (
          <div style={{ marginBottom: '12px', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: '12px', lineHeight: 1.5 }}>
            Upload your PDF resume once in Profile before sending an application.
          </div>
        )}
        <button
          onClick={hasResume ? onRequestSend : onGoToProfile}
          className="btn-primary"
          style={{ height: '52px', borderRadius: '16px' }}
          disabled={hasResume && !attached}
          type="button"
        >
          {hasResume ? <Send size={18} /> : <FileText size={18} />}
          <span>{!hasResume ? 'Upload Resume' : attached ? 'Send Application' : 'Attach Resume to Continue'}</span>
        </button>
      </div>
    </div>
  );
};
