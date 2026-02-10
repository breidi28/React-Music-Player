import React from 'react';
import { Playlist, Track } from '../types';
import './Sidebar.css';

interface SidebarProps {
  playlists: Playlist[];
  selectedPlaylist: Playlist | null;
  onLoadFiles: () => void;
  onLoadFolder: () => void;
  onSelectPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRenamePlaylist?: (playlistId: string, newName: string) => void;
  onCreatePlaylist: () => void;
  onGoHome: () => void;
  onShowAlbums?: () => void;
  onShowArtists?: () => void;
  currentTrack: Track | null;
  onAddPlaylistToQueue?: (playlist: Playlist) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  playlists, 
  selectedPlaylist,
  onLoadFiles, 
  onLoadFolder,
  onSelectPlaylist,
  onDeletePlaylist,
  onRenamePlaylist,
  onCreatePlaylist,
  onGoHome,
  onShowAlbums,
  onShowArtists,
  currentTrack,
  onAddPlaylistToQueue,
}) => {
  const [contextMenu, setContextMenu] = React.useState<{ x: number; y: number; playlistId: string } | null>(null);
  const [editingPlaylist, setEditingPlaylist] = React.useState<{ id: string; name: string } | null>(null);

  const handleContextMenu = (e: React.MouseEvent, playlistId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, playlistId });
  };

  const handleDeleteFromContext = () => {
    if (contextMenu) {
      onDeletePlaylist(contextMenu.playlistId);
      setContextMenu(null);
    }
  };

  const handleRenameFromContext = () => {
    if (contextMenu) {
      const playlist = playlists.find(p => p.id === contextMenu.playlistId);
      if (playlist) {
        setEditingPlaylist({ id: playlist.id, name: playlist.name });
      }
      setContextMenu(null);
    }
  };

  const handleRenameSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editingPlaylist && onRenamePlaylist) {
      const newName = (e.target as HTMLInputElement).value.trim();
      if (newName && newName !== editingPlaylist.name) {
        onRenamePlaylist(editingPlaylist.id, newName);
      }
      setEditingPlaylist(null);
    } else if (e.key === 'Escape') {
      setEditingPlaylist(null);
    }
  };

  const handleDoubleClick = (playlist: Playlist) => {
    if (onRenamePlaylist) {
      setEditingPlaylist({ id: playlist.id, name: playlist.name });
    }
  };

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);
  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Navigation</h3>
        <button className="sidebar-nav-button" onClick={onGoHome}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
          Home
        </button>
        {onShowAlbums && (
          <button className="sidebar-nav-button" onClick={onShowAlbums}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
            </svg>
            Albums
          </button>
        )}
        {onShowArtists && (
          <button className="sidebar-nav-button" onClick={onShowArtists}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            Artists
          </button>
        )}
      </div>

      <div className="sidebar-section">
        <h3 className="sidebar-title">Library</h3>
        <button className="sidebar-button" onClick={onLoadFiles}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
          </svg>
          Add Files
        </button>
        <button className="sidebar-button" onClick={onLoadFolder}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          Add Folder
        </button>
      </div>

      <div className="sidebar-section playlists-section">
        <div className="sidebar-title-row">
          <h3 className="sidebar-title">Playlists</h3>
          <button className="create-playlist-btn" onClick={onCreatePlaylist} title="Create Playlist">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
        </div>
        {playlists.length > 0 ? (
          <div className="playlists-list">
            {playlists.map((playlist) => (
              <div 
                key={playlist.id}
                className={`playlist-item ${selectedPlaylist?.id === playlist.id ? 'active' : ''}`}
                onClick={() => !editingPlaylist && onSelectPlaylist(playlist)}
                onDoubleClick={() => handleDoubleClick(playlist)}
                onContextMenu={(e) => handleContextMenu(e, playlist.id)}
              >
                <div className="playlist-item-info">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                  </svg>
                  <div className="playlist-text">
                    {editingPlaylist?.id === playlist.id ? (
                      <input
                        type="text"
                        className="playlist-name-edit"
                        defaultValue={editingPlaylist.name}
                        autoFocus
                        onKeyDown={handleRenameSubmit}
                        onBlur={() => setEditingPlaylist(null)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="playlist-name">{playlist.name}</span>
                    )}
                    <span className="playlist-count">{playlist.tracks.length} tracks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="playlists-empty">
            <p>No playlists yet</p>
            <p className="playlists-empty-hint">Click + to create one</p>
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {onAddPlaylistToQueue && (
            <button className="context-menu-item" onClick={() => {
              const playlist = playlists.find(p => p.id === contextMenu.playlistId);
              if (playlist) onAddPlaylistToQueue(playlist);
              setContextMenu(null);
            }}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
              </svg>
              Add to Queue
            </button>
          )}
          {onRenamePlaylist && (
            <button className="context-menu-item" onClick={handleRenameFromContext}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              Rename
            </button>
          )}
          <button className="context-menu-item delete" onClick={handleDeleteFromContext}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
            Delete Playlist
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
