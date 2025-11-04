// 主应用程序入口

class MyMusicApp {
    constructor() {
        this.version = '1.0.0';
        this.isInitialized = false;
        this.modules = {};
    }
    
    async init() {
        console.log(`🎵 MyMusic v${this.version} 启动中...`);
        
        try {
            // 等待 DOM 加载完成
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // 初始化各个模块
            await this.initializeModules();
            
            // 设置全局错误处理
            this.setupErrorHandlers();
            
            // 启动定期任务
            this.startBackgroundTasks();
            
            this.isInitialized = true;
            console.log('🎵 MyMusic 启动完成!');
            
            // 显示欢迎消息
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('应用程序启动失败:', error);
            Utils.showNotification('应用程序启动失败', 'error');
        }
    }
    
    async initializeModules() {
        console.log('正在初始化模块...');
        
        // 检查必要的全局对象是否存在
        const requiredModules = [
            'storage',
            'musicLibrary', 
            'player',
            'playlistManager',
            'ui'
        ];
        
        // 可选模块（如果不存在也不会阻止应用启动）
        const optionalModules = ['keyboardShortcuts'];
        
        // 初始化歌词管理器
        if (window.LyricsManager) {
            this.modules.lyricsManager = new LyricsManager();
            window.lyricsManager = this.modules.lyricsManager;
            console.log('歌词管理器初始化完成');
        }
        
        for (const moduleName of requiredModules) {
            console.log(`检查模块: ${moduleName}`);
            if (!window[moduleName]) {
                console.error(`必需的模块 ${moduleName} 未找到`);
                console.log('当前可用的全局对象:', Object.keys(window).filter(key => 
                    ['storage', 'musicLibrary', 'player', 'playlistManager', 'ui', 'keyboardShortcuts', 'Utils'].includes(key)
                ));
                throw new Error(`必需的模块 ${moduleName} 未找到`);
            }
            this.modules[moduleName] = window[moduleName];
            console.log(`模块 ${moduleName} 加载成功`);
        }
        
        // 检查可选模块
        for (const moduleName of optionalModules) {
            if (window[moduleName]) {
                this.modules[moduleName] = window[moduleName];
                console.log(`可选模块 ${moduleName} 加载成功`);
            } else {
                console.warn(`可选模块 ${moduleName} 未找到，跳过`);
            }
        }
        
        // 等待音乐库初始化完成
        if (window.musicLibrary && typeof window.musicLibrary.init === 'function') {
            await window.musicLibrary.init();
        }
        
        console.log('所有模块初始化完成');
    }
    
    setupErrorHandlers() {
        // 全局错误处理
        window.addEventListener('error', (event) => {
            console.error('全局错误:', event.error);
            console.error('错误详情:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
            Utils.showNotification(`发生了一个错误: ${event.message}`, 'error');
        });
        
        // Promise 拒绝处理
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的 Promise 拒绝:', event.reason);
            Utils.showNotification('发生了一个异步错误', 'error');
        });
        
