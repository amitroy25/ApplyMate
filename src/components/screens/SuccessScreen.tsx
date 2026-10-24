import React, { useEffect } from 'react';
import { Check, History, PlusCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SuccessScreenProps {
  company: string;
  role: string;
  recipient: string;
  sentDate: string;
  warning?: string;
  onViewHistory: () => void;
  onApplyAnother: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({
  company,
  role,
  recipient,
  sentDate,
  warning,
  onViewHistory,
  onApplyAnother
}) => {
  useEffect(() => {
    // Launch celebratory confetti burst
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.45 },
      colors: ['#4F46E5', '#16A34A', '#F59E0B', '#7C3AED', '#EC4899']
    });
  }, []);

  return (
    <div
      className="screen-scroll-container no-nav"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        padding: '32px 20px',
        textAlign: 'center'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '40px' }}>
        {/* Animated Green Circle with Checkmark */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            backgroundColor: '#16A34A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            boxShadow: '0 12px 28px rgba(22, 163, 74, 0.35)',
            marginBottom: '24px'
          }}
        >
          <Check size={44} strokeWidth={3} />
        </div>

        {/* Success Title */}
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.4px' }}>
          Application Sent!
        </h2>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '280px', lineHeight: 1.4 }}>
          Your application has been sent to{' '}
          <strong style={{ color: 'var(--text-main)' }}>{recipient}</strong>
        </p>

        {warning && (
          <div role="alert" style={{ marginTop: '16px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#92400E', fontSize: '12px', textAlign: 'left' }}>
            {warning}
          </div>
        )}

        {/* Summary Card */}
        <div
          className="card"
          style={{
            width: '100%',
            marginTop: '32px',
            padding: '16px',
            backgroundColor: '#F8FAFC',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Company</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>{company}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Job Title</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>{role}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Sent Time</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#16A34A' }}>{sentDate}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <button
          onClick={onViewHistory}
          className="btn-primary"
          style={{ height: '52px', borderRadius: '16px' }}
          type="button"
        >
          <History size={18} />
          <span>View in History</span>
        </button>

        <button
          onClick={onApplyAnother}
          className="btn-secondary"
          style={{ height: '50px', borderRadius: '16px' }}
          type="button"
        >
          <PlusCircle size={18} />
          <span>Apply for Another Job</span>
        </button>
      </div>
    </div>
  );
};
