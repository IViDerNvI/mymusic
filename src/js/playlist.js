// 播放列表管理

class PlaylistManager {
    constructor() {
        console.log('PlaylistManager: 构造函数开始');
        this.playlists = [];
        try {
            this.init();
            console.log('PlaylistManager: 初始化完成');
        } catch (error) {
            console.error('PlaylistManager: 初始化失败:', error);
        }
    }
    
    init() {
        this.loadPlaylists();
        this.bindEvents();
        this.updatePlaylistNav();
    }
    
    bindEvents() {
        console.log('PlaylistManager: 绑定事件开始');
        // 创建播放列表按钮
        const createBtn = document.getElementById('create-playlist');
        console.log('PlaylistManager: 找到创建按钮:', createBtn);
        if (createBtn) {
            createBtn.addEventListener('click', () => {
                console.log('PlaylistManager: 创建按钮被点击');
                this.showCreateDialog();
            });
            console.log('PlaylistManager: 事件监听器已绑定');
        } else {
            console.warn('PlaylistManager: 未找到创建播放列表按钮 (#create-playlist)');
        }
    }
    
    loadPlaylists() {
        this.playlists = storage.getPlaylists();
    }
    
    updatePlaylistNav() {
        const navContainer = document.getElementById('playlist-nav');
        if (!navContainer) return;
        
        // 保留创建按钮
        const createBtn = navContainer.querySelector('#create-playlist');
        navContainer.innerHTML = '';
        if (createBtn) {
            const li = document.createElement('li');
            li.appendChild(createBtn);
            navContainer.appendChild(li);
        }
        
        // 添加播放列表
        this.playlists.forEach(playlist => {
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="#" class="nav-link playlist-link" 
                   data-playlist-id="${playlist.id}">
                    📋 ${playlist.name}
                </a>
            `;
            navContainer.appendChild(li);
        });
        
        this.bindPlaylistNavEvents();
    }
    
    bindPlaylistNavEvents() {
        document.querySelectorAll('.playlist-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const playlistId = e.target.dataset.playlistId;
                this.showPlaylist(playlistId);
            });
            
            // 右键菜单
            link.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const playlistId = e.target.dataset.playlistId;
                this.showPlaylistContextMenu(e, playlistId);
            });
        });
    }
    
    async showCreateDialog() {
        try {
            console.log('显示创建播放列表对话框');
            
            // 检查 Utils.showInputDialog 是否可用
            if (typeof Utils === 'undefined' || !Utils.showInputDialog) {
                throw new Error('showInputDialog 函数不可用');
            }
            
            const name = await Utils.showInputDialog(
                '创建播放列表', 
                '请输入播放列表名称', 
                ''
            );
            
            if (name && name.trim()) {
                console.log('用户输入的名称:', name.trim());
                this.createPlaylist(name.trim());
            } else {
                console.log('用户取消或输入为空');
            }
        } catch (error) {
            console.error('显示创建对话框失败:', error);
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification(`显示创建对话框失败: ${error.message}`, 'error');
            } else {
                // 降级到原生 confirm 作为备选方案
                const name = window.confirm('无法显示输入对话框，是否使用默认名称创建播放列表？') 
                    ? `新建播放列表_${Date.now()}` 
                    : null;
                if (name) {
                    this.createPlaylist(name);
                }
            }
        }
    }
    
    createPlaylist(name, description = '') {
        try {
            console.log('开始创建播放列表:', name);
            
            // 检查依赖项
            if (typeof storage === 'undefined') {
                throw new Error('storage 模块未加载');
            }
            if (typeof Utils === 'undefined') {
                throw new Error('Utils 模块未加载');
            }
            
            // 检查重名
            if (this.playlists.some(p => p.name === name)) {
                Utils.showNotification('播放列表名称已存在', 'error');
                return null;
            }
            
            console.log('调用 storage.createPlaylist');
            const playlist = storage.createPlaylist(name, description);
            console.log('播放列表创建成功:', playlist);
            
            this.playlists = storage.getPlaylists();
            this.updatePlaylistNav();
            
            Utils.showNotification(`播放列表 "${name}" 创建成功`, 'success');
            
            // 自动切换到新创建的播放列表
            this.showPlaylist(playlist.id);
            
            return playlist;
        } catch (error) {
            console.error('创建播放列表失败:', error);
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification(`创建播放列表失败: ${error.message}`, 'error');
            } else {
                alert(`创建播放列表失败: ${error.message}`);
            }
            return null;
        }
    }
    
    async deletePlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        let confirmed = false;
        try {
            if (Utils && Utils.showConfirmDialog) {
                confirmed = await Utils.showConfirmDialog(
                    '删除播放列表',
                    `确定要删除播放列表 "${playlist.name}" 吗？`,
                    '删除',
                    '取消'
                );
            } else {
                // 降级到原生 confirm
                confirmed = window.confirm(`确定要删除播放列表 "${playlist.name}" 吗？`);
            }
        } catch (error) {
            console.error('显示确认对话框失败:', error);
            confirmed = window.confirm(`确定要删除播放列表 "${playlist.name}" 吗？`);
        }
        
        if (!confirmed) return false;
        
        const success = storage.deletePlaylist(playlistId);
        if (success) {
            this.playlists = storage.getPlaylists();
            this.updatePlaylistNav();
            
            Utils.showNotification(`播放列表 "${playlist.name}" 已删除`, 'info');
            
            // 如果当前显示的是被删除的播放列表，切换到音乐库
            const currentView = document.querySelector('.view.active');
            if (currentView && currentView.id === `playlist-${playlistId}`) {
                window.ui?.switchView('library');
            }
        }
        
        return success;
    }
    
    renamePlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        const newName = prompt('请输入新的播放列表名称:', playlist.name);
        if (!newName || newName.trim() === playlist.name) return false;
        
        // 检查重名
        if (this.playlists.some(p => p.name === newName.trim() && p.id !== playlistId)) {
            Utils.showNotification('播放列表名称已存在', 'error');
            return false;
        }
        
        const success = storage.updatePlaylist(playlistId, { name: newName.trim() });
        if (success) {
            this.playlists = storage.getPlaylists();
            this.updatePlaylistNav();
            this.showPlaylist(playlistId); // 刷新当前视图
            
            Utils.showNotification(`播放列表已重命名为 "${newName.trim()}"`, 'success');
        }
        
        return success;
    }
    
    addToPlaylist(playlistId, songPaths) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        const addedCount = storage.addToPlaylist(playlistId, songPaths);
        if (addedCount > 0) {
            this.playlists = storage.getPlaylists();
            
            // 如果当前显示的是这个播放列表，刷新视图
            const currentView = document.querySelector('.view.active');
            if (currentView && currentView.id === `playlist-${playlistId}`) {
                this.showPlaylist(playlistId);
            }
            
            Utils.showNotification(`已添加 ${addedCount} 首歌曲到 "${playlist.name}"`, 'success');
        } else {
            Utils.showNotification('歌曲已在播放列表中', 'info');
        }
        
        return addedCount > 0;
    }
    
    removeFromPlaylist(playlistId, songPath) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return false;
        
        const success = storage.removeFromPlaylist(playlistId, songPath);
        if (success) {
            this.playlists = storage.getPlaylists();
            
            // 刷新当前视图
            const currentView = document.querySelector('.view.active');
            if (currentView && currentView.id === `playlist-${playlistId}`) {
                this.showPlaylist(playlistId);
            }
            
            Utils.showNotification('已从播放列表中移除', 'info');
        }
        
        return success;
    }
    
    showPlaylist(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // 切换导航高亮
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const playlistLink = document.querySelector(`[data-playlist-id="${playlistId}"]`);
        if (playlistLink) {
            playlistLink.classList.add('active');
        }
        
        // 创建或更新播放列表视图
        this.createPlaylistView(playlist);
        
        // 切换到播放列表视图
        window.ui?.switchView(`playlist-${playlistId}`);
    }
    
    createPlaylistView(playlist) {
        const contentView = document.querySelector('.content-view');
        if (!contentView) return;
        
        const viewId = `playlist-${playlist.id}`;
        let playlistView = document.getElementById(viewId);
        
        if (!playlistView) {
            playlistView = document.createElement('div');
            playlistView.id = viewId;
            playlistView.className = 'view';
            contentView.appendChild(playlistView);
        }
        
        // 获取播放列表中的歌曲
        const library = window.musicLibrary?.getAllSongs() || [];
        const playlistSongs = playlist.songs.map(path => 
            library.find(song => song.path === path)
        ).filter(song => song); // 过滤掉找不到的歌曲
        
        playlistView.innerHTML = `
            <div class="view-header">
                <div>
                    <h2>${playlist.name}</h2>
                    <p style="color: var(--text-secondary); margin-top: 5px;">
                        ${playlist.description || `${playlistSongs.length} 首歌曲`}
                    </p>
                </div>
                <div class="view-controls">
                    <button class="btn btn-primary play-all-btn">播放全部</button>
                    <button class="btn btn-secondary shuffle-play-btn">随机播放</button>
                </div>
            </div>
            
            <div class="playlist-content">
                ${playlistSongs.length > 0 ? this.renderPlaylistSongs(playlistSongs, playlist.id) : `
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h3>播放列表为空</h3>
                        <p>右键点击歌曲选择"添加到播放列表"来添加歌曲</p>
                    </div>
                `}
            </div>
        `;
        
        this.bindPlaylistViewEvents(playlistView, playlist);
    }
    
    renderPlaylistSongs(songs, playlistId) {
        return `
            <div class="music-list">
                ${songs.map((song, index) => `
                    <div class="music-item" data-path="${song.path}" data-index="${index}">
                        <div class="music-item-index">${index + 1}</div>
                        <div class="music-item-info">
                            <div class="music-item-title">${song.title}</div>
                            <div class="music-item-artist">${song.artist}</div>
                        </div>
                        <div class="music-item-album">${song.album}</div>
                        <div class="music-item-duration">${Utils.formatTime(song.duration)}</div>
                        <div class="music-item-actions">
                            <button class="btn btn-icon remove-from-playlist-btn" 
                                    data-path="${song.path}" data-playlist-id="${playlistId}" title="从播放列表移除">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    bindPlaylistViewEvents(playlistView, playlist) {
        // 播放全部
        const playAllBtn = playlistView.querySelector('.play-all-btn');
        if (playAllBtn) {
            playAllBtn.addEventListener('click', () => {
                this.playPlaylist(playlist.id, false);
            });
        }
        
        // 随机播放
        const shufflePlayBtn = playlistView.querySelector('.shuffle-play-btn');
        if (shufflePlayBtn) {
            shufflePlayBtn.addEventListener('click', () => {
                this.playPlaylist(playlist.id, true);
            });
        }
        
        // 编辑播放列表
        // const editBtn = playlistView.querySelector('.edit-playlist-btn');
        // if (editBtn) {
        //     editBtn.addEventListener('click', () => {
        //         this.showEditDialog(playlist.id);
        //     });
        // }
        
        // 歌曲双击播放
        playlistView.querySelectorAll('.music-item').forEach(item => {
            item.addEventListener('dblclick', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.playPlaylist(playlist.id, false, index);
            });
        });
        
        // 从播放列表移除
        playlistView.querySelectorAll('.remove-from-playlist-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const path = btn.dataset.path;
                const playlistId = btn.dataset.playlistId;
                
                let confirmed = false;
                try {
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
                } catch (error) {
                    console.error('显示确认对话框失败:', error);
                    confirmed = window.confirm('确定要从播放列表中移除这首歌吗？');
                }
                
                if (confirmed) {
                    this.removeFromPlaylist(playlistId, path);
                }
            });
        });
        
        // 右键菜单
        playlistView.querySelectorAll('.music-item').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                window.ui?.showContextMenu(e, item.dataset.path, {
                    playlist: playlist.id,
                    inPlaylist: true
                });
            });
        });
    }
    
    playPlaylist(playlistId, shuffle = false, startIndex = 0) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist || playlist.songs.length === 0) {
            Utils.showNotification('播放列表为空', 'warning');
            return;
        }
        
        // 获取歌曲对象
        const library = window.musicLibrary?.getAllSongs() || [];
        const songs = playlist.songs.map(path => 
            library.find(song => song.path === path)
        ).filter(song => song);
        
        if (songs.length === 0) {
            Utils.showNotification('播放列表中的歌曲文件不存在', 'error');
            return;
        }
        
        // 设置播放器
        if (shuffle) {
            const shuffledSongs = Utils.shuffleArray(songs);
            window.player?.setPlaylist(shuffledSongs, 0);
            Utils.showNotification(`正在随机播放 "${playlist.name}"`, 'success');
        } else {
            window.player?.setPlaylist(songs, startIndex);
            Utils.showNotification(`正在播放 "${playlist.name}"`, 'success');
        }
    }
    
    showEditDialog(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // 创建编辑对话框（简单的prompt版本，可以后续改为模态框）
        const newName = prompt('播放列表名称:', playlist.name);
        if (newName && newName.trim() !== playlist.name) {
            this.renamePlaylist(playlistId);
        }
        
        const newDescription = prompt('播放列表描述:', playlist.description || '');
        if (newDescription !== null && newDescription !== playlist.description) {
            storage.updatePlaylist(playlistId, { description: newDescription });
            this.playlists = storage.getPlaylists();
            this.showPlaylist(playlistId);
        }
    }
    
    showPlaylistContextMenu(event, playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // 创建上下文菜单
        const menu = document.createElement('div');
        menu.className = 'context-menu active';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;
        
        menu.innerHTML = `
            <ul>
                <li data-action="play">播放</li>
                <li data-action="shuffle-play">随机播放</li>
                <li data-action="rename">重命名</li>
                <li data-action="delete">删除</li>
            </ul>
        `;
        
        document.body.appendChild(menu);
        
        // 绑定事件
        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            switch (action) {
                case 'play':
                    this.playPlaylist(playlistId, false);
                    break;
                case 'shuffle-play':
                    this.playPlaylist(playlistId, true);
                    break;
                case 'rename':
                    this.renamePlaylist(playlistId);
                    break;
                case 'delete':
                    this.deletePlaylist(playlistId);
                    break;
            }
            
            menu.remove();
        });
        
        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', () => {
                menu.remove();
            }, { once: true });
        }, 100);
    }
    
    // 获取播放列表选择器（用于添加歌曲到播放列表）
    async showPlaylistSelector(songPaths) {
        try {
            if (this.playlists.length === 0) {
                // 如果没有播放列表，询问是否创建新的
                if (Utils && Utils.showConfirmDialog) {
                    const shouldCreate = await Utils.showConfirmDialog(
                        '没有播放列表',
                        '您还没有创建任何播放列表。是否要创建一个新的播放列表？',
                        '创建',
                        '取消'
                    );
                    if (shouldCreate) {
                        await this.showCreateDialog();
                    }
                } else {
                    Utils.showNotification('请先创建一个播放列表', 'info');
                }
                return;
            }
            
            // 检查 Utils.showSelectDialog 是否可用
            if (!Utils || !Utils.showSelectDialog) {
                // 降级到简化版本
                const playlistNames = this.playlists.map(p => p.name);
                const selectedText = window.prompt(`选择播放列表:\n${playlistNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}\n\n请输入数字:`);
                
                if (selectedText) {
                    const index = parseInt(selectedText) - 1;
                    if (index >= 0 && index < this.playlists.length) {
                        const playlist = this.playlists[index];
                        this.addToPlaylist(playlist.id, songPaths);
                    } else {
                        Utils.showNotification('无效的选择', 'error');
                    }
                }
                return;
            }
            
            // 使用自定义选择对话框
            const playlistNames = this.playlists.map(p => p.name);
            const selectedIndex = await Utils.showSelectDialog(
                '添加到播放列表',
                playlistNames,
                `选择要添加 ${songPaths.length} 首歌曲的播放列表:`
            );
            
            if (selectedIndex !== null && selectedIndex >= 0) {
                const playlist = this.playlists[selectedIndex];
                this.addToPlaylist(playlist.id, songPaths);
            }
        } catch (error) {
            console.error('显示播放列表选择器失败:', error);
            Utils.showNotification(`操作失败: ${error.message}`, 'error');
        }
    }
    
    // 智能播放列表（基于条件自动生成）
    createSmartPlaylist(name, condition) {
        const library = window.musicLibrary?.getAllSongs() || [];
        const songs = library.filter(condition);
        
        if (songs.length === 0) {
            Utils.showNotification('没有符合条件的歌曲', 'warning');
            return null;
        }
        
        const playlist = this.createPlaylist(name, `智能播放列表 - ${songs.length} 首歌曲`);
        if (playlist) {
            const songPaths = songs.map(song => song.path);
            storage.addToPlaylist(playlist.id, songPaths);
            this.playlists = storage.getPlaylists();
        }
        
        return playlist;
    }
    
    // 导出播放列表
    exportPlaylist(playlistId, format = 'm3u') {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return null;
        
        let content = '';
        
        switch (format.toLowerCase()) {
            case 'm3u':
                content = '#EXTM3U\n';
                playlist.songs.forEach(path => {
                    const song = window.musicLibrary?.getSongByPath(path);
                    if (song) {
                        content += `#EXTINF:${Math.round(song.duration || 0)},${song.artist} - ${song.title}\n`;
                        content += `${path}\n`;
                    }
                });
                break;
                
            case 'json':
                content = JSON.stringify({
                    name: playlist.name,
                    description: playlist.description,
                    songs: playlist.songs,
                    createdAt: playlist.createdAt,
                    exportedAt: Date.now()
                }, null, 2);
                break;
        }
        
        return content;
    }
    
