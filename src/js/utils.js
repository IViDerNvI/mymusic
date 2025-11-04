// 工具函数

// 格式化时间（秒转换为分:秒）
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 随机打乱数组
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 检查音频文件格式
function isAudioFile(filename) {
    const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.wma'];
    const ext = filename.toLowerCase().split('.').pop();
    return audioExtensions.includes('.' + ext);
}

// 获取文件扩展名
function getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
}

// 从路径获取文件名
function getFileName(filepath) {
    return filepath.split('/').pop() || filepath.split('\\').pop();
}

// 从文件名获取艺术家和标题
function parseFilename(filename) {
    // 移除文件扩展名
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    
    // 常见的分隔符：- _ |
    const separators = [' - ', ' _ ', ' | ', '-', '_', '|'];
    
    for (const sep of separators) {
        if (nameWithoutExt.includes(sep)) {
            const parts = nameWithoutExt.split(sep);
            if (parts.length >= 2) {
                return {
                    artist: parts[0].trim(),
                    title: parts.slice(1).join(' ').trim()
                };
            }
        }
    }
    
    // 如果没有找到分隔符，整个文件名作为标题
    return {
        artist: '未知艺术家',
        title: nameWithoutExt.trim()
    };
}

// 创建专辑封面占位符
function createAlbumArtPlaceholder(title) {
    return title.charAt(0).toUpperCase();
}

// 创建安全的专辑封面 HTML
function createAlbumArtHTML(song, size = 'medium') {
    if (song.albumArt) {
        return `<img src="${song.albumArt}" alt="${song.album}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="album-art-placeholder" style="display: none;">
                    ${createAlbumArtPlaceholder(song.title || song.album)}
                </div>`;
    } else {
        return `<div class="album-art-placeholder">
                    ${createAlbumArtPlaceholder(song.title || song.album)}
                </div>`;
    }
}

// 获取音乐流派的图标
function getGenreIcon(genre) {
    const icons = {
        'pop': '🎵',
        'rock': '🎸',
        'jazz': '🎺',
        'classical': '🎼',
        'electronic': '🎛️',
        'folk': '🪕',
        'blues': '🎷',
        'country': '🤠',
        'rap': '🎤',
        'metal': '⚡',
        'reggae': '🌴',
        'punk': '💀',
        'rnb': '💫',
        'soul': '💝',
        'funk': '🕺',
        'disco': '🪩',
        'indie': '🌈',
        'alternative': '🔮',
        'ambient': '🌌',
        'techno': '🔊'
    };
    
    const normalizedGenre = genre.toLowerCase();
    return icons[normalizedGenre] || '🎵';
}

// 显示通知
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-secondary); cursor: pointer; font-size: 18px; margin-left: 10px;">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => notification.classList.add('show'), 100);
    
    // 自动移除
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// 自定义输入对话框 (替代 prompt)
function showInputDialog(title, placeholder = '', defaultValue = '') {
    return new Promise((resolve) => {
        // 创建模态背景
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // 创建对话框
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-title">${title}</div>
            <input type="text" class="modal-input" placeholder="${placeholder}" value="${defaultValue}" id="modal-input">
            <div class="modal-buttons">
                <button class="modal-btn modal-btn-secondary" id="modal-cancel">取消</button>
                <button class="modal-btn modal-btn-primary" id="modal-ok">确定</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 获取元素
        const input = modal.querySelector('#modal-input');
        const cancelBtn = modal.querySelector('#modal-cancel');
        const okBtn = modal.querySelector('#modal-ok');
        
        // 关闭对话框的函数
        const closeDialog = (result = null) => {
            if (overlay.classList.contains('show')) {
                overlay.classList.remove('show');
            }
            setTimeout(() => {
                try {
                    if (overlay.parentNode === document.body) {
                        document.body.removeChild(overlay);
                    }
                } catch (error) {
                    console.warn('对话框移除失败:', error);
                }
                resolve(result);
            }, 300);
        };
        
        // 绑定事件
        cancelBtn.addEventListener('click', () => closeDialog(null));
        okBtn.addEventListener('click', () => {
            const value = input.value.trim();
            closeDialog(value || null);
        });
        
        // 键盘事件
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = input.value.trim();
                closeDialog(value || null);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeDialog(null);
            }
        });
        
        // 点击背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog(null);
            }
        });
        
        // 显示对话框
        setTimeout(() => {
            overlay.classList.add('show');
            input.focus();
            input.select();
        }, 50);
    });
}

