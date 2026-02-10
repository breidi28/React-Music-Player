import React, { useMemo, useState } from 'react';
import { Track } from '../types';
import './ArtistView.css';
import './ArtistImageModal.css';

interface Artist {
  name: string;
  albums: number;
  tracks: number;
  artwork?: string | null;
}

interface ArtistViewProps {
  tracks: Track[];
  onTrackSelect: (track: Track, trackList: Track[]) => void;
  onPlayNext?: (track: Track) => void;
  onAddToQueue?: (track: Track) => void;
}

const ArtistView: React.FC<ArtistViewProps> = ({ tracks, onTrackSelect, onPlayNext, onAddToQueue }) => {
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadModalArtist, setUploadModalArtist] = useState<string | null>(null);
  
  const [customArtistImages, setCustomArtistImages] = useState<{[key: string]: string}>(() => {
    try {
      return JSON.parse(localStorage.getItem('customArtistImages') || '{}');
    } catch {
      return {};
    }
  });

  const handleOpenUploadModal = (artistName: string) => {
    setUploadModalArtist(artistName);
    setShowUploadModal(true);
  };

  const handleFileUpload = async () => {
    if (!uploadModalArtist) return;
    
    try {
      const artworkPath = await window.electronAPI.selectArtworkFile();
      if (artworkPath) {
        const artworkData = await window.electronAPI.getArtworkData(artworkPath);
        if (artworkData && artworkData.type === 'image') {
          const newImages = { ...customArtistImages, [uploadModalArtist]: artworkData.data };
          setCustomArtistImages(newImages);
          localStorage.setItem('customArtistImages', JSON.stringify(newImages));
          setShowUploadModal(false);
        } else {
          alert('Please select a valid image file.');
        }
      }
    } catch (error) {
      console.error('Error updating artist image:', error);
    }
  };

  const handleUrlUpload = () => {
    if (!uploadModalArtist) return;

    const url = window.prompt('Enter image URL:');
    if (url) {
      const newImages = { ...customArtistImages, [uploadModalArtist]: url };
      setCustomArtistImages(newImages);
      localStorage.setItem('customArtistImages', JSON.stringify(newImages));
      setShowUploadModal(false);
    }
  };

  const artists = useMemo(() => {
    try {
      const artistMap = new Map<string, Artist>();
      const artistAlbums = new Map<string, Set<string>>();

      if (!tracks || !Array.isArray(tracks)) {
        return [];
      }

      tracks.forEach(track => {
        try {
          if (!track || !track.artist) {
            const unknownName = 'Unknown Artist';
            if (!artistMap.has(unknownName)) {
              artistMap.set(unknownName, {
                name: unknownName,
                albums: 0,
                tracks: 0,
                artwork: customArtistImages[unknownName] || null
              });
            }
            const artist = artistMap.get(unknownName)!;
            artist.tracks++;
            if (!artistAlbums.has(unknownName)) {
              artistAlbums.set(unknownName, new Set());
            }
            artistAlbums.get(unknownName)!.add(track?.album || 'Unknown Album');
            return;
          }

          const rawArtist = track.artist;
          // Split by semicolon to handle multiple artists (e.g. "Artist A; Artist B")
          const individualArtists = rawArtist.split(';').map(a => a.trim()).filter(a => a.length > 0);
          
          if (individualArtists.length === 0) {
            individualArtists.push('Unknown Artist');
          }

          individualArtists.forEach(artistName => {
            // Initialize artist if not exists
            if (!artistMap.has(artistName)) {
              artistMap.set(artistName, {
                name: artistName,
                albums: 0,
                tracks: 0,
                artwork: customArtistImages[artistName] || null
              });
            }

            const artist = artistMap.get(artistName)!;
            artist.tracks++;
            
            // Try to find artwork from tracks (prefer tracks where this artist is the main/first artist)
            // Only if no custom artwork is set
            if (!artist.artwork && !customArtistImages[artistName] && track.artwork) {
              artist.artwork = track.artwork;
            }

            // Track albums for this artist
            if (!artistAlbums.has(artistName)) {
              artistAlbums.set(artistName, new Set());
            }
            artistAlbums.get(artistName)!.add(track.album || 'Unknown Album');
          });
        } catch (trackError) {
          console.error('Error processing track for artist view:', trackError);
        }
      });

      // Update album counts
      artistAlbums.forEach((albums, artistName) => {
        if (artistMap.has(artistName)) {
          artistMap.get(artistName)!.albums = albums.size;
        }
      });

      return Array.from(artistMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Error building artist list:', error);
      return [];
    }
  }, [tracks, customArtistImages]);

  const getArtistTracks = (artistName: string) => {
    return tracks.filter(t => {
      const rawArtist = t.artist || 'Unknown Artist';
      const individualArtists = rawArtist.split(';').map(a => a.trim());
      return individualArtists.includes(artistName);
    });
  };

  const getArtistAlbums = (artistName: string) => {
    const artistTracks = getArtistTracks(artistName);
    const albums = new Map<string, { name: string, year?: number, artwork?: string | null, tracks: Track[] }>();

    artistTracks.forEach(track => {
      const albumName = track.album || 'Unknown Album';
      if (!albums.has(albumName)) {
        albums.set(albumName, {
          name: albumName,
          year: track.year,
          artwork: track.artwork,
          tracks: []
        });
      }
      albums.get(albumName)!.tracks.push(track);
    });

    return Array.from(albums.values()).sort((a, b) => {
      if (a.year && b.year) return b.year - a.year;
      return a.name.localeCompare(b.name);
    });
  };

  const handlePlayArtist = (artistName: string) => {
    const artistTracks = getArtistTracks(artistName);
    if (artistTracks.length > 0) {
      onTrackSelect(artistTracks[0], artistTracks);
    }
  };

  if (selectedArtist) {
    const artistTracks = getArtistTracks(selectedArtist);
    const artistAlbums = getArtistAlbums(selectedArtist);
    const artistInfo = artists.find(a => a.name === selectedArtist);

    return (
      <div className="artist-view">
        <button className="back-button" onClick={() => setSelectedArtist(null)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Artists
        </button>

        <div className="artist-detail-header">
          <div 
            className="artist-detail-image-container" 
            onClick={() => selectedArtist && handleOpenUploadModal(selectedArtist)}
            title="Click to change artist image"
          >
            {artistInfo?.artwork ? (
              <img src={artistInfo.artwork} alt={selectedArtist} className="artist-detail-image" />
            ) : (
              <div className="artist-detail-image artist-placeholder" style={{ background: 'var(--bg-tertiary)', borderRadius: '50%' }}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
            )}
            <div className="artist-image-overlay">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          </div>
          <div className="artist-detail-info">
            <h1>{selectedArtist}</h1>
            <div className="artist-detail-stats">
              <span>{artistAlbums.length} Albums</span>
              <span>{artistTracks.length} Tracks</span>
            </div>
            <div className="artist-actions">
              <button className="play-artist-btn" onClick={() => handlePlayArtist(selectedArtist)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                Play Artist
              </button>
            </div>
          </div>
        </div>

        <div className="artist-albums-section">
          <h3>Albums</h3>
          <div className="artist-albums-grid">
            {artistAlbums.map(album => (
              <div 
                key={album.name} 
                className="artist-album-card"
                onClick={() => onTrackSelect(album.tracks[0], album.tracks)}
              >
                {album.artwork ? (
                  <img src={album.artwork} alt={album.name} className="artist-album-art" />
                ) : (
                  <div className="artist-album-art album-placeholder">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                    </svg>
                  </div>
                )}
                <div className="album-info">
                  <h4>{album.name}</h4>
                  <span className="album-year">{album.year || 'Unknown Year'} • {album.tracks.length} tracks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {showUploadModal && (
          <div className="artist-image-modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="artist-image-modal" onClick={e => e.stopPropagation()}>
              <h3>Change Artist Image</h3>
              <div className="artist-image-options">
                <button className="artist-image-option-btn" onClick={handleFileUpload}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Upload from Computer
                </button>
                <button className="artist-image-option-btn" onClick={handleUrlUpload}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Paste Image URL
                </button>
              </div>
              <button className="artist-image-modal-close" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="artist-view">
      <h2>Artists</h2>
      <div className="artists-grid">
        {artists.map(artist => (
          <div 
            key={artist.name} 
            className="artist-card"
            onClick={() => setSelectedArtist(artist.name)}
          >
            <div className="artist-image-container">
              {artist.artwork ? (
                <img src={artist.artwork} alt={artist.name} className="artist-image" />
              ) : (
                <div className="artist-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )}
            </div>
            <div className="artist-info">
              <h3>{artist.name}</h3>
              <div className="artist-stats">
                {artist.albums} Albums • {artist.tracks} Tracks
              </div>
            </div>
          </div>
        ))}
      </div>

      {showUploadModal && (
        <div className="artist-image-modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="artist-image-modal" onClick={e => e.stopPropagation()}>
            <h3>Change Artist Image</h3>
            <div className="artist-image-options">
              <button className="artist-image-option-btn" onClick={handleFileUpload}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Upload from Computer
              </button>
              <button className="artist-image-option-btn" onClick={handleUrlUpload}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Paste Image URL
              </button>
            </div>
            <button className="artist-image-modal-close" onClick={() => setShowUploadModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistView;