    // 导入播放列表
    async importPlaylist(content, format = 'm3u') {
        try {
            let playlist = null;
            
            switch (format.toLowerCase()) {
                case 'm3u':
                    playlist = this.parseM3U(content);
                    break;
                case 'json':
                    playlist = JSON.parse(content);
                    break;
            }
            
            if (playlist && playlist.songs) {
                const newPlaylist = this.createPlaylist(
                    playlist.name || '导入的播放列表',
                    playlist.description || ''
                );
                
                if (newPlaylist) {
                    // 验证歌曲路径是否存在
                    const validPaths = [];
                    for (const path of playlist.songs) {
                        if (window.musicLibrary?.getSongByPath(path)) {
                            validPaths.push(path);
                        }
                    }
                    
                    if (validPaths.length > 0) {
                        storage.addToPlaylist(newPlaylist.id, validPaths);
                        this.playlists = storage.getPlaylists();
                        this.updatePlaylistNav();
                        
                        Utils.showNotification(
                            `导入成功，包含 ${validPaths.length} 首歌曲`,
                            'success'
                        );
                        
                        return newPlaylist;
                    }
                }
            }
            
            Utils.showNotification('导入失败：播放列表格式不正确', 'error');
            return null;
        } catch (error) {
            console.error('导入播放列表失败:', error);
            Utils.showNotification('导入失败', 'error');
            return null;
        }
    }
    
