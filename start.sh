#!/bin/bash

# MyMusic 启动脚本
echo "🎵 MyMusic 启动脚本"
echo "=================="

# 检查 Node.js 是否已安装
check_node() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node --version)
        echo "✅ Node.js 已安装: $NODE_VERSION"
        return 0
    else
        echo "❌ Node.js 未安装"
        return 1
    fi
}

# 检查 npm 是否已安装
check_npm() {
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm --version)
        echo "✅ npm 已安装: $NPM_VERSION"
        return 0
    else
        echo "❌ npm 未安装"
        return 1
    fi
}

# 安装依赖
install_deps() {
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ 依赖安装成功"
        return 0
    else
        echo "❌ 依赖安装失败"
        return 1
    fi
}

# 启动应用
start_app() {
    echo "🚀 启动 MyMusic..."
    npm start
}

# 主函数
main() {
    echo "正在检查环境..."
    
    if ! check_node; then
        echo ""
        echo "请先安装 Node.js:"
        echo "1. 访问 https://nodejs.org/"
        echo "2. 下载并安装 LTS 版本"
        echo "3. 重新运行此脚本"
        exit 1
    fi
    
    if ! check_npm; then
        echo "npm 应该随 Node.js 一起安装，请检查安装"
        exit 1
    fi
    
    echo ""
    echo "检查依赖..."
    
    if [ ! -d "node_modules" ]; then
        echo "需要安装依赖"
        if ! install_deps; then
            exit 1
        fi
    else
        echo "✅ 依赖已存在"
    fi
    
    echo ""
    start_app
}

# 运行主函数
main