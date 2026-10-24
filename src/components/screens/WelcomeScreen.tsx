import React from 'react';
import { Briefcase, ArrowRight, FileText, Send, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface WelcomeScreenProps {
  isSupabaseConfigured: boolean;
  isAuthenticating: boolean;
  authError: string | null;
  onSignIn: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  isSupabaseConfigured,
  isAuthenticating,
  authError,
  onSignIn
}) => {
  return (
    <div className="screen-scroll-container no-nav" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        {/* App Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px', marginBottom: '12px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 24px -4px rgba(79, 70, 229, 0.4)'
            }}
          >
            <Briefcase size={32} color="#FFFFFF" strokeWidth={2.3} />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            ApplyMate
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
            Turn job posts into applications in seconds.
          </p>
        </div>

        {/* Hero Card Illustration */}
        <div
          style={{
            background: 'linear-gradient(180deg, #F0F4FF 0%, #FFFFFF 100%)',
            border: '1px solid #E0E7FF',
            borderRadius: '20px',
            padding: '18px 16px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          {/* Subtle background glow */}
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              filter: 'blur(20px)'
            }}
          />

          {/* Document Sheet Graphic */}
          <div
            style={{
              width: '140px',
              height: '150px',
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              boxShadow: '0 10px 25px -5px rgba(30, 41, 59, 0.1)',
              border: '1px solid #E2E8F0',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={15} color="#4F46E5" />
              </div>
              <div style={{ height: '7px', width: '45px', backgroundColor: '#E2E8F0', borderRadius: '4px' }} />
            </div>

            <div style={{ height: '5px', width: '90%', backgroundColor: '#F1F5F9', borderRadius: '3px' }} />
            <div style={{ height: '5px', width: '75%', backgroundColor: '#F1F5F9', borderRadius: '3px' }} />
            <div style={{ height: '5px', width: '85%', backgroundColor: '#F1F5F9', borderRadius: '3px' }} />

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={10} color="#16A34A" />
              </div>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#16A34A' }}>Resume Ready</span>
            </div>
          </div>

          {/* Flying Paper Airplane */}
          <div
            style={{
              position: 'absolute',
              right: '30px',
              top: '35px',
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'var(--primary-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              transform: 'rotate(12deg)',
              boxShadow: '0 8px 18px rgba(79, 70, 229, 0.4)'
            }}
          >
            <Send size={22} style={{ transform: 'rotate(10deg)' }} />
          </div>
        </div>

        {/* Feature List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Feature 1 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileText size={18} color="#4F46E5" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                Upload a job-post screenshot
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Extract the role, company, and contact
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Briefcase size={18} color="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                Save your resume once
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Reuse it for every application
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CheckCircle2 size={18} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                Review before every send
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Send with Gmail and track your history
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div style={{ marginTop: '24px' }}>
        {authError && (
          <div role="alert" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '12px' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{authError}</span>
          </div>
        )}
        {!isSupabaseConfigured && (
          <div style={{ marginBottom: '12px', padding: '12px 14px', borderRadius: '12px', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontSize: '12px', lineHeight: 1.5 }}>
            <strong>ApplyMate is not ready yet.</strong> Ask the person who runs this app to finish its one-time setup. You do not need a Supabase account or dashboard access.
          </div>
        )}
        <button
          onClick={onSignIn}
          className="btn-primary"
          style={{ height: '50px', borderRadius: '16px' }}
          disabled={!isSupabaseConfigured || isAuthenticating}
          type="button"
        >
          {isAuthenticating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span>{isSupabaseConfigured ? 'Sign up or sign in with Google' : 'Sign-in setup required'}</span>
              {isSupabaseConfigured && <ArrowRight size={18} />}
            </>
          )}
        </button>
        {isSupabaseConfigured && (
          <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
            New here? Google will create your account securely.
          </p>
        )}
      </div>
    </div>
  );
};
