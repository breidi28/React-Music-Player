import React, { useState, useMemo, useEffect } from 'react';
import { Playlist, Track } from '../types';
import './PlaylistView.css';

interface PlaylistViewProps {
  playlist: Playlist;
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, trackList?: Track[]) => void;
  onPlayAll: () => void;
  onShuffle: () => void;
  onRemoveTrack?: (trackId: string) => void;
  onUpdatePlaylist?: (playlist: Playlist) => void;
}

const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onPlayAll,
  onShuffle,
  onRemoveTrack,
  onUpdatePlaylist,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'default' | 'title' | 'artist' | 'album' | 'dateAdded' | 'duration'>('default');
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [dominantColor, setDominantColor] = useState<string>('rgb(102, 126, 234)');

  const handleUploadArtwork = async () => {
    try {
      const artworkPath = await window.electronAPI.selectArtworkFile();
      if (!artworkPath) return;

      const artworkData = await window.electronAPI.getArtworkData(artworkPath);
      if (!artworkData) {
        alert('Failed to read artwork file');
        return;
      }

      // Check for error response
      if ('error' in artworkData) {
        alert(artworkData.error);
        return;
      }

      const updatedPlaylist = {
        ...playlist,
        artwork: artworkData.data,
        artworkType: 'image'
      };

      if (onUpdatePlaylist) {
        onUpdatePlaylist(updatedPlaylist);
      }
    } catch (error) {
      console.error('Error uploading artwork:', error);
      alert('Error loading artwork file');
    }
  };

  // Extract dominant color from playlist cover
  useEffect(() => {
    const extractColor = async () => {
      const coverUrl = playlist.artwork || playlist.tracks[0]?.artwork;
      if (!coverUrl) {
        setDominantColor('rgb(102, 126, 234)');
        return;
      }

      try {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = coverUrl;

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // Sample from center area for better color
          const size = 100;
          canvas.width = size;
          canvas.height = size;
          
          ctx.drawImage(img, 0, 0, size, size);
          const imageData = ctx.getImageData(0, 0, size, size).data;

          let r = 0, g = 0, b = 0;
          let count = 0;

          // Sample pixels and calculate average
          for (let i = 0; i < imageData.length; i += 4) {
            const brightness = (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
            // Skip very dark and very bright pixels
            if (brightness > 20 && brightness < 235) {
              r += imageData[i];
              g += imageData[i + 1];
              b += imageData[i + 2];
              count++;
            }
          }

          if (count > 0) {
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
            
            // Boost saturation slightly
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const delta = max - min;
            
            if (delta > 0) {
              const factor = 1.3;
              r = Math.min(255, Math.floor(min + (r - min) * factor));
              g = Math.min(255, Math.floor(min + (g - min) * factor));
              b = Math.min(255, Math.floor(min + (b - min) * factor));
            }

            setDominantColor(`rgb(${r}, ${g}, ${b})`);
          }
        };
      } catch (error) {
        console.error('Error extracting color:', error);
        setDominantColor('rgb(102, 126, 234)');
      }
    };

    extractColor();
  }, [playlist.tracks, playlist.artwork]);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return playlist.tracks.reduce((acc, track) => acc + track.duration, 0);
  }, [playlist.tracks]);

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs} hr ${mins} min`;
    }
    return `${mins} min ${secs} sec`;
  };

  const formatTrackDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return '1 week ago';
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 60) return '1 month ago';
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
  };

  // Filter and sort tracks
  const displayedTracks = useMemo(() => {
    let filtered = [...playlist.tracks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (track) =>
          track.title.toLowerCase().includes(query) ||
          track.artist.toLowerCase().includes(query) ||
          track.album.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortOrder !== 'default') {
      filtered.sort((a, b) => {
        switch (sortOrder) {
          case 'title':
            return a.title.localeCompare(b.title);
          case 'artist':
            return a.artist.localeCompare(b.artist);
          case 'album':
            return a.album.localeCompare(b.album);
          case 'duration':
            return b.duration - a.duration;
          case 'dateAdded':
            // Assuming tracks are added in order, use index
            return 0;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }, [playlist.tracks, searchQuery, sortOrder]);

  return (
    <div className="playlist-view">
      {/* Header Section */}
      <div 
        className="playlist-header" 
        style={{ 
          background: `linear-gradient(135deg, ${dominantColor} 0%, rgba(18, 18, 18, 0.8) 100%)`
        }}
      >
        <div className="playlist-cover" onClick={handleUploadArtwork} title="Click to change artwork">
          {playlist.artwork ? (
            <img src={playlist.artwork} alt={playlist.name} />
          ) : playlist.tracks[0]?.artwork ? (
            <img src={playlist.tracks[0].artwork} alt={playlist.name} />
          ) : (
            <div className="playlist-cover-placeholder">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
          )}
          <div className="artwork-upload-overlay">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Change Artwork</span>
          </div>
        </div>
        <div className="playlist-info">
          <span className="playlist-type">PUBLIC PLAYLIST</span>
          <h1 className="playlist-title">{playlist.name}</h1>
          <div className="playlist-description">
            {playlist.folderPath}
          </div>
          <div className="playlist-meta">
            <span className="playlist-stats">
              {playlist.tracks.length} Song{playlist.tracks.length !== 1 ? 's' : ''}, {formatDuration(totalDuration)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="playlist-controls">
        <div className="controls-left">
          <button className="play-button" onClick={onPlayAll}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button className="control-button shuffle-button" onClick={onShuffle} title="Shuffle">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </button>
          <button className="control-button like-button" title="Save to library">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
          <button className="control-button more-button" title="More options">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>

        <div className="controls-right">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="text"
              placeholder="Search in playlist"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="sort-dropdown">
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
              <option value="default">Custom Order</option>
              <option value="title">Title</option>
              <option value="artist">Artist</option>
              <option value="album">Album</option>
              <option value="dateAdded">Date Added</option>
              <option value="duration">Duration</option>
            </select>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Track List Table */}
      <div className="playlist-tracks">
        <div className="track-table-header">
          <div className="drag-col"></div>
          <div className="track-number-col">#</div>
          <div className="track-title-col">Title</div>
          <div className="track-album">Album</div>
          <div className="track-date">Date Added</div>
          <div className="track-duration">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
            </svg>
          </div>
          <div className="track-menu"></div>
        </div>

        <div className="track-table-body">
          {displayedTracks.map((track, index) => {
            const isCurrentTrack = currentTrack?.id === track.id;
            const isHovered = hoveredTrack === track.id;

            return (
              <div
                key={track.id}
                className={`track-row ${isCurrentTrack ? 'active' : ''}`}
                onMouseEnter={() => setHoveredTrack(track.id)}
                onMouseLeave={() => setHoveredTrack(null)}
                onDoubleClick={() => onPlayTrack(track, playlist.tracks)}
              >
                <div className="drag-handle">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </div>
                <div className="track-number">
                  {isHovered || isCurrentTrack ? (
                    <button
                      className="play-track-button"
                      onClick={() => onPlayTrack(track, playlist.tracks)}
                    >
                      {isCurrentTrack && isPlaying ? (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  ) : (
                    <>
                      <span className={isCurrentTrack && isPlaying ? 'playing-indicator' : ''}>
                        {isCurrentTrack && isPlaying ? '♫' : index + 1}
                      </span>
                      {isCurrentTrack && isPlaying && (
                        <div className="equalizer-animation">
                          <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 20h4V4h-4v16zm-6 0h4v-8H4v8zM16 9v11h4V9h-4z" />
                          </svg>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="track-title-col">
                  <div className="track-artwork-small">
                    {track.artwork ? (
                      <img src={track.artwork} alt={track.title} />
                    ) : (
                      <div className="track-artwork-placeholder">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="track-info">
                    <div className="track-title" title={track.title}>
                      {track.title}
                    </div>
                    <div className="track-artist" title={track.artist}>
                      {track.artist}
                    </div>
                  </div>
                </div>
                <div className="track-album" title={track.album}>
                  {track.album}
                </div>
                <div className="track-date">
                  {formatDate(playlist.dateAdded)}
                </div>
                <div className="track-duration">
                  <div className="track-actions">
                    {onRemoveTrack && (
                      <button
                        className="remove-track-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(track.id);
                        }}
                        title="Remove from playlist"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <span className="duration-text">{formatTrackDuration(track.duration)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {displayedTracks.length === 0 && (
        <div className="empty-state">
          <p>No tracks found</p>
        </div>
      )}
    </div>
  );
};

export default PlaylistView;
