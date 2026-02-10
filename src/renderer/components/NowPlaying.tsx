import React, { useEffect, useRef, useState } from 'react';
import { Track, LRCLine } from '../types';
import { parseLRC, getCurrentLyricIndex } from '../utils/lrcParser';
import './NowPlaying.css';

interface NowPlayingProps {
  track: Track | null;
  isPlaying: boolean;
  analyser: AnalyserNode | null;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  currentTime?: number;
  onUpdateTrack?: (track: Track) => void;
}

const NowPlaying: React.FC<NowPlayingProps> = ({ 
  track, 
  isPlaying, 
  analyser, 
  isFullscreen = false, 
  onToggleFullscreen,
  currentTime = 0,
  onUpdateTrack
}) => {
  const [showLyrics, setShowLyrics] = useState(false);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Update current lyric line based on playback time
  useEffect(() => {
    if (track?.lrcLines && currentTime) {
      const index = getCurrentLyricIndex(track.lrcLines, currentTime);
      
      // Only update if index changed to avoid unnecessary re-renders
      if (index !== currentLyricIndex) {
        setCurrentLyricIndex(index);

        // Auto-scroll to current lyric with smooth animation
        if (lyricsContainerRef.current && index >= 0) {
          const lyricElements = lyricsContainerRef.current.querySelectorAll('.lyric-line');
          if (lyricElements[index]) {
            // Use smooth scroll with a slight delay for better visual effect
            requestAnimationFrame(() => {
              lyricElements[index].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',
                inline: 'nearest'
              });
            });
          }
        }
      }
    }
  }, [currentTime, track?.lrcLines, currentLyricIndex]);

  const handleUploadLRC = async () => {
    if (!track) return;

    try {
      const lrcPath = await window.electronAPI.selectLrcFile();
      if (!lrcPath) return;

      const lrcContent = await window.electronAPI.getLrcContent(lrcPath);
      if (!lrcContent) {
        alert('Failed to read LRC file');
        return;
      }

      const lrcLines = parseLRC(lrcContent);
      
      // Update track with LRC data
      const updatedTrack = {
        ...track,
        lrcPath,
        lrcLines
      };

      // If onUpdateTrack is provided, use it to update globally
      if (onUpdateTrack) {
        onUpdateTrack(updatedTrack);
      }

      // Save association to localStorage
      const lrcAssociations = JSON.parse(localStorage.getItem('lrcAssociations') || '{}');
      lrcAssociations[track.path] = lrcPath;
      localStorage.setItem('lrcAssociations', JSON.stringify(lrcAssociations));

      setShowLyrics(true);
    } catch (error) {
      console.error('Error uploading LRC file:', error);
      alert('Error loading LRC file');
    }
  };

  const handleRemoveLRC = () => {
    if (!track) return;

    const updatedTrack = {
      ...track,
      lrcPath: null,
      lrcLines: undefined
    };

    // If onUpdateTrack is provided, use it to update globally
    if (onUpdateTrack) {
      onUpdateTrack(updatedTrack);
    }

    // Remove from localStorage
    const lrcAssociations = JSON.parse(localStorage.getItem('lrcAssociations') || '{}');
    delete lrcAssociations[track.path];
    localStorage.setItem('lrcAssociations', JSON.stringify(lrcAssociations));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getQualityBadge = () => {
    if (!track) return null;
    
    if (track.lossless) {
      if (track.sampleRate && track.sampleRate >= 96000) {
        return <div className="quality-badge hi-res">Hi-Res Lossless</div>;
      }
      return <div className="quality-badge lossless">Lossless</div>;
    }
    return <div className="quality-badge standard">Lossy</div>;
  };

  if (!track) {
    return (
      <div className="now-playing">
        <div className="now-playing-empty">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <path d="M32 8v48M16 24l16-16 16 16M16 40l16 16 16-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p>No track playing</p>
          <p className="empty-subtitle">Select a track to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`now-playing ${isFullscreen ? 'fullscreen' : ''}`}>
      {isFullscreen && onToggleFullscreen && (
        <button 
          className="exit-fullscreen-btn" 
          onClick={onToggleFullscreen}
          title="Exit Fullscreen"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" fill="currentColor"/>
          </svg>
        </button>
      )}
      <div className="album-art-container">
        {track.artwork ? (
          <img src={track.artwork} alt={track.album} className="album-art" />
        ) : (
          <div className="album-art-placeholder">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="2" />
              <circle cx="40" cy="40" r="8" fill="currentColor" />
            </svg>
          </div>
        )}
      </div>

      <div className="track-info">
        <h2 className="track-title">{track.title}</h2>
        <p className="track-artist">{track.artist}</p>
        <p className="track-album">{track.album}</p>
        
        {getQualityBadge()}

        <div className="audio-specs">
          <div className="spec-item">
            <span className="spec-label">Format</span>
            <span className="spec-value">{track.format}</span>
          </div>
          {track.sampleRate && (
            <div className="spec-item">
              <span className="spec-label">Sample Rate</span>
              <span className="spec-value">{(track.sampleRate / 1000).toFixed(1)} kHz</span>
            </div>
          )}
          {track.bitsPerSample && (
            <div className="spec-item">
              <span className="spec-label">Bit Depth</span>
              <span className="spec-value">{track.bitsPerSample} bit</span>
            </div>
          )}
          {track.bitrate && (
            <div className="spec-item">
              <span className="spec-label">Bitrate</span>
              <span className="spec-value">{Math.round(track.bitrate / 1000)} kbps</span>
            </div>
          )}
          <div className="spec-item">
            <span className="spec-label">File Size</span>
            <span className="spec-value">{formatFileSize(track.fileSize)}</span>
          </div>
        </div>

        {/* Lyrics Section - supports both LRC (synchronized) and plain text lyrics */}
        {(track.lyrics || track.lrcLines) && (
          <div className="lyrics-section">
            <div className="lyrics-header">
              <button className="lyrics-toggle" onClick={() => setShowLyrics(!showLyrics)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {showLyrics ? 'Hide Lyrics' : 'Show Lyrics'}
              </button>
              
              {track.lrcLines && (
                <button className="lrc-remove-btn" onClick={handleRemoveLRC} title="Remove LRC file">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>

            {showLyrics && (
              <div className="lyrics-content" ref={lyricsContainerRef}>
                {track.lrcLines ? (
                  // Synchronized LRC lyrics
                  <div className="lrc-lyrics">
                    {track.lrcLines.map((line, index) => (
                      <div
                        key={index}
                        className={`lyric-line ${index === currentLyricIndex ? 'active' : ''} ${
                          index < currentLyricIndex ? 'past' : ''
                        }`}
                      >
                        {line.text || '♪'}
                      </div>
                    ))}
                  </div>
                ) : (
                  // Plain text lyrics
                  <pre>{typeof track.lyrics === 'string' ? track.lyrics : JSON.stringify(track.lyrics, null, 2)}</pre>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upload LRC button - shown when no LRC file is loaded */}
        {!track.lrcLines && (
          <div className="lrc-upload-section">
            <button className="lrc-upload-btn" onClick={handleUploadLRC}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Upload LRC File
            </button>
            <span className="lrc-hint">Add synchronized lyrics for this song</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NowPlaying;
