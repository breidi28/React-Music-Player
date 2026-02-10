import { app, BrowserWindow, ipcMain, dialog, protocol, net, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, readSync, openSync, closeSync } from 'fs';
import { pathToFileURL } from 'url';

let mainWindow: BrowserWindow | null = null;
let parseFile: any;
let parseStream: any;

// Detect actual file type from magic bytes
async function detectFileType(filePath: string): Promise<{ mime: string; ext: string } | null> {
  try {
    const fd = openSync(filePath, 'r');
    const buffer = Buffer.alloc(4096); // Read more bytes to handle ID3v2 tags before FLAC
    readSync(fd, buffer, 0, 4096, 0);
    closeSync(fd);
    
    // Check magic bytes
    // FLAC: 'fLaC' - can be at start or after ID3v2 tag
    const flacIndex = buffer.indexOf('fLaC', 0, 'binary');
    if (flacIndex >= 0 && flacIndex < 4096) {
      // Found FLAC signature (possibly after ID3v2 tag)
      return { mime: 'audio/flac', ext: 'flac' };
    }
    
    // Also check immediate start for standard FLAC
    if (buffer[0] === 0x66 && buffer[1] === 0x4C && buffer[2] === 0x61 && buffer[3] === 0x43) {
      return { mime: 'audio/flac', ext: 'flac' };
    }
    // MP3: ID3 tag or sync bytes
    if ((buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || // ID3
        (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)) { // Sync
      return { mime: 'audio/mpeg', ext: 'mp3' };
    }
    // WAV: RIFF....WAVE
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x41 && buffer[10] === 0x56 && buffer[11] === 0x45) {
      return { mime: 'audio/wav', ext: 'wav' };
    }
    // OGG: OggS
    if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
      return { mime: 'audio/ogg', ext: 'ogg' };
    }
    // M4A/AAC: ftyp
    if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
      return { mime: 'audio/mp4', ext: 'm4a' };
    }
    
    return null;
  } catch {
    return null;
  }
}

// Parse artist and title from filename
function parseFilename(fileName: string): { artist: string; title: string } {
  // Remove extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  
  // Common patterns: "Artist - Title", "Artist - Title (feat. X)", etc.
  const separators = [' - ', ' – ', ' — ', '_-_'];
  
  for (const sep of separators) {
    if (nameWithoutExt.includes(sep)) {
      const parts = nameWithoutExt.split(sep);
      if (parts.length >= 2) {
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(sep).trim()
        };
      }
    }
  }
  
  // No separator found, use filename as title
  return {
    artist: 'Unknown Artist',
    title: nameWithoutExt
  };
}

