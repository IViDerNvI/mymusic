# MyMusic 自定义协议使用指南

## 概述

MyMusic 支持自定义协议 `mymusic://`，允许通过URL格式打开和播放特定音乐。这个功能特别适用于：

- 从外部应用程序或网页启动音乐播放
- 创建音乐分享链接
- 制作快捷方式或书签
- 集成到其他应用程序中

## 协议格式

### 基本格式
```
mymusic://play?title=歌曲名&artist=艺术家名
```

### 支持的参数

| 参数 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `title` | 字符串 | 是* | 歌曲标题 |
| `artist` | 字符串 | 否 | 艺术家名称 |
| `path` | 字符串 | 是* | 音乐文件的完整路径 |

*注意：`title` 和 `path` 至少需要提供一个

## 使用示例

### 1. 通过标题和艺术家播放
```
mymusic://play?title=Yesterday&artist=The Beatles
```

### 2. 仅通过标题播放
```
mymusic://play?title=Bohemian Rhapsody
```

### 3. 通过文件路径播放
```
mymusic://play?path=/Users/username/Music/song.mp3
```

### 4. 中文歌曲支持
```
mymusic://play?title=夜曲&artist=周杰伦
```

## 功能特性

### 自动搜索和匹配
- 当提供 `title` 和 `artist` 时，MyMusic 会在音乐库中搜索最匹配的歌曲
- 支持模糊匹配，即使标题或艺术家名称不完全一致也能找到
- 优先匹配完全相同的歌曲，然后是部分匹配

### URL编码支持
- 自动处理URL编码的中文和特殊字符
- 支持空格和特殊符号

### 错误处理
- 如果找不到匹配的歌曲，会显示友好的错误提示
- 无效的协议格式会被捕获并提示用户

## 在应用中使用分享功能

### 分享按钮
1. 播放任意歌曲
2. 点击播放器控制栏中的分享按钮（🔗）
3. 分享链接会自动复制到剪贴板
4. 同时会显示分享对话框，方便查看和再次复制

### 分享链接格式
应用会根据当前播放歌曲的信息自动生成最适合的分享链接：

- 如果歌曲有完整的标题和艺术家信息，使用：
  ```
  mymusic://play?title=歌曲名&artist=艺术家名
  ```

- 如果只有标题信息，使用：
  ```
  mymusic://play?title=歌曲名
  ```

- 如果没有标题信息，使用文件路径：
  ```
  mymusic://play?path=完整文件路径
  ```

## 系统集成

### macOS
在 macOS 上，可以使用以下命令测试协议：
```bash
open "mymusic://play?title=歌曲名&artist=艺术家名"
```

### Windows
在 Windows 上，可以在运行对话框或命令提示符中输入：
```cmd
start mymusic://play?title=歌曲名&artist=艺术家名
```

### Linux
在 Linux 上，使用：
```bash
xdg-open "mymusic://play?title=歌曲名&artist=艺术家名"
```

## 开发集成

### HTML 中使用
```html
<a href="mymusic://play?title=Yesterday&artist=The Beatles">
    在 MyMusic 中播放 Yesterday
</a>
```

### JavaScript 中使用
```javascript
// 打开 MyMusic 播放指定歌曲
window.location.href = "mymusic://play?title=歌曲名&artist=艺术家名";

// 或者使用
window.open("mymusic://play?title=歌曲名&artist=艺术家名");
```

## 安全注意事项

1. **文件路径验证**：使用 `path` 参数时，确保路径指向合法的音频文件
2. **URL编码**：包含特殊字符的参数需要进行URL编码
3. **用户确认**：在生产环境中，考虑添加用户确认机制

## 故障排除

### 协议未注册
如果点击链接没有反应，可能是协议未正确注册：
1. 重新安装 MyMusic 应用
2. 确保应用具有必要的系统权限
3. 在某些系统上，可能需要手动设置默认程序

### 找不到歌曲
如果协议正常打开但找不到歌曲：
1. 确保歌曲已添加到 MyMusic 音乐库中
2. 检查歌曲的元数据信息是否正确
3. 尝试使用更精确的搜索参数

### 中文字符问题
如果中文歌曲名称无法识别：
1. 确保使用 UTF-8 编码
2. 检查 URL 编码是否正确
3. 验证歌曲文件的元数据编码

## 更新日志

- **v0.1.4**: 初始协议支持，支持基本的 play 操作
- 后续版本将支持更多操作，如播放列表管理、搜索等