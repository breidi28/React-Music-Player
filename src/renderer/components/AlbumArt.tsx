import React, { useState, useEffect } from 'react';
import './AlbumArt.css';

interface AlbumArtProps {
  track: { path: string; artwork?: string | null; album?: string } | null;
  className?: string;
  showPlaceholder?: boolean;
}

const AlbumArt: React.FC<AlbumArtProps> = ({ 
  track, 
  className = '',
  showPlaceholder = true 
}) => {
  const [artwork, setArtwork] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!track) {
      setArtwork(null);
      return;
    }

    // If track already has artwork (from custom upload), use it
    if (track.artwork) {
      setArtwork(track.artwork);
      return;
    }

    // Load artwork from cache/file on-demand
    let cancelled = false;
    setLoading(true);
    setArtwork(null);
    
    window.electronAPI.getArtwork(track.path)
      .then(artworkData => {
        if (!cancelled && artworkData) {
          setArtwork(artworkData);
        }
      })
      .catch(err => {
        console.error('Failed to load artwork:', err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [track?.path, track?.artwork]);

  if (artwork) {
    return <img src={artwork} alt={track?.album || 'Album art'} className={className} />;
  }

  if (!showPlaceholder) {
    return null;
  }

  return (
    <div className={`album-art-placeholder ${className}`}>
      {loading ? (
        <div className="album-art-loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <svg width="40" height="40" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="2" />
          <circle cx="40" cy="40" r="8" fill="currentColor" />
        </svg>
      )}
    </div>
  );
};

export default AlbumArt;
