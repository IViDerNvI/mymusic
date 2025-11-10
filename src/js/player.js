// 音乐播放器核心

class MusicPlayer {
    constructor() {
        this.audio = document.getElementById('audio-player');
        this.currentSong = null;
        this.playlist = [];
        this.currentIndex = -1;
        this.isPlaying = false;
        this.isShuffling = false;
        this.repeatMode = 'none'; // none, one, all
        this.volume = 0.5;
        this.currentTime = 0;
        this.duration = 0;
        this.crossfade = true;
        this.analyzer = null;
        this.effectProcessor = null;
        
        // 回调函数
        this.onSongChange = null;
        this.onTimeUpdate = null;
        
        this.init();
    }
    
    init() {
        this.setupAudioEvents();
        this.setupControls();
        this.loadSettings();
        this.bindKeyboardShortcuts();
        
        // 初始化音效处理器（优先级更高）
        this.effectProcessor = new Utils.AudioEffectProcessor(this.audio);
        this.effectProcessor.init();
        
        // 初始化音频分析器（如果需要的话）
        // 注意：为了避免冲突，暂时禁用AudioAnalyzer
        // this.analyzer = new Utils.AudioAnalyzer(this.audio);
        // this.analyzer.init();
        
        // 加载保存的音效设置
        this.loadEqualizerSettings();
    }
    
