import React from 'react';
import { Home, History, User } from 'lucide-react';
import { ScreenName } from '../../types';

interface BottomNavProps {
  currentScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${currentScreen === 'home' ? 'active' : ''}`}
        onClick={() => onNavigate('home')}
        type="button"
      >
        <Home size={20} strokeWidth={currentScreen === 'home' ? 2.5 : 2} />
        <span>Home</span>
      </button>

      <button
        className={`nav-item ${currentScreen === 'history' ? 'active' : ''}`}
        onClick={() => onNavigate('history')}
        type="button"
      >
        <History size={20} strokeWidth={currentScreen === 'history' ? 2.5 : 2} />
        <span>History</span>
      </button>

      <button
        className={`nav-item ${currentScreen === 'profile' ? 'active' : ''}`}
        onClick={() => onNavigate('profile')}
        type="button"
      >
        <User size={20} strokeWidth={currentScreen === 'profile' ? 2.5 : 2} />
        <span>Profile</span>
      </button>
    </nav>
  );
};
