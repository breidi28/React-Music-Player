import React, { useState } from 'react';
import './AudioSettingsNew.css';

interface AudioSettingsNewProps {
  audioDevices: MediaDeviceInfo[];
  selectedDevice: string;
  gaplessEnabled: boolean;
  onDeviceChange: (deviceId: string) => void;
  onGaplessToggle: (enabled: boolean) => void;
  onOpenEqualizer: () => void;
  onClose: () => void;
}

const AudioSettingsNew: React.FC<AudioSettingsNewProps> = ({
  audioDevices,
  selectedDevice,
  gaplessEnabled,
  onDeviceChange,
  onGaplessToggle,
  onOpenEqualizer,
  onClose,
}) => {
  const [automixEnabled, setAutomixEnabled] = useState(false);
  const [crossfadeEnabled, setCrossfadeEnabled] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(4);
  const [normalizeVolume, setNormalizeVolume] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="audio-settings-new-overlay">
      <div className="audio-settings-new-modal">
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <div className="settings-user-profile">
              <div className="settings-user-avatar">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
                </svg>
              </div>
              <div className="settings-user-info">
                <h3>Audiophile Player</h3>
                <span className="settings-badge">Premium</span>
              </div>
            </div>
          </div>

          <nav className="settings-nav">
            <a href="#" className="settings-nav-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
              <span>General</span>
            </a>
            <a href="#" className="settings-nav-item active">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
              </svg>
              <span>Audio</span>
            </a>
            <a href="#" className="settings-nav-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
              <span>Appearance</span>
            </a>
            <a href="#" className="settings-nav-item">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              <span>About</span>
            </a>
          </nav>

          <div className="settings-sidebar-footer">
            <div className="settings-version">
              <span>Version 1.0.0</span>
            </div>
          </div>
        </div>

        <div className="settings-main">
          <div className="settings-header">
            <div className="settings-search">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="settings-close-btn" onClick={onClose}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          <div className="settings-content">
            <div className="settings-title-section">
              <h1>Audio Settings</h1>
              <p>Customize your listening experience and output preferences.</p>
            </div>

            {/* Output Device */}
            <section className="settings-section">
              <h2>Output Device</h2>
              <div className="settings-select-wrapper">
                <select
                  value={selectedDevice}
                  onChange={(e) => onDeviceChange(e.target.value)}
                >
                  <option value="default">System Default</option>
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Device ${device.deviceId.substring(0, 8)}`}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z" />
                </svg>
              </div>
              <p className="settings-hint">Select the active device for music playback.</p>
            </section>

            {/* Equalizer */}
            <section className="settings-section">
              <h2>Equalizer</h2>
              <div className="settings-equalizer-card-full" onClick={onOpenEqualizer}>
                <div className="settings-equalizer-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z" />
                  </svg>
                </div>
                <div className="settings-equalizer-content">
                  <h3>Equalizer</h3>
                  <p>Customize audio frequencies for your perfect sound</p>
                </div>
                <button className="settings-equalizer-btn">Open</button>
              </div>
            </section>

            {/* Playback */}
            <section className="settings-section">
              <h2>Playback</h2>
              <div className="settings-toggle-list">
                <div className="settings-toggle-item">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-title">Gapless Playback</span>
                      <span className="settings-toggle-subtitle">Eliminate silence between tracks</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={gaplessEnabled}
                        onChange={(e) => onGaplessToggle(e.target.checked)}
                      />
                      <span className="settings-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-title">Automix</span>
                      <span className="settings-toggle-subtitle">Allow smooth transitions on select playlists</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={automixEnabled}
                        onChange={() => setAutomixEnabled(!automixEnabled)}
                      />
                      <span className="settings-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-toggle-item with-slider">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-title">Crossfade Songs</span>
                      <span className="settings-toggle-subtitle">Fade out current song while fading in next</span>
                    </div>
                    {crossfadeEnabled && (
                      <div className="settings-slider-wrapper-inline">
                        <span className="settings-slider-label">0s</span>
                        <input
                          type="range"
                          min="0"
                          max="12"
                          value={crossfadeDuration}
                          onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
                          className="settings-slider"
                        />
                        <span className="settings-slider-value">{crossfadeDuration}s</span>
                      </div>
                    )}
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={crossfadeEnabled}
                        onChange={() => setCrossfadeEnabled(!crossfadeEnabled)}
                      />
                      <span className="settings-toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-toggle-item">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-title">Normalize Volume</span>
                      <span className="settings-toggle-subtitle">Set the same volume level for all songs</span>
                    </div>
                    <label className="settings-toggle">
                      <input
                        type="checkbox"
                        checked={normalizeVolume}
                        onChange={() => setNormalizeVolume(!normalizeVolume)}
                      />
                      <span className="settings-toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioSettingsNew;
