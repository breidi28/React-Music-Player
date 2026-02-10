import React from 'react';
import { Track, Playlist } from '../types';
import './HomePage.css';

interface HomePageProps {
  playlists: Playlist[];
  recentTracks: Track[];
  onSelectPlaylist: (playlist: Playlist) => void;
  onPlayTrack: (track: Track) => void;
  onLoadFolder: () => void;
}

const HomePage: React.FC<HomePageProps> = ({
  playlists,
  recentTracks,
  onSelectPlaylist,
  onPlayTrack,
  onLoadFolder,
}) => {
  const getQualityBadge = (track: Track) => {
    if (track.sampleRate && track.sampleRate >= 96000) return 'hi-res';
    if (track.format?.toLowerCase().includes('flac') || 
        track.format?.toLowerCase().includes('alac') ||
        track.format?.toLowerCase().includes('wav')) return 'lossless';
    return 'standard';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (playlists.length === 0) {
    return (
      <div className="home-page empty">
        <div className="welcome-container">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>
          <h1>Welcome to Audiophile</h1>
          <p className="subtitle">Your high-fidelity music player</p>
          <p className="description">
            Import your music library to get started. We support FLAC, ALAC, WAV, MP3, AAC, and OGG formats.
          </p>
          <button className="import-button" onClick={onLoadFolder}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
            Import Folder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Home</h1>
      </header>

      {recentTracks.length > 0 && (
        <section className="recent-section">
          <h2>Recently Added</h2>
          <div className="recent-tracks">
            {recentTracks.slice(0, 6).map((track) => (
              <div 
                key={track.id} 
                className="recent-track-card"
                onClick={() => onPlayTrack(track)}
              >
                <div className="track-artwork">
                  {track.artwork ? (
                    <img src={track.artwork} alt={track.album || 'Album art'} />
                  ) : (
                    <div className="artwork-placeholder">
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                      </svg>
                    </div>
                  )}
                  <div className="play-overlay">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="track-info">
                  <span className="track-title">{track.title}</span>
                  <span className="track-artist">{track.artist}</span>
                </div>
                <span className={`quality-badge ${getQualityBadge(track)}`}>
                  {getQualityBadge(track).toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="playlists-section">
        <h2>Your Library</h2>
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <div 
              key={playlist.id}
              className="playlist-card"
              onClick={() => onSelectPlaylist(playlist)}
            >
              <div className="playlist-artwork">
                {playlist.tracks[0]?.artwork ? (
                  <img src={playlist.tracks[0].artwork} alt={playlist.name} />
                ) : (
                  <div className="artwork-placeholder folder">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                    </svg>
                  </div>
                )}
                <div className="play-overlay">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              <div className="playlist-info">
                <span className="playlist-name">{playlist.name}</span>
                <span className="playlist-count">{playlist.tracks.length} tracks</span>
              </div>
            </div>
          ))}
          
          <div className="playlist-card add-new" onClick={onLoadFolder}>
            <div className="playlist-artwork">
              <div className="artwork-placeholder add">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </div>
            </div>
            <div className="playlist-info">
              <span className="playlist-name">Add Folder</span>
              <span className="playlist-count">Import music</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
