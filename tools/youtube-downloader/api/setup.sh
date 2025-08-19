#!/bin/bash

# YouTube Downloader API Setup Script

echo "🚀 YouTube Downloader API セットアップを開始します..."

# Node.js バージョンチェック
echo "📋 Node.js バージョンを確認中..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js がインストールされていません。"
    echo "   https://nodejs.org/ からダウンロードしてインストールしてください。"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js バージョン: $NODE_VERSION"

# npm バージョンチェック
NPM_VERSION=$(npm --version)
echo "✅ npm バージョン: $NPM_VERSION"

# APIディレクトリに移動
cd "$(dirname "$0")" || exit 1

echo "📦 依存関係をインストール中..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依存関係のインストールが完了しました"
else
    echo "❌ 依存関係のインストールに失敗しました"
    exit 1
fi

# 環境設定ファイルの確認
if [ ! -f ".env" ]; then
    echo "🔧 環境設定ファイルを作成中..."
    cp .env.example .env
    echo "✅ .env ファイルを作成しました（必要に応じて編集してください）"
fi

# 一時ディレクトリの作成
echo "📁 一時ディレクトリを作成中..."
mkdir -p temp
echo "✅ 一時ディレクトリを作成しました"

# ヘルスチェック
echo "🏥 サーバーヘルスチェック..."
npm run test 2>/dev/null || echo "⚠️  テストスクリプトが設定されていません"

echo ""
echo "🎉 セットアップが完了しました！"
echo ""
echo "📝 使用方法:"
echo "   開発モード: npm run dev"
echo "   本番モード: npm start"
echo "   ヘルスチェック: curl http://localhost:3001/api/health"
echo ""
echo "🌐 API エンドポイント:"
echo "   http://localhost:3001/api/health - ヘルスチェック"
echo "   http://localhost:3001/api/info/:videoId - 動画情報取得"
echo "   http://localhost:3001/api/download - ダウンロード処理"
echo ""
echo "🔗 フロントエンド:"
echo "   http://localhost:8080/tools/youtube-downloader-pro.html"
echo ""
echo "⚠️  注意: FFmpeg が必要です。未インストールの場合は以下を実行してください:"
echo "   macOS: brew install ffmpeg"
echo "   Ubuntu: sudo apt update && sudo apt install ffmpeg"
echo "   Windows: https://ffmpeg.org/download.html"
echo ""
