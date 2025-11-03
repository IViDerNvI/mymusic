const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false // 允许本地文件访问
    },
    icon: path.join(__dirname, 'assets/icons/app.png'),
    titleBarStyle: 'hiddenInset',
    show: false
  })

  mainWindow.loadFile('index.html')
  
  // 窗口准备完成后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 开发模式下打开开发者工具
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools()
  }
}

// 创建菜单
const createMenu = () => {
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '导入音乐文件',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-import-files')
          }
        },
        {
          label: '导入音乐文件夹',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => {
            mainWindow.webContents.send('menu-import-folder')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: '播放',
      submenu: [
        {
          label: '播放/暂停',
          accelerator: 'Space',
          click: () => {
            mainWindow.webContents.send('menu-toggle-play')
          }
        },
        {
          label: '上一曲',
          accelerator: 'Left',
          click: () => {
            mainWindow.webContents.send('menu-previous')
          }
        },
        {
          label: '下一曲',
          accelerator: 'Right',
          click: () => {
            mainWindow.webContents.send('menu-next')
          }
        }
      ]
    },
    {
      label: '视图',
      submenu: [
        {
          label: '切换全屏',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen())
          }
        },
        { type: 'separator' },
        {
          label: '开发者工具',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools()
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.whenReady().then(() => {
  createWindow()
  createMenu()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// IPC 处理器
ipcMain.handle('select-music-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      {
        name: '音频文件',
        extensions: ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'wma']
      }
    ]
  })
  return result
})

ipcMain.handle('select-music-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  return result
})

ipcMain.handle('read-music-files-from-folder', async (event, folderPath) => {
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.m4a', '.ogg', '.wma']
  const musicFiles = []

  const scanFolder = (dir) => {
    try {
      const files = fs.readdirSync(dir)
      files.forEach(file => {
        const fullPath = path.join(dir, file)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          scanFolder(fullPath) // 递归扫描子文件夹
        } else if (audioExtensions.includes(path.extname(file).toLowerCase())) {
          musicFiles.push(fullPath)
        }
      })
    } catch (error) {
      console.error('扫描文件夹错误:', error)
    }
  }

  scanFolder(folderPath)
  return musicFiles
})

ipcMain.handle('get-file-stats', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath)
    return {
      size: stats.size,
      mtime: stats.mtime,
      exists: true
    }
  } catch (error) {
    return { exists: false }
  }
})