import React from 'react';
import { Wifi, BatteryMedium, Signal } from 'lucide-react';

interface MobileContainerProps {
  children: React.ReactNode;
  showStatusBar?: boolean;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({
  children,
  showStatusBar = true
}) => {
  // Current time formatted like 9:41
  const currentTime = '9:41';

  return (
    <div className="app-viewport-wrapper">
      <div className="desktop-preview-toolbar">
        <span>📱 Mobile Preview (Android PWA Viewport)</span>
      </div>

      <div className="mobile-device-frame">
        {showStatusBar && (
          <div className="mobile-status-bar">
            <span>{currentTime}</span>
            <div className="status-bar-notch" />
            <div className="status-bar-icons">
              <Signal size={14} />
              <Wifi size={14} />
              <BatteryMedium size={16} />
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};
