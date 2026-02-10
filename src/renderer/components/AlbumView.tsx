import React, { useMemo } from 'react';
import { Track } from '../types';
import './AlbumView.css';

interface Album {
  name: string;
  artist: string;
  tracks: Track[];
  artwork?: string | null;
  year?: number;
  totalDuration: number;
}

interface AlbumViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  onTrackSelect: (track: Track, trackList: Track[]) => void;
  onAddToQueue?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
}

const AlbumView: React.FC<AlbumViewProps> = ({ tracks, currentTrack, onTrackSelect, onAddToQueue, onPlayNext }) => {
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    track?: Track;
    album?: Album;
  } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, track?: Track, album?: Album) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      track,
      album,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  React.useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  const albums = useMemo(() => {
    const albumMap = new Map<string, Album>();

    tracks.forEach(track => {
      const key = `${track.album}-${track.artist}`;
      
      if (!albumMap.has(key)) {
        albumMap.set(key, {
          name: track.album,
          artist: track.artist,
          tracks: [],
          artwork: track.artwork,
          year: track.year,
          totalDuration: 0,
        });
      }

      const album = albumMap.get(key)!;
      album.tracks.push(track);
      album.totalDuration += track.duration;
      
      // Use first available artwork
      if (!album.artwork && track.artwork) {
        album.artwork = track.artwork;
      }
    });

    return Array.from(albumMap.values()).sort((a, b) => {
      // Sort by year descending, then by name
      if (a.year && b.year && a.year !== b.year) {
        return b.year - a.year;
      }
      return a.name.localeCompare(b.name);
    });
  }, [tracks]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} min`;
  };

  const getQualityBadge = (tracks: Track[]) => {
    const hasHiRes = tracks.some(t => t.lossless && t.sampleRate && t.sampleRate >= 96000);
    const hasLossless = tracks.some(t => t.lossless);

    if (hasHiRes) {
      return <span className="album-quality hi-res">Hi-Res</span>;
    } else if (hasLossless) {
      return <span className="album-quality lossless">Lossless</span>;
    }
    return null;
  };

  if (albums.length === 0) {
    return (
      <div className="album-view-empty">
        <p>No albums found</p>
      </div>
    );
  }

  return (
    <div className="album-view">
      <div className="album-view-header">
        <h1>Albums</h1>
        <p className="album-count">{albums.length} albums</p>
      </div>

      <div className="album-grid">
        {albums.map((album, index) => (
          <div 
            key={`${album.name}-${album.artist}-${index}`} 
            className="album-card"
            onContextMenu={(e) => handleContextMenu(e, undefined, album)}
          >
            <div className="album-artwork">
              {album.artwork ? (
                <img src={album.artwork} alt={album.name} />
              ) : (
                <div className="album-artwork-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              )}
              <div className="album-overlay">
                <button 
                  className="album-play-button"
                  onClick={() => onTrackSelect(album.tracks[0], album.tracks)}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="album-info">
              <div className="album-title" title={album.name}>
                {album.name}
              </div>
              <div className="album-artist" title={album.artist}>
                {album.artist}
              </div>
              <div className="album-meta">
                {album.year && <span>{album.year}</span>}
                {album.year && <span className="album-meta-dot">•</span>}
                <span>{album.tracks.length} tracks</span>
                <span className="album-meta-dot">•</span>
                <span>{formatDuration(album.totalDuration)}</span>
              </div>
              {getQualityBadge(album.tracks)}
            </div>

            <div className="album-tracks">
              {album.tracks.map((track, trackIndex) => (
                <div
                  key={track.id}
                  className={`album-track ${currentTrack?.id === track.id ? 'active' : ''}`}
                  onClick={() => onTrackSelect(track, album.tracks)}
                  onContextMenu={(e) => handleContextMenu(e, track)}
                >
                  <span className="album-track-number">{trackIndex + 1}</span>
                  <span className="album-track-title">{track.title}</span>
                </div>
              ))}
            </div>
          </div>
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
          {contextMenu.track && onPlayNext && (
            <div className="context-menu-item" onClick={() => {
              onPlayNext(contextMenu.track!);
              closeContextMenu();
            }}>
              Play Next
            </div>
          )}
          {contextMenu.track && onAddToQueue && (
            <div className="context-menu-item" onClick={() => {
              onAddToQueue(contextMenu.track!);
              closeContextMenu();
            }}>
              Add to Queue
            </div>
          )}
          {contextMenu.album && onAddToQueue && (
            <div className="context-menu-item" onClick={() => {
              contextMenu.album!.tracks.forEach(track => onAddToQueue(track));
              closeContextMenu();
            }}>
              Add Album to Queue
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbumView;