// Get metadata using ffprobe as fallback
async function getMetadataWithFfprobe(filePath: string): Promise<{
  duration?: number;
  sampleRate?: number;
  bitsPerSample?: number;
  bitrate?: number;
  channels?: number;
  codec?: string;
  artist?: string;
  title?: string;
  album?: string;
  artwork?: string | null;
} | null> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Escape the file path for shell
    const escapedPath = filePath.replace(/"/g, '\\"');
    
    const { stdout } = await execAsync(
      `ffprobe -v quiet -print_format json -show_format -show_streams "${escapedPath}"`,
      { maxBuffer: 1024 * 1024 }
    );
    
    const data = JSON.parse(stdout);
    const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio');
    // Look for video stream (album art is often stored as a video stream in audio files)
    const videoStream = data.streams?.find((s: any) => 
      s.codec_type === 'video' && (s.codec_name === 'mjpeg' || s.codec_name === 'png' || s.codec_name === 'bmp')
    );
    const format = data.format || {};
    const tags = format.tags || {};
    
    let artwork: string | null = null;
    
    // Extract artwork if embedded (common in FLAC/MP3 with album art)
    if (videoStream) {
      try {
        // Determine output format based on codec
        const artFormat = videoStream.codec_name === 'png' ? 'png' : 'jpg';
        const mimeType = videoStream.codec_name === 'png' ? 'image/png' : 'image/jpeg';
        
        // Create temp file for artwork
        const tempArtPath = path.join(app.getPath('temp'), `artwork_${Date.now()}.${artFormat}`);
        
        // Extract artwork frame (stream copy to preserve quality)
        await execAsync(
          `ffmpeg -v quiet -i "${escapedPath}" -an -c:v copy "${tempArtPath}"`,
          { maxBuffer: 10 * 1024 * 1024, timeout: 5000 }
        );
        
        // Read as base64
        const artData = await fs.readFile(tempArtPath);
        
        try {
          // Resize extracted artwork using nativeImage
          const image = nativeImage.createFromBuffer(artData);
          if (!image.isEmpty()) {
            const resized = image.resize({ width: 300, quality: 'good' });
            const jpegData = resized.toJPEG(70);
            artwork = `data:image/jpeg;base64,${jpegData.toString('base64')}`;
          } else {
            artwork = `data:${mimeType};base64,${artData.toString('base64')}`;
          }
        } catch (resizeError) {
          artwork = `data:${mimeType};base64,${artData.toString('base64')}`;
        }
        
        // Clean up temp file
        await fs.unlink(tempArtPath).catch(() => {});
        
        console.log(`Extracted ${mimeType} artwork from ${path.basename(filePath)} using ffmpeg`);
      } catch (artError) {
        console.log(`Could not extract artwork with stream copy: ${artError instanceof Error ? artError.message : 'Unknown error'}`);
        
        // Try alternative method - extract as jpeg with re-encoding
        try {
          const tempArtPath = path.join(app.getPath('temp'), `artwork_${Date.now()}_re.jpg`);
          await execAsync(
            `ffmpeg -v quiet -i "${escapedPath}" -an -vframes 1 "${tempArtPath}"`,
            { maxBuffer: 10 * 1024 * 1024, timeout: 5000 }
          );
          
          const artData = await fs.readFile(tempArtPath);
          try {
            // Resize extracted artwork using nativeImage
            const image = nativeImage.createFromBuffer(artData);
            if (!image.isEmpty()) {
              const resized = image.resize({ width: 300, quality: 'good' });
              const jpegData = resized.toJPEG(70);
              artwork = `data:image/jpeg;base64,${jpegData.toString('base64')}`;
            } else {
              artwork = `data:image/jpeg;base64,${artData.toString('base64')}`;
            }
          } catch (e) {
            artwork = `data:image/jpeg;base64,${artData.toString('base64')}`;
          }
          await fs.unlink(tempArtPath).catch(() => {});
          console.log(`Extracted artwork (re-encoded) from ${path.basename(filePath)} using ffmpeg`);
        } catch (reencodeError) {
          console.log(`Re-encode attempt also failed: ${reencodeError instanceof Error ? reencodeError.message : 'Unknown error'}`);
        }
      }
    }
    
    return {
      duration: format.duration ? parseFloat(format.duration) : undefined,
      sampleRate: audioStream?.sample_rate ? parseInt(audioStream.sample_rate) : undefined,
      bitsPerSample: audioStream?.bits_per_raw_sample ? parseInt(audioStream.bits_per_raw_sample) : undefined,
      bitrate: format.bit_rate ? parseInt(format.bit_rate) : undefined,
      channels: audioStream?.channels,
      codec: audioStream?.codec_name?.toUpperCase(),
      artist: tags.artist || tags.ARTIST || tags.Artist,
      title: tags.title || tags.TITLE || tags.Title,
      album: tags.album || tags.ALBUM || tags.Album,
      artwork,
    };
  } catch (error) {
    console.log('ffprobe failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0a',
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false, // Allow loading local files
    },
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Register custom protocol for audio files
  protocol.handle('audio', async (request) => {
    // Extract file path - handle Windows paths correctly
    let filePath = request.url.replace('audio://', '');
    filePath = decodeURIComponent(filePath);
    
    // Convert to proper file URL for net.fetch
    const fileUrl = pathToFileURL(filePath).href;
    console.log('Playing audio from:', fileUrl);
    
    return net.fetch(fileUrl);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-audio-url', async (_, filePath: string) => {
  // Convert Windows path to proper file URL
  // pathToFileURL handles all the encoding properly
  return pathToFileURL(filePath).href;
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  return result.filePaths[0];
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'ogg', 'm4a', 'aac', 'alac', 'wma'] },
      { name: 'All Files', extensions: ['*'] }
    ],
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }
  
  return result.filePaths;
});

ipcMain.handle('scan-folder', async (_, folderPath: string) => {
  const audioExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a', '.aac', '.alac', '.wma'];
  const files: string[] = [];

  async function scanDirectory(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (audioExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  try {
    await scanDirectory(folderPath);
    return files;
  } catch (error) {
    console.error('Error scanning folder:', error);
    return [];
  }
});

ipcMain.handle('is-directory', async (_, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
});

ipcMain.handle('get-file-metadata', async (_, filePath: string) => {
  try {
    // Lazy load ES modules using dynamic import
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    
    if (!parseFile || !parseStream) {
      const musicMetadata = await dynamicImport('music-metadata');
      parseFile = musicMetadata.parseFile;
      parseStream = musicMetadata.parseStream;
    }
    
    const stats = await fs.stat(filePath);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    
    // Detect actual file type from magic bytes
    const detectedType = await detectFileType(filePath);
    const actualExt = detectedType?.ext || ext;
    const actualMime = detectedType?.mime;
    
    if (detectedType && detectedType.ext !== ext) {
      console.log(`File ${fileName}: extension is .${ext} but actual format is ${detectedType.ext}`);
    }
    
    // Determine if this is a lossless format
    const losslessFormats = ['flac', 'wav', 'alac', 'aiff', 'ape', 'wv'];
    const isLosslessFormat = losslessFormats.includes(actualExt);
    
    // Parse artist/title from filename as ultimate fallback
    const filenameInfo = parseFilename(fileName);
    
    let metadata = null;
    
    // For FLAC files, try multiple approaches to extract metadata and artwork
    if (actualExt === 'flac') {
      try {
        // Try with native option first (better for FLAC)
        metadata = await parseFile(filePath, {
          skipCovers: false,
          duration: true,
          includeChapters: false,
          native: true, // Include native FLAC tags
        });
        console.log(`Successfully parsed FLAC ${fileName} with parseFile (native mode)`);
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          console.log(`Found ${metadata.common.picture.length} artwork(s) in ${fileName}`);
        }
      } catch (e: any) {
        console.log(`parseFile (native mode) failed for ${fileName}: ${e.message}`);
        // Try without native option as fallback
        try {
          metadata = await parseFile(filePath, {
            skipCovers: false,
            duration: true,
          });
          console.log(`Successfully parsed FLAC ${fileName} with parseFile (standard mode)`);
        } catch (e2: any) {
          console.log(`parseFile (standard mode) also failed for ${fileName}: ${e2.message}`);
        }
      }
    }
    
    // Try parsing with detected mime type for non-FLAC files
    if (!metadata && actualMime && actualExt !== 'flac') {
      try {
        const stream = createReadStream(filePath);
        metadata = await parseStream(stream, {
          mimeType: actualMime,
          size: stats.size,
          skipCovers: false,
          duration: true,
        });
        stream.destroy();
        console.log(`Successfully parsed ${fileName} with detected mime type ${actualMime}`);
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          console.log(`Found ${metadata.common.picture.length} artwork(s) in ${fileName}`);
        }
      } catch (e: any) {
        console.log(`parseStream with mime failed for ${fileName}: ${e.message}`);
        metadata = null;
      }
    }
    
    // Try parseFile as fallback for non-FLAC files
    if (!metadata && actualExt !== 'flac') {
      try {
        metadata = await parseFile(filePath, {
          skipCovers: false,
          duration: true,
        });
        console.log(`Successfully parsed ${fileName} with parseFile`);
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          console.log(`Found ${metadata.common.picture.length} artwork(s) in ${fileName}`);
        }
      } catch (e: any) {
        console.log(`parseFile failed for ${fileName}: ${e.message}`);
      }
    }
    
    // If music-metadata succeeded, return result
    if (metadata && metadata.format && metadata.format.duration) {
      const lyricsData = metadata.common.lyrics?.[0];
      const lyricsText = lyricsData 
        ? (typeof lyricsData === 'string' ? lyricsData : (lyricsData as any).text || null)
        : null;

      // Extract artwork - prefer front cover, fall back to any available picture
      let artworkData: string | null = null;
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        // Try to find front cover (type 3) first
        let coverPicture = metadata.common.picture.find((pic: any) => pic.type === 'Cover (front)');
        if (!coverPicture) {
          // Fall back to first available picture
          coverPicture = metadata.common.picture[0];
        }
        
        if (coverPicture && coverPicture.data) {
          try {
            // Resize image to reduce memory usage (max 300px width) & use JPEG
            const image = nativeImage.createFromBuffer(coverPicture.data);
            if (!image.isEmpty()) {
              const resized = image.resize({ width: 300, quality: 'good' });
              // Convert to JPEG with 70% quality to save space
              const jpegData = resized.toJPEG(70);
              artworkData = `data:image/jpeg;base64,${jpegData.toString('base64')}`;
            } else {
              // Fallback if image is empty/invalid
              artworkData = `data:${coverPicture.format};base64,${coverPicture.data.toString('base64')}`;
            }
          } catch (resizeError) {
            console.error('Error resizing artwork:', resizeError);
            artworkData = `data:${coverPicture.format};base64,${coverPicture.data.toString('base64')}`;
          }
        }
      }

      const result = {
        path: filePath,
        title: metadata.common.title || filenameInfo.title,
        artist: metadata.common.artist || filenameInfo.artist,
        album: metadata.common.album || 'Unknown Album',
        year: metadata.common.year,
        duration: metadata.format.duration || 0,
        format: (metadata.format.codec || actualExt).toUpperCase(),
        bitrate: metadata.format.bitrate,
        sampleRate: metadata.format.sampleRate,
        bitsPerSample: metadata.format.bitsPerSample,
        numberOfChannels: metadata.format.numberOfChannels,
        lossless: metadata.format.lossless ?? isLosslessFormat,
        fileSize: stats.size,
        artwork: artworkData,
        lyrics: lyricsText,
      };
      
      // If we still don't have artwork for FLAC files, try ffmpeg as last resort
      if (!result.artwork && actualExt === 'flac') {
        console.log(`No artwork from music-metadata, trying ffmpeg for ${fileName}...`);
        try {
          const ffprobeData = await getMetadataWithFfprobe(filePath);
          if (ffprobeData && ffprobeData.artwork) {
            result.artwork = ffprobeData.artwork;
            console.log(`Successfully extracted artwork using ffmpeg for ${fileName}`);
          }
        } catch (ffmpegError) {
          console.log(`ffmpeg artwork extraction failed for ${fileName}`);
        }
      }
      
      console.log(`Metadata for ${fileName}: duration=${result.duration.toFixed(1)}s, ${result.sampleRate}Hz, ${result.bitrate}bps${result.artwork ? ' [has artwork]' : ' [no artwork]'}`);
      return result;
    }
    
    // Try ffprobe as fallback when music-metadata fails
    console.log(`Trying ffprobe for ${fileName}...`);
    const ffprobeData = await getMetadataWithFfprobe(filePath);
    
    if (ffprobeData && ffprobeData.duration) {
      const result = {
        path: filePath,
        title: ffprobeData.title || filenameInfo.title,
        artist: ffprobeData.artist || filenameInfo.artist,
        album: ffprobeData.album || 'Unknown Album',
        year: undefined,
        duration: ffprobeData.duration,
        format: ffprobeData.codec || actualExt.toUpperCase(),
        bitrate: ffprobeData.bitrate,
        sampleRate: ffprobeData.sampleRate,
        bitsPerSample: ffprobeData.bitsPerSample,
        numberOfChannels: ffprobeData.channels,
        lossless: isLosslessFormat,
        fileSize: stats.size,
        artwork: ffprobeData.artwork || null,
      };
      console.log(`ffprobe metadata for ${fileName}: duration=${result.duration.toFixed(1)}s, ${result.sampleRate}Hz, ${result.bitrate}bps${result.artwork ? ' [has artwork]' : ''}`);
      return result;
    }
    
    // Ultimate fallback: return basic file info with parsed filename
    console.log(`Using fallback metadata for ${fileName}`);
    return {
      path: filePath,
      title: filenameInfo.title,
      artist: filenameInfo.artist,
      album: 'Unknown Album',
      year: undefined,
      duration: 0,
      format: actualExt.toUpperCase(),
      bitrate: undefined,
      sampleRate: undefined,
      bitsPerSample: undefined,
      numberOfChannels: undefined,
      lossless: isLosslessFormat,
      fileSize: stats.size,
      artwork: null,
    };
  } catch (error) {
    console.error(`Error for ${path.basename(filePath)}:`, error instanceof Error ? error.message : 'Unknown error');
    
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const losslessFormats = ['flac', 'wav', 'alac', 'aiff', 'ape', 'wv'];
    const filenameInfo = parseFilename(fileName);
    
    // Even on error, try to return something
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        title: filenameInfo.title,
        artist: filenameInfo.artist,
        album: 'Unknown Album',
        year: undefined,
        duration: 0,
        format: ext.toUpperCase(),
        bitrate: undefined,
        sampleRate: undefined,
        bitsPerSample: undefined,
        numberOfChannels: undefined,
        lossless: losslessFormats.includes(ext),
        fileSize: stats.size,
        artwork: null,
      };
    } catch {
      return null;
    }
  }
});



// Get artwork for a track (cached on-demand)
ipcMain.handle('get-artwork', async (_, filePath: string) => {
  try {
    const crypto = await import('crypto');
    
    // Create cache directory if it doesn't exist
    const cacheDir = path.join(app.getPath('userData'), 'artwork');
    await fs.mkdir(cacheDir, { recursive: true });
    
    // Generate cache filename based on file path hash
    const hash = crypto.createHash('md5').update(filePath).digest('hex');
    const cacheFilePath = path.join(cacheDir, `${hash}.jpg`);
    
    // Check if cached artwork exists
    try {
      const cachedData = await fs.readFile(cacheFilePath);
      return `data:image/jpeg;base64,${cachedData.toString('base64')}`;
    } catch {
      // Cache miss, extract artwork
    }
    
    // Lazy load music-metadata
    const dynamicImport = new Function('specifier', 'return import(specifier)');
    if (!parseFile) {
      const musicMetadata = await dynamicImport('music-metadata');
      parseFile = musicMetadata.parseFile;
    }
    
    // Extract artwork using music-metadata
    try {
      const metadata = await parseFile(filePath, {
        skipCovers: false,
        duration: false,
      });
      
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        // Prefer front cover, fallback to first picture
        let coverPicture = metadata.common.picture.find((pic: any) => pic.type === 'Cover (front)');
        if (!coverPicture) {
          coverPicture = metadata.common.picture[0];
        }
        
        if (coverPicture && coverPicture.data) {
          // Save to cache
          await fs.writeFile(cacheFilePath, coverPicture.data);
          
          // Return base64
          return `data:${coverPicture.format};base64,${coverPicture.data.toString('base64')}`;
        }
      }
    } catch (parseError) {
      console.log(`music-metadata failed for artwork extraction: ${parseError instanceof Error ? parseError.message : 'Unknown'}`);
    }
    
    // Try ffmpeg as fallback
    try {
      const ffprobeData = await getMetadataWithFfprobe(filePath);
      if (ffprobeData && ffprobeData.artwork) {
        // Extract base64 data and save to cache
        const base64Match = ffprobeData.artwork.match(/^data:image\/[^;]+;base64,(.+)$/);
        if (base64Match) {
          const imageBuffer = Buffer.from(base64Match[1], 'base64');
          await fs.writeFile(cacheFilePath, imageBuffer);
        }
        return ffprobeData.artwork;
      }
    } catch (ffmpegError) {
      console.log(`ffmpeg failed for artwork extraction: ${ffmpegError instanceof Error ? ffmpegError.message : 'Unknown'}`);
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting artwork:', error);
    return null;
  }
});

