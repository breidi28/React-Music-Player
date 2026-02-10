import React, { useState } from 'react';
import './CreatePlaylistModal.css';

interface CreatePlaylistModalProps {
  onClose: () => void;
  onCreate: (name: string) => void;
}

const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({ onClose, onCreate }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreate(name.trim());
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Playlist</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <label htmlFor="playlist-name">Playlist Name</label>
            <input
              id="playlist-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter playlist name..."
              autoFocus
              maxLength={50}
            />
          </div>
          
          <div className="modal-footer">
            <button type="button" className="modal-btn cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="modal-btn create" disabled={!name.trim()}>
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePlaylistModal;
