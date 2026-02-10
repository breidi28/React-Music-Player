import React from 'react';
import './AudioSettings.css';

interface AudioSettingsProps {
  audioDevices: MediaDeviceInfo[];
  selectedDevice: string;
  gaplessEnabled: boolean;
  onDeviceChange: (deviceId: string) => void;
  onGaplessToggle: (enabled: boolean) => void;
  onClose: () => void;
}

const AudioSettings: React.FC<AudioSettingsProps> = ({
  audioDevices,
  selectedDevice,
  gaplessEnabled,
  onDeviceChange,
  onGaplessToggle,
  onClose
}) => {
  return (
    <div className="audio-settings-overlay" onClick={onClose}>
      <div className="audio-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="audio-settings-header">
          <h2>Audio Settings</h2>
          <button className="audio-settings-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="audio-settings-content">
          <div className="setting-section">
            <h3>Output Device</h3>
            <p className="setting-description">
              Select the audio output device for playback
            </p>
            <select 
              className="device-select"
              value={selectedDevice}
              onChange={(e) => onDeviceChange(e.target.value)}
            >
              <option value="default">System Default</option>
              {audioDevices.map(device => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Audio Device ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            {audioDevices.length === 0 && (
              <p className="no-devices-message">
                No additional audio devices detected
              </p>
            )}
          </div>

          <div className="setting-section">
            <h3>Gapless Playback</h3>
            <p className="setting-description">
              Preload next track for seamless transitions between songs
            </p>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={gaplessEnabled}
                onChange={(e) => onGaplessToggle(e.target.checked)}
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">
                {gaplessEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          <div className="setting-section info-section">
            <div className="info-icon">ⓘ</div>
            <div className="info-text">
              <p>
                <strong>Gapless Playback:</strong> Eliminates silence between tracks by preloading 
                the next song 5 seconds before the current one ends.
              </p>
              <p>
                <strong>Audio Output:</strong> Change where audio is played (speakers, headphones, etc.). 
                Requires browser support for audio sink selection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioSettings;
