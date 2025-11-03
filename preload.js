const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  selectMusicFiles: () => ipcRenderer.invoke('select-music-files'),
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  readMusicFilesFromFolder: (folderPath) => ipcRenderer.invoke('read-music-files-from-folder', folderPath),
  getFileStats: (filePath) => ipcRenderer.invoke('get-file-stats', filePath),
  
  // 歌词搜索功能
  searchSongId: (songName, artistName) => ipcRenderer.invoke('search-song-id', songName, artistName),
  fetchLyrics: (songId) => ipcRenderer.invoke('fetch-lyrics', songId),
  autoSearchLyrics: (songName, artistName) => ipcRenderer.invoke('auto-search-lyrics', songName, artistName),
  
  // 菜单事件监听
  onMenuImportFiles: (callback) => ipcRenderer.on('menu-import-files', callback),
  onMenuImportFolder: (callback) => ipcRenderer.on('menu-import-folder', callback),
  onMenuTogglePlay: (callback) => ipcRenderer.on('menu-toggle-play', callback),
  onMenuPrevious: (callback) => ipcRenderer.on('menu-previous', callback),
  onMenuNext: (callback) => ipcRenderer.on('menu-next', callback),
  
  // 移除监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
})