    parseM3U(content) {
        const lines = content.split('\n');
        const songs = [];
        let currentSong = null;
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            if (trimmedLine.startsWith('#EXTINF:')) {
                // 解析歌曲信息（可选）
                currentSong = {};
            } else if (trimmedLine && !trimmedLine.startsWith('#')) {
                // 歌曲路径
                songs.push(trimmedLine);
                currentSong = null;
            }
        }
        
        return {
            name: '导入的播放列表',
            songs: songs
        };
    }
    
    // 获取播放列表统计信息
    getPlaylistStats(playlistId) {
        const playlist = this.playlists.find(p => p.id === playlistId);
        if (!playlist) return null;
        
        const library = window.musicLibrary?.getAllSongs() || [];
        const songs = playlist.songs.map(path => 
            library.find(song => song.path === path)
        ).filter(song => song);
        
        const totalDuration = songs.reduce((sum, song) => sum + (song.duration || 0), 0);
        const artists = new Set(songs.map(song => song.artist));
        const albums = new Set(songs.map(song => song.album));
        
        return {
            songCount: songs.length,
            totalDuration,
            artistCount: artists.size,
            albumCount: albums.size,
            avgDuration: songs.length > 0 ? totalDuration / songs.length : 0
        };
    }
    // 测试函数 - 用于调试
    testCreatePlaylist() {
        console.log('=== 播放列表创建测试 ===');
        console.log('storage 可用:', typeof storage !== 'undefined');
        console.log('Utils 可用:', typeof Utils !== 'undefined');
        console.log('当前播放列表数量:', this.playlists.length);
        
        try {
            const testName = `测试播放列表_${Date.now()}`;
            console.log('尝试创建播放列表:', testName);
            const result = this.createPlaylist(testName);
            console.log('创建结果:', result);
            return result;
        } catch (error) {
            console.error('测试失败:', error);
            return null;
        }
    }
}

// 创建全局播放列表管理器实例
window.playlistManager = new PlaylistManager();

// 暴露测试函数到控制台（开发模式）
window.testPlaylist = () => window.playlistManager.testCreatePlaylist();