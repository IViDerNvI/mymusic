// 歌词处理模块

class LyricsManager {
    constructor() {
        this.currentLyrics = null;
        this.currentTranslation = null;
        this.parsedLyrics = [];
        this.currentLineIndex = -1;
        this.isEnabled = true; // 始终启用
        this.showTranslation = false;
        this.autoSync = true; // 始终开启同步
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupUI();
    }
    
    bindEvents() {
        // 监听播放器时间更新
        if (window.player) {
            window.player.onTimeUpdate = (currentTime) => {
                if (this.autoSync) {
                    this.syncLyrics(currentTime);
                }
            };
            
            // 监听歌曲变化，自动搜索歌词
            window.player.onSongChange = (song) => {
                this.autoSearchLyricsForSong(song);
            };
        }
        
        // 监听播放器加载事件
        document.addEventListener('playerReady', () => {
            if (window.player) {
                window.player.onTimeUpdate = (currentTime) => {
                    if (this.autoSync) {
                        this.syncLyrics(currentTime);
                    }
                };
                
                window.player.onSongChange = (song) => {
                    this.autoSearchLyricsForSong(song);
                };
            }
        });
    }
    
    setupUI() {
        const lyricsPanel = document.getElementById('lyrics-panel');
        if (lyricsPanel) {
            // 添加控制按钮 - 只保留翻译切换按钮
            const controls = document.createElement('div');
            controls.className = 'lyrics-controls';
            controls.innerHTML = `
                <button class="btn btn-sm" id="translation-toggle" style="display: none;">
                    ${this.showTranslation ? '隐藏翻译' : '显示翻译'}
                </button>
            `;
            
            lyricsPanel.insertBefore(controls, lyricsPanel.firstChild);
            
            // 绑定控制事件
            document.getElementById('translation-toggle').addEventListener('click', () => {
                this.toggleTranslation();
            });
        }
    }
    
    // 解析LRC格式歌词
    parseLRC(lrcText) {
        const lines = lrcText.split('\n');
        const lyrics = [];
        
        lines.forEach(line => {
            const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
            if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                const milliseconds = parseInt(match[3].padEnd(3, '0'));
                const text = match[4].trim();
                
                const timeInSeconds = minutes * 60 + seconds + milliseconds / 1000;
                
                if (text) { // 只保存非空歌词
                    lyrics.push({
                        time: timeInSeconds,
                        text: text,
                        translated: null
                    });
                }
            }
        });
        
