# LRC Synchronized Lyrics Feature

## Overview
The Audiophile Music Player now supports LRC (synchronized lyrics) files, allowing you to display time-synced lyrics that highlight the current line as the song plays.

## Features

### 1. Upload LRC Files
- Navigate to the "Now Playing" view while a song is playing
- Click the "Upload LRC File" button
- Select the .lrc file for the current song
- The lyrics will be parsed and displayed with time synchronization

### 2. Synchronized Display
- Current lyric line is highlighted with a purple gradient background
- Text size increases for the active line
- Past lines are dimmed
- Automatic smooth scrolling to keep the current line centered
- Lyrics update in real-time as the song plays

### 3. Persistent Associations
- LRC file associations are saved to localStorage
- When you reload songs, their associated LRC files are automatically loaded
- Associations are tied to the audio file path

### 4. Manage LRC Files
- **Remove LRC**: Click the X button next to "Show/Hide Lyrics" to remove the LRC file
- **Toggle Display**: Use "Show Lyrics"/"Hide Lyrics" button to toggle visibility
- Works alongside regular embedded lyrics (plain text)

## LRC File Format

LRC files use the following format:
```
[mm:ss.xx]Lyric text
```

Example:
```
[ar:Artist Name]
[ti:Song Title]
[al:Album Name]

[00:12.00]First line of lyrics
[00:17.50]Second line of lyrics
[00:23.80]Third line here
```

### Metadata Tags (Optional)
- `[ar:Artist]` - Artist name
- `[ti:Title]` - Song title
- `[al:Album]` - Album name
- `[by:Creator]` - LRC file creator
- `[offset:+/-100]` - Time offset in milliseconds

### Timestamp Format
- `[mm:ss.xx]` - Minutes:Seconds.Centiseconds
- `[mm:ss.xxx]` - Minutes:Seconds.Milliseconds

## Where to Find LRC Files

You can:
1. Create your own LRC files using a text editor
2. Find LRC files online from various lyrics databases
3. Use LRC editor software to create synchronized lyrics

## Example LRC File

An example LRC file (`example-lyrics.lrc`) is included in the project root for testing.

## Technical Details

### Implementation
- **Parser**: Custom LRC parser in `src/renderer/utils/lrcParser.ts`
- **Storage**: LRC associations stored in localStorage
- **Sync**: Uses audio element's `currentTime` to determine active lyric
- **UI**: Smooth scrolling and highlighting in `NowPlaying` component

### File Structure
- LRC files are not copied - only the path is stored
- Associations map: `{ [audioFilePath]: lrcFilePath }`
- Parsed LRC data is cached in the Track object during runtime

### Browser Support
- Works in all modern browsers and Electron
- Smooth scrolling supported
- No external dependencies for LRC parsing

## Keyboard Shortcuts
- All existing shortcuts still work
- Use arrow keys to seek (left/right) - lyrics will update accordingly
- Space to play/pause

## Tips
- Make sure LRC timestamps match your audio file version
- If lyrics seem out of sync, check the `[offset]` tag
- You can edit LRC files with any text editor
- Keep LRC files in the same folder as your music for easy organization
