import { LRCLine } from '../types';

/**
 * Parse LRC file content into structured lines with timestamps
 * LRC format: [mm:ss.xx]Lyric text
 * Example: [00:12.00]First line of lyrics
 */
export function parseLRC(lrcContent: string): LRCLine[] {
  const lines: LRCLine[] = [];
  const lrcLines = lrcContent.split('\n');

  // Regex to match timestamp: [mm:ss.xx] or [mm:ss.xxx]
  const timeRegex = /\[(\d{2,}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lrcLines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Extract all timestamps from the line
    const timestamps: number[] = [];
    let match;
    let lastIndex = 0;

    while ((match = timeRegex.exec(trimmedLine)) !== null) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const centiseconds = parseInt(match[3].padEnd(3, '0').substring(0, 3), 10);
      
      const timeInSeconds = minutes * 60 + seconds + centiseconds / 1000;
      timestamps.push(timeInSeconds);
      lastIndex = match.index + match[0].length;
    }

    // Extract the lyric text (everything after the last timestamp)
    const text = trimmedLine.substring(lastIndex).trim();

    // Skip metadata lines (e.g., [ar:Artist], [ti:Title], etc.)
    if (timestamps.length === 0) {
      continue;
    }

    // Add a line for each timestamp (some LRC files have multiple timestamps for the same text)
    for (const time of timestamps) {
      lines.push({ time, text });
    }
  }

  // Sort by timestamp
  lines.sort((a, b) => a.time - b.time);

  return lines;
}

/**
 * Get the currently active lyric line based on current playback time
 */
export function getCurrentLyricIndex(lrcLines: LRCLine[], currentTime: number): number {
  if (!lrcLines || lrcLines.length === 0) return -1;

  // Find the last line whose timestamp is less than or equal to current time
  for (let i = lrcLines.length - 1; i >= 0; i--) {
    if (lrcLines[i].time <= currentTime) {
      return i;
    }
  }

  return -1;
}

/**
 * Extract metadata from LRC file (artist, title, album, etc.)
 */
export function extractLRCMetadata(lrcContent: string): {
  artist?: string;
  title?: string;
  album?: string;
  by?: string;
  offset?: number;
} {
  const metadata: any = {};
  const lines = lrcContent.split('\n');

  const metadataRegex = /\[(\w+):(.+)\]/;

  for (const line of lines) {
    const match = line.match(metadataRegex);
    if (match) {
      const key = match[1].toLowerCase();
      const value = match[2].trim();

      switch (key) {
        case 'ar':
          metadata.artist = value;
          break;
        case 'ti':
          metadata.title = value;
          break;
        case 'al':
          metadata.album = value;
          break;
        case 'by':
          metadata.by = value;
          break;
        case 'offset':
          metadata.offset = parseInt(value, 10);
          break;
      }
    }
  }

  return metadata;
}
