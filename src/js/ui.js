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
        this.loadEqualizerState();
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
        
        // 分享按钮
        const shareBtn = document.getElementById('share-btn');
        
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareCurrentSong());
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
        
        // 应用音效到播放器
        if (window.player && window.player.applyEqualizerPreset) {
            const success = window.player.applyEqualizerPreset(preset);
            if (success) {
                // 更新当前音效显示
                this.updateCurrentEqualizerDisplay(preset);
                
                // 获取音效名称
                const presetName = window.player.getEqualizerPresetName(preset);
                
                // 检查是否有音频正在播放
                if (window.player.isPlaying) {
                    Utils.showNotification(`已应用 ${presetName} 音效`, 'success');
                } else {
                    Utils.showNotification(`已选择 ${presetName} 音效，将在播放时生效`, 'info');
                }
            } else {
                // 音效应用失败，但仍保存设置
                storage.setSetting('equalizer', preset);
                this.updateCurrentEqualizerDisplay(preset);
                
                const presetName = window.player.getEqualizerPresetName(preset);
                
                // 提供更详细的错误信息
                if (!window.player.currentSong) {
                    Utils.showNotification(`已选择 ${presetName} 音效，请先播放音乐`, 'warning');
                } else {
                    Utils.showNotification(`${presetName} 音效设置已保存，可能需要重新播放歌曲`, 'warning');
                }
            }
        } else {
            // 降级处理：仅保存设置
            storage.setSetting('equalizer', preset);
            this.updateCurrentEqualizerDisplay(preset);
            
            const presetNames = {
                'normal': '普通',
                'pop': '流行',
                'rock': '摇滚',
                'jazz': '爵士',
                'classical': '古典',
                'electronic': '电子',
                'vocal': '人声',
                'bass': '低音'
            };
            
            Utils.showNotification(`已选择 ${presetNames[preset]} 音效`, 'info');
        }
    }
    
    updateCurrentEqualizerDisplay(preset) {
        const currentEqName = document.getElementById('current-eq-name');
        if (currentEqName) {
            if (window.player && window.player.getEqualizerPresetName) {
                currentEqName.textContent = window.player.getEqualizerPresetName(preset);
            } else {
                const presetNames = {
                    'normal': '普通',
                    'pop': '流行',
                    'rock': '摇滚',
                    'jazz': '爵士',
                    'classical': '古典',
                    'electronic': '电子',
                    'vocal': '人声',
                    'bass': '低音'
                };
                currentEqName.textContent = presetNames[preset] || preset;
            }
        }
    }
    
    loadEqualizerState() {
        // 加载保存的均衡器状态
        const savedPreset = storage.getSetting('equalizer') || 'normal';
        
        // 设置按钮状态
        document.querySelectorAll('.eq-preset').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-preset="${savedPreset}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // 更新显示
        this.updateCurrentEqualizerDisplay(savedPreset);
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
    
    /**
     * 分享当前播放的歌曲
     * 生成自定义协议链接并复制到剪贴板
     */
    async shareCurrentSong() {
        try {
            // 检查是否有正在播放的歌曲
            if (!window.player || !window.player.currentSong) {
                Utils.showNotification('没有正在播放的歌曲', 'info');
                return;
            }
            
            const song = window.player.currentSong;
            
            // 显示加载状态
            Utils.showNotification('正在生成分享链接...', 'info');
            
            // 构建多种分享链接
            const shareUrls = await this.generateShareUrls(song);
            
            if (!shareUrls) {
                Utils.showNotification('无法生成分享链接：缺少必要信息', 'error');
                return;
            }
            
            // 显示分享对话框
            this.showShareDialog(shareUrls);
            
        } catch (error) {
            console.error('分享歌曲失败:', error);
            Utils.showNotification('分享歌曲失败：' + error.message, 'error');
        }
    }
    
    /**
     * 生成分享URL
     * @param {Object} song - 歌曲对象
     * @returns {Object|null} - 包含多种分享URL的对象
     */
    async generateShareUrls(song) {
        if (!song) return null;
        
        const urls = {};
        
        // 生成 MyMusic 协议 URL
        const params = new URLSearchParams();
        
        // 优先使用标题和艺术家
        if (song.title) {
            params.append('title', song.title);
        }
        
        if (song.artist) {
            params.append('artist', song.artist);
        }
        
        // 如果没有标题信息，使用文件路径
        if (!song.title && song.path) {
            params.append('path', song.path);
        }
        
        // 检查是否有足够信息生成链接
        if (params.has('title') || params.has('path')) {
            urls.mymusic = `mymusic://play?${params.toString()}`;
        }
        
        // 生成 Orpheus 协议 URL (通过搜索歌曲ID)
        if (song.title && window.electronAPI) {
            try {
                
                const searchResult = await window.electronAPI.searchSongId(song.title, '');
                if (searchResult.success && searchResult.songId) {
                    urls.orpheus = `orpheus://song/${searchResult.songId}`;
                    urls.songInfo = {
                        id: searchResult.songId,
                        name: searchResult.songName,
                        artist: searchResult.artistName,
                        album: searchResult.albumName
                    };
                }
            } catch (error) {
                console.error('搜索歌曲ID失败:', error);
            }
        }
        
        return Object.keys(urls).length > 0 ? urls : null;
    }

    /**
     * 生成分享URL (保持向后兼容)
     * @param {Object} song - 歌曲对象
     * @returns {string|null} - 分享URL
     */
    generateShareUrl(song) {
        if (!song) return null;
        
        const params = new URLSearchParams();
        
        // 优先使用标题和艺术家
        if (song.title) {
            params.append('title', song.title);
        }
        
        if (song.artist) {
            params.append('artist', song.artist);
        }
        
        // 如果没有标题信息，使用文件路径
        if (!song.title && song.path) {
            params.append('path', song.path);
        }
        
        // 检查是否有足够信息生成链接
        if (!params.has('title') && !params.has('path')) {
            return null;
        }
        
        return `mymusic://play?${params.toString()}`;
    }
    
    /**
     * 显示分享对话框
     * @param {Object} shareUrls - 包含多种分享URL的对象
     */
    showShareDialog(shareUrls) {
        // 创建分享对话框
        const dialog = document.createElement('div');
        dialog.className = 'share-dialog';
        
        let urlsHtml = '';
        
        // MyMusic 协议
        if (shareUrls.mymusic) {
            urlsHtml += `
                <div class="share-url-section">
                    <h4>🎵 MyMusic 协议链接</h4>
                    <p class="share-description">用于在 MyMusic 应用中直接播放</p>
                    <div class="share-url-container">
                        <input type="text" class="share-url-input" value="${shareUrls.mymusic}" readonly data-url="${shareUrls.mymusic}">
                        <button class="share-copy-btn" title="复制链接" data-url="${shareUrls.mymusic}">📋</button>
                    </div>
                </div>
            `;
        }
        
        // Orpheus 协议
        if (shareUrls.orpheus) {
            const songInfo = shareUrls.songInfo || {};
            urlsHtml += `
                <div class="share-url-section">
                    <h4>🎶 Orpheus 协议链接</h4>
                    <p class="share-description">基于网易云音乐ID: ${songInfo.id || '未知'}</p>
                    <p class="share-song-info">歌曲：${songInfo.name || '未知'} - ${songInfo.artist || '未知'}</p>
                    <div class="share-url-container">
                        <input type="text" class="share-url-input" value="${shareUrls.orpheus}" readonly data-url="${shareUrls.orpheus}">
                        <button class="share-copy-btn" title="复制链接" data-url="${shareUrls.orpheus}">📋</button>
                    </div>
                </div>
            `;
        }
        
        dialog.innerHTML = `
            <div class="share-dialog-content">
                <h3>分享音乐</h3>
                <p>选择合适的分享格式：</p>
                ${urlsHtml}
                <div class="share-dialog-actions">
                    <button class="share-close-btn">关闭</button>
                </div>
            </div>
        `;
        
        // 添加样式
        dialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        const content = dialog.querySelector('.share-dialog-content');
        content.style.cssText = `
            background: var(--background-color, #fff);
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 25px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            color: var(--text-color, #333);
        `;
        
        // 样式化所有URL容器
        const urlContainers = dialog.querySelectorAll('.share-url-container');
        urlContainers.forEach(container => {
            container.style.cssText = `
                display: flex;
                margin: 10px 0;
                border: 1px solid var(--border-color, #ddd);
                border-radius: 5px;
                overflow: hidden;
            `;
        });
        
        // 样式化所有URL输入框
        const urlInputs = dialog.querySelectorAll('.share-url-input');
        urlInputs.forEach(input => {
            input.style.cssText = `
                flex: 1;
                padding: 10px;
                border: none;
                background: var(--input-background, #f9f9f9);
                color: var(--text-color, #333);
                font-family: monospace;
                font-size: 12px;
                word-break: break-all;
            `;
        });
        
        // 样式化所有复制按钮
        const copyBtns = dialog.querySelectorAll('.share-copy-btn');
        copyBtns.forEach(btn => {
            btn.style.cssText = `
                padding: 10px;
                border: none;
                background: var(--primary-color, #007bff);
                color: white;
                cursor: pointer;
                min-width: 40px;
            `;
        });
        
        // 样式化区域标题
        const sectionTitles = dialog.querySelectorAll('.share-url-section h4');
        sectionTitles.forEach(title => {
            title.style.cssText = `
                margin: 15px 0 5px 0;
                color: var(--accent-color, #007bff);
                font-size: 16px;
            `;
        });
        
        // 样式化描述文本
        const descriptions = dialog.querySelectorAll('.share-description');
        descriptions.forEach(desc => {
            desc.style.cssText = `
                margin: 5px 0;
                color: var(--text-secondary, #666);
                font-size: 13px;
            `;
        });
        
        // 样式化歌曲信息
        const songInfos = dialog.querySelectorAll('.share-song-info');
        songInfos.forEach(info => {
            info.style.cssText = `
                margin: 5px 0;
                color: var(--text-color, #333);
                font-size: 14px;
                font-weight: 500;
            `;
        });
        
        const actions = dialog.querySelector('.share-dialog-actions');
        actions.style.cssText = `
            text-align: right;
            margin-top: 20px;
            padding-top: 15px;
            border-top: 1px solid var(--border-color, #eee);
        `;
        
        const closeBtn = dialog.querySelector('.share-close-btn');
        closeBtn.style.cssText = `
            padding: 10px 20px;
            border: 1px solid var(--border-color, #ddd);
            background: var(--background-color, #fff);
            color: var(--text-color, #333);
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        // 事件绑定 - 为所有复制按钮添加事件
        copyBtns.forEach(copyBtn => {
            copyBtn.addEventListener('click', async () => {
                const urlToShare = copyBtn.getAttribute('data-url');
                try {
                    await navigator.clipboard.writeText(urlToShare);
                    copyBtn.textContent = '✅';
                    Utils.showNotification('分享链接已复制到剪贴板', 'success');
                    setTimeout(() => {
                        copyBtn.textContent = '📋';
                    }, 2000);
                } catch (error) {
                    // 降级方法
                    const input = copyBtn.parentElement.querySelector('.share-url-input');
                    input.select();
                    document.execCommand('copy');
                    copyBtn.textContent = '✅';
                    Utils.showNotification('分享链接已复制到剪贴板', 'success');
                    setTimeout(() => {
                        copyBtn.textContent = '📋';
                    }, 2000);
                }
            });
        });
        
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(dialog);
        });
        
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog);
            }
        });
        
        // 添加到页面
        document.body.appendChild(dialog);
        
        // 自动选择第一个URL文本
        const firstInput = dialog.querySelector('.share-url-input');
        if (firstInput) {
            firstInput.select();
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