// 自定义确认对话框 (替代 confirm)
function showConfirmDialog(title, message, confirmText = '确定', cancelText = '取消') {
    return new Promise((resolve) => {
        // 创建模态背景
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // 创建对话框
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-title">${title}</div>
            <div style="margin-bottom: 20px; color: var(--text-secondary); line-height: 1.5;">${message}</div>
            <div class="modal-buttons">
                <button class="modal-btn modal-btn-secondary" id="modal-cancel">${cancelText}</button>
                <button class="modal-btn modal-btn-primary" id="modal-confirm">${confirmText}</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 获取元素
        const cancelBtn = modal.querySelector('#modal-cancel');
        const confirmBtn = modal.querySelector('#modal-confirm');
        
        // 关闭对话框的函数
        const closeDialog = (result = false) => {
            if (overlay.classList.contains('show')) {
                overlay.classList.remove('show');
            }
            setTimeout(() => {
                try {
                    if (overlay.parentNode === document.body) {
                        document.body.removeChild(overlay);
                    }
                } catch (error) {
                    console.warn('对话框移除失败:', error);
                }
                resolve(result);
            }, 300);
        };
        
        // 绑定事件
        cancelBtn.addEventListener('click', () => closeDialog(false));
        confirmBtn.addEventListener('click', () => closeDialog(true));
        
        // 键盘事件
        document.addEventListener('keydown', function keyHandler(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                closeDialog(true);
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeDialog(false);
                document.removeEventListener('keydown', keyHandler);
            }
        });
        
        // 点击背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog(false);
            }
        });
        
        // 显示对话框
        setTimeout(() => {
            overlay.classList.add('show');
            confirmBtn.focus();
        }, 50);
    });
}

// 自定义选择对话框 (用于播放列表选择)
function showSelectDialog(title, options, message = '') {
    return new Promise((resolve) => {
        // 创建模态背景
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        // 创建对话框
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.minWidth = '400px';
        
        // 构建选项HTML
        const optionsHtml = options.map((option, index) => `
            <div class="modal-option" data-index="${index}">
                <input type="radio" name="modal-select" id="option-${index}" value="${index}">
                <label for="option-${index}">${option}</label>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="modal-title">${title}</div>
            ${message ? `<div style="margin-bottom: 16px; color: var(--text-secondary);">${message}</div>` : ''}
            <div class="modal-options">
                ${optionsHtml}
            </div>
            <div class="modal-buttons" style="margin-top: 20px;">
                <button class="modal-btn modal-btn-secondary" id="modal-cancel">取消</button>
                <button class="modal-btn modal-btn-primary" id="modal-select-confirm">确定</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // 获取元素
        const cancelBtn = modal.querySelector('#modal-cancel');
        const confirmBtn = modal.querySelector('#modal-select-confirm');
        const optionElements = modal.querySelectorAll('.modal-option');
        
        let selectedIndex = -1;
        
        // 关闭对话框的函数
        const closeDialog = (result = null) => {
            if (overlay.classList.contains('show')) {
                overlay.classList.remove('show');
            }
            setTimeout(() => {
                try {
                    if (overlay.parentNode === document.body) {
                        document.body.removeChild(overlay);
                    }
                } catch (error) {
                    console.warn('对话框移除失败:', error);
                }
                resolve(result);
            }, 300);
        };
        
        // 绑定选项点击事件
        optionElements.forEach((element, index) => {
            const radio = element.querySelector('input[type="radio"]');
            element.addEventListener('click', () => {
                // 清除其他选中状态
                optionElements.forEach(el => el.classList.remove('selected'));
                // 设置当前选中
                element.classList.add('selected');
                radio.checked = true;
                selectedIndex = index;
            });
        });
        
        // 绑定按钮事件
        cancelBtn.addEventListener('click', () => closeDialog(null));
        confirmBtn.addEventListener('click', () => {
            if (selectedIndex >= 0) {
                closeDialog(selectedIndex);
            } else {
                // 如果没有选择，显示提示
                confirmBtn.textContent = '请选择一项';
                setTimeout(() => {
                    confirmBtn.textContent = '确定';
                }, 1500);
            }
        });
        
        // 键盘事件
        document.addEventListener('keydown', function keyHandler(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0) {
                    closeDialog(selectedIndex);
                }
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closeDialog(null);
                document.removeEventListener('keydown', keyHandler);
            }
        });
        
        // 点击背景关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog(null);
            }
        });
        
        // 显示对话框
        setTimeout(() => {
            overlay.classList.add('show');
        }, 50);
    });
}

// 创建加载状态
function createLoadingElement() {
    const loading = document.createElement('div');
    loading.className = 'loading-spinner';
    return loading;
}

// 颜色工具
const ColorUtils = {
    // 从字符串生成颜色
    stringToColor(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 70%, 50%)`;
    },
    
    // 获取对比色
    getContrastColor(hexColor) {
        // 移除 # 符号
        const hex = hexColor.replace('#', '');
        
        // 转换为 RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // 计算亮度
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        
        return brightness > 128 ? '#000000' : '#ffffff';
    }
};

// 搜索工具
const SearchUtils = {
    // 模糊搜索
    fuzzyMatch(searchTerm, text) {
        if (!searchTerm || !text) return false;
        
        const search = searchTerm.toLowerCase();
        const target = text.toLowerCase();
        
        // 完全匹配
        if (target.includes(search)) return true;
        
        // 模糊匹配
        let searchIndex = 0;
        for (let i = 0; i < target.length && searchIndex < search.length; i++) {
            if (target[i] === search[searchIndex]) {
                searchIndex++;
            }
        }
        
        return searchIndex === search.length;
    },
    
    // 高亮搜索词
    highlightMatch(text, searchTerm) {
        if (!searchTerm || !text) return text;
        
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }
};

// 键盘快捷键处理
class KeyboardShortcuts {
    constructor() {
        this.shortcuts = new Map();
        this.init();
    }
    
    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }
    
    register(key, callback, options = {}) {
        const keyString = this.normalizeKey(key, options);
        this.shortcuts.set(keyString, callback);
    }
    
    unregister(key, options = {}) {
        const keyString = this.normalizeKey(key, options);
        this.shortcuts.delete(keyString);
    }
    
    normalizeKey(key, options) {
        const parts = [];
        if (options.ctrl || options.meta) parts.push('ctrl');
        if (options.alt) parts.push('alt');
        if (options.shift) parts.push('shift');
        parts.push(key.toLowerCase());
        return parts.join('+');
    }
    
    handleKeyDown(event) {
        // 忽略输入框中的快捷键
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
            return;
        }
        
        const key = this.normalizeKey(event.key, {
            ctrl: event.ctrlKey || event.metaKey,
            alt: event.altKey,
            shift: event.shiftKey
        });
        
        const callback = this.shortcuts.get(key);
        if (callback) {
            event.preventDefault();
            callback(event);
        }
    }
}

// 全局键盘快捷键实例
const keyboardShortcuts = new KeyboardShortcuts();

// 音频分析工具（简单的可视化）
class AudioAnalyzer {
    constructor(audioElement) {
        this.audio = audioElement;
        this.context = null;
        this.analyzer = null;
        this.source = null;
        this.dataArray = null;
    }
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.analyzer = this.context.createAnalyser();
            this.source = this.context.createMediaElementSource(this.audio);
            
            this.analyzer.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyzer.frequencyBinCount);
            
            this.source.connect(this.analyzer);
            this.analyzer.connect(this.context.destination);
            
            return true;
        } catch (error) {
            console.error('音频分析器初始化失败:', error);
            return false;
        }
    }
    
    getFrequencyData() {
        if (!this.analyzer) return null;
        
        this.analyzer.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }
    
    getAverageFrequency() {
        const data = this.getFrequencyData();
        if (!data) return 0;
        
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i];
        }
        return sum / data.length;
    }
}

// 导出工具函数到全局作用域
window.Utils = {
    formatTime,
    formatFileSize,
    debounce,
    throttle,
    shuffleArray,
    generateId,
    isAudioFile,
    getFileExtension,
    getFileName,
    parseFilename,
    createAlbumArtPlaceholder,
    createAlbumArtHTML,
    getGenreIcon,
    showNotification,
    showInputDialog,
    showConfirmDialog,
    showSelectDialog,
    createLoadingElement,
    ColorUtils,
    SearchUtils,
    KeyboardShortcuts,
    AudioAnalyzer
};

// 导出键盘快捷键实例
window.keyboardShortcuts = keyboardShortcuts;