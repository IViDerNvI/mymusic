@echo off
echo 🎵 MyMusic 启动脚本
echo ==================

REM 检查 Node.js 是否已安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装
    echo.
    echo 请先安装 Node.js:
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装 LTS 版本
    echo 3. 重新运行此脚本
    pause
    exit /b 1
) else (
    for /f %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js 已安装: %NODE_VERSION%
)

REM 检查 npm 是否已安装
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm 未安装
    pause
    exit /b 1
) else (
    for /f %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm 已安装: %NPM_VERSION%
)

echo.
echo 检查依赖...

REM 检查 node_modules 文件夹是否存在
if not exist "node_modules" (
    echo 需要安装依赖
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    ) else (
        echo ✅ 依赖安装成功
    )
) else (
    echo ✅ 依赖已存在
)

echo.
echo 🚀 启动 MyMusic...
npm start

pause