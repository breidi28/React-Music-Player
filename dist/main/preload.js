"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => electron_1.ipcRenderer.invoke('select-folder'),
    selectFiles: () => electron_1.ipcRenderer.invoke('select-files'),
    scanFolder: (folderPath) => electron_1.ipcRenderer.invoke('scan-folder', folderPath),
    getFileMetadata: (filePath) => electron_1.ipcRenderer.invoke('get-file-metadata', filePath),
    getAudioUrl: (filePath) => electron_1.ipcRenderer.invoke('get-audio-url', filePath),
    isDirectory: (path) => electron_1.ipcRenderer.invoke('is-directory', path),
    selectLrcFile: () => electron_1.ipcRenderer.invoke('select-lrc-file'),
    getLrcContent: (lrcPath) => electron_1.ipcRenderer.invoke('get-lrc-content', lrcPath),
    selectArtworkFile: () => electron_1.ipcRenderer.invoke('select-artwork-file'),
    getArtworkData: (artworkPath) => electron_1.ipcRenderer.invoke('get-artwork-data', artworkPath),
    getArtwork: (filePath) => electron_1.ipcRenderer.invoke('get-artwork', filePath),
    windowMinimize: () => electron_1.ipcRenderer.invoke('window-minimize'),
    windowMaximize: () => electron_1.ipcRenderer.invoke('window-maximize'),
    windowClose: () => electron_1.ipcRenderer.invoke('window-close'),
});