    setupAudioEvents() {
        this.audio.addEventListener('loadstart', () => {
            console.log('开始加载音频');
        });
        
        this.audio.addEventListener('canplay', () => {
            console.log('音频可以播放');
            this.duration = this.audio.duration || 0;
            this.updateDisplay();
        });
        
        this.audio.addEventListener('loadedmetadata', () => {
            this.duration = this.audio.duration || 0;
            this.updateDisplay();
        });
        
        this.audio.addEventListener('timeupdate', () => {
            this.currentTime = this.audio.currentTime;
            this.updateProgress();
            
            // 调用时间更新回调
            if (this.onTimeUpdate) {
                this.onTimeUpdate(this.currentTime);
            }
            
            // 同步歌词
            if (window.lyricsManager) {
                window.lyricsManager.syncLyrics(this.currentTime);
            }
            
            // 更新统计信息
            if (this.isPlaying && this.currentSong) {
                storage.addPlayTime(0.1); // 每次更新约0.1秒
            }
        });
        
        this.audio.addEventListener('ended', () => {
            console.log('播放结束');
            this.onSongEnded();
        });
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            this.updatePlayButton();
            this.updatePlaybackState();
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.updatePlayButton();
            this.updatePlaybackState();
        });
        
        this.audio.addEventListener('error', (e) => {
            console.error('音频播放错误:', e);
            Utils.showNotification('播放失败，可能是不支持的音频格式', 'error');
        });
        
        this.audio.addEventListener('volumechange', () => {
            this.volume = this.audio.volume;
            this.updateVolumeDisplay();
        });
    }
    
    setupControls() {
        // 播放/暂停按钮
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.togglePlay());
        }
        
        // 上一曲按钮
        const prevBtn = document.getElementById('prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }
        
        // 下一曲按钮
        const nextBtn = document.getElementById('next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        
        // 随机播放按钮
        const shuffleBtn = document.getElementById('shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.addEventListener('click', () => this.toggleShuffle());
        }
        
        // 重复播放按钮
        const repeatBtn = document.getElementById('repeat-btn');
        if (repeatBtn) {
            repeatBtn.addEventListener('click', () => this.toggleRepeat());
        }
        
        // 收藏按钮
        const favoriteBtn = document.getElementById('favorite-btn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleCurrentFavorite());
        }
        
        // 进度条
        this.setupProgressBar();
        
        // 音量控制
        this.setupVolumeControl();
        
        // 菜单事件
        if (window.electronAPI) {
            window.electronAPI.onMenuTogglePlay(() => this.togglePlay());
            window.electronAPI.onMenuPrevious(() => this.previous());
            window.electronAPI.onMenuNext(() => this.next());
        }
    }
    
    setupProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.getElementById('progress-fill');
        const progressHandle = document.getElementById('progress-handle');
        
        if (!progressBar || !progressFill || !progressHandle) return;
        
        let isDragging = false;
        
        const updateProgress = (event) => {
            const rect = progressBar.getBoundingClientRect();
            const percent = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
            const newTime = percent * this.duration;
            
            if (isDragging) {
                this.currentTime = newTime;
                this.updateProgressDisplay();
            } else {
                this.seek(newTime);
            }
        };
        
        progressBar.addEventListener('mousedown', (e) => {
            isDragging = true;
            updateProgress(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                updateProgress(e);
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.seek(this.currentTime);
            }
        });
        
        progressBar.addEventListener('click', updateProgress);
    }
    
    setupVolumeControl() {
        const volumeRange = document.getElementById('volume-range');
        const volumeBtn = document.getElementById('volume-btn');
        
        if (volumeRange) {
            volumeRange.addEventListener('input', (e) => {
                this.setVolume(e.target.value / 100);
            });
            
            // 设置初始值
            volumeRange.value = this.volume * 100;
        }
        
        if (volumeBtn) {
            volumeBtn.addEventListener('click', () => this.toggleMute());
        }
    }
    
    bindKeyboardShortcuts() {
        // 播放/暂停
        keyboardShortcuts.register('space', () => this.togglePlay());
        
        // 上一曲/下一曲
        keyboardShortcuts.register('arrowleft', () => this.previous());
        keyboardShortcuts.register('arrowright', () => this.next());
        
        // 音量控制
        keyboardShortcuts.register('arrowup', () => {
            const newVolume = Math.min(1, this.volume + 0.1);
            this.setVolume(newVolume);
        });
        
        keyboardShortcuts.register('arrowdown', () => {
            const newVolume = Math.max(0, this.volume - 0.1);
            this.setVolume(newVolume);
        });
        
        // 静音
        keyboardShortcuts.register('m', () => this.toggleMute());
        
        // 收藏
        keyboardShortcuts.register('f', () => this.toggleCurrentFavorite());
        
        // 随机播放
        keyboardShortcuts.register('s', () => this.toggleShuffle());
        
        // 重复播放
        keyboardShortcuts.register('r', () => this.toggleRepeat());
    }
    
    loadSettings() {
        const settings = storage.getSettings();
        this.volume = settings.volume || 0.5;
        this.isShuffling = settings.shuffle || false;
        this.repeatMode = settings.repeat || 'none';
        this.crossfade = settings.crossfade !== false;
        
        // 应用设置
        this.audio.volume = this.volume;
        this.updateShuffleButton();
        this.updateRepeatButton();
        this.updateVolumeDisplay();
        
        // 恢复播放状态
        const playbackState = storage.getPlaybackState();
        if (playbackState.currentSong) {
            this.currentSong = playbackState.currentSong;
            this.playlist = playbackState.queue || [];
            this.currentIndex = playbackState.currentIndex || -1;
            this.loadSong(this.currentSong, false);
            
            if (playbackState.currentTime > 0) {
                this.audio.currentTime = playbackState.currentTime;
            }
        }
    }
    
    saveSettings() {
        storage.updateSettings({
            volume: this.volume,
            shuffle: this.isShuffling,
            repeat: this.repeatMode,
            crossfade: this.crossfade
        });
        
        storage.updatePlaybackState({
            currentSong: this.currentSong,
            currentTime: this.currentTime,
            isPlaying: this.isPlaying,
            queue: this.playlist,
            currentIndex: this.currentIndex
        });
    }
    
    // 播放控制方法
    async play() {
        if (!this.currentSong) return false;
        
        try {
            await this.audio.play();
            
            // 在播放开始后激活音效处理器
            this.activateAudioEffects();
            
            return true;
        } catch (error) {
            console.error('播放失败:', error);
            Utils.showNotification('播放失败', 'error');
            return false;
        }
    }
    
    // 激活音效处理器
    activateAudioEffects() {
        if (this.effectProcessor && !this.effectProcessor.context) {
            console.log('激活音效处理器...');
            if (this.effectProcessor.ensureAudioContext()) {
                // 重新应用当前预设
                const currentPreset = this.effectProcessor.getCurrentPreset();
                if (currentPreset !== 'normal') {
                    this.effectProcessor.applyPreset(currentPreset);
                }
                console.log('音效处理器激活成功');
            }
        }
    }
    
    pause() {
        this.audio.pause();
    }
    
    async togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            if (this.currentSong) {
                await this.play();
            } else if (this.playlist.length > 0) {
                this.playByIndex(0);
            } else {
                // 如果没有播放列表，播放音乐库中的第一首歌
                const library = window.musicLibrary?.getAllSongs() || [];
                if (library.length > 0) {
                    this.playByPath(library[0].path, library, 0);
                } else {
                    Utils.showNotification('没有可播放的音乐', 'warning');
                }
            }
        }
    }
    
    async loadSong(song, autoPlay = false) {
        if (!song) return false;
        
        console.log('加载歌曲:', song.title);
        
        const previousSong = this.currentSong;
        this.currentSong = song;
        this.audio.src = `file://${song.path}`;
        
        // 更新显示信息
        this.updateDisplay();
        this.updateFavoriteButton();
        this.updateCurrentlyPlaying();
        
        // 触发歌曲切换回调
        if (this.onSongChange && previousSong !== song) {
            this.onSongChange(song);
        }
        
        // 更新统计信息
        if (autoPlay) {
            storage.incrementPlayCount(song.path);
        }
        
        if (autoPlay) {
            await this.play();
        }
        
        this.saveSettings();
        return true;
    }
    
    async playByPath(path, playlist = null, index = -1) {
        const song = window.musicLibrary?.getSongByPath(path);
        if (!song) {
            Utils.showNotification('找不到歌曲文件', 'error');
            return false;
        }
        
        if (playlist) {
            this.playlist = playlist;
            this.currentIndex = index;
        }
        
        return await this.loadSong(song, true);
    }
    
    async playByIndex(index) {
        if (index < 0 || index >= this.playlist.length) return false;
        
        const song = this.playlist[index];
        this.currentIndex = index;
        
        return await this.loadSong(song, true);
    }
    
    previous() {
        if (this.playlist.length === 0) return;
        
        if (this.repeatMode === 'one') {
            this.seek(0);
            this.play();
            return;
        }
        
        let newIndex;
        if (this.isShuffling) {
            newIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            newIndex = this.currentIndex - 1;
            if (newIndex < 0) {
                newIndex = this.repeatMode === 'all' ? this.playlist.length - 1 : 0;
            }
        }
        
        this.playByIndex(newIndex);
    }
    
    next() {
        if (this.playlist.length === 0) return;
        
        if (this.repeatMode === 'one') {
            this.seek(0);
            this.play();
            return;
        }
        
        let newIndex;
        if (this.isShuffling) {
            newIndex = Math.floor(Math.random() * this.playlist.length);
        } else {
            newIndex = this.currentIndex + 1;
            if (newIndex >= this.playlist.length) {
                if (this.repeatMode === 'all') {
                    newIndex = 0;
                } else {
                    this.pause();
                    return;
                }
            }
        }
        
        this.playByIndex(newIndex);
    }
    
    onSongEnded() {
        const settings = storage.getSettings();
        if (settings.autoPlayNext) {
            this.next();
        }
    }
    
    seek(time) {
        if (this.audio.duration) {
            this.audio.currentTime = Math.max(0, Math.min(time, this.audio.duration));
        }
    }
    
    // 别名方法，供歌词管理器使用
    seekTo(time) {
        this.seek(time);
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        this.audio.volume = this.volume;
        this.updateVolumeDisplay();
        storage.setSetting('volume', this.volume);
    }
    
    toggleMute() {
        if (this.audio.volume > 0) {
            this.previousVolume = this.audio.volume;
            this.setVolume(0);
        } else {
            this.setVolume(this.previousVolume || 0.5);
        }
    }
    
    toggleShuffle() {
        this.isShuffling = !this.isShuffling;
        this.updateShuffleButton();
        storage.setSetting('shuffle', this.isShuffling);
        
        Utils.showNotification(
            this.isShuffling ? '已开启随机播放' : '已关闭随机播放',
            'info'
        );
    }
    
    toggleRepeat() {
        const modes = ['none', 'one', 'all'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        this.updateRepeatButton();
        storage.setSetting('repeat', this.repeatMode);
        
        const messages = {
            'none': '已关闭重复播放',
            'one': '单曲循环',
            'all': '列表循环'
        };
        
        Utils.showNotification(messages[this.repeatMode], 'info');
    }
    
    toggleCurrentFavorite() {
        if (!this.currentSong) return;
        
        const result = storage.toggleFavorite(this.currentSong.path);
        this.updateFavoriteButton();
        
        if (result === 'added') {
            Utils.showNotification('已添加到收藏', 'success');
        } else if (result === 'removed') {
            Utils.showNotification('已从收藏中移除', 'info');
        }
        
        // 刷新收藏视图
        if (window.musicLibrary) {
            window.musicLibrary.updateFavoritesView();
        }
    }
    
    // 更新显示方法
    updateDisplay() {
        this.updateSongInfo();
        this.updateProgressDisplay();
    }
    
    updateSongInfo() {
        const titleElement = document.getElementById('current-title');
        const artistElement = document.getElementById('current-artist');
        
        if (this.currentSong) {
            if (titleElement) titleElement.textContent = this.currentSong.title;
            if (artistElement) artistElement.textContent = this.currentSong.artist;
            
            // 加载歌词
            this.loadSongLyrics();
        } else {
            if (titleElement) titleElement.textContent = '选择一首歌曲开始播放';
            if (artistElement) artistElement.textContent = '-';
            
            // 清空歌词
            if (window.lyricsManager) {
                window.lyricsManager.clearLyrics();
            }
        }
    }
    
    // 加载歌曲歌词
    async loadSongLyrics() {
        if (!window.lyricsManager || !this.currentSong) return;
        
        // 如果歌曲已有本地歌词，直接显示
        if (this.currentSong.lyrics) {
            await window.lyricsManager.loadLyrics(
                this.currentSong.lyrics, 
                this.currentSong.translatedLyrics
            );
        } else {
            // 清空当前歌词显示
            window.lyricsManager.clearLyrics();
        }
    }
    
    // 获取当前歌曲信息 (供歌词管理器使用)
    getCurrentSong() {
        return this.currentSong;
    }
    
    updateProgress() {
        this.updateProgressDisplay();
    }
    
    updateProgressDisplay() {
        const progressFill = document.getElementById('progress-fill');
        const progressHandle = document.getElementById('progress-handle');
        const currentTimeElement = document.querySelector('.current-time');
        const totalTimeElement = document.querySelector('.total-time');
        
        const progress = this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0;
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
        
        if (progressHandle) {
            progressHandle.style.left = `${progress}%`;
        }
        
        if (currentTimeElement) {
            currentTimeElement.textContent = Utils.formatTime(this.currentTime);
        }
        
        if (totalTimeElement) {
            totalTimeElement.textContent = Utils.formatTime(this.duration);
        }
    }
    
    updatePlayButton() {
        const playBtn = document.getElementById('play-btn');
        if (playBtn) {
            playBtn.innerHTML = this.isPlaying ? '⏸' : '▶';
            playBtn.title = this.isPlaying ? '暂停' : '播放';
        }
    }
    
    updateShuffleButton() {
        const shuffleBtn = document.getElementById('shuffle-btn');
        if (shuffleBtn) {
            shuffleBtn.classList.toggle('active', this.isShuffling);
            shuffleBtn.title = this.isShuffling ? '关闭随机播放' : '开启随机播放';
        }
    }
    
    updateRepeatButton() {
        const repeatBtn = document.getElementById('repeat-btn');
        if (repeatBtn) {
            repeatBtn.classList.remove('active');
            
            switch (this.repeatMode) {
                case 'one':
                    repeatBtn.innerHTML = '<img src="public/repeat.1.png" alt="单曲循环" title="单曲循环">';
                    repeatBtn.classList.add('active');
                    repeatBtn.title = '单曲循环';
                    break;
                case 'all':
                    repeatBtn.innerHTML = '<img src="public/repeat.png" alt="列表循环" title="列表循环">';
                    repeatBtn.classList.add('active');
                    repeatBtn.title = '列表循环';
                    break;
                default:
                    repeatBtn.innerHTML = '<img src="public/repeat.png" alt="循环" title="循环">';
                    repeatBtn.title = '开启循环播放';
                    break;
            }
        }
    }
    
    updateFavoriteButton() {
        const favoriteBtn = document.getElementById('favorite-btn');
        if (favoriteBtn && this.currentSong) {
            const isFavorite = storage.isFavorite(this.currentSong.path);
            favoriteBtn.classList.toggle('active', isFavorite);
            favoriteBtn.innerHTML = isFavorite ? '<img src="public/heart.fill.png" alt="收藏">' : '<img src="public/heart.png" alt="未收藏">';
            favoriteBtn.title = isFavorite ? '取消收藏' : '收藏';
        }
    }
    
    updateVolumeDisplay() {
        const volumeRange = document.getElementById('volume-range');
        const volumeBtn = document.getElementById('volume-btn');
        
        if (volumeRange) {
            volumeRange.value = this.volume * 100;
        }
        
        if (volumeBtn) {
            if (this.volume === 0) {
                volumeBtn.innerHTML = '<img src="public/bell.slash.png" alt="静音" title="静音">';
            } else {
                volumeBtn.innerHTML = '<img src="public/bell.png" alt="音量" title="音量">';
            }
        }
    }
    
    updateCurrentlyPlaying() {
        // 更新音乐列表中正在播放的标记
        const musicItems = document.querySelectorAll('.music-item');
        musicItems.forEach(item => {
            const isCurrentSong = this.currentSong && 
                                  item.dataset.path === this.currentSong.path;
            item.classList.toggle('playing', isCurrentSong);
        });
    }
    
    updatePlaybackState() {
        this.saveSettings();
    }
    
    // 播放队列管理
    setPlaylist(songs, startIndex = 0) {
        this.playlist = songs;
        this.currentIndex = startIndex;
        
        if (songs.length > 0 && startIndex < songs.length) {
            this.loadSong(songs[startIndex], true);
        }
    }
    
    addToQueue(songs) {
        const songsArray = Array.isArray(songs) ? songs : [songs];
        this.playlist.push(...songsArray);
        
        Utils.showNotification(`已添加 ${songsArray.length} 首歌曲到播放队列`, 'success');
    }
    
    clearQueue() {
        this.playlist = [];
        this.currentIndex = -1;
        Utils.showNotification('播放队列已清空', 'info');
    }
    
    // 获取播放状态信息
    getPlaybackInfo() {
        return {
            isPlaying: this.isPlaying,
            currentSong: this.currentSong,
            currentTime: this.currentTime,
            duration: this.duration,
            volume: this.volume,
            isShuffling: this.isShuffling,
            repeatMode: this.repeatMode,
            playlist: this.playlist,
            currentIndex: this.currentIndex
        };
    }
    
    // 音频频谱数据
    getFrequencyData() {
        if (this.analyzer) {
            return this.analyzer.getFrequencyData();
        }
        return null;
    }
    
    // 音效相关方法
    applyEqualizerPreset(presetName) {
        if (this.effectProcessor) {
            const success = this.effectProcessor.applyPreset(presetName);
            if (success) {
                // 保存设置
                storage.setSetting('equalizer', presetName);
                console.log(`已应用音效预设: ${presetName}`);
                return true;
            } else {
                // 如果应用失败，尝试激活音效处理器后重试
                console.log('音效应用失败，尝试激活音效处理器...');
                this.activateAudioEffects();
                
                // 短暂延迟后重试
                setTimeout(() => {
                    if (this.effectProcessor.applyPreset(presetName)) {
                        storage.setSetting('equalizer', presetName);
                        console.log(`重试成功，已应用音效预设: ${presetName}`);
                        
                        // 通知UI更新
                        const presetName_display = this.effectProcessor.getPresetName(presetName);
                        Utils.showNotification(`${presetName_display} 音效已生效`, 'success');
                    }
                }, 500);
                
                // 仍然保存设置，即使当前应用失败
                storage.setSetting('equalizer', presetName);
                return false;
            }
        }
        return false;
    }
    
    getCurrentEqualizerPreset() {
        if (this.effectProcessor) {
            return this.effectProcessor.getCurrentPreset();
        }
        return 'normal';
    }
    
    getEqualizerPresetName(presetKey) {
        if (this.effectProcessor) {
            return this.effectProcessor.getPresetName(presetKey);
        }
        return presetKey;
    }
    
    getAllEqualizerPresets() {
        if (this.effectProcessor) {
            return this.effectProcessor.getAllPresets();
        }
        return [];
    }
    
    loadEqualizerSettings() {
        const savedPreset = storage.getSetting('equalizer') || 'normal';
        if (this.effectProcessor) {
            // 检查浏览器支持
            if (this.checkAudioEffectSupport()) {
                this.effectProcessor.applyPreset(savedPreset);
            } else {
                console.warn('浏览器不支持Web Audio API，音效功能将被禁用');
            }
        }
    }
    
    checkAudioEffectSupport() {
        try {
            // 检查Web Audio API支持
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                return false;
            }
            
            // 检查必要的API
            const testContext = new AudioContextClass();
            const hasRequiredFeatures = 
                testContext.createMediaElementSource &&
                testContext.createBiquadFilter &&
                testContext.createGain;
            
            // 关闭测试用的AudioContext
            if (testContext.close) {
                testContext.close();
            }
            
            return hasRequiredFeatures;
        } catch (error) {
            console.warn('Audio effect support check failed:', error);
            return false;
        }
    }
}

// 创建全局播放器实例
window.player = new MusicPlayer();