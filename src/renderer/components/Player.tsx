import React from 'react';
import { Track } from '../types';
import './Player.css';

interface PlayerProps {
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onShowNowPlaying?: () => void;
  onShowSignalPath?: () => void;
  onShowQueue?: () => void;
  onShowEqualizer?: () => void;
  onShowAudioSettings?: () => void;
  isShuffled?: boolean;
  repeatMode?: 'off' | 'all' | 'one';
  onToggleShuffle?: () => void;
  onToggleRepeat?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const Player: React.FC<PlayerProps> = ({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onShowNowPlaying,
  onShowSignalPath,
  onShowQueue,
  onShowEqualizer,
  onShowAudioSettings,
  isShuffled = false,
  repeatMode = 'off',
  onToggleShuffle,
  onToggleRepeat,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const getQualityBadge = () => {
    if (!track) return null;
    
    if (track.lossless) {
      if (track.sampleRate && track.sampleRate >= 96000) {
        return <span className="player-quality-badge hi-res">Hi-Res</span>;
      }
      return <span className="player-quality-badge lossless">Lossless</span>;
    }
    if (track.bitrate && track.bitrate >= 256000) {
      return <span className="player-quality-badge high">HQ</span>;
    }
    return <span className="player-quality-badge standard">MP3</span>;
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    onSeek(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    onVolumeChange(vol);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="player">
      {/* Track Info - Left side */}
      <div className="player-track-info" onClick={onShowNowPlaying}>
        {track ? (
          <>
            <div className="player-track-art">
              {track.artwork ? (
                <img src={track.artwork} alt={track.album} />
              ) : (
                <div className="player-track-art-placeholder">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="player-track-text">
              <span className="player-track-title">{track.title}</span>
              <span className="player-track-artist">{track.artist}</span>
            </div>
            {getQualityBadge()}
          </>
        ) : (
          <div className="player-track-empty">No track selected</div>
        )}
      </div>

      {/* Center Section - Spotify style with controls above timeline */}
      <div className="player-center">
        <div className="player-controls">
        <button 
          className={`control-button shuffle-button ${isShuffled ? 'active' : ''}`}
          onClick={onToggleShuffle}
          disabled={!track}
          title={isShuffled ? 'Shuffle On' : 'Shuffle Off'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" fill="currentColor"/>
          </svg>
        </button>

        <button className="control-button" onClick={onPrevious} disabled={!track}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 20L9 12L19 4V20Z" fill="currentColor" />
            <path d="M5 19V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button 
          className="control-button play-button" 
          onClick={onPlayPause}
          disabled={!track}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="7" y="6" width="3" height="12" fill="currentColor" />
              <rect x="14" y="6" width="3" height="12" fill="currentColor" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M8 6L18 12L8 18V6Z" fill="currentColor" />
            </svg>
          )}
        </button>

        <button className="control-button" onClick={onNext} disabled={!track}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 4L15 12L5 20V4Z" fill="currentColor" />
            <path d="M19 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <button 
          className={`control-button repeat-button ${repeatMode !== 'off' ? 'active' : ''}`}
          onClick={onToggleRepeat}
          disabled={!track}
          title={repeatMode === 'off' ? 'Repeat Off' : repeatMode === 'all' ? 'Repeat All' : 'Repeat One'}
        >
          {repeatMode === 'one' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="currentColor"/>
              <text x="12" y="16" fontSize="10" fill="currentColor" textAnchor="middle" fontWeight="bold">1</text>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" fill="currentColor"/>
            </svg>
          )}
        </button>
        </div>

        <div className="player-timeline">
          <span className="time-label">{formatTime(currentTime)}</span>
          <div className="progress-container">
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={currentTime}
              onChange={handleSeekChange}
              className="progress-slider"
              style={{
                background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${progress}%, var(--bg-tertiary) ${progress}%, var(--bg-tertiary) 100%)`
              }}
            />
          </div>
          <span className="time-label">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-volume">
        <button 
          className="signal-path-button" 
          onClick={onShowSignalPath}
          disabled={!track}
          title="Signal Path"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 9h3M7 9h4M13 9h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="5" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="13" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
        <button 
          className="queue-button" 
          onClick={onShowQueue}
          title="Queue"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <button 
          className="eq-button" 
          onClick={onShowEqualizer}
          title="Equalizer"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="2" y="2" width="3" height="14" rx="1.5" fill="currentColor"/>
            <rect x="7" y="6" width="3" height="10" rx="1.5" fill="currentColor"/>
            <rect x="12" y="4" width="3" height="12" rx="1.5" fill="currentColor"/>
          </svg>
        </button>
        <button 
          className="settings-button" 
          onClick={onShowAudioSettings}
          title="Audio Settings"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M14.5 9a5.5 5.5 0 11-11 0 5.5 5.5 0 0111 0z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 2v1M9 15v1M15 9h1M2 9h1M13.5 4.5l-.7.7M5.2 12.8l-.7.7M13.5 13.5l-.7-.7M5.2 5.2l-.7-.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4L6 8H2v4h4l4 4V4z" fill="currentColor" />
          <path d="M14 7c1 1 1 3 0 4M16 5c2 2 2 6 0 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
          style={{
            background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${volume * 100}%, var(--bg-tertiary) ${volume * 100}%, var(--bg-tertiary) 100%)`
          }}
        />
        {track && onToggleFullscreen && (
          <button 
            className="fullscreen-button" 
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Now Playing'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              {isFullscreen ? (
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/>
              ) : (
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" fill="currentColor"/>
              )}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Player;
