import React from 'react';
import './TitleBar.css';

const TitleBar: React.FC = () => {
  const handleMinimize = () => window.electronAPI.windowMinimize();
  const handleMaximize = () => window.electronAPI.windowMaximize();
  const handleClose = () => window.electronAPI.windowClose();

  return (
    <div className="titlebar">
      <div className="titlebar-drag">
        <div className="titlebar-title">Audiophile Player</div>
      </div>
      <div className="titlebar-controls">
        <button className="titlebar-button" onClick={handleMinimize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="0" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button className="titlebar-button" onClick={handleMaximize}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
        <button className="titlebar-button titlebar-close" onClick={handleClose}>
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="1" />
            <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="1" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