        // 按时间排序
        return lyrics.sort((a, b) => a.time - b.time);
    }
    
    // 解析翻译歌词并合并
    parseTranslation(translationText) {
        if (!translationText || !this.parsedLyrics.length) return;
        
        const translationLines = this.parseLRC(translationText);
        
        // 将翻译合并到原歌词中
        this.parsedLyrics.forEach(lyric => {
            const translation = translationLines.find(trans => 
                Math.abs(trans.time - lyric.time) < 0.5 // 允许0.5秒的时间差
            );
            if (translation) {
                lyric.translated = translation.text;
            }
        });
    }
    
    // 加载歌词
    async loadLyrics(lrcText, translationText = null) {
        try {
            if (!lrcText) {
                this.clearLyrics();
                return false;
            }
            
            this.currentLyrics = lrcText;
            this.currentTranslation = translationText;
            this.parsedLyrics = this.parseLRC(lrcText);
            
            if (translationText) {
                this.parseTranslation(translationText);
                document.getElementById('translation-toggle').style.display = 'inline-block';
            } else {
                document.getElementById('translation-toggle').style.display = 'none';
            }
            
            this.renderLyrics();
            this.currentLineIndex = -1;
            
            console.log('歌词加载成功，共', this.parsedLyrics.length, '行');
            return true;
        } catch (error) {
            console.error('加载歌词失败:', error);
            return false;
        }
    }
    
    // 渲染歌词到界面
    renderLyrics() {
        const lyricsContent = document.getElementById('lyrics-content');
        if (!lyricsContent) return;
        
        if (!this.parsedLyrics.length) {
            lyricsContent.innerHTML = '<div class="no-lyrics">暂无歌词</div>';
            return;
        }
        
        const html = this.parsedLyrics.map((lyric, index) => `
            <div class="lyric-line" data-index="${index}" data-time="${lyric.time}">
                <div class="lyric-text">${lyric.text}</div>
                ${lyric.translated && this.showTranslation ? 
                    `<div class="lyric-translation">${lyric.translated}</div>` : ''
                }
            </div>
        `).join('');
        
        lyricsContent.innerHTML = html;
        
        // 绑定点击跳转事件
        lyricsContent.querySelectorAll('.lyric-line').forEach(line => {
            line.addEventListener('click', () => {
                const time = parseFloat(line.dataset.time);
                if (window.player && window.player.seekTo) {
                    window.player.seekTo(time);
                }
            });
        });
    }
    
    // 同步歌词高亮
    syncLyrics(currentTime) {
        if (!this.parsedLyrics.length || !this.isEnabled) return;
        
        // 找到当前应该高亮的歌词行
        let activeIndex = -1;
        for (let i = 0; i < this.parsedLyrics.length; i++) {
            if (this.parsedLyrics[i].time <= currentTime) {
                activeIndex = i;
            } else {
                break;
            }
        }
        
        // 更新高亮
        if (activeIndex !== this.currentLineIndex) {
            this.currentLineIndex = activeIndex;
            this.updateHighlight();
        }
    }
    
    // 更新歌词高亮显示
    updateHighlight() {
        const lines = document.querySelectorAll('.lyric-line');
        
        // 获取之前的活跃行
        const prevActiveLine = document.querySelector('.lyric-line.active');
        
        // 清除所有高亮
        lines.forEach(line => {
            line.classList.remove('active', 'passed');
        });
        
        if (this.currentLineIndex >= 0 && this.currentLineIndex < lines.length) {
            const currentLine = lines[this.currentLineIndex];
            
            // 添加进入动画类
            currentLine.classList.add('lyric-entering');
            
            // 短暂延迟后添加活跃状态，创建动画效果
            setTimeout(() => {
                currentLine.classList.add('active');
                currentLine.classList.remove('lyric-entering');
            }, 50);
            
            // 标记已过的行
            for (let i = 0; i < this.currentLineIndex; i++) {
                lines[i].classList.add('passed');
            }
            
            // 滚动到当前行
            this.scrollToActiveLine();
        }
    }
    
    // 滚动到当前歌词行
    scrollToActiveLine() {
        const activeLine = document.querySelector('.lyric-line.active');
        const lyricsContent = document.getElementById('lyrics-content');
        
        if (activeLine && lyricsContent) {
            const containerHeight = lyricsContent.clientHeight;
            const lineTop = activeLine.offsetTop;
            const lineHeight = activeLine.clientHeight;
            const scrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2);
            
            lyricsContent.scrollTo({
                top: Math.max(0, scrollTop),
                behavior: 'smooth'
            });
        }
    }
    
    // 自动搜索指定歌曲的歌词
    async autoSearchLyricsForSong(song) {
        if (!song) return;
        
        // 如果歌曲已经有歌词，直接加载
        if (song.lyrics) {
            await this.loadLyrics(song.lyrics, song.translatedLyrics);
            return;
        }
        
        // 自动搜索歌词
        this.showSearchingIndicator(true);
        
        try {
            const result = await window.electronAPI.autoSearchLyrics(
                song.title || song.name,
                song.artist || ''
            );
            
            if (result.success && result.lyrics) {
                await this.loadLyrics(result.lyrics, result.translatedLyrics);
                
                // 保存歌词到本地歌曲对象
                song.lyrics = result.lyrics;
                if (result.translatedLyrics) {
                    song.translatedLyrics = result.translatedLyrics;
                }
                
                // 更新存储
                storage.updateSong(song.path, {
                    lyrics: result.lyrics,
                    translatedLyrics: result.translatedLyrics,
                    onlineSongInfo: result.songInfo
                });
                
                console.log('自动获取歌词成功:', song.title);
            } else {
                console.log('未找到歌词:', song.title);
                this.clearLyrics();
            }
        } catch (error) {
            console.error('自动搜索歌词失败:', error);
            this.clearLyrics();
        } finally {
            this.showSearchingIndicator(false);
        }
    }

    // 搜索当前歌曲的歌词
    async searchCurrentSongLyrics() {
        const currentSong = window.player?.getCurrentSong();
        if (!currentSong) {
            Utils.showNotification('没有正在播放的歌曲', 'warning');
            return;
        }
        
        this.showSearchingIndicator(true);
        
        try {
            const result = await window.electronAPI.autoSearchLyrics(
                currentSong.title, 
                currentSong.artist
            );
            
            if (result.success) {
                await this.loadLyrics(result.lyrics, result.translatedLyrics);
                
                // 保存歌词到本地歌曲对象
                currentSong.lyrics = result.lyrics;
                if (result.translatedLyrics) {
                    currentSong.translatedLyrics = result.translatedLyrics;
                }
                
                // 更新存储
                storage.updateSong(currentSong.path, {
                    lyrics: result.lyrics,
                    translatedLyrics: result.translatedLyrics,
                    onlineSongInfo: result.songInfo
                });
                
                Utils.showNotification('歌词获取成功', 'success');
            } else {
                Utils.showNotification(`获取歌词失败: ${result.error}`, 'error');
                this.clearLyrics();
            }
        } catch (error) {
            console.error('搜索歌词失败:', error);
            Utils.showNotification('搜索歌词时发生错误', error.message);
            console.log('搜索歌词失败:', error);
            this.clearLyrics();
        } finally {
            this.showSearchingIndicator(false);
        }
    }
    
    // 显示搜索指示器
    showSearchingIndicator(show) {
        const searchBtn = document.getElementById('lyrics-search');
        if (searchBtn) {
            if (show) {
                searchBtn.textContent = '搜索中...';
                searchBtn.disabled = true;
            } else {
                searchBtn.textContent = '搜索歌词';
                searchBtn.disabled = false;
            }
        }
        
        const lyricsContent = document.getElementById('lyrics-content');
        if (lyricsContent && show) {
            lyricsContent.innerHTML = '<div class="searching-lyrics">🔍 正在搜索歌词...</div>';
        }
    }
    
    // 清空歌词
    clearLyrics() {
        this.currentLyrics = null;
        this.currentTranslation = null;
        this.parsedLyrics = [];
        this.currentLineIndex = -1;
        
        const lyricsContent = document.getElementById('lyrics-content');
        if (lyricsContent) {
            lyricsContent.innerHTML = '<div class="no-lyrics">暂无歌词</div>';
        }
        
        document.getElementById('translation-toggle').style.display = 'none';
    }
    
    // 切换翻译显示
    toggleTranslation() {
        this.showTranslation = !this.showTranslation;
        const toggleBtn = document.getElementById('translation-toggle');
        
        if (toggleBtn) {
            toggleBtn.textContent = this.showTranslation ? '隐藏翻译' : '显示翻译';
        }
        
        this.renderLyrics();
        
        // 保存设置
        storage.updateSettings({ showLyricsTranslation: this.showTranslation });
    }
    
    // 从设置加载配置
    loadSettings() {
        const settings = storage.getSettings();
        // 歌词面板始终启用，自动同步始终开启
        this.isEnabled = true;
        this.showTranslation = settings.showLyricsTranslation === true;
        this.autoSync = true;
        
        // 歌词面板始终可见
        const lyricsPanel = document.getElementById('lyrics-panel');
        if (lyricsPanel) {
            lyricsPanel.style.display = 'block';
        }
    }
}

// 全局歌词管理器实例  
let globalLyricsManager = null;

// 确保在DOM加载后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保其他模块已加载
    setTimeout(() => {
        if (!globalLyricsManager && window.LyricsManager) {
            globalLyricsManager = new LyricsManager();
            window.lyricsManager = globalLyricsManager;
        }
    }, 100);
});

// 导出到全局作用域
window.LyricsManager = LyricsManager;