import React, { useEffect, useRef, useState } from 'react';
import { User, Phone, Briefcase, Code, FileText, CheckCircle2, ChevronRight, Edit3, X, Mail, Loader2 } from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileScreenProps {
  userProfile: UserProfile;
  isProfileReady: boolean;
  isProfileLoading: boolean;
  profileLoadError: string | null;
  onRetryProfileLoad: () => void;
  onUpdateProfile: (updated: UserProfile, resumeFile?: File) => Promise<UserProfile>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  userProfile,
  isProfileReady,
  isProfileLoading,
  profileLoadError,
  onRetryProfileLoad,
  onUpdateProfile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(userProfile);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing && !isSaving) setFormData(userProfile);
  }, [isEditing, isSaving, userProfile]);

  const startEditing = () => {
    if (!isProfileReady) return;
    setFormData(userProfile);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const savedProfile = await onUpdateProfile(formData);
      setFormData(savedProfile);
      setIsEditing(false);
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResumeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsSaving(true);
      setErrorMessage(null);
      try {
        const savedProfile = await onUpdateProfile(userProfile, file);
        setFormData(savedProfile);
      } catch (error) {
        setErrorMessage((error as Error).message);
      } finally {
        setIsSaving(false);
        e.target.value = '';
      }
    }
  };

  return (
    <div className="screen-scroll-container">
      {/* Header */}
      <div className="app-header">
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          Profile
        </h2>
        <button
          onClick={startEditing}
          disabled={!isProfileReady || isSaving}
          className="header-action-btn"
          aria-label="Edit Profile"
          type="button"
        >
          <Edit3 size={18} />
        </button>
      </div>

      {errorMessage && !isEditing && (
        <div role="alert" style={{ margin: '0 20px 12px', color: '#B91C1C', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 12px', fontSize: '12px' }}>
          {errorMessage}
        </div>
      )}
      {!isProfileReady && (
        <div role={profileLoadError ? 'alert' : 'status'} style={{ margin: '0 20px 12px', color: profileLoadError ? '#991B1B' : '#475569', backgroundColor: profileLoadError ? '#FEF2F2' : '#F1F5F9', border: `1px solid ${profileLoadError ? '#FECACA' : '#CBD5E1'}`, borderRadius: '10px', padding: '10px 12px', fontSize: '12px' }}>
          {profileLoadError
            ? `Could not load this account's profile: ${profileLoadError}`
            : isProfileLoading
              ? 'Loading your account profile...'
              : 'Resume upload is unavailable until your account profile has loaded.'}
          {profileLoadError && (
            <button
              type="button"
              onClick={onRetryProfileLoad}
              disabled={isProfileLoading}
              style={{ display: 'block', marginTop: '8px', padding: 0, border: 0, background: 'none', color: '#991B1B', fontWeight: 700, textDecoration: 'underline', cursor: isProfileLoading ? 'wait' : 'pointer' }}
            >
              {isProfileLoading ? 'Retrying...' : 'Retry profile load'}
            </button>
          )}
        </div>
      )}

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* User Card */}
        <div
          className="card"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#EEF2FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
              flexShrink: 0
            }}
          >
            <User size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
              {userProfile.fullName}
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {userProfile.email}
            </span>
          </div>
        </div>

        {/* User Details Rows */}
        <div className="card" style={{ padding: '6px 16px' }}>
          {/* Current Role */}
          <div
            onClick={startEditing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: '1px solid #F1F5F9',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Briefcase size={18} color="var(--primary)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Current Role
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {userProfile.currentRole}
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </div>

          {/* Phone Number */}
          <div
            onClick={startEditing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: '1px solid #F1F5F9',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone size={18} color="var(--primary)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Phone Number
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {userProfile.phone}
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </div>

          {/* Skills */}
          <div
            onClick={startEditing}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0',
              borderBottom: '1px solid #F1F5F9',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Code size={18} color="var(--primary)" />
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Skills
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {userProfile.skills.join(', ')}
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="#94A3B8" />
          </div>

          {/* Resume */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '32px',
                  height: '34px',
                  borderRadius: '6px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #FECACA'
                }}
              >
                <span style={{ fontSize: '7px', fontWeight: 800, color: '#DC2626' }}>PDF</span>
                <FileText size={12} color="#DC2626" />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                  Resume
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                  {userProfile.resumeStoragePath
                    ? `${userProfile.resumeFileName} • ${userProfile.resumeFileSize}`
                    : 'No resume uploaded'}
                </span>
              </div>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!isProfileReady || isSaving}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isProfileReady && !isSaving ? 'pointer' : 'not-allowed',
                opacity: isProfileReady && !isSaving ? 1 : 0.5
              }}
              type="button"
            >
              {isSaving ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} role="status">
                  <Loader2 size={13} className="animate-spin" />
                  Uploading...
                </span>
              ) : 'Change'}
            </button>
          </div>
        </div>

        {/* Hidden Resume file picker */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleResumeFileChange}
          accept="application/pdf"
          disabled={!isProfileReady || isSaving}
          style={{ display: 'none' }}
        />

        {/* Connected Accounts Card */}
        <div>
          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
            Connected Accounts
          </h4>

          <div
            className="card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#EA4335'
                }}
              >
                <Mail size={18} />
              </div>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                  Gmail
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {userProfile.gmailConnected ? userProfile.gmailEmail : 'Not connected'}
                </span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '9999px',
                border: userProfile.gmailConnected ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                backgroundColor: userProfile.gmailConnected ? '#F0FDF4' : '#F8FAFC',
                color: userProfile.gmailConnected ? '#15803D' : '#64748B',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              {userProfile.gmailConnected && <CheckCircle2 size={13} color="#16A34A" />}
              <span>{userProfile.gmailConnected ? 'Connected' : 'Connect in Settings'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            {errorMessage && (
              <div role="alert" style={{ marginBottom: '12px', color: '#B91C1C', fontSize: '12px' }}>
                {errorMessage}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Current Role</label>
                <input
                  type="text"
                  value={formData.currentRole}
                  onChange={(e) => setFormData({ ...formData, currentRole: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="input-label">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={formData.skills.join(', ')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      skills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-secondary"
                style={{ flex: 1 }}
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
                style={{ flex: 1 }}
                type="button"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