        // 音频错误处理
        const audio = document.getElementById('audio-player');
        if (audio) {
            audio.addEventListener('error', (event) => {
                console.error('音频错误:', event);
                Utils.showNotification('音频播放出错', 'error');
            });
        }
    }
    
    startBackgroundTasks() {
        // 定期保存播放状态
        setInterval(() => {
            if (window.player) {
                window.player.saveSettings();
            }
        }, 30000); // 每30秒保存一次
        
        // 定期清理过期数据
        setInterval(() => {
            this.performMaintenance();
        }, 300000); // 每5分钟执行一次维护
        
        // 检查文件完整性
        setInterval(() => {
            this.checkLibraryIntegrity();
        }, 600000); // 每10分钟检查一次
    }
    
    performMaintenance() {
        console.log('执行定期维护...');
        
        try {
            // 清理搜索历史（保留最新20条）
            const searchHistory = storage.getSearchHistory();
            if (searchHistory.length > 20) {
                storage.set('searchHistory', searchHistory.slice(0, 20));
            }
            
            // 清理播放历史
            const playbackState = storage.getPlaybackState();
            if (playbackState.history && playbackState.history.length > 100) {
                playbackState.history = playbackState.history.slice(-50);
                storage.updatePlaybackState({ history: playbackState.history });
            }
            
            console.log('定期维护完成');
        } catch (error) {
            console.error('维护任务执行失败:', error);
        }
    }
    
    async checkLibraryIntegrity() {
        if (!window.electronAPI || !window.musicLibrary) return;
        
        console.log('检查音乐库完整性...');
        
        try {
            const library = storage.getLibrary();
            let removedCount = 0;
            const validSongs = [];
            
            for (const song of library) {
                try {
                    const stats = await window.electronAPI.getFileStats(song.path);
                    if (stats.exists) {
                        validSongs.push(song);
                    } else {
                        removedCount++;
                        console.log(`文件不存在，已移除: ${song.path}`);
                    }
                } catch (error) {
                    console.error(`检查文件失败: ${song.path}`, error);
                }
            }
            
            if (removedCount > 0) {
                storage.setLibrary(validSongs);
                window.musicLibrary.songs = validSongs;
                window.musicLibrary.updateStatistics();
                window.musicLibrary.updateViews();
                
                Utils.showNotification(
                    `已自动移除 ${removedCount} 个无效文件`,
                    'info'
                );
            }
            
            console.log('音乐库完整性检查完成');
        } catch (error) {
            console.error('完整性检查失败:', error);
        }
    }
    
    showWelcomeMessage() {
        const library = storage.getLibrary();
        const totalSongs = library.length;
        const totalDuration = library.reduce((sum, song) => sum + (song.duration || 0), 0);
        
        if (totalSongs === 0) {
            Utils.showNotification('欢迎使用 MyMusic！开始导入您的音乐吧', 'success', 5000);
        } else {
            const message = `欢迎回来！您的音乐库包含 ${totalSongs} 首歌曲，总时长 ${Utils.formatTime(totalDuration)}`;
            Utils.showNotification(message, 'success', 4000);
        }
    }
    
    // 应用程序信息
    getAppInfo() {
        return {
            name: 'MyMusic',
            version: this.version,
            description: '本地音乐播放器',
            author: 'MyMusic Team',
            isInitialized: this.isInitialized,
            modules: Object.keys(this.modules),
            stats: this.getStats()
        };
    }
    
    getStats() {
        const library = storage.getLibrary();
        const playlists = storage.getPlaylists();
        const favorites = storage.getFavorites();
        const stats = storage.getStats();
        
        return {
            totalSongs: library.length,
            totalPlaylists: playlists.length,
            totalFavorites: favorites.length,
            totalPlayTime: stats.totalPlayTime || 0,
            songsPlayed: stats.songsPlayed || 0,
            storageSize: storage.getStorageSize()
        };
    }
    
    // 导出应用数据
    exportAppData() {
        try {
            const data = {
                ...storage.exportData(),
                appInfo: this.getAppInfo(),
                exportDate: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mymusic-backup-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            Utils.showNotification('数据导出成功', 'success');
            
            return true;
        } catch (error) {
            console.error('导出数据失败:', error);
            Utils.showNotification('数据导出失败', 'error');
            return false;
        }
    }
    
    // 导入应用数据
    async importAppData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // 验证数据格式
            if (!data.library || !data.version) {
                throw new Error('无效的备份文件格式');
            }
            
            let confirmed = false;
            try {
                if (Utils && Utils.showConfirmDialog) {
                    confirmed = await Utils.showConfirmDialog(
                        '导入数据',
                        `导入数据将覆盖当前的所有数据，确定要继续吗？\n备份包含: ${data.library?.length || 0} 首歌曲, ${data.playlists?.length || 0} 个播放列表`,
                        '导入',
                        '取消'
                    );
                } else {
                    confirmed = window.confirm(
                        '导入数据将覆盖当前的所有数据，确定要继续吗？\n' +
                        `备份包含: ${data.library?.length || 0} 首歌曲, ${data.playlists?.length || 0} 个播放列表`
                    );
                }
            } catch (error) {
                console.error('显示确认对话框失败:', error);
                confirmed = window.confirm(
                    '导入数据将覆盖当前的所有数据，确定要继续吗？\n' +
                    `备份包含: ${data.library?.length || 0} 首歌曲, ${data.playlists?.length || 0} 个播放列表`
                );
            }
            
            if (!confirmed) return false;
            
            // 导入数据
            const success = storage.importData(data);
            if (success) {
                // 重新加载所有模块
                await this.reloadApp();
                Utils.showNotification('数据导入成功，应用已重新加载', 'success');
                return true;
            } else {
                Utils.showNotification('数据导入失败', 'error');
                return false;
            }
        } catch (error) {
            console.error('导入数据失败:', error);
            Utils.showNotification('导入数据失败: ' + error.message, 'error');
            return false;
        }
    }
    
    // 重新加载应用
    async reloadApp() {
        console.log('重新加载应用...');
        
        // 重新加载各个模块的数据
        if (window.musicLibrary) {
            await window.musicLibrary.loadFromStorage();
            window.musicLibrary.updateViews();
        }
        
        if (window.playlistManager) {
            window.playlistManager.loadPlaylists();
            window.playlistManager.updatePlaylistNav();
        }
        
        if (window.player) {
            window.player.loadSettings();
        }
        
        if (window.ui) {
            window.ui.loadTheme();
        }
        
        console.log('应用重新加载完成');
    }
    
    // 重置应用
    async resetApp() {
        let confirmed = false;
        try {
            if (Utils && Utils.showConfirmDialog) {
                confirmed = await Utils.showConfirmDialog(
                    '重置应用',
                    '这将清除所有数据并重置应用到初始状态，确定要继续吗？\n注意: 这不会删除您的音乐文件，只会清除应用的设置和数据。',
                    '重置',
                    '取消'
                );
            } else {
                confirmed = window.confirm(
                    '这将清除所有数据并重置应用到初始状态，确定要继续吗？\n' +
                    '注意: 这不会删除您的音乐文件，只会清除应用的设置和数据。'
                );
            }
        } catch (error) {
            console.error('显示确认对话框失败:', error);
            confirmed = window.confirm(
                '这将清除所有数据并重置应用到初始状态，确定要继续吗？\n' +
                '注意: 这不会删除您的音乐文件，只会清除应用的设置和数据。'
            );
        }
        
        if (!confirmed) return false;
        
        try {
            // 停止播放
            if (window.player) {
                window.player.pause();
            }
            
            // 清除所有数据
            storage.clear();
            
            // 重新初始化存储
            storage.init();
            
            // 重新加载应用
            this.reloadApp();
            
            Utils.showNotification('应用已重置', 'success');
            return true;
        } catch (error) {
            console.error('重置应用失败:', error);
            Utils.showNotification('重置应用失败', 'error');
            return false;
        }
    }
    
    // 检查更新（模拟）
    async checkForUpdates() {
        try {
            // 这里可以实现真正的更新检查逻辑
            console.log('检查更新...');
            
            // 模拟检查过程
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            Utils.showNotification('当前已是最新版本', 'info');
            return false;
        } catch (error) {
            console.error('检查更新失败:', error);
            Utils.showNotification('检查更新失败', 'error');
            return false;
        }
    }
    
    // 应用程序清理
    cleanup() {
        console.log('执行应用程序清理...');
        
        // 保存当前状态
        if (window.player) {
            window.player.saveSettings();
        }
        
        // 清理定时器和事件监听器
        if (window.keyboardShortcuts) {
            // 清理键盘快捷键
            keyboardShortcuts.shortcuts.clear();
        }
        
        console.log('应用程序清理完成');
    }
}

// 创建应用程序实例
const app = new MyMusicApp();

// 将应用实例暴露到全局
window.app = app;

// 应用程序启动
app.init().catch(error => {
    console.error('应用程序启动失败:', error);
});

// 窗口关闭前的清理工作
window.addEventListener('beforeunload', () => {
    app.cleanup();
});

// 开发模式下的控制台快捷方式
if (process && process.env && process.env.NODE_ENV === 'development') {
    window.devHelpers = {
        app: app,
        storage: storage,
        player: window.player,
        library: window.musicLibrary,
        ui: window.ui,
        utils: Utils,
        exportData: () => app.exportAppData(),
        getStats: () => app.getStats(),
        reset: () => app.resetApp()
    };
    
    console.log('开发模式已激活，可以使用 window.devHelpers 访问各种调试工具');
}