import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  scanFolder: (folderPath: string) => ipcRenderer.invoke('scan-folder', folderPath),
  getFileMetadata: (filePath: string) => ipcRenderer.invoke('get-file-metadata', filePath),
  getAudioUrl: (filePath: string) => ipcRenderer.invoke('get-audio-url', filePath),
  isDirectory: (path: string) => ipcRenderer.invoke('is-directory', path),
  selectLrcFile: () => ipcRenderer.invoke('select-lrc-file'),
  getLrcContent: (lrcPath: string) => ipcRenderer.invoke('get-lrc-content', lrcPath),
  selectArtworkFile: () => ipcRenderer.invoke('select-artwork-file'),
  getArtworkData: (artworkPath: string) => ipcRenderer.invoke('get-artwork-data', artworkPath),
  getArtwork: (filePath: string) => ipcRenderer.invoke('get-artwork', filePath),
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
});
