import React, { useRef } from 'react';
import { Settings, Image as ImageIcon, FileText, CheckCircle, ChevronRight, ArrowRight, Briefcase } from 'lucide-react';
import { ApplicationRecord, UserProfile, ScreenName } from '../../types';
import { Badge } from '../common/Badge';

interface HomeScreenProps {
  userProfile: UserProfile;
  applications: ApplicationRecord[];
  dailyTarget: number;
  onNavigate: (screen: ScreenName) => void;
  onSelectImage: (file: File | null, previewUrl: string) => void;
  onOpenSettings: () => void;
  onSelectApplication: (app: ApplicationRecord) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userProfile,
  applications,
  dailyTarget,
  onNavigate,
  onSelectImage,
  onOpenSettings,
  onSelectApplication
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive stats dynamically from applications list
  const today = new Date().toDateString();
  const appliedCount = applications.filter(a => a.status === 'Sent' && a.sentAt && new Date(a.sentAt).toDateString() === today).length;
  const pendingCount = applications.filter(a => a.status === 'Pending').length;
  const interviewCount = applications.filter(a => a.status === 'Interview').length;

  const recentApplications = applications.slice(0, 3);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      onSelectImage(file, previewUrl);
      onNavigate('upload');
    }
  };

  const handleUseSampleScreenshot = () => {
    // Navigate with sample preset
    onSelectImage(null, 'sample-linkedin-post');
    onNavigate('upload');
  };

  return (
    <div className="screen-scroll-container">
      {/* Top Header */}
      <div className="app-header">
        <div className="app-brand">
          <div className="brand-icon-box">
            <Briefcase size={20} strokeWidth={2.4} />
          </div>
          <span className="brand-title">ApplyMate</span>
        </div>

        <button
          onClick={onOpenSettings}
          className="header-action-btn"
          aria-label="Settings"
          type="button"
        >
          <Settings size={20} />
        </button>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* User Greeting */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
            Good Morning, {userProfile.fullName.split(' ')[0]}! 👋
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Your next opportunity starts here.
          </p>
        </div>

        {/* 3 Metric Pills */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div className="stat-pill purple">
            <span className="stat-num">{appliedCount}</span>
            <span className="stat-label">Sent today / {dailyTarget}</span>
          </div>

          <div className="stat-pill amber">
            <span className="stat-num">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>

          <div className="stat-pill green">
            <span className="stat-num">{interviewCount}</span>
            <span className="stat-label">Interview</span>
          </div>
        </div>

        {/* Apply for a job Card */}
        <div className="card" style={{ padding: '18px', border: '1px solid #EEF2F6', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ marginBottom: '14px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>
              Apply for a job
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px', lineHeight: 1.4 }}>
              Upload a LinkedIn job post screenshot and we'll extract the details for you.
            </p>
          </div>

          {/* Hidden native file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            style={{ display: 'none' }}
          />

          {/* Upload Drop Area */}
          <div
            className="dropzone-box"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            style={{ marginBottom: '14px', padding: '22px 14px' }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                backgroundColor: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '10px'
              }}
            >
              <ImageIcon size={24} color="#4F46E5" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
              Upload job screenshot
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              JPG or PNG (LinkedIn post)
            </span>
          </div>

          {/* Action Button */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
              style={{ flex: 1, padding: '13px' }}
              type="button"
            >
              <ImageIcon size={18} />
              <span>Choose Image</span>
            </button>
            <button
              onClick={handleUseSampleScreenshot}
              title="Use sample LinkedIn post screenshot for quick test"
              className="btn-secondary"
              style={{ width: 'auto', padding: '13px 14px', fontSize: '13px' }}
              type="button"
            >
              Sample Post
            </button>
          </div>
        </div>

        {/* My Resume Card */}
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#FEE2E2',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #FECACA'
              }}
            >
              <span style={{ fontSize: '9px', fontWeight: 800, color: '#DC2626' }}>PDF</span>
              <FileText size={16} color="#DC2626" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {userProfile.resumeStoragePath ? userProfile.resumeFileName : 'No resume uploaded'}
                </span>
                {userProfile.resumeStoragePath && <CheckCircle size={15} color="#16A34A" />}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {userProfile.resumeStoragePath ? userProfile.resumeFileSize : 'Upload a PDF to send applications'}
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('profile')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
            type="button"
          >
            Change
          </button>
        </div>

        {/* Recent Applications Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main)' }}>
              Recent Applications
            </h3>
            <button
              onClick={() => onNavigate('history')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              type="button"
            >
              <span>View all</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* List of Recent Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="card"
                onClick={() => onSelectApplication(app)}
                style={{
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '12px',
                      backgroundColor: app.companyLogoBg || '#1E293B',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '15px'
                    }}
                  >
                    {app.companyInitial || app.companyName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {app.companyName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {app.jobTitle}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-subtle)', marginTop: '2px' }}>
                      {app.createdAt}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge status={app.status} />
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