ipcMain.handle('select-lrc-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'LRC Files', extensions: ['lrc'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  return result.filePaths[0];
});

ipcMain.handle('get-lrc-content', async (_event, lrcPath: string) => {
  try {
    const content = await fs.readFile(lrcPath, 'utf-8');
    return content;
  } catch (error) {
    console.error('Error reading LRC file:', error);
    return null;
  }
});

ipcMain.handle('select-artwork-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Image Files', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  
  return result.filePaths[0];
});

ipcMain.handle('get-artwork-data', async (_event, artworkPath: string) => {
  try {
    const stats = await fs.stat(artworkPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    // Limit artwork to 5MB to prevent memory issues
    if (fileSizeMB > 5) {
      console.error(`Artwork file too large: ${fileSizeMB.toFixed(1)}MB (max 5MB)`);
      return { error: 'File too large. Please use an image smaller than 5MB.' };
    }
    
    const ext = artworkPath.toLowerCase().split('.').pop();
    const buffer = await fs.readFile(artworkPath);
    
    let mimeType: string;
    
    if (ext === 'png') {
      mimeType = 'image/png';
    } else if (ext === 'webp') {
      mimeType = 'image/webp';
    } else if (ext === 'bmp') {
      mimeType = 'image/bmp';
    } else {
      mimeType = 'image/jpeg';
    }
    
    const data = `data:${mimeType};base64,${buffer.toString('base64')}`;
    return { data, type: 'image' };
  } catch (error) {
    console.error('Error reading artwork file:', error);
    return { error: 'Failed to read artwork file' };
  }
});

ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});
