import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface HeaderBarProps {
  title?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showBack?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onBack,
  rightAction,
  showBack = true
}) => {
  return (
    <div className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
        <div style={{ width: '40px' }}>
          {showBack && onBack && (
            <button
              onClick={onBack}
              className="back-btn"
              aria-label="Go back"
              type="button"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        {title && (
          <h1
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-main)',
              textAlign: 'center',
              flex: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {title}
          </h1>
        )}

        <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          {rightAction}
        </div>
      </div>
    </div>
  );
};
