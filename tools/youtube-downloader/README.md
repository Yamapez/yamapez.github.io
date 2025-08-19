# YouTube Downloader Tool

本格的なYouTube動画・音声ダウンローダーツール

## 📁 プロジェクト構成

### フロントエンド
- **`youtube-downloader-pro.html`** - プロダクション版メインHTML（推奨）
- **`youtube-downloader-pro.css`** - プロダクション版スタイル
- **`youtube-downloader-pro.js`** - プロダクション版JavaScript（API統合）
- **`youtube-downloader.html`** - デモ版HTML（スタンドアロン）
- **`youtube-downloader.css`** - デモ版スタイル
- **`youtube-downloader.js`** - デモ版JavaScript（シミュレーション）
- **`youtube-downloader-clean.html`** - 分離版HTML
- **`youtube-downloader-integrated.html`** - 統合版HTML

### バックエンド API
- **`api/`** - Node.js + Express プロダクション用APIサーバー
  - `server.js` - メインサーバー
  - `routes/` - APIルート（download, info, health）
  - `package.json` - 依存関係
  - `.env` - 環境設定

## 🚀 使用方法

### プロダクション版（推奨）
1. APIサーバーを起動:
   ```bash
   cd api && npm install && npm start
   ```
2. ブラウザで `youtube-downloader-pro.html` を開く
3. YouTubeのURLを入力してダウンロード実行

### デモ版（スタンドアロン）
1. ブラウザで `youtube-downloader.html` を開く
2. デモ機能でダウンロードをシミュレーション

## ✨ 主要機能

- **動画ダウンロード**: MP4形式での高品質動画ダウンロード
- **音声抽出**: MP3形式での音声ファイル抽出
- **リアルタイムプレビュー**: 動画情報の即座表示
- **品質選択**: 利用可能な品質オプション
- **プログレス表示**: ダウンロード進行状況の表示
- **セキュリティ**: レート制限、CORS対応

## 🛠 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **バックエンド**: Node.js, Express, ytdl-core, FFmpeg
- **セキュリティ**: Helmet, CORS, Rate Limiting

## 📋 動作要件

- Node.js 18+
- FFmpeg
- 対応ブラウザ: Chrome, Firefox, Safari, Edge

---
作成日: 2025年8月19日
