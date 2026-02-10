import React from 'react';
import { Track } from '../types';
import './Queue.css';

interface QueueProps {
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  onTrackSelect: (track: Track, trackList: Track[]) => void;
  onRemoveFromQueue: (index: number) => void;
  onClose: () => void;
}

const Queue: React.FC<QueueProps> = ({
  queue,
  currentIndex,
  currentTrack,
  onTrackSelect,
  onRemoveFromQueue,
  onClose
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const upcomingTracks = queue.slice(currentIndex + 1);
  const totalDuration = upcomingTracks.reduce((acc, track) => acc + track.duration, 0);
  const hours = Math.floor(totalDuration / 3600);
  const minutes = Math.floor((totalDuration % 3600) / 60);

  return (
    <div className="queue-overlay" onClick={onClose}>
      <div className="queue-panel" onClick={(e) => e.stopPropagation()}>
        <div className="queue-header">
          <h2>Queue</h2>
          <p className="queue-meta">
            {upcomingTracks.length} tracks
            {hours > 0 && `, ${hours}h ${minutes}m`}
            {hours === 0 && minutes > 0 && `, ${minutes} min`}
          </p>
          <button className="queue-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="queue-content">
          {currentTrack && (
            <div className="queue-section">
              <h3 className="queue-section-title">Now Playing</h3>
              <div className="queue-track current">
                <div className="queue-track-number">♪</div>
                <div className="queue-track-info">
                  <div className="queue-track-title">{currentTrack.title}</div>
                  <div className="queue-track-artist">{currentTrack.artist}</div>
                </div>
                <div className="queue-track-duration">{formatDuration(currentTrack.duration)}</div>
              </div>
            </div>
          )}

          {upcomingTracks.length > 0 && (
            <div className="queue-section">
              <h3 className="queue-section-title">Up Next</h3>
              {upcomingTracks.map((track, index) => (
                <div 
                  key={`${track.id}-${index}`}
                  className="queue-track"
                  onClick={() => onTrackSelect(track, queue)}
                >
                  <div className="queue-track-number">{currentIndex + index + 2}</div>
                  <div className="queue-track-info">
                    <div className="queue-track-title">{track.title}</div>
                    <div className="queue-track-artist">{track.artist}</div>
                  </div>
                  <div className="queue-track-duration">{formatDuration(track.duration)}</div>
                  <button 
                    className="queue-track-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFromQueue(currentIndex + index + 1);
                    }}
                    title="Remove from queue"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {upcomingTracks.length === 0 && !currentTrack && (
            <div className="queue-empty">
              <p>Queue is empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Queue;
