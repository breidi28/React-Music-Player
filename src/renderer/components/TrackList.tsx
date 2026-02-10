import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Track } from '../types';
import './TrackList.css';

// Memoized TrackRow component to prevent unnecessary re-renders
const TrackRow = React.memo(({
  track,
  index,
  isActive,
  isDragging,
  isDragOver,
  isDraggable,
  onSelect,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd
}: {
  track: Track;
  index: number;
  isActive: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  isDraggable: boolean;
  onSelect: (track: Track) => void;
  onContextMenu: (e: React.MouseEvent, track: Track) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBitrate = (bitrate?: number) => {
    if (!bitrate) return '-';
    return `${Math.round(bitrate / 1000)} kbps`;
  };

  const formatSampleRate = (rate?: number) => {
    if (!rate) return '-';
    return `${(rate / 1000).toFixed(1)} kHz`;
  };

  const getQualityIcon = (track: Track) => {
    if (track.lossless) {
      if (track.sampleRate && track.sampleRate >= 96000) {
        return <span className="quality-icon hi-res" title="Hi-Res">HR</span>;
      }
      return <span className="quality-icon lossless" title="Lossless">LL</span>;
    }
    return <span className="quality-icon standard" title="Lossy">ST</span>;
  };

  return (
    <div
      className={`track-row ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
      draggable={isDraggable}
      onClick={() => onSelect(track)}
      onContextMenu={(e) => onContextMenu(e, track)}
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
    >
      {isDraggable && (
        <div className="drag-handle">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <circle cx="3" cy="3" r="1"/>
            <circle cx="9" cy="3" r="1"/>
            <circle cx="3" cy="6" r="1"/>
            <circle cx="9" cy="6" r="1"/>
            <circle cx="3" cy="9" r="1"/>
            <circle cx="9" cy="9" r="1"/>
          </svg>
        </div>
      )}
      <div className="track-cell col-quality">
        {getQualityIcon(track)}
      </div>
      <div className="track-cell col-title" title={track.title}>
        {track.title}
      </div>
      <div className="track-cell col-artist" title={track.artist}>
        {track.artist}
      </div>
      <div className="track-cell col-album" title={track.album}>
        {track.album}
      </div>
      <div className="track-cell col-format">{track.format}</div>
      <div className="track-cell col-sample-rate">
        {formatSampleRate(track.sampleRate)}
      </div>
      <div className="track-cell col-bitrate">
        {formatBitrate(track.bitrate)}
      </div>
      <div className="track-cell col-duration">
        {formatDuration(track.duration)}
      </div>
    </div>
  );
});

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  onTrackSelect: (track: Track, trackList: Track[]) => void;
  playlistName?: string;
  onRemoveTrack?: (trackId: string) => void;
  onAddToQueue?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
  onReorderTracks?: (fromIndex: number, toIndex: number) => void;
}

const TrackList: React.FC<TrackListProps> = ({ 
  tracks, 
  currentTrack, 
  onTrackSelect, 
  playlistName,
  onRemoveTrack,
  onAddToQueue,
  onPlayNext,
  onReorderTracks
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    track: Track;
  } | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query to prevent lag while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredTracks = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return tracks;
    
    // Performance optimization: use simple includes check first
    const query = debouncedSearchQuery.toLowerCase();
    
    // Limit result set if too large during search to keep UI responsive
    let result = [];
    const maxResults = 500;
    
    for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (
            track.title.toLowerCase().includes(query) ||
            track.artist.toLowerCase().includes(query) ||
            track.album.toLowerCase().includes(query) ||
            (track.format && track.format.toLowerCase().includes(query))
        ) {
            result.push(track);
            if (result.length >= maxResults) break;
        }
    }
    return result;
  }, [tracks, debouncedSearchQuery]);

  const handleContextMenu = useCallback((e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      track
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleRemoveTrack = useCallback(() => {
    if (contextMenu && onRemoveTrack) {
      onRemoveTrack(contextMenu.track.id);
    }
    closeContextMenu();
  }, [contextMenu, onRemoveTrack, closeContextMenu]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!onReorderTracks) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, [onReorderTracks]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    if (!onReorderTracks) return;
    e.preventDefault();
    setDragOverIndex(index);
  }, [onReorderTracks]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex && onReorderTracks) {
      onReorderTracks(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, [draggedIndex, onReorderTracks]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleTrackSelect = useCallback((track: Track) => {
    onTrackSelect(track, tracks);
  }, [onTrackSelect, tracks]);

  // Close context menu on click outside
  React.useEffect(() => {
    if (contextMenu) {
      const handleClick = () => closeContextMenu();
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu, closeContextMenu]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBitrate = (bitrate?: number) => {
    if (!bitrate) return '-';
    return `${Math.round(bitrate / 1000)} kbps`;
  };

  const formatSampleRate = (rate?: number) => {
    if (!rate) return '-';
    return `${(rate / 1000).toFixed(1)} kHz`;
  };

  const getQualityIcon = (track: Track) => {
    if (track.lossless) {
      if (track.sampleRate && track.sampleRate >= 96000) {
        return <span className="quality-icon hi-res" title="Hi-Res">HR</span>;
      }
      return <span className="quality-icon lossless" title="Lossless">LL</span>;
    }
    return <span className="quality-icon standard" title="Lossy">ST</span>;
  };

  if (tracks.length === 0) {
    return (
      <div className="track-list-empty">
        <p>No tracks loaded</p>
        <p className="empty-subtitle">Use the sidebar to add files or folders</p>
      </div>
    );
  }

  return (
    <div className="track-list">
      {playlistName && (
        <div className="playlist-header">
          <h1 className="playlist-title">{playlistName}</h1>
          <p className="playlist-meta">{filteredTracks.length} of {tracks.length} tracks</p>
        </div>
      )}

      <div className="track-list-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="search-icon">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search tracks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
      
      <div className="track-list-header">
        <div className="header-cell col-quality">Q</div>
        <div className="header-cell col-title">Title</div>
        <div className="header-cell col-artist">Artist</div>
        <div className="header-cell col-album">Album</div>
        <div className="header-cell col-format">Format</div>
        <div className="header-cell col-sample-rate">Sample Rate</div>
        <div className="header-cell col-bitrate">Bitrate</div>
        <div className="header-cell col-duration">Duration</div>
      </div>
      
      <div className="track-list-body">
        {filteredTracks.map((track, index) => (
          <TrackRow
            key={track.id}
            track={track}
            index={index}
            isActive={currentTrack?.id === track.id}
            isDragging={draggedIndex === index}
            isDragOver={dragOverIndex === index}
            isDraggable={!!onReorderTracks && !searchQuery}
            onSelect={handleTrackSelect}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          {onPlayNext && (
            <div className="context-menu-item" onClick={() => {
              onPlayNext(contextMenu.track);
              closeContextMenu();
            }}>
              Play Next
            </div>
          )}
          {onAddToQueue && (
            <div className="context-menu-item" onClick={() => {
              onAddToQueue(contextMenu.track);
              closeContextMenu();
            }}>
              Add to Queue
            </div>
          )}
          {onRemoveTrack && (
            <div className="context-menu-item" onClick={handleRemoveTrack}>
              Remove from Playlist
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackList;
