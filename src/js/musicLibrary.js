// 音乐库管理

class MusicLibrary {
    constructor() {
        this.songs = [];
        this.artists = new Map();
        this.albums = new Map();
        this.genres = new Map();
        this.isLoading = false;
        this.init();
    }
    
    async init() {
        // 从存储加载音乐库
        await this.loadFromStorage();
        this.updateViews();
        this.bindEvents();
    }
    
    bindEvents() {
        // 导入文件按钮
        document.getElementById('import-files').addEventListener('click', () => {
            this.importFiles();
        });
        
        // 导入文件夹按钮
        document.getElementById('import-folder').addEventListener('click', () => {
            this.importFolder();
        });
        
        // 菜单事件监听
        if (window.electronAPI) {
            window.electronAPI.onMenuImportFiles(() => this.importFiles());
            window.electronAPI.onMenuImportFolder(() => this.importFolder());
        }
        
        // 搜索
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.search(e.target.value);
            }, 300));
        }
        
        // 排序
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortLibrary(e.target.value);
            });
        }
    }
    
    async loadFromStorage() {
        this.songs = storage.getLibrary();
        this.updateStatistics();
        
        // 检查文件是否仍然存在
        if (this.songs.length > 0) {
            await this.validateLibrary();
        }
    }
    
    async validateLibrary() {
        console.log('验证音乐库文件...');
        const validSongs = [];
        
        for (const song of this.songs) {
            try {
                if (window.electronAPI) {
                    const stats = await window.electronAPI.getFileStats(song.path);
                    if (stats.exists) {
                        validSongs.push(song);
                    } else {
                        console.log(`文件不存在: ${song.path}`);
                    }
                } else {
                    // 浏览器环境下跳过验证
                    validSongs.push(song);
                }
            } catch (error) {
                console.error(`验证文件失败: ${song.path}`, error);
            }
        }
        
        if (validSongs.length !== this.songs.length) {
            this.songs = validSongs;
            storage.setLibrary(this.songs);
            Utils.showNotification(`已移除 ${this.songs.length - validSongs.length} 个无效文件`, 'warning');
        }
    }
    
    async importFiles() {
        if (!window.electronAPI) {
            Utils.showNotification('文件导入功能需要在Electron环境中使用', 'error');
            return;
        }
        
        try {
            const result = await window.electronAPI.selectMusicFiles();
            if (result.canceled || !result.filePaths.length) return;
            
            await this.addFiles(result.filePaths);
        } catch (error) {
            console.error('导入文件失败:', error);
            Utils.showNotification('导入文件失败', 'error');
        }
    }
    
    async importFolder() {
        if (!window.electronAPI) {
            Utils.showNotification('文件夹导入功能需要在Electron环境中使用', 'error');
            return;
        }
        
        try {
            const result = await window.electronAPI.selectMusicFolder();
            if (result.canceled || !result.filePaths.length) return;
            
            const folderPath = result.filePaths[0];
            Utils.showNotification('正在扫描文件夹...', 'info', 1000);
            
            const musicFiles = await window.electronAPI.readMusicFilesFromFolder(folderPath);
            if (musicFiles.length === 0) {
                Utils.showNotification('文件夹中没有找到音乐文件', 'warning');
                return;
            }
            
            await this.addFiles(musicFiles);
        } catch (error) {
            console.error('导入文件夹失败:', error);
            Utils.showNotification('导入文件夹失败', 'error');
        }
    }
    
    async addFiles(filePaths) {
        this.isLoading = true;
        this.showLoading(true);
        
        const newSongs = [];
        let processed = 0;
        
        for (const filePath of filePaths) {
            try {
                const song = await this.createSongFromPath(filePath);
                if (song) {
                    newSongs.push(song);
                }
                
                processed++;
                // 更新进度
                if (processed % 10 === 0 || processed === filePaths.length) {
                    console.log(`处理进度: ${processed}/${filePaths.length}`);
                }
            } catch (error) {
                console.error(`处理文件失败: ${filePath}`, error);
            }
        }
        
        if (newSongs.length > 0) {
            const addedCount = storage.addToLibrary(newSongs);
            this.songs = storage.getLibrary();
            this.updateStatistics();
            this.updateViews();
            
            Utils.showNotification(`成功添加 ${addedCount} 首歌曲`, 'success');
        } else {
            Utils.showNotification('没有新歌曲被添加', 'info');
        }
        
        this.isLoading = false;
        this.showLoading(false);
    }
    
    async createSongFromPath(filePath) {
        try {
            const filename = Utils.getFileName(filePath);
            const extension = Utils.getFileExtension(filename);
            
            if (!Utils.isAudioFile(filename)) {
                return null;
            }
            
            // 从文件名解析基本信息作为后备
            const parsed = Utils.parseFilename(filename);
            
            // 获取文件统计信息
            let fileStats = { size: 0, mtime: new Date() };
            if (window.electronAPI) {
                try {
                    const stats = await window.electronAPI.getFileStats(filePath);
                    if (stats.exists) {
                        fileStats = stats;
                    }
                } catch (error) {
                    console.error('获取文件统计失败:', filePath, error);
                }
            }
            
            // 读取音乐文件的 ID3 标签和元数据
            let metadata = null;
            if (window.electronAPI) {
                try {
                    const result = await window.electronAPI.readMusicMetadata(filePath);
                    if (result.success) {
                        metadata = result.metadata;
                    } else {
                        console.warn('读取元数据失败:', filePath, result.error);
                    }
                } catch (error) {
                    console.error('读取元数据异常:', filePath, error);
                }
            }
            
            // 创建歌曲对象，优先使用元数据，其次使用文件名解析，最后使用默认值
            const song = {
                id: Utils.generateId(),
                path: filePath,
                title: metadata?.title || parsed.title || filename.replace(/\.[^/.]+$/, ''),
                artist: metadata?.artist || parsed.artist || '未知艺术家',
                album: metadata?.album || '未知专辑',
                albumArtist: metadata?.albumartist || metadata?.artist || parsed.artist || '未知艺术家',
                year: metadata?.year || null,
                genre: metadata?.genre || '未知',
                track: metadata?.track || null,
                trackTotal: metadata?.trackTotal || null,
                disc: metadata?.disc || null,
                discTotal: metadata?.discTotal || null,
                duration: metadata?.duration || 0,
                bitrate: metadata?.bitrate || null,
                sampleRate: metadata?.sampleRate || null,
                codec: metadata?.codec || null,
                container: metadata?.container || null,
                fileSize: fileStats.size,
                format: extension.toUpperCase(),
                dateAdded: Date.now(),
                dateModified: fileStats.mtime ? new Date(fileStats.mtime).getTime() : Date.now(),
                playCount: 0,
                lastPlayed: null,
                rating: 0,
                lyrics: metadata?.lyrics || null,
                comment: metadata?.comment || null,
                composer: metadata?.composer || null
            };
            
            return song;
        } catch (error) {
            console.error(`创建歌曲对象失败: ${filePath}`, error);
            return null;
        }
    }
    
    updateStatistics() {
        // 清空统计数据
        this.artists.clear();
        this.albums.clear();
        this.genres.clear();
        
        // 重新统计
        this.songs.forEach(song => {
            // 艺术家统计
            if (!this.artists.has(song.artist)) {
                this.artists.set(song.artist, {
                    name: song.artist,
                    songs: [],
                    albumCount: 0,
                    totalDuration: 0
                });
            }
            const artist = this.artists.get(song.artist);
            artist.songs.push(song);
            artist.totalDuration += song.duration || 0;
            
            // 专辑统计
            const albumKey = `${song.artist} - ${song.album}`;
            if (!this.albums.has(albumKey)) {
                this.albums.set(albumKey, {
                    title: song.album,
                    artist: song.artist,
                    year: song.year,
                    songs: [],
                    totalDuration: 0
                });
            }
            const album = this.albums.get(albumKey);
            album.songs.push(song);
            album.totalDuration += song.duration || 0;
            
            // 流派统计
            if (!this.genres.has(song.genre)) {
                this.genres.set(song.genre, {
                    name: song.genre,
                    songs: [],
                    artistCount: new Set(),
                    totalDuration: 0
                });
            }
            const genre = this.genres.get(song.genre);
            genre.songs.push(song);
            genre.artistCount.add(song.artist);
            genre.totalDuration += song.duration || 0;
        });
        
        // 更新专辑数量
        this.artists.forEach(artist => {
            const albums = new Set();
            artist.songs.forEach(song => albums.add(song.album));
            artist.albumCount = albums.size;
        });
    }
    
    updateViews() {
        this.updateLibraryView();
        this.updateArtistsView();
        this.updateAlbumsView();
        this.updateGenresView();
        this.updateFavoritesView();
    }
    
    updateLibraryView() {
        const container = document.getElementById('music-list');
        if (!container) return;
        
        if (this.songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <h3>音乐库为空</h3>
                    <p>点击"导入文件"或"导入文件夹"来添加音乐</p>
                </div>
            `;
            return;
        }
        
        const html = this.songs.map((song, index) => `
            <div class="music-item" data-path="${song.path}" data-index="${index}">
                <div class="music-item-index">${index + 1}</div>
                <div class="music-item-info">
                    <div class="music-item-title">${song.title}</div>
                    <div class="music-item-artist">${song.artist}</div>
                </div>
                <div class="music-item-album">${song.album}</div>
                <div class="music-item-duration">${Utils.formatTime(song.duration)}</div>
                <div class="music-item-actions">
                    <button class="btn btn-icon more-btn" data-path="${song.path}" title="更多">⋯</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        this.bindMusicItemEvents(container);
    }
    
    updateArtistsView() {
        const container = document.getElementById('artists-grid');
        if (!container) return;
        
        const artistsArray = Array.from(this.artists.values());
        
        if (artistsArray.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👤</div>
                    <h3>暂无艺术家</h3>
                    <p>导入音乐后这里会显示艺术家信息</p>
                </div>
            `;
            return;
        }
        
        const html = artistsArray.map(artist => `
            <div class="grid-item artist-item" data-artist="${artist.name}">
                <div class="grid-item-image">👤</div>
                <div class="grid-item-title">${artist.name}</div>
                <div class="grid-item-subtitle">${artist.songs.length} 首歌曲 · ${artist.albumCount} 个专辑</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        this.bindArtistEvents(container);
    }
    
    updateAlbumsView() {
        const container = document.getElementById('albums-grid');
        if (!container) return;
        
        const albumsArray = Array.from(this.albums.values());
        
        if (albumsArray.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💿</div>
                    <h3>暂无专辑</h3>
                    <p>导入音乐后这里会显示专辑信息</p>
                </div>
            `;
            return;
        }
        
        const html = albumsArray.map(album => `
            <div class="grid-item album-item" data-album="${album.title}" data-artist="${album.artist}">
                <div class="grid-item-image">
                    💿
                </div>
                <div class="grid-item-title">${album.title}</div>
                <div class="grid-item-subtitle">${album.artist} · ${album.songs.length} 首歌曲</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        this.bindAlbumEvents(container);
    }
    
    updateGenresView() {
        const container = document.getElementById('genres-grid');
        if (!container) return;
        
        const genresArray = Array.from(this.genres.values());
        
        if (genresArray.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎭</div>
                    <h3>暂无流派</h3>
                    <p>导入音乐后这里会显示流派信息</p>
                </div>
            `;
            return;
        }
        
        const html = genresArray.map(genre => `
            <div class="grid-item genre-item" data-genre="${genre.name}">
                <div class="grid-item-image">${Utils.getGenreIcon(genre.name)}</div>
                <div class="grid-item-title">${genre.name}</div>
                <div class="grid-item-subtitle">${genre.songs.length} 首歌曲 · ${genre.artistCount.size} 位艺术家</div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        this.bindGenreEvents(container);
    }
    
    updateFavoritesView() {
        const container = document.getElementById('favorites-list');
        if (!container) return;
        
        const favorites = storage.getFavorites();
        const favoriteSongs = this.songs.filter(song => favorites.includes(song.path));
        
        if (favoriteSongs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><img src="public/heart.fill.png" alt="收藏"></div>
                    <h3>暂无收藏</h3>
                    <p>点击歌曲旁边的心形图标来收藏喜欢的歌曲</p>
                </div>
            `;
            return;
        }
        
        const html = favoriteSongs.map((song, index) => `
            <div class="music-item" data-path="${song.path}" data-index="${index}">
                <div class="music-item-index">${index + 1}</div>
                <div class="music-item-info">
                    <div class="music-item-title">${song.title}</div>
                    <div class="music-item-artist">${song.artist}</div>
                </div>
                <div class="music-item-album">${song.album}</div>
                <div class="music-item-duration">${Utils.formatTime(song.duration)}</div>
                <div class="music-item-actions">
                    <button class="btn btn-icon more-btn" data-path="${song.path}" title="更多">⋯</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        this.bindMusicItemEvents(container);
    }
    
    bindMusicItemEvents(container) {
        // 双击播放
        container.querySelectorAll('.music-item').forEach(item => {
            item.addEventListener('dblclick', (e) => {
                const path = e.currentTarget.dataset.path;
                const index = parseInt(e.currentTarget.dataset.index);
                window.player?.playByPath(path, this.songs, index);
            });
        });
        
        // 右键菜单
        container.querySelectorAll('.music-item').forEach(item => {
            item.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                window.ui?.showContextMenu(e, item.dataset.path);
            });
        });
    }
    
    bindArtistEvents(container) {
        container.querySelectorAll('.artist-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const artistName = e.currentTarget.dataset.artist;
                this.filterByArtist(artistName);
            });
        });
    }
    
    bindAlbumEvents(container) {
        container.querySelectorAll('.album-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const albumTitle = e.currentTarget.dataset.album;
                const artistName = e.currentTarget.dataset.artist;
                this.filterByAlbum(albumTitle, artistName);
            });
        });
    }
    
    bindGenreEvents(container) {
        container.querySelectorAll('.genre-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const genreName = e.currentTarget.dataset.genre;
                this.filterByGenre(genreName);
            });
        });
    }
    
    // 搜索功能
    search(query) {
        if (!query.trim()) {
            this.updateLibraryView();
            return;
        }
        
        storage.addToSearchHistory(query);
        
        const results = this.songs.filter(song => {
            return Utils.SearchUtils.fuzzyMatch(query, song.title) ||
                   Utils.SearchUtils.fuzzyMatch(query, song.artist) ||
                   Utils.SearchUtils.fuzzyMatch(query, song.album) ||
                   Utils.SearchUtils.fuzzyMatch(query, song.genre);
        });
        
        this.displaySearchResults(results, query);
    }
    
    displaySearchResults(results, query) {
        const container = document.getElementById('music-list');
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>没有找到结果</h3>
                    <p>尝试使用不同的关键词搜索</p>
                </div>
            `;
            return;
        }
        
        const html = results.map((song, index) => `
            <div class="music-item" data-path="${song.path}" data-index="${index}">
                <div class="music-item-index">${index + 1}</div>
                <div class="music-item-info">
                    <div class="music-item-title">${Utils.SearchUtils.highlightMatch(song.title, query)}</div>
                    <div class="music-item-artist">${Utils.SearchUtils.highlightMatch(song.artist, query)}</div>
                </div>
                <div class="music-item-album">${Utils.SearchUtils.highlightMatch(song.album, query)}</div>
                <div class="music-item-duration">${Utils.formatTime(song.duration)}</div>
                <div class="music-item-actions">
                    <button class="btn btn-icon more-btn" data-path="${song.path}" title="更多">⋯</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        this.bindMusicItemEvents(container);
    }
    
    // 排序功能
    sortLibrary(sortBy) {
        let sortedSongs = [...this.songs];
        
        switch (sortBy) {
            case 'title':
                sortedSongs.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'artist':
                sortedSongs.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
                break;
            case 'album':
                sortedSongs.sort((a, b) => a.album.localeCompare(b.album) || (a.track - b.track));
                break;
            case 'duration':
                sortedSongs.sort((a, b) => (b.duration || 0) - (a.duration || 0));
                break;
            case 'dateAdded':
                sortedSongs.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
                break;
            default:
                break;
        }
        
        this.songs = sortedSongs;
        this.updateLibraryView();
    }
    
    // 过滤功能
    filterByArtist(artistName) {
        const filteredSongs = this.songs.filter(song => song.artist === artistName);
        this.displayFilteredResults(filteredSongs, `艺术家: ${artistName}`);
    }
    
    filterByAlbum(albumTitle, artistName) {
        const filteredSongs = this.songs.filter(song => 
            song.album === albumTitle && song.artist === artistName
        );
        this.displayFilteredResults(filteredSongs, `专辑: ${albumTitle} - ${artistName}`);
    }
    
    filterByGenre(genreName) {
        const filteredSongs = this.songs.filter(song => song.genre === genreName);
        this.displayFilteredResults(filteredSongs, `流派: ${genreName}`);
    }
    
    displayFilteredResults(songs, filterTitle) {
        // 切换到音乐库视图
        window.ui?.switchView('library');
        
        // 更新视图标题
        const viewHeader = document.querySelector('#library-view .view-header h2');
        if (viewHeader) {
            viewHeader.textContent = filterTitle;
        }
        
        // 显示过滤结果
        const container = document.getElementById('music-list');
        if (!container) return;
        
        if (songs.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🎵</div>
                    <h3>没有找到歌曲</h3>
                    <p>当前筛选条件下没有歌曲</p>
                </div>
            `;
            return;
        }
        
        const html = songs.map((song, index) => `
            <div class="music-item" data-path="${song.path}" data-index="${index}">
                <div class="music-item-index">${index + 1}</div>
                <div class="music-item-info">
                    <div class="music-item-title">${song.title}</div>
                    <div class="music-item-artist">${song.artist}</div>
                </div>
                <div class="music-item-album">${song.album}</div>
                <div class="music-item-duration">${Utils.formatTime(song.duration)}</div>
                <div class="music-item-actions">
                    <button class="btn btn-icon more-btn" data-path="${song.path}" title="更多">⋯</button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        this.bindMusicItemEvents(container);
    }
    
    showLoading(show) {
        const container = document.getElementById('music-list');
        if (!container) return;
        
        if (show) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="loading-spinner"></div>
                    <h3>正在处理音乐文件...</h3>
                    <p>请稍候</p>
                </div>
            `;
        }
    }
    
    // 获取歌曲信息
    getSongByPath(path) {
        return this.songs.find(song => song.path === path);
    }
    
    // 获取所有歌曲
    getAllSongs() {
        return this.songs;
    }
    
    // 获取艺术家信息
    getArtist(name) {
        return this.artists.get(name);
    }
    
    // 获取专辑信息
    getAlbum(title, artist) {
        return this.albums.get(`${artist} - ${title}`);
    }
    
    // 获取流派信息
    getGenre(name) {
        return this.genres.get(name);
    }
}

// 创建全局音乐库实例
window.musicLibrary = new MusicLibrary();