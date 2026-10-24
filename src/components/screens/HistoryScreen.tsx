import React, { useState } from 'react';
import { Search, ChevronRight, X, Briefcase } from 'lucide-react';
import { ApplicationRecord } from '../../types';
import { Badge } from '../common/Badge';

interface HistoryScreenProps {
  applications: ApplicationRecord[];
  onSelectApplication: (app: ApplicationRecord) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  applications,
  onSelectApplication
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [showSearchInput, setShowSearchInput] = useState(false);

  // Filter chips
  const filterTabs = [
    { label: 'All', count: applications.length },
    { label: 'Sent', count: applications.filter((a) => a.status === 'Sent').length },
    { label: 'Sending', count: applications.filter((a) => a.status === 'Sending').length },
    { label: 'Failed', count: applications.filter((a) => a.status === 'Failed').length },
    { label: 'Unknown', count: applications.filter((a) => a.status === 'Unknown').length },
    { label: 'Pending', count: applications.filter((a) => a.status === 'Pending').length },
    { label: 'Interview', count: applications.filter((a) => a.status === 'Interview').length },
    { label: 'No Reply', count: applications.filter((a) => a.status === 'No Reply').length }
  ];

  const filteredApplications = applications.filter((app) => {
    const matchesFilter =
      selectedFilter === 'All' || app.status.toLowerCase() === selectedFilter.toLowerCase();
    const matchesSearch =
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.recruiterEmail.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="screen-scroll-container">
      {/* Header */}
      <div className="app-header">
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
          Application History
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowSearchInput(!showSearchInput)}
            className="header-action-btn"
            aria-label="Search"
            type="button"
          >
            <Search size={18} />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Expandable Search Input */}
        {showSearchInput && (
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, role or email..."
              className="input-field"
              style={{ paddingRight: '36px' }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                type="button"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Filter Chips Bar */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none'
          }}
        >
          {filterTabs.map((tab) => {
            const isActive = selectedFilter === tab.label;
            return (
              <button
                key={tab.label}
                onClick={() => setSelectedFilter(tab.label)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  backgroundColor: isActive ? 'var(--primary)' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : 'var(--text-main)',
                  transition: 'all 0.15s ease'
                }}
                type="button"
              >
                {tab.label} ({tab.count})
              </button>
            );
          })}
        </div>

        {/* Application Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredApplications.length === 0 ? (
            <div
              className="card"
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <Briefcase size={32} color="#CBD5E1" style={{ margin: '0 auto 10px auto' }} />
              <p style={{ fontSize: '14px', fontWeight: 600 }}>No applications found</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            filteredApplications.map((app) => (
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
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: app.companyLogoBg || '#1E293B',
                      color: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '16px'
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
                      {Number.isNaN(new Date(app.createdAt).getTime())
                        ? app.createdAt
                        : new Date(app.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge status={app.status} />
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
