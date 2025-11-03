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
    getGenreIcon,
    showNotification,
    createLoadingElement,
    ColorUtils,
    SearchUtils,
    KeyboardShortcuts,
    AudioAnalyzer
};

// 导出键盘快捷键实例
window.keyboardShortcuts = keyboardShortcuts;