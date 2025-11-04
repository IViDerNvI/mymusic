// 本地存储管理

class StorageManager {
    constructor() {
        this.prefix = 'mymusic_';
        this.init();
    }
    
    init() {
        // 确保必要的存储结构存在
        if (!this.get('library')) {
            this.set('library', []);
        }
        if (!this.get('playlists')) {
            this.set('playlists', []);
        }
        if (!this.get('favorites')) {
            this.set('favorites', []);
        }
        if (!this.get('settings')) {
            this.set('settings', this.getDefaultSettings());
        }
        if (!this.get('playbackState')) {
            this.set('playbackState', this.getDefaultPlaybackState());
        }
    }
    
    // 获取默认设置
    getDefaultSettings() {
        return {
            theme: 'dark',
            volume: 0.5,
            autoPlayNext: true,
            shuffle: false,
            repeat: 'none', // none, one, all
            crossfade: true,
            lastFm: false,
            notifications: true,
            equalizer: 'normal'
        };
    }
    
    // 获取默认播放状态
    getDefaultPlaybackState() {
        return {
            currentSong: null,
            currentTime: 0,
            isPlaying: false,
            queue: [],
            currentIndex: -1,
            history: []
        };
    }
    
    // 基本存储方法
    set(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('存储数据失败:', error);
            return false;
        }
    }
    
    get(key) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('读取数据失败:', error);
            return null;
        }
    }
    
    remove(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('删除数据失败:', error);
            return false;
        }
    }
    
    clear() {
        try {
            const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
            keys.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('清除数据失败:', error);
            return false;
        }
    }
    
    // 音乐库管理
    getLibrary() {
        return this.get('library') || [];
    }
    
    setLibrary(library) {
        return this.set('library', library);
    }
    
    addToLibrary(songs) {
        const library = this.getLibrary();
        const existingPaths = new Set(library.map(song => song.path));
        
        const newSongs = Array.isArray(songs) ? songs : [songs];
        const uniqueSongs = newSongs.filter(song => !existingPaths.has(song.path));
        
        if (uniqueSongs.length > 0) {
            library.push(...uniqueSongs);
            this.setLibrary(library);
        }
        
        return uniqueSongs.length;
    }
    
    removeFromLibrary(songPath) {
        const library = this.getLibrary();
        const filtered = library.filter(song => song.path !== songPath);
        this.setLibrary(filtered);
        return library.length !== filtered.length;
    }
    
    updateSongInLibrary(songPath, updates) {
        const library = this.getLibrary();
        const index = library.findIndex(song => song.path === songPath);
        
        if (index !== -1) {
            library[index] = { ...library[index], ...updates };
            this.setLibrary(library);
            return true;
        }
        
        return false;
    }
    
    // 播放列表管理
    getPlaylists() {
        return this.get('playlists') || [];
    }
    
    setPlaylists(playlists) {
        return this.set('playlists', playlists);
    }
    
    createPlaylist(name, description = '') {
        try {
            console.log('Storage: 开始创建播放列表');
            
            // 检查 Utils 是否可用
            if (typeof Utils === 'undefined') {
                throw new Error('Utils 模块未加载');
            }
            
            const playlists = this.getPlaylists();
            console.log('Storage: 当前播放列表数量:', playlists.length);
            
            const playlist = {
                id: Utils.generateId(),
                name,
                description,
                songs: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            
            console.log('Storage: 新播放列表对象:', playlist);
            
            playlists.push(playlist);
            const success = this.setPlaylists(playlists);
            
            if (!success) {
                throw new Error('保存播放列表到本地存储失败');
            }
            
            console.log('Storage: 播放列表创建并保存成功');
            return playlist;
        } catch (error) {
            console.error('Storage: 创建播放列表失败:', error);
            throw error; // 重新抛出错误让调用者处理
        }
    }
    
    deletePlaylist(playlistId) {
        const playlists = this.getPlaylists();
        const filtered = playlists.filter(playlist => playlist.id !== playlistId);
        this.setPlaylists(filtered);
        return playlists.length !== filtered.length;
    }
    
    updatePlaylist(playlistId, updates) {
        const playlists = this.getPlaylists();
        const index = playlists.findIndex(playlist => playlist.id === playlistId);
        
        if (index !== -1) {
            playlists[index] = { 
                ...playlists[index], 
                ...updates, 
                updatedAt: Date.now() 
            };
            this.setPlaylists(playlists);
            return true;
        }
        
        return false;
    }
    
    addToPlaylist(playlistId, songPaths) {
        const playlists = this.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        
        if (playlist) {
            const paths = Array.isArray(songPaths) ? songPaths : [songPaths];
            const existingPaths = new Set(playlist.songs);
            const newPaths = paths.filter(path => !existingPaths.has(path));
            
            if (newPaths.length > 0) {
                playlist.songs.push(...newPaths);
                playlist.updatedAt = Date.now();
                this.setPlaylists(playlists);
            }
            
            return newPaths.length;
        }
        
        return 0;
    }
    
    removeFromPlaylist(playlistId, songPath) {
        const playlists = this.getPlaylists();
        const playlist = playlists.find(p => p.id === playlistId);
        
        if (playlist) {
            const originalLength = playlist.songs.length;
            playlist.songs = playlist.songs.filter(path => path !== songPath);
            
            if (playlist.songs.length !== originalLength) {
                playlist.updatedAt = Date.now();
                this.setPlaylists(playlists);
                return true;
            }
        }
        
        return false;
    }
    
    // 收藏管理
    getFavorites() {
        return this.get('favorites') || [];
    }
    
    setFavorites(favorites) {
        return this.set('favorites', favorites);
    }
    
    addToFavorites(songPath) {
        const favorites = this.getFavorites();
        if (!favorites.includes(songPath)) {
            favorites.push(songPath);
            this.setFavorites(favorites);
            return true;
        }
        return false;
    }
    
    removeFromFavorites(songPath) {
        const favorites = this.getFavorites();
        const filtered = favorites.filter(path => path !== songPath);
        this.setFavorites(filtered);
        return favorites.length !== filtered.length;
    }
    
    isFavorite(songPath) {
        const favorites = this.getFavorites();
        return favorites.includes(songPath);
    }
    
    toggleFavorite(songPath) {
        if (this.isFavorite(songPath)) {
            return this.removeFromFavorites(songPath) ? 'removed' : 'error';
        } else {
            return this.addToFavorites(songPath) ? 'added' : 'error';
        }
    }
    
    // 设置管理
    getSettings() {
        const defaults = this.getDefaultSettings();
        const stored = this.get('settings') || {};
        return { ...defaults, ...stored };
    }
    
    updateSettings(updates) {
        const settings = this.getSettings();
        const newSettings = { ...settings, ...updates };
        return this.set('settings', newSettings);
    }
    
    getSetting(key) {
        const settings = this.getSettings();
        return settings[key];
    }
    
    setSetting(key, value) {
        return this.updateSettings({ [key]: value });
    }
    
    // 播放状态管理
    getPlaybackState() {
        const defaults = this.getDefaultPlaybackState();
        const stored = this.get('playbackState') || {};
        return { ...defaults, ...stored };
    }
    
    updatePlaybackState(updates) {
        const state = this.getPlaybackState();
        const newState = { ...state, ...updates };
        return this.set('playbackState', newState);
    }
    
    // 搜索历史管理
    getSearchHistory() {
        return this.get('searchHistory') || [];
    }
    
    addToSearchHistory(query) {
        if (!query.trim()) return;
        
        const history = this.getSearchHistory();
        const filtered = history.filter(item => item !== query);
        filtered.unshift(query);
        
        // 只保留最近20条搜索历史
        const limited = filtered.slice(0, 20);
        this.set('searchHistory', limited);
    }
    
    clearSearchHistory() {
        return this.set('searchHistory', []);
    }
    
    // 统计信息
    getStats() {
        return this.get('stats') || {
            totalPlayTime: 0,
            songsPlayed: 0,
            favoriteGenre: null,
            favoriteArtist: null,
            lastPlayed: null
        };
    }
    
    updateStats(updates) {
        const stats = this.getStats();
        const newStats = { ...stats, ...updates };
        return this.set('stats', newStats);
    }
    
    incrementPlayCount(songPath) {
        const stats = this.getStats();
        stats.songsPlayed = (stats.songsPlayed || 0) + 1;
        stats.lastPlayed = Date.now();
        
        // 更新歌曲播放次数
        this.updateSongInLibrary(songPath, {
            playCount: (this.getLibrary().find(s => s.path === songPath)?.playCount || 0) + 1,
            lastPlayed: Date.now()
        });
        
        this.updateStats(stats);
    }
    
    addPlayTime(seconds) {
        const stats = this.getStats();
        stats.totalPlayTime = (stats.totalPlayTime || 0) + seconds;
        this.updateStats(stats);
    }
    
    // 导入/导出数据
    exportData() {
        return {
            library: this.getLibrary(),
            playlists: this.getPlaylists(),
            favorites: this.getFavorites(),
            settings: this.getSettings(),
            stats: this.getStats(),
            exportTime: Date.now(),
            version: '1.0.0'
        };
    }
    
    importData(data) {
        try {
            if (data.library) this.setLibrary(data.library);
            if (data.playlists) this.setPlaylists(data.playlists);
            if (data.favorites) this.setFavorites(data.favorites);
            if (data.settings) this.updateSettings(data.settings);
            if (data.stats) this.updateStats(data.stats);
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }
    
    // 数据库大小估算
    getStorageSize() {
        let total = 0;
        for (let key in localStorage) {
            if (key.startsWith(this.prefix)) {
                total += localStorage[key].length;
            }
        }
        return total;
    }
    
    // 清理过期数据
    cleanup() {
        const library = this.getLibrary();
        const validPaths = [];
        
        // 检查文件是否仍然存在（这里需要与主进程通信）
        library.forEach(async (song) => {
            try {
                const stats = await window.electronAPI.getFileStats(song.path);
                if (stats.exists) {
                    validPaths.push(song.path);
                }
            } catch (error) {
                console.error('检查文件存在性失败:', error);
            }
        });
        
        // 清理播放列表中不存在的歌曲
        const playlists = this.getPlaylists();
        playlists.forEach(playlist => {
            playlist.songs = playlist.songs.filter(path => validPaths.includes(path));
        });
        this.setPlaylists(playlists);
        
        // 清理收藏中不存在的歌曲
        const favorites = this.getFavorites().filter(path => validPaths.includes(path));
        this.setFavorites(favorites);
        
        // 更新音乐库
        const validLibrary = library.filter(song => validPaths.includes(song.path));
        this.setLibrary(validLibrary);
        
        return {
            removedSongs: library.length - validLibrary.length,
            totalSongs: validLibrary.length
        };
    }
}

// 创建全局存储管理器实例
window.storage = new StorageManager();