import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Track, Playlist } from './types';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import TrackList from './components/TrackList';
import Player from './components/Player';
import NowPlaying from './components/NowPlaying';
import HomePage from './components/HomePage';
import SignalPath from './components/SignalPath';
import CreatePlaylistModal from './components/CreatePlaylistModal';
import Queue from './components/Queue';
import AlbumView from './components/AlbumView';
import ArtistView from './components/ArtistView';
import Equalizer from './components/Equalizer';
import AudioSettingsNew from './components/AudioSettingsNew';
import SearchResults from './components/SearchResults';
import PlaylistView from './components/PlaylistView';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

type View = 'home' | 'now-playing' | 'playlist' | 'albums' | 'artists';

const App: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [view, setView] = useState<View>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });
  const [showSignalPath, setShowSignalPath] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [gaplessEnabled, setGaplessEnabled] = useState(true);
  const [nextTrackPreloaded, setNextTrackPreloaded] = useState(false);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedOutputDevice, setSelectedOutputDevice] = useState<string>('default');
  const [globalSearch, setGlobalSearch] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const nextAudioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Initialize Web Audio API on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && audioRef.current) {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    }
  }, []);

  // Load playlists from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('audiophile-playlists');
    if (saved) {
      try {
        setPlaylists(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved playlists');
      }
    }

    // Load saved volume
    const savedVolume = localStorage.getItem('audiophile-volume');
    if (savedVolume) {
      try {
        const vol = parseFloat(savedVolume);
        if (!isNaN(vol) && vol >= 0 && vol <= 1) {
          setVolume(vol);
          if (audioRef.current) {
            audioRef.current.volume = vol;
          }
        }
      } catch (e) {
        console.error('Failed to load saved volume');
      }
    }

    // Load saved output device
    const savedDevice = localStorage.getItem('audiophile-output-device');
    if (savedDevice) {
      setSelectedOutputDevice(savedDevice);
    }

    // Enumerate audio output devices
    enumerateAudioDevices();
  }, []);

  // Enumerate audio output devices
  const enumerateAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
      setAudioOutputDevices(audioOutputs);
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error);
    }
  };

  // Save playlists to localStorage
  useEffect(() => {
    if (playlists.length > 0) {
      try {
        localStorage.setItem('audiophile-playlists', JSON.stringify(playlists));
      } catch (error) {
        console.error('Failed to save playlists to localStorage (quota exceeded?)', error);
        // Optional: show a notification to the user
      }
    } else {
      // Remove from localStorage if all playlists are deleted
      localStorage.removeItem('audiophile-playlists');
    }
  }, [playlists]);

  // Save volume to localStorage
  useEffect(() => {
    localStorage.setItem('audiophile-volume', volume.toString());
  }, [volume]);

  // Save selected audio output device
  useEffect(() => {
    if (selectedOutputDevice !== 'default') {
      localStorage.setItem('audiophile-output-device', selectedOutputDevice);
    }
    
    // Apply to audio elements
    if (audioRef.current && 'setSinkId' in audioRef.current) {
      (audioRef.current as any).setSinkId(selectedOutputDevice).catch((err: any) => {
        console.error('Failed to set audio output device:', err);
      });
    }
    if (nextAudioRef.current && 'setSinkId' in nextAudioRef.current) {
      (nextAudioRef.current as any).setSinkId(selectedOutputDevice).catch((err: any) => {
        console.error('Failed to set next audio output device:', err);
      });
    }
  }, [selectedOutputDevice]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            playNext();
          } else {
            e.preventDefault();
            const newTime = Math.min(currentTime + 5, duration);
            handleSeek(newTime);
          }
          break;
        case 'ArrowLeft':
          if (e.shiftKey) {
            playPrevious();
          } else {
            e.preventDefault();
            const newTime = Math.max(currentTime - 5, 0);
            handleSeek(newTime);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        case 'KeyM':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleVolumeChange(volume > 0 ? 0 : 0.7);
          }
          break;
        case 'KeyS':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleShuffle();
          }
          break;
        case 'KeyR':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleRepeat();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, volume, isPlaying, currentTrack]);

  // Drag & Drop support
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const filePaths: string[] = [];
      const folderPaths: string[] = [];

      // Collect file paths
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = (file as any).path; // Electron exposes the file path

        if (!path) continue;

        // Check if it's a directory (Electron doesn't have a direct way, so we check via API)
        const isDirectory = await window.electronAPI.isDirectory(path);
        
        if (isDirectory) {
          folderPaths.push(path);
        } else {
          // Check if it's a supported audio file
          const ext = path.toLowerCase().split('.').pop();
          if (['mp3', 'flac', 'm4a', 'wav', 'ogg', 'aac', 'wma', 'opus'].includes(ext || '')) {
            filePaths.push(path);
          }
        }
      }

      // Scan folders for audio files
      for (const folder of folderPaths) {
        const files = await window.electronAPI.scanFolder(folder);
        filePaths.push(...files);
      }

      if (filePaths.length === 0) return;

      // Load tracks
      setIsLoading(true);
      setLoadingProgress({ current: 0, total: filePaths.length });
      const tracks = await loadTracksFromPaths(filePaths);

      if (tracks.length > 0) {
        if (selectedPlaylist) {
          // Add to current playlist
          const updatedPlaylist = {
            ...selectedPlaylist,
            tracks: [...selectedPlaylist.tracks, ...tracks],
          };
          setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
          setSelectedPlaylist(updatedPlaylist);
        } else {
          // Find existing "Imported Files" playlist or create new one
          const existingPlaylist = playlists.find(p => p.name === 'Imported Files' && p.folderPath === '');
          
          if (existingPlaylist) {
            const updatedPlaylist = {
              ...existingPlaylist,
              tracks: [...existingPlaylist.tracks, ...tracks],
            };
            setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
            setSelectedPlaylist(updatedPlaylist);
          } else {
            // Create new playlist
            const playlist: Playlist = {
              id: Math.random().toString(36).substr(2, 9),
              name: 'Imported Files',
              folderPath: '',
              tracks,
              dateAdded: Date.now(),
            };
            setPlaylists(prev => [...prev, playlist]);
            setSelectedPlaylist(playlist);
          }
          setView('playlist');
        }
      }

      setIsLoading(false);
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [selectedPlaylist]);

  const loadFiles = async () => {
    const files = await window.electronAPI.selectFiles();
    if (files.length > 0) {
      setIsLoading(true);
      setLoadingProgress({ current: 0, total: files.length });
      const tracks = await loadTracksFromPaths(files);
      if (tracks.length > 0) {
        // Find existing "Imported Files" playlist
        const existingPlaylist = playlists.find(p => p.name === 'Imported Files' && p.folderPath === '');
        
        if (existingPlaylist) {
          // Add to existing playlist
          const updatedPlaylist = {
            ...existingPlaylist,
            tracks: [...existingPlaylist.tracks, ...tracks],
          };
          setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
          setSelectedPlaylist(updatedPlaylist);
        } else {
          // Create new playlist
          const playlist: Playlist = {
            id: Math.random().toString(36).substr(2, 9),
            name: 'Imported Files',
            folderPath: '',
            tracks,
            dateAdded: Date.now(),
          };
          setPlaylists(prev => [...prev, playlist]);
          setSelectedPlaylist(playlist);
        }
        setView('playlist');
      }
      setIsLoading(false);
    }
  };

  const loadFolder = async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setIsLoading(true);
        const files = await window.electronAPI.scanFolder(folder);
        setLoadingProgress({ current: 0, total: files.length });
        
        const tracks = await loadTracksFromPaths(files);
        
        if (tracks.length > 0) {
          const folderName = folder.split(/[/\\]/).pop() || 'Unknown Folder';
          const playlist: Playlist = {
            id: Math.random().toString(36).substr(2, 9),
            name: folderName,
            folderPath: folder,
            tracks,
            dateAdded: Date.now(),
          };
          setPlaylists(prev => [...prev, playlist]);
          setSelectedPlaylist(playlist);
          setView('playlist');
        }
        
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading folder:', error);
      setIsLoading(false);
    }
  };

  const loadTracksFromPaths = async (paths: string[]): Promise<Track[]> => {
    const newTracks: Track[] = [];
    let processed = 0;
    
    try {
      // Load LRC associations from localStorage
      const lrcAssociations = JSON.parse(localStorage.getItem('lrcAssociations') || '{}');
      
      for (const filePath of paths) {
        try {
          const metadata = await window.electronAPI.getFileMetadata(filePath);
          
          if (metadata !== null) {
            const track: Track = {
              ...metadata,
              id: Math.random().toString(36).substr(2, 9),
            };

            // Check if there's an associated LRC file for this track
            const lrcPath = lrcAssociations[filePath];
            if (lrcPath) {
              try {
                const lrcContent = await window.electronAPI.getLrcContent(lrcPath);
                if (lrcContent) {
                  const { parseLRC } = await import('./utils/lrcParser');
                  track.lrcPath = lrcPath;
                  track.lrcLines = parseLRC(lrcContent);
                }
              } catch (error) {
                console.error('Error loading LRC file for track:', filePath, error);
              }
            }

            newTracks.push(track);
          }
        } catch (error) {
          console.error('Error loading track:', filePath, error);
        }
        
        processed++;
        // Throttling progress updates to avoid UI freezes with many files
        if (processed % 5 === 0 || processed === paths.length) {
          setLoadingProgress({ current: processed, total: paths.length });
        }
      }
    } catch (error) {
      console.error('Error in loadTracksFromPaths:', error);
    }
    
    return newTracks;
  };

  const playTrack = async (track: Track, trackList?: Track[]) => {
    initAudioContext();
    
    // Ensure we always have a valid track list
    const effectiveTrackList = trackList || selectedPlaylist?.tracks || [track];
    
    setCurrentTrack(track);
    setQueue(effectiveTrackList);
    const newIndex = effectiveTrackList.findIndex(t => t.id === track.id);
    setQueueIndex(newIndex >= 0 ? newIndex : 0);
    
    if (audioRef.current) {
      try {
        const audioUrl = await window.electronAPI.getAudioUrl(track.path);
        console.log('Playing track:', track.title);
        console.log('Audio URL:', audioUrl);
        console.log('File path:', track.path);
        
        audioRef.current.src = audioUrl;
        audioRef.current.load(); // Force reload the audio element
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Playback started successfully');
              setIsPlaying(true);
              if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
              }
              
              // Preload next track for gapless playback
              if (gaplessEnabled) {
                preloadNextTrack(effectiveTrackList, newIndex >= 0 ? newIndex : 0);
              }
            })
            .catch((error) => {
              console.error('Playback failed:', error);
              setIsPlaying(false);
            });
        }
      } catch (error) {
        console.error('Error playing track:', error);
      }
    }
  };

  const preloadNextTrack = async (trackList: Track[], currentIndex: number) => {
    const nextIndex = getNextTrackIndex(trackList, currentIndex);
    
    if (nextIndex !== -1 && nextAudioRef.current) {
      const nextTrack = trackList[nextIndex];
      try {
        const audioUrl = await window.electronAPI.getAudioUrl(nextTrack.path);
        nextAudioRef.current.src = audioUrl;
        nextAudioRef.current.load();
        nextAudioRef.current.volume = volume;
        
        // Apply output device to next audio element
        if ('setSinkId' in nextAudioRef.current && selectedOutputDevice !== 'default') {
          (nextAudioRef.current as any).setSinkId(selectedOutputDevice).catch((err: any) => {
            console.error('Failed to set next track output device:', err);
          });
        }
        
        setNextTrackPreloaded(true);
        console.log('Preloaded next track:', nextTrack.title);
      } catch (error) {
        console.error('Error preloading next track:', error);
        setNextTrackPreloaded(false);
      }
    }
  };

  const getNextTrackIndex = (trackList: Track[], currentIndex: number): number => {
    if (isShuffled) {
      const availableIndices = trackList
        .map((_, i) => i)
        .filter(i => i !== currentIndex);
      if (availableIndices.length === 0) return -1;
      return availableIndices[Math.floor(Math.random() * availableIndices.length)];
    }

    if (repeatMode === 'one') {
      return currentIndex;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < trackList.length) {
      return nextIndex;
    } else if (repeatMode === 'all') {
      return 0;
    }

    return -1;
  };

  const togglePlayPause = async () => {
    if (!audioRef.current || !currentTrack) return;

    initAudioContext();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
      } catch (error) {
        console.error('Error resuming playback:', error);
      }
    }
  };

  const playNext = async () => {
    if (queue.length === 0) return;
    
    if (repeatMode === 'one') {
      // Replay current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
      return;
    }
    
    let nextIndex: number;
    if (isShuffled) {
      // Pick random track excluding current
      do {
        nextIndex = Math.floor(Math.random() * queue.length);
      } while (nextIndex === queueIndex && queue.length > 1);
    } else {
      nextIndex = queueIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return; // End of queue
        }
      }
    }
    
    await playTrack(queue[nextIndex], queue);
  };

  const playPrevious = async () => {
    if (queue.length === 0) return;
    
    if (currentTime > 3) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return;
    }
    
    let prevIndex: number;
    if (isShuffled) {
      // Pick random track excluding current
      do {
        prevIndex = Math.floor(Math.random() * queue.length);
      } while (prevIndex === queueIndex && queue.length > 1);
    } else {
      prevIndex = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
    }
    
    await playTrack(queue[prevIndex], queue);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      
      // Preload next track when approaching end (5 seconds before)
      if (gaplessEnabled && !nextTrackPreloaded && duration > 0 && 
          currentTime > duration - 5 && currentTime < duration - 4) {
        preloadNextTrack(queue, queueIndex);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    if (gaplessEnabled && nextTrackPreloaded && nextAudioRef.current) {
      // Gapless transition: swap audio elements
      performGaplessTransition();
    } else {
      // Standard transition
      playNext();
    }
  };

  const updateTrackData = (updatedTrack: Track) => {
    // Update the current track
    setCurrentTrack(updatedTrack);

    // Update in queue
    const updatedQueue = queue.map(t => t.id === updatedTrack.id ? updatedTrack : t);
    setQueue(updatedQueue);

    // Update in all playlists that contain this track
    const updatedPlaylists = playlists.map(playlist => ({
      ...playlist,
      tracks: playlist.tracks.map(t => t.path === updatedTrack.path ? updatedTrack : t)
    }));
    setPlaylists(updatedPlaylists);

    // Update selected playlist if it contains this track
    if (selectedPlaylist) {
      const updatedPlaylist = {
        ...selectedPlaylist,
        tracks: selectedPlaylist.tracks.map(t => t.path === updatedTrack.path ? updatedTrack : t)
      };
      setSelectedPlaylist(updatedPlaylist);
    }
  };

  const performGaplessTransition = () => {
    if (!nextAudioRef.current || !audioRef.current) return;

    const nextIndex = getNextTrackIndex(queue, queueIndex);
    if (nextIndex === -1) {
      setIsPlaying(false);
      return;
    }

    // Swap the audio element references
    const tempSrc = audioRef.current.src;
    audioRef.current.src = nextAudioRef.current.src;
    nextAudioRef.current.src = tempSrc;

    // Play the new track
    audioRef.current.play()
      .then(() => {
        setCurrentTrack(queue[nextIndex]);
        setQueueIndex(nextIndex);
        setIsPlaying(true);
        setNextTrackPreloaded(false);
        
        // Preload the next track after this one
        preloadNextTrack(queue, nextIndex);
      })
      .catch(error => {
        console.error('Gapless transition failed:', error);
        // Fall back to standard playback
        playNext();
      });
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleShuffle = () => {
    setIsShuffled(prev => !prev);
  };

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const selectPlaylist = (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setView('playlist');
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
      setView('home');
    }
  };

  const renamePlaylist = (playlistId: string, newName: string) => {
    setPlaylists(prev => prev.map(p => 
      p.id === playlistId ? { ...p, name: newName } : p
    ));
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(prev => prev ? { ...prev, name: newName } : null);
    }
  };

  const reorderTracks = (fromIndex: number, toIndex: number) => {
    if (!selectedPlaylist) return;

    const tracks = [...selectedPlaylist.tracks];
    const [movedTrack] = tracks.splice(fromIndex, 1);
    tracks.splice(toIndex, 0, movedTrack);

    const updatedPlaylist = { ...selectedPlaylist, tracks };
    setPlaylists(prev => prev.map(p => p.id === selectedPlaylist.id ? updatedPlaylist : p));
    setSelectedPlaylist(updatedPlaylist);
  };

  const createPlaylist = () => {
    setShowCreatePlaylist(true);
  };

  const handleCreatePlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      folderPath: '',
      tracks: [],
      dateAdded: Date.now(),
    };
    setPlaylists(prev => [...prev, newPlaylist]);
    setSelectedPlaylist(newPlaylist);
    setView('playlist');
  };

  const handleRemoveTrack = (trackId: string) => {
    if (!selectedPlaylist) return;

    const updatedTracks = selectedPlaylist.tracks.filter(t => t.id !== trackId);
    const updatedPlaylist = {
      ...selectedPlaylist,
      tracks: updatedTracks,
    };

    setPlaylists(prev => prev.map(p => p.id === updatedPlaylist.id ? updatedPlaylist : p));
    setSelectedPlaylist(updatedPlaylist);

    // If the removed track is currently playing, stop playback
    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    }

    // Update queue if necessary
    if (queue.some(t => t.id === trackId)) {
      setQueue(updatedTracks);
      const newIndex = updatedTracks.findIndex(t => t.id === currentTrack?.id);
      setQueueIndex(newIndex);
    }
  };

  const handleRemoveFromQueue = (index: number) => {
    const newQueue = queue.filter((_, i) => i !== index);
    setQueue(newQueue);
    
    // Adjust queue index if necessary
    if (index <= queueIndex) {
      setQueueIndex(Math.max(0, queueIndex - 1));
    }
  };

  const addToQueue = (track: Track) => {
    setQueue(prev => [...prev, track]);
  };

  const addTrackPlayNext = (track: Track) => {
    setQueue(prev => {
      const newQueue = [...prev];
      newQueue.splice(queueIndex + 1, 0, track);
      return newQueue;
    });
  };

  const addPlaylistToQueue = (playlist: Playlist) => {
    setQueue(prev => [...prev, ...playlist.tracks]);
  };

  const goHome = () => {
    setView('home');
    setSelectedPlaylist(null);
  };

  const showNowPlaying = () => {
    if (currentTrack) {
      setView('now-playing');
    }
  };

  const handleToggleFullscreen = () => {
    if (!isFullscreen && currentTrack) {
      // Entering fullscreen: navigate to Now Playing view
      setView('now-playing');
      setIsFullscreen(true);
    } else {
      // Exiting fullscreen: just toggle the state
      setIsFullscreen(false);
    }
  };

  const showAlbums = () => {
    setView('albums');
    setSelectedPlaylist(null);
  };

  const showArtists = () => {
    setView('artists');
    setSelectedPlaylist(null);
  };

  const allTracks = playlists.flatMap(p => p.tracks);

  return (
    <div className="app">
      <TitleBar />
      
      <div className="app-content">
            <Sidebar 
              playlists={playlists}
              selectedPlaylist={selectedPlaylist}
              onLoadFiles={loadFiles}
              onLoadFolder={loadFolder}
              onSelectPlaylist={selectPlaylist}
              onDeletePlaylist={deletePlaylist}
              onRenamePlaylist={renamePlaylist}
              onCreatePlaylist={createPlaylist}
              onGoHome={goHome}
              onShowAlbums={showAlbums}
              onShowArtists={showArtists}
              currentTrack={currentTrack}
              onAddPlaylistToQueue={addPlaylistToQueue}
            />
            
            <div className="main-content">
              {/* Global Search Bar */}
              <div className="global-search-bar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search songs, playlists..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
                {globalSearch && (
                  <button className="search-clear-btn" onClick={() => setGlobalSearch('')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                )}
              </div>
          
          <div className="content-wrapper">
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading tracks...</p>
                <p className="loading-progress">
                  {loadingProgress.current} / {loadingProgress.total}
                </p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            ) : globalSearch.trim() ? (
              <SearchResults
                query={globalSearch}
                playlists={playlists}
                tracks={allTracks}
                currentTrack={currentTrack}
                onSelectPlaylist={selectPlaylist}
                onPlayTrack={playTrack}
                onAddToQueue={addToQueue}
                onPlayNext={addTrackPlayNext}
              />
            ) : view === 'home' ? (
              <HomePage 
                playlists={playlists}
                recentTracks={allTracks.slice(-10).reverse()}
                onSelectPlaylist={selectPlaylist}
                onPlayTrack={playTrack}
                onLoadFolder={loadFolder}
              />
            ) : view === 'now-playing' ? (
              <NowPlaying 
                track={currentTrack}
                isPlaying={isPlaying}
                analyser={analyserRef.current}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                currentTime={currentTime}
                onUpdateTrack={updateTrackData}
              />
            ) : view === 'albums' ? (
              <AlbumView
                tracks={allTracks}
                currentTrack={currentTrack}
                onTrackSelect={playTrack}
                onAddToQueue={addToQueue}
                onPlayNext={addTrackPlayNext}
              />
            ) : view === 'artists' ? (
              <ErrorBoundary>
                <ArtistView
                  tracks={allTracks}
                  onTrackSelect={playTrack}
                  onAddToQueue={addToQueue}
                  onPlayNext={addTrackPlayNext}
                />
              </ErrorBoundary>
            ) : selectedPlaylist ? (
              <PlaylistView
                playlist={selectedPlaylist}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                onPlayTrack={playTrack}
                onPlayAll={() => {
                  if (selectedPlaylist.tracks.length > 0) {
                    setQueue(selectedPlaylist.tracks);
                    setQueueIndex(0);
                    playTrack(selectedPlaylist.tracks[0]);
                  }
                }}
                onShuffle={() => {
                  if (selectedPlaylist.tracks.length > 0) {
                    const shuffled = [...selectedPlaylist.tracks].sort(() => Math.random() - 0.5);
                    setQueue(shuffled);
                    setQueueIndex(0);
                    playTrack(shuffled[0]);
                  }
                }}
                onRemoveTrack={handleRemoveTrack}
                onUpdatePlaylist={(updatedPlaylist) => {
                  setSelectedPlaylist(updatedPlaylist);
                  setPlaylists(playlists.map(p => 
                    p.id === updatedPlaylist.id ? updatedPlaylist : p
                  ));
                }}
              />
            ) : (
              <TrackList 
                tracks={selectedPlaylist?.tracks || []}
                currentTrack={currentTrack}
                onTrackSelect={playTrack}
                playlistName={selectedPlaylist?.name || ''}
                onRemoveTrack={handleRemoveTrack}
                onAddToQueue={addToQueue}
                onPlayNext={addTrackPlayNext}
                onReorderTracks={reorderTracks}
              />
            )}
          </div>
        </div>
      </div>
      
      <Player
        track={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        onPlayPause={togglePlayPause}
        onNext={playNext}
        onPrevious={playPrevious}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onShowNowPlaying={showNowPlaying}
        onShowSignalPath={() => setShowSignalPath(true)}
        onShowQueue={() => setShowQueue(true)}
        onShowEqualizer={() => setShowEqualizer(true)}
        onShowAudioSettings={() => setShowAudioSettings(true)}
        isShuffled={isShuffled}
        repeatMode={repeatMode}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {showSignalPath && (
        <SignalPath
          track={currentTrack}
          audioContext={audioContextRef.current}
          isPlaying={isPlaying}
          onClose={() => setShowSignalPath(false)}
        />
      )}

      {showQueue && (
        <Queue
          queue={queue}
          currentIndex={queueIndex}
          currentTrack={currentTrack}
          onTrackSelect={playTrack}
          onRemoveFromQueue={handleRemoveFromQueue}
          onClose={() => setShowQueue(false)}
        />
      )}

      <Equalizer
        audioContext={audioContextRef.current}
        sourceNode={sourceRef.current}
        destinationNode={analyserRef.current}
        isOpen={showEqualizer}
        onClose={() => setShowEqualizer(false)}
      />

      {showAudioSettings && (
        <AudioSettingsNew
          audioDevices={audioOutputDevices}
          selectedDevice={selectedOutputDevice}
          gaplessEnabled={gaplessEnabled}
          onDeviceChange={(deviceId) => {
            setSelectedOutputDevice(deviceId);
            localStorage.setItem('audiophile-output-device', deviceId);
          }}
          onGaplessToggle={(enabled) => {
            setGaplessEnabled(enabled);
            localStorage.setItem('audiophile-gapless', String(enabled));
          }}
          onOpenEqualizer={() => {
            setShowAudioSettings(false);
            setShowEqualizer(true);
          }}
          onClose={() => setShowAudioSettings(false)}
        />
      )}

      {showCreatePlaylist && (
        <CreatePlaylistModal
          onClose={() => setShowCreatePlaylist(false)}
          onCreate={handleCreatePlaylist}
        />
      )}

      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={(e) => console.error('Audio error:', e)}
      />
      
      {/* Hidden audio element for gapless playback preloading */}
      <audio
        ref={nextAudioRef}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default App;