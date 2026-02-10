import React from 'react';
import { Track, Playlist } from '../types';
import './SearchResults.css';

interface SearchResultsProps {
  query: string;
  playlists: Playlist[];
  tracks: Track[];
  currentTrack: Track | null;
  onSelectPlaylist: (playlist: Playlist) => void;
  onPlayTrack: (track: Track, trackList: Track[]) => void;
  onAddToQueue?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  playlists,
  tracks,
  currentTrack,
  onSelectPlaylist,
  onPlayTrack,
  onAddToQueue,
  onPlayNext,
}) => {
  const [contextMenu, setContextMenu] = React.useState<{
    x: number;
    y: number;
    track: Track;
  } | null>(null);

  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTracks = tracks.filter(t =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.artist.toLowerCase().includes(query.toLowerCase()) ||
    t.album.toLowerCase().includes(query.toLowerCase())
  );

  const handleContextMenu = (e: React.MouseEvent, track: Track) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      track,
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

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQualityBadge = (track: Track) => {
    if (track.lossless) {
      if (track.sampleRate && track.sampleRate >= 96000) {
        return <span className="quality-badge hi-res">Hi-Res</span>;
      }
      return <span className="quality-badge lossless">Lossless</span>;
    }
    if (track.bitrate && track.bitrate >= 256000) {
      return <span className="quality-badge high">HQ</span>;
    }
    return <span className="quality-badge standard">MP3</span>;
  };

  if (filteredPlaylists.length === 0 && filteredTracks.length === 0) {
    return (
      <div className="search-results-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h2>No results found</h2>
        <p>Try searching with different keywords</p>
      </div>
    );
  }

  return (
    <div className="search-results">
      <h1 className="search-results-title">Search Results for "{query}"</h1>

      {filteredPlaylists.length > 0 && (
        <div className="search-section">
          <h2 className="search-section-title">Playlists ({filteredPlaylists.length})</h2>
          <div className="search-playlists">
            {filteredPlaylists.map(playlist => (
              <div
                key={playlist.id}
                className="search-playlist-card"
                onClick={() => onSelectPlaylist(playlist)}
              >
                <div className="playlist-card-art">
                  {playlist.tracks[0]?.artwork ? (
                    <img src={playlist.tracks[0].artwork} alt={playlist.name} />
                  ) : (
                    <div className="playlist-card-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="playlist-card-info">
                  <div className="playlist-card-name">{playlist.name}</div>
                  <div className="playlist-card-count">{playlist.tracks.length} tracks</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredTracks.length > 0 && (
        <div className="search-section">
          <h2 className="search-section-title">Songs ({filteredTracks.length})</h2>
          <div className="search-tracks">
            {filteredTracks.map(track => (
              <div
                key={track.id}
                className={`search-track-row ${currentTrack?.id === track.id ? 'active' : ''}`}
                onClick={() => onPlayTrack(track, filteredTracks)}
                onContextMenu={(e) => handleContextMenu(e, track)}
              >
                <div className="search-track-art">
                  {track.artwork ? (
                    <img src={track.artwork} alt={track.album} />
                  ) : (
                    <div className="search-track-art-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="search-track-info">
                  <div className="search-track-title">{track.title}</div>
                  <div className="search-track-artist">{track.artist}</div>
                </div>
                <div className="search-track-album">{track.album}</div>
                {getQualityBadge(track)}
                <div className="search-track-duration">{formatDuration(track.duration)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

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
        </div>
      )}
    </div>
  );
};

export default SearchResults;
