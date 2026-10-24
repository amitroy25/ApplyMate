import React, { useState } from 'react';
import { X, Mail, MapPin, Calendar, FileText, Trash2 } from 'lucide-react';
import { ApplicationRecord, ApplicationStatus } from '../../types';

interface ApplicationDetailModalProps {
  application: ApplicationRecord;
  errorMessage?: string | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}

const ALL_STATUSES: ApplicationStatus[] = [
  'Sent',
  'Pending',
  'Interview',
  'Rejected',
  'No Reply',
  'Draft',
  'Ready',
  'Failed',
  'Unknown'
];

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  errorMessage,
  onClose,
  onUpdateStatus,
  onDelete
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>(application.status);

  const handleStatusChange = (status: ApplicationStatus) => {
    setSelectedStatus(status);
    onUpdateStatus(application.id, status);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90%' }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: application.companyLogoBg || '#1E293B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '17px'
              }}
            >
              {application.companyInitial || application.companyName.charAt(0)}
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                {application.companyName}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {application.jobTitle}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              padding: '4px'
            }}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Info Grid */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={15} color="var(--primary)" />
            <span style={{ color: 'var(--text-muted)' }}>Recipient:</span>
            <strong style={{ color: '#2563EB' }}>{application.recruiterEmail}</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={15} color="var(--primary)" />
            <span style={{ color: 'var(--text-muted)' }}>Location:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{application.location}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="var(--primary)" />
            <span style={{ color: 'var(--text-muted)' }}>Applied:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>
              {Number.isNaN(new Date(application.createdAt).getTime())
                ? application.createdAt
                : new Date(application.createdAt).toLocaleString()}
            </span>
          </div>
        </div>

        {(application.status === 'Failed' || application.status === 'Unknown') && application.sendError && (
          <div role="alert" style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: '12px' }}>
            {application.status === 'Unknown' ? 'Check Gmail before retrying: ' : 'Send failed: '}
            {application.sendError}
          </div>
        )}

        {/* Status Selector */}
        {errorMessage && (
          <div role="alert" style={{ marginBottom: '14px', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '10px 12px', fontSize: '12px' }}>
            {errorMessage}
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>
            Application Status
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {ALL_STATUSES.map((status) => {
              const isSelected = selectedStatus === status;
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid var(--primary)' : '1px solid var(--border-color)',
                    backgroundColor: isSelected ? '#EEF2FF' : '#FFFFFF',
                    color: isSelected ? 'var(--primary)' : 'var(--text-main)'
                  }}
                  type="button"
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>

        {/* Email Preview */}
        <div style={{ marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'block' }}>
            Sent Application Email
          </span>
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '12px 14px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Subject: {application.emailSubject}
            </div>
            <p style={{ fontSize: '12px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {application.emailBody}
            </p>
          </div>
        </div>

        {/* Resume attached info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            backgroundColor: '#FEF2F2',
            borderRadius: '10px',
            border: '1px solid #FECACA',
            marginBottom: '20px'
          }}
        >
          <FileText size={16} color="#DC2626" />
          <div style={{ fontSize: '12px', color: '#991B1B' }}>
            Attached: <strong>{application.resumeFileName}</strong> ({application.resumeFileSize})
          </div>
        </div>

        {/* Delete application action */}
        <button
          onClick={() => onDelete(application.id)}
          className="btn-danger-outline"
          style={{ width: '100%', padding: '12px' }}
          type="button"
        >
          <Trash2 size={16} />
          <span>Delete Application Record</span>
        </button>
      </div>
    </div>
  );
};
