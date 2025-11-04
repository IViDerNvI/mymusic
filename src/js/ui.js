// 用户界面管理

class UIManager {
    constructor() {
        this.currentView = 'library';
        this.panels = {
            lyrics: false,
            equalizer: false,
            settings: false
        };
        this.contextMenu = null;
        this.init();
    }
    
    init() {
        this.bindNavigation();
        this.bindPanels();
        this.bindSettings();
        this.loadTheme();
        this.bindContextMenu();
        this.bindKeyboardShortcuts();
    }
    
    bindNavigation() {
        // 侧边栏导航
        document.querySelectorAll('.nav-link').forEach(link => {
            if (!link.id && link.dataset.view) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchView(link.dataset.view);
                    this.setActiveNavLink(link);
                });
            }
        });
    }
    
    bindPanels() {
        // 歌词面板
        const lyricsBtn = document.getElementById('lyrics-btn');
        const closeLyricsBtn = document.getElementById('close-lyrics');
        
        if (lyricsBtn) {
            lyricsBtn.addEventListener('click', () => this.togglePanel('lyrics'));
        }
        
        if (closeLyricsBtn) {
            closeLyricsBtn.addEventListener('click', () => this.togglePanel('lyrics'));
        }
        
        // 均衡器面板
        const equalizerBtn = document.getElementById('equalizer-btn');
        const closeEqualizerBtn = document.getElementById('close-equalizer');
        
        if (equalizerBtn) {
            equalizerBtn.addEventListener('click', () => this.togglePanel('equalizer'));
        }
        
        if (closeEqualizerBtn) {
            closeEqualizerBtn.addEventListener('click', () => this.togglePanel('equalizer'));
        }
        
        // 设置面板
        const settingsBtn = document.getElementById('settings-btn');
        const closeSettingsBtn = document.getElementById('close-settings');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.togglePanel('settings'));
        }
        
        if (closeSettingsBtn) {
            closeSettingsBtn.addEventListener('click', () => this.togglePanel('settings'));
        }
        
        // 均衡器预设
        document.querySelectorAll('.eq-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setEqualizerPreset(e.target.dataset.preset);
            });
        });
    }
    
    bindSettings() {
        // 主题切换
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                this.setTheme(e.target.value);
            });
        }
        
        // 自动播放下一首
        const autoPlayNext = document.getElementById('auto-play-next');
        if (autoPlayNext) {
            autoPlayNext.addEventListener('change', (e) => {
                storage.setSetting('autoPlayNext', e.target.checked);
            });
            
            // 设置初始值
            autoPlayNext.checked = storage.getSetting('autoPlayNext');
        }
        
        // 淡入淡出效果
        const crossfade = document.getElementById('crossfade');
        if (crossfade) {
            crossfade.addEventListener('change', (e) => {
                storage.setSetting('crossfade', e.target.checked);
                if (window.player) {
                    window.player.crossfade = e.target.checked;
                }
            });
            
            // 设置初始值
            crossfade.checked = storage.getSetting('crossfade');
        }
    }
    
    bindContextMenu() {
        // 隐藏右键菜单
        document.addEventListener('click', () => {
            this.hideContextMenu();
        });
        
        // 右键菜单项点击
        document.addEventListener('click', (e) => {
            if (e.target.closest('.context-menu')) {
                const action = e.target.dataset.action;
                const menu = e.target.closest('.context-menu');
                const songPath = menu.dataset.songPath;
                const context = menu.dataset.context ? JSON.parse(menu.dataset.context) : {};
                
                this.handleContextMenuAction(action, songPath, context);
                this.hideContextMenu();
            }
        });
    }
    
    bindKeyboardShortcuts() {
        // 面板快捷键
        keyboardShortcuts.register('l', () => this.togglePanel('lyrics'));
        keyboardShortcuts.register('e', () => this.togglePanel('equalizer'));
        keyboardShortcuts.register('comma', () => this.togglePanel('settings'), { ctrl: true });
        
        // 视图切换快捷键
        keyboardShortcuts.register('1', () => this.switchView('library'), { ctrl: true });
        keyboardShortcuts.register('2', () => this.switchView('artists'), { ctrl: true });
        keyboardShortcuts.register('3', () => this.switchView('albums'), { ctrl: true });
        keyboardShortcuts.register('4', () => this.switchView('genres'), { ctrl: true });
        keyboardShortcuts.register('5', () => this.switchView('favorites'), { ctrl: true });
        
        // ESC 关闭面板
        keyboardShortcuts.register('escape', () => {
            this.closeAllPanels();
        });
    }
    
    switchView(viewName) {
        // 隐藏所有视图
        document.querySelectorAll('.view').forEach(view => {
            view.classList.remove('active');
        });
        
        // 显示目标视图
        const targetView = document.getElementById(`${viewName}-view`);
        if (targetView) {
            targetView.classList.add('active');
            this.currentView = viewName;
        } else {
            // 可能是播放列表视图
            const playlistView = document.getElementById(viewName);
            if (playlistView && playlistView.classList.contains('view')) {
                playlistView.classList.add('active');
                this.currentView = viewName;
            }
        }
        
        // 更新导航高亮
        this.updateNavHighlight(viewName);
    }
    
    setActiveNavLink(activeLink) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        activeLink.classList.add('active');
    }
    
    updateNavHighlight(viewName) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const navLink = document.querySelector(`[data-view="${viewName}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }
    }
    
    togglePanel(panelName) {
        this.panels[panelName] = !this.panels[panelName];
        
        const panel = document.getElementById(`${panelName}-panel`);
        if (panel) {
            panel.classList.toggle('active', this.panels[panelName]);
        }
        
        // 关闭其他面板
        Object.keys(this.panels).forEach(name => {
            if (name !== panelName && this.panels[name]) {
                this.panels[name] = false;
                const otherPanel = document.getElementById(`${name}-panel`);
                if (otherPanel) {
                    otherPanel.classList.remove('active');
                }
            }
        });
        
        // 更新歌词内容
        if (panelName === 'lyrics' && this.panels[panelName]) {
            this.updateLyricsPanel();
        }
    }
    
    closeAllPanels() {
        Object.keys(this.panels).forEach(panelName => {
            if (this.panels[panelName]) {
                this.togglePanel(panelName);
            }
        });
    }
    
    showContextMenu(event, songPath, context = {}) {
        this.hideContextMenu();
        
        const menu = document.getElementById('context-menu');
        if (!menu) return;
        
        // 设置菜单数据
        menu.dataset.songPath = songPath;
        menu.dataset.context = JSON.stringify(context);
        
        // 根据上下文调整菜单项
        this.updateContextMenuItems(menu, songPath, context);
        
        // 显示菜单
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        menu.classList.add('active');
        
        // 确保菜单不会超出屏幕
        this.adjustContextMenuPosition(menu);
    }
    
    updateContextMenuItems(menu, songPath, context) {
        const ul = menu.querySelector('ul');
        if (!ul) return;
        
        const isFavorite = storage.isFavorite(songPath);
        const inPlaylist = context.inPlaylist || false;
        
        ul.innerHTML = `
            <li data-action="play">播放</li>
            <li data-action="add-to-queue">添加到队列</li>
            <li data-action="add-to-playlist">添加到播放列表</li>
            <li data-action="favorite">${isFavorite ? '取消收藏' : '收藏'}</li>
            ${inPlaylist ? '<li data-action="remove-from-playlist">从播放列表移除</li>' : ''}
            <li data-action="show-info">歌曲信息</li>
            <li data-action="remove">从音乐库删除</li>
        `;
    }
    
    adjustContextMenuPosition(menu) {
        const rect = menu.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 调整水平位置
        if (rect.right > windowWidth) {
            menu.style.left = `${windowWidth - rect.width - 10}px`;
        }
        
        // 调整垂直位置
        if (rect.bottom > windowHeight) {
            menu.style.top = `${windowHeight - rect.height - 10}px`;
        }
    }
    
    hideContextMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.classList.remove('active');
        }
    }
    
    handleContextMenuAction(action, songPath, context) {
        const song = window.musicLibrary?.getSongByPath(songPath);
        if (!song && action !== 'remove') return;
        
        switch (action) {
            case 'play':
                window.player?.playByPath(songPath);
                break;
                
            case 'add-to-queue':
                if (song) {
                    window.player?.addToQueue([song]);
                }
                break;
                
            case 'add-to-playlist':
                window.playlistManager?.showPlaylistSelector([songPath]);
                break;
                
            case 'favorite':
                const result = storage.toggleFavorite(songPath);
                if (result === 'added') {
                    Utils.showNotification('已添加到收藏', 'success');
                } else if (result === 'removed') {
                    Utils.showNotification('已从收藏中移除', 'info');
                }
                
                // 刷新相关视图
                this.refreshCurrentView();
                break;
                
            case 'remove-from-playlist':
                if (context.playlist) {
                    this.handleRemoveFromPlaylist(context.playlist, songPath);
                }
                break;
                
            case 'show-info':
                this.showSongInfo(song);
                break;
                
            case 'remove':
                const confirmRemove = confirm('确定要从音乐库中删除这首歌吗？这不会删除原文件。');
                if (confirmRemove) {
                    storage.removeFromLibrary(songPath);
                    
                    // 刷新音乐库
                    if (window.musicLibrary) {
                        window.musicLibrary.songs = storage.getLibrary();
                        window.musicLibrary.updateStatistics();
                        window.musicLibrary.updateViews();
                    }
                    
                    Utils.showNotification('已从音乐库中移除', 'info');
                }
                break;
        }
    }
    
    refreshCurrentView() {
        switch (this.currentView) {
            case 'library':
                window.musicLibrary?.updateLibraryView();
                break;
            case 'favorites':
                window.musicLibrary?.updateFavoritesView();
                break;
            default:
                if (this.currentView.startsWith('playlist-')) {
                    const playlistId = this.currentView.replace('playlist-', '');
                    window.playlistManager?.showPlaylist(playlistId);
                }
                break;
        }
    }
    
    showSongInfo(song) {
        if (!song) return;
        
        const info = `
歌曲: ${song.title}
艺术家: ${song.artist}
专辑: ${song.album}
时长: ${Utils.formatTime(song.duration)}
格式: ${song.format}
文件大小: ${Utils.formatFileSize(song.fileSize)}
添加时间: ${new Date(song.dateAdded).toLocaleString()}
播放次数: ${song.playCount || 0}
        `.trim();
        
        alert(info);
    }
    
    setTheme(themeName) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);
        
        storage.setSetting('theme', themeName);
        Utils.showNotification(`已切换到${themeName === 'dark' ? '深色' : '浅色'}主题`, 'success');
    }
    
    loadTheme() {
        const theme = storage.getSetting('theme') || 'dark';
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) {
            themeSelect.value = theme;
        }
    }
    
    setEqualizerPreset(preset) {
        // 移除所有预设的激活状态
        document.querySelectorAll('.eq-preset').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 激活选中的预设
        const presetBtn = document.querySelector(`[data-preset="${preset}"]`);
        if (presetBtn) {
            presetBtn.classList.add('active');
        }
        
        // 保存设置
        storage.setSetting('equalizer', preset);
        
        // 应用音效（这里可以扩展实际的音频处理）
        this.applyEqualizerPreset(preset);
        
        const presetNames = {
            'normal': '普通',
            'pop': '流行',
            'rock': '摇滚',
            'jazz': '爵士',
            'classical': '古典',
            'electronic': '电子'
        };
        
        Utils.showNotification(`已应用 ${presetNames[preset]} 音效`, 'success');
    }
    
    applyEqualizerPreset(preset) {
        // 这里可以实现真正的音频均衡器效果
        // 目前只是存储设置
        console.log(`应用音效预设: ${preset}`);
    }
    
    updateLyricsPanel() {
        const lyricsContent = document.getElementById('lyrics-content');
        if (!lyricsContent) return;
        
        const currentSong = window.player?.currentSong;
        if (!currentSong || !currentSong.lyrics) {
            lyricsContent.innerHTML = '<div class="no-lyrics">暂无歌词</div>';
            return;
        }
        
        // 解析歌词（支持 LRC 格式）
        const lyrics = this.parseLyrics(currentSong.lyrics);
        
        if (lyrics.length === 0) {
            lyricsContent.innerHTML = '<div class="no-lyrics">暂无歌词</div>';
            return;
        }
        
        const html = lyrics.map((line, index) => `
            <div class="lyrics-line" data-time="${line.time}" data-index="${index}">
                ${line.text}
            </div>
        `).join('');
        
        lyricsContent.innerHTML = html;
        
        // 绑定歌词点击事件
        this.bindLyricsEvents(lyricsContent);
    }
    
    parseLyrics(lyricsText) {
        if (!lyricsText) return [];
        
        const lines = lyricsText.split('\n');
        const lyrics = [];
        
        for (const line of lines) {
            const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3].padEnd(3, '0'));
                const text = match[4].trim();
                
                const time = minutes * 60 + seconds + milliseconds / 1000;
                lyrics.push({ time, text });
            } else if (line.trim()) {
                // 没有时间标记的歌词
                lyrics.push({ time: 0, text: line.trim() });
            }
        }
        
        return lyrics.sort((a, b) => a.time - b.time);
    }
    
    bindLyricsEvents(container) {
        container.querySelectorAll('.lyrics-line').forEach(line => {
            line.addEventListener('click', () => {
                const time = parseFloat(line.dataset.time);
                if (time >= 0 && window.player) {
                    window.player.seek(time);
                }
            });
        });
    }
    
    updateLyricsHighlight() {
        const lyricsLines = document.querySelectorAll('.lyrics-line');
        if (lyricsLines.length === 0) return;
        
        const currentTime = window.player?.currentTime || 0;
        let activeLine = null;
        
        lyricsLines.forEach(line => {
            const time = parseFloat(line.dataset.time);
            line.classList.remove('active');
            
            if (time <= currentTime) {
                activeLine = line;
            }
        });
        
        if (activeLine) {
            activeLine.classList.add('active');
            
            // 滚动到当前歌词
            activeLine.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    
    // 视图切换动画
    animateViewSwitch(fromView, toView) {
        if (fromView) {
            fromView.style.animation = 'slideOut 0.3s ease forwards';
        }
        
        if (toView) {
            toView.style.animation = 'slideIn 0.3s ease forwards';
        }
    }
    
    // 显示加载状态
    showLoading(container, message = '加载中...') {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="loading-spinner"></div>
                <h3>${message}</h3>
            </div>
        `;
    }
    
    // 显示错误状态
    showError(container, message = '发生错误') {
        if (typeof container === 'string') {
            container = document.querySelector(container);
        }
        
        if (!container) return;
        
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <h3>${message}</h3>
                <p>请重试或联系技术支持</p>
            </div>
        `;
    }
    
    // 更新播放器可视化
    updateVisualization() {
        if (!window.player?.analyzer) return;
        
        const frequencyData = window.player.getFrequencyData();
        if (!frequencyData) return;
        
        // 这里可以添加频谱可视化的代码
        // 例如更新播放按钮的动画效果
        const playBtn = document.getElementById('play-btn');
        if (playBtn && window.player.isPlaying) {
            const average = window.player.analyzer.getAverageFrequency();
            const scale = 1 + (average / 255) * 0.1;
            playBtn.style.transform = `scale(${scale})`;
        }
    }
    
    // 初始化时间更新
    startTimeUpdate() {
        setInterval(() => {
            if (this.panels.lyrics) {
                this.updateLyricsHighlight();
            }
            
            this.updateVisualization();
        }, 100);
    }
    
    // 响应式布局调整
    handleResize() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth < 768) {
            // 移动端布局调整
            if (sidebar) sidebar.classList.add('mobile');
            if (mainContent) mainContent.classList.add('mobile');
        } else {
            if (sidebar) sidebar.classList.remove('mobile');
            if (mainContent) mainContent.classList.remove('mobile');
        }
    }
    
    // 处理从播放列表中移除歌曲
    async handleRemoveFromPlaylist(playlistId, songPath) {
        try {
            let confirmed = false;
            if (Utils && Utils.showConfirmDialog) {
                confirmed = await Utils.showConfirmDialog(
                    '移除歌曲',
                    '确定要从播放列表中移除这首歌吗？',
                    '移除',
                    '取消'
                );
            } else {
                confirmed = window.confirm('确定要从播放列表中移除这首歌吗？');
            }
            
            if (confirmed) {
                window.playlistManager?.removeFromPlaylist(playlistId, songPath);
            }
        } catch (error) {
            console.error('移除歌曲失败:', error);
            Utils.showNotification(`移除歌曲失败: ${error.message}`, 'error');
        }
    }
}

// 创建全局UI管理器实例
window.ui = new UIManager();

// 监听窗口大小变化
window.addEventListener('resize', Utils.debounce(() => {
    window.ui.handleResize();
}, 300));

// 启动时间更新
window.addEventListener('load', () => {
    window.ui.startTimeUpdate();
});