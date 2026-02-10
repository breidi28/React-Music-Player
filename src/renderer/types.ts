export interface LRCLine {
  time: number; // Time in seconds
  text: string;
}

export interface AudioMetadata {
  path: string;
  title: string;
  artist: string;
  album: string;
  year?: number;
  duration: number;
  format: string;
  bitrate?: number;
  sampleRate?: number;
  bitsPerSample?: number;
  numberOfChannels?: number;
  lossless: boolean;
  fileSize: number;
  artwork?: string | null;
  lyrics?: string | null;
  lrcPath?: string | null; // Path to associated LRC file
  lrcLines?: LRCLine[]; // Parsed LRC lines with timestamps
}

export interface Track extends AudioMetadata {
  id: string;
}

export interface Playlist {
  id: string;
  name: string;
  folderPath: string;
  tracks: Track[];
  dateAdded: number;
  artwork?: string | null;
  artworkType?: 'image' | null;
}

export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  selectFiles: () => Promise<string[]>;
  scanFolder: (folderPath: string) => Promise<string[]>;
  getFileMetadata: (filePath: string) => Promise<AudioMetadata | null>;
  getAudioUrl: (filePath: string) => Promise<string>;
  isDirectory: (path: string) => Promise<boolean>;
  selectLrcFile: () => Promise<string | null>;
  getLrcContent: (lrcPath: string) => Promise<string | null>;
  selectArtworkFile: () => Promise<string | null>;
  getArtworkData: (artworkPath: string) => Promise<{ data: string; type: 'image' } | { error: string } | null>;
  getArtwork: (filePath: string) => Promise<string | null>;
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
