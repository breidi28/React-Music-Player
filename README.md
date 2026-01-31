# Audiophile Music Player

A high-quality desktop music player built with Electron, React, and TypeScript, designed for audiophiles who care about sound quality and detailed audio metadata.

![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Highlights

- 🎵 **Audiophile-grade** playback with detailed quality metadata
- 🎛️ **10-band parametric EQ** with genre-optimized presets  
- 📀 **Album view** with beautiful artwork grid
- 🔀 **Smart shuffle** and flexible repeat modes
- ⌨️ **Comprehensive keyboard shortcuts** for power users
- 🎨 **Dark, minimalist UI** designed for focus
- 📊 **Signal path visualization** showing audio quality chain
- 🔍 **Instant search** across your entire library
- 💾 **Drag & drop** support for effortless library building

## Features

### 🎵 Audiophile-Grade Playback
- **Lossless Format Support**: FLAC, ALAC, WAV, APE
- **Lossy Format Support**: MP3, AAC, OGG, M4A
- **Bit-Perfect Audio**: Direct audio output using Web Audio API
- **Signal Path Visualization**: Roon-style audio chain display with quality indicators
- **10-Band Equalizer**: Parametric EQ (32 Hz - 16 kHz) with 8 presets
  - Flat, Audiophile, Bass Boost, Treble Boost, Classical, Rock, Jazz, Electronic
- **Gapless Playback**: Seamless track transitions with intelligent preloading
- **Audio Output Selection**: Choose your preferred audio device (speakers, headphones, DAC)

### 📊 Quality Analysis & Metadata
- **Detailed Audio Specs Display**:
  - Sample Rate (kHz)
  - Bit Depth (16/24/32-bit)
  - Bitrate (kbps)
  - Channel Configuration
  - Codec Information
  - File Size

- **Quality Badges**:
  - 🟢 **Hi-Res Lossless** (96kHz+)
  - 🔵 **Lossless** (FLAC, ALAC, WAV)
  - ⚪ **Standard** (MP3, AAC, etc.)

### 🎨 Modern Interface
- **Dark Theme**: Easy on the eyes for long listening sessions
- **Clean, Minimalist Design**: Focus on music, not clutter
- **Real-time Spectrum Analyzer**: Visualize your music
- **Album Art Display**: High-resolution cover art support
- **Synchronized Lyrics**: Upload LRC files for time-synced lyrics display with auto-scrolling and highlighting
- **Custom Window Controls**: Frameless, modern look

### 🎛️ Player Controls
- **Playback Controls**: Play, Pause, Skip (Next/Previous)
- **Shuffle Mode**: Random playback with smart track selection
- **Repeat Modes**: Off, Repeat All, Repeat One
- **Seekable Timeline**: Click or drag to any position
- **Volume Control**: Smooth volume adjustment with visual feedback
- **Queue Management**: View and edit upcoming tracks
- **Playlist Management**: Create, organize, and manage multiple playlists

### 🔍 Library Features
- **Album View**: Grid layout with album artwork and metadata
- **Smart Search**: Real-time filtering by title, artist, album, or format
- **Drag & Drop**: Drop files or folders to add to library
- **Context Menus**: Right-click to remove tracks or delete playlists
- **Persistent Storage**: Playlists and settings saved automatically

### ⌨️ Keyboard Shortcuts
- `Space`: Play/Pause
- `←/→`: Seek backward/forward (5 seconds)
- `Shift + ←/→`: Previous/Next track
- `↑/↓`: Volume up/down
- `Ctrl + M`: Mute/Unmute
- `Ctrl + S`: Toggle Shuffle
- `Ctrl + R`: Toggle Repeat

## Screenshots

[Coming Soon]

## Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Development Setup

1. **Clone or download the project**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run dev
   ```

   This will start both the Vite dev server (React) and Electron in development mode with hot reloading.

### Building for Production

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Package the application**:
   ```bash
   npm run package
   ```

   This will create distributable packages in the `release` folder for your platform.

## Usage

### Adding Music

1. **Add Files**: Click "Add Files" in the sidebar to select individual audio files
2. **Add Folder**: Click "Add Folder" to scan an entire directory for audio files
3. **Drag & Drop**: Drag audio files or folders directly onto the app window

### Creating Playlists

1. Click "Create Playlist" in the sidebar
2. Give your playlist a name
3. Add tracks by importing files or folders
4. Right-click tracks to remove them from playlists
5. Right-click playlists in the sidebar to delete them

### Playing Music

1. Select a track from the track list to start playback
2. Use the player controls at the bottom to control playback
3. View detailed audio quality information in the "Now Playing" section
4. Click the Signal Path button to see the audio processing chain
5. Use shuffle and repeat buttons for different playback modes

### Advanced Features

**Equalizer**: Click the EQ button in the player to open the 10-band equalizer. Choose from presets or create your own custom sound profile.

**Queue Management**: Click the Queue button to view and manage upcoming tracks:
- View current queue with playing track highlighted
- Remove tracks with right-click
- Add tracks to queue: Right-click any track → "Add to Queue"
- Play Next: Right-click any track to insert it next in queue
- Add entire playlists or albums to queue via right-click
- Queue respects shuffle and repeat modes

**Album View**: Click "Albums" in the sidebar to browse your library by album. Hover over album cards to see track listings. Right-click albums or tracks to add to queue.

**Search**: Use the search bar above track lists to filter by title, artist, album, or format.

**Audio Settings**: Click the settings button in the player to:
- Select your preferred audio output device
- Enable/disable gapless playback for seamless transitions
- Configure advanced audio options

### Audio Quality Information

Each track displays:
- **Format**: Audio codec (FLAC, MP3, etc.)
- **Sample Rate**: Audio sampling frequency
- **Bit Depth**: Bits per sample (for lossless formats)
- **Bitrate**: Data rate in kbps
- **File Size**: Total file size

Tracks are automatically categorized:
- **Hi-Res** (HR): Lossless files with 96kHz+ sample rate
- **Lossless** (LL): FLAC, ALAC, WAV formats
- **Standard** (ST): MP3, AAC, and other lossy formats

## Technology Stack

- **Electron 28**: Cross-platform desktop framework
- **React 18**: UI library with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Web Audio API**: High-quality audio processing and equalization
- **music-metadata 8**: Audio file metadata parsing with ffprobe fallback

## Project Structure

```
music-player/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # Main entry point, IPC handlers
│   │   └── preload.ts  # Preload script for IPC
│   └── renderer/       # React application
│       ├── components/ # UI components
│       │   ├── Player.tsx       # Bottom player bar
│       │   ├── TrackList.tsx    # Track listing with search
│       │   ├── AlbumView.tsx    # Album grid view
│       │   ├── Queue.tsx        # Queue panel
│       │   ├── Equalizer.tsx    # 10-band EQ
│       │   ├── SignalPath.tsx   # Audio chain visualization
│       │   └── ...
│       ├── App.tsx     # Main app component
│       └── types.ts    # TypeScript definitions
├── dist/              # Compiled output
├── release/           # Packaged applications
└── package.json
```

## Keyboard Shortcuts

- `Space`: Play/Pause
- `←`: Seek backward 5 seconds
- `→`: Seek forward 5 seconds  
- `Shift + ←`: Previous track
- `Shift + →`: Next track
- `↑`: Volume up
- `↓`: Volume down
- `Ctrl + M`: Mute/Unmute
- `Ctrl + S`: Toggle Shuffle
- `Ctrl + R`: Cycle Repeat Mode (Off → All → One)

*Note: Keyboard shortcuts are disabled when typing in search or input fields*

## Supported Audio Formats

| Format | Extension | Lossless | Max Quality |
|--------|-----------|----------|-------------|
| FLAC   | .flac     | ✅       | 24-bit/192kHz |
| ALAC   | .m4a      | ✅       | 24-bit/192kHz |
| WAV    | .wav      | ✅       | 24-bit/192kHz |
| APE    | .ape      | ✅       | 24-bit/192kHz |
| MP3    | .mp3      | ✅       | 320kbps |
| AAC    | .aac, .m4a| ✅       | 320kbps |
| OGG    | .ogg      | ✅       | ~500kbps |
| WMA    | .wma      | ✅       | 320kbps |

## Planned Features

- [ ] ReplayGain support
- [ ] Dynamic range analysis
- [ ] Persistent library database with indexing
- [ ] Last.fm scrobbling
- [ ] Multiple visualizer modes
- [ ] Lyrics display
- [ ] Mini player mode
- [ ] Global media key support
- [ ] Crossfade between tracks
- [ ] Audio fingerprinting

## Recently Implemented ✨

- [x] **Gapless Playback** with intelligent track preloading (5s before end)
- [x] **Audio Output Selection** for choosing playback device
- [x] **10-Band Equalizer** with 8 genre presets
- [x] **Album View** with grid layout and artwork
- [x] **Queue Management** with removal and reordering
- [x] **Smart Search** across all track metadata
- [x] **Drag & Drop** support for files and folders
- [x] **Keyboard Shortcuts** for all major functions
- [x] **Shuffle & Repeat** modes with visual indicators
- [x] **Track Management** with context menus
- [x] **Signal Path Visualization** (Roon-style)
- [x] **Persistent Settings** (playlists, volume, audio device)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Metadata parsing by [music-metadata](https://github.com/Borewit/music-metadata)
- UI built with [React](https://react.dev/)

## Support

For issues, questions, or suggestions, please open an issue on the GitHub repository.

---

**Made with ❤️ for audiophiles**

