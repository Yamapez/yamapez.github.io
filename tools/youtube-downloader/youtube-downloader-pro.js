/**
 * YouTube Downloader Tool - Production JavaScript
 * Real API integration with server-side processing
 */

class YouTubeDownloaderPro {
    constructor() {
        this.apiBaseUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001/api' 
            : '/api';
        
        this.form = document.getElementById('downloadForm');
        this.urlInput = document.getElementById('youtube-url');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.btnText = document.getElementById('btnText');
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultContainer = document.getElementById('resultContainer');
        this.resultMessage = document.getElementById('resultMessage');
        this.qualitySelect = document.getElementById('quality');
        
        this.isProcessing = false;
        this.downloadHistory = [];
        this.currentVideoInfo = null;
        this.abortController = null;
        
        this.initializeEventListeners();
        this.initializeUI();
        this.checkServerStatus();
    }

    /**
     * イベントリスナーの初期化
     */
    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.urlInput.addEventListener('paste', (e) => this.handleURLPaste(e));
        this.urlInput.addEventListener('input', (e) => this.handleURLInput(e));
        this.urlInput.addEventListener('blur', (e) => this.fetchVideoInfo(e.target.value));
        
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        window.addEventListener('focus', () => this.handleWindowFocus());
    }

    /**
     * UIの初期化
     */
    initializeUI() {
        const firstOption = document.querySelector('.option-card');
        if (firstOption) {
            firstOption.classList.add('selected');
        }
        
        this.restoreSettings();
        this.loadHistory();
        this.displayStats();
    }

    /**
     * サーバー状態チェック
     */
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            
            if (data.status === 'OK') {
                this.showServerStatus('✅ サーバー接続正常', 'success');
            } else {
                this.showServerStatus('⚠️ サーバー状態不安定', 'warning');
            }
        } catch (error) {
            this.showServerStatus('❌ サーバー接続エラー - デモモードで動作', 'error');
            console.warn('Server not available, falling back to demo mode');
        }
    }

    /**
     * サーバー状態表示
     */
    showServerStatus(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `server-status server-status-${type}`;
        statusDiv.textContent = message;
        statusDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 0.9em;
            z-index: 1000;
            color: white;
            background: ${type === 'success' ? '#28a745' : type === 'warning' ? '#ffc107' : '#dc3545'};
        `;
        
        document.body.appendChild(statusDiv);
        
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.parentNode.removeChild(statusDiv);
            }
        }, 5000);
    }

    /**
     * 動画情報の取得
     */
    async fetchVideoInfo(url) {
        if (!this.isValidYouTubeURL(url)) return;

        try {
            const videoId = this.extractVideoId(url);
            const response = await fetch(`${this.apiBaseUrl}/info/${videoId}`);
            
            if (!response.ok) throw new Error('Video info fetch failed');
            
            const data = await response.json();
            this.currentVideoInfo = data;
            this.updateVideoPreview(data.videoInfo);
            this.updateQualityOptions(data.availableQualities);
            
        } catch (error) {
            console.error('Failed to fetch video info:', error);
            this.currentVideoInfo = null;
        }
    }

    /**
     * 動画プレビューの更新
     */
    updateVideoPreview(videoInfo) {
        let previewContainer = document.getElementById('videoPreview');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'videoPreview';
            previewContainer.className = 'video-preview';
            this.form.insertBefore(previewContainer, this.form.firstChild);
        }

        previewContainer.innerHTML = `
            <div class="preview-content">
                <div class="preview-thumbnail">
                    <img src="${videoInfo.thumbnail}" alt="Video thumbnail" />
                    <div class="preview-duration">${videoInfo.duration.formatted}</div>
                </div>
                <div class="preview-info">
                    <h3 class="preview-title">${videoInfo.title}</h3>
                    <p class="preview-author">${videoInfo.author.name}</p>
                    <p class="preview-stats">
                        ${this.formatNumber(videoInfo.viewCount)} 回視聴 • 
                        ${new Date(videoInfo.uploadDate).toLocaleDateString('ja-JP')}
                    </p>
                </div>
            </div>
        `;
        previewContainer.style.display = 'block';
    }

    /**
     * 品質オプションの動的更新
     */
    updateQualityOptions(availableQualities) {
        const currentType = document.querySelector('input[name="downloadType"]:checked')?.value || 'video';
        const qualities = currentType === 'video' 
            ? availableQualities.video 
            : availableQualities.audio;

        if (currentType === 'video') {
            this.qualitySelect.innerHTML = qualities.map(quality => 
                `<option value="${quality}">${quality} (${this.getQualityDescription(quality)})</option>`
            ).join('');
        } else {
            this.qualitySelect.innerHTML = qualities.map(quality => 
                `<option value="${quality}">${quality} (${this.getAudioQualityDescription(quality)})</option>`
            ).join('');
        }
    }

    /**
     * 品質説明の取得
     */
    getQualityDescription(quality) {
        const descriptions = {
            '2160p': '4K Ultra HD',
            '1440p': '2K Quad HD', 
            '1080p': 'フルHD',
            '720p': 'HD',
            '480p': '標準画質',
            '360p': '低画質'
        };
        return descriptions[quality] || '高画質';
    }

    /**
     * 音声品質説明の取得
     */
    getAudioQualityDescription(quality) {
        const descriptions = {
            '320k': '最高音質',
            '256k': '高音質',
            '192k': '標準音質',
            '128k': '低音質'
        };
        return descriptions[quality] || '高音質';
    }

    /**
     * 実際のダウンロード処理
     */
    async downloadFile(url, type, quality) {
        if (!this.isValidYouTubeURL(url)) {
            throw new Error('無効なYouTube URL');
        }

        this.showProgress();
        this.setProcessingState(true);
        
        try {
            this.abortController = new AbortController();
            
            this.updateProgress(10, 'サーバーに接続中...');
            
            const response = await fetch(`${this.apiBaseUrl}/download`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url, type, quality }),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ダウンロードに失敗しました');
            }

            this.updateProgress(30, 'ダウンロード準備中...');

            // ファイル名をヘッダーから取得
            const contentDisposition = response.headers.get('content-disposition');
            const filename = this.extractFilenameFromHeader(contentDisposition) || 
                           this.generateFileName(url, type, quality);

            this.updateProgress(50, 'ファイルを受信中...');

            // レスポンスをBlobとして取得
            const blob = await response.blob();
            
            this.updateProgress(90, 'ファイルを保存中...');

            // ブラウザダウンロードを実行
            this.triggerBrowserDownload(blob, filename);
            
            this.updateProgress(100, 'ダウンロード完了!');

            // 成功メッセージ表示
            const successMessage = `
                <strong>✅ ダウンロード完了!</strong><br>
                <div style="margin-top: 10px; font-size: 0.9em;">
                    ファイル名: ${filename}<br>
                    ファイル形式: ${type === 'video' ? 'MP4' : 'MP3'}<br>
                    品質: ${quality}
                </div>
            `;
            
            this.showResult(successMessage, true, true);
            this.addToHistory(url, type, quality, { fileName: filename });

        } catch (error) {
            if (error.name === 'AbortError') {
                this.showResult('⏹️ ダウンロードがキャンセルされました', false);
            } else {
                console.error('Download error:', error);
                this.showResult(`❌ エラーが発生しました: ${error.message}`, false);
            }
        } finally {
            setTimeout(() => this.resetUI(), 1500);
        }
    }

    /**
     * ファイル名をContent-Dispositionヘッダーから抽出
     */
    extractFilenameFromHeader(contentDisposition) {
        if (!contentDisposition) return null;
        
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
            return decodeURIComponent(match[1].replace(/['"]/g, ''));
        }
        return null;
    }

    /**
     * ブラウザダウンロードの実行
     */
    triggerBrowserDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        
        // 通知表示
        this.showDownloadNotification(filename);
    }

    /**
     * ダウンロードキャンセル
     */
    cancelDownload() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    /**
     * フォーム送信処理
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isProcessing) {
            this.cancelDownload();
            return;
        }
        
        const url = this.urlInput.value.trim();
        const type = document.querySelector('input[name="downloadType"]:checked')?.value;
        const quality = this.qualitySelect.value;
        
        // バリデーション
        if (!url) {
            this.showResult('❌ YouTubeのURLを入力してください。', false);
            this.urlInput.focus();
            return;
        }
        
        if (!this.isValidYouTubeURL(url)) {
            this.showResult('❌ 有効なYouTubeのURLを入力してください。', false);
            this.urlInput.focus();
            return;
        }
        
        if (!type) {
            this.showResult('❌ ダウンロード形式を選択してください。', false);
            return;
        }
        
        // 通知許可
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        try {
            await this.downloadFile(url, type, quality);
        } catch (error) {
            console.error('Download error:', error);
            this.showResult(`❌ エラーが発生しました: ${error.message}`, false);
            this.resetUI();
        }
    }

    // 既存のユーティリティメソッドを継承
    isValidYouTubeURL(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(&.*)?$/,
            /^(https?:\/\/)?(www\.)?(youtu\.be\/)([a-zA-Z0-9_-]{11})(\?.*)?$/,
            /^(https?:\/\/)?(www\.)?(youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(\?.*)?$/,
            /^(https?:\/\/)?(www\.)?(youtube\.com\/v\/)([a-zA-Z0-9_-]{11})(\?.*)?$/
        ];
        return patterns.some(pattern => pattern.test(url));
    }

    extractVideoId(url) {
        const patterns = [
            /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
            /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    generateFileName(url, type, quality) {
        const videoId = this.extractVideoId(url) || 'unknown';
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const extension = type === 'video' ? 'mp4' : 'mp3';
        return `youtube_${videoId}_${quality}_${timestamp}.${extension}`;
    }

    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    // プログレス関連メソッド
    updateProgress(percentage, message) {
        this.progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        this.progressText.textContent = message;
    }

    showProgress() {
        this.hideResult();
        this.progressContainer.style.display = 'block';
        this.updateProgress(0, '準備中...');
    }

    setProcessingState(isProcessing) {
        this.isProcessing = isProcessing;
        this.downloadBtn.disabled = isProcessing;
        this.btnText.textContent = isProcessing ? '🔄 処理中... (ESCでキャンセル)' : '📥 ダウンロード開始';
    }

    resetUI() {
        this.progressContainer.style.display = 'none';
        this.setProcessingState(false);
        this.updateProgress(0, '');
        this.abortController = null;
    }

    showResult(message, isSuccess = true, autoHide = false) {
        this.resultContainer.className = `result-container ${isSuccess ? 'result-success' : 'result-error'}`;
        this.resultMessage.innerHTML = message;
        this.resultContainer.style.display = 'block';
        
        if (autoHide) {
            setTimeout(() => this.hideResult(), 5000);
        }
    }

    hideResult() {
        this.resultContainer.style.display = 'none';
    }

    showDownloadNotification(fileName) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ダウンロード開始', {
                body: `${fileName} のダウンロードを開始しました`,
                icon: '../images/favicon.ico'
            });
        }
    }

    // 既存の履歴・設定管理メソッドも継承 (省略)
    selectOption(type) {
        document.querySelectorAll('.option-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`#${type}-option`).closest('.option-card');
        selectedCard.classList.add('selected');
        document.getElementById(`${type}-option`).checked = true;
        
        if (this.currentVideoInfo) {
            this.updateQualityOptions(this.currentVideoInfo.availableQualities);
        }
        
        this.saveSettings();
    }

    handleKeyboardShortcuts(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !this.isProcessing) {
            e.preventDefault();
            this.form.dispatchEvent(new Event('submit'));
        }
        
        if (e.key === 'Escape' && this.isProcessing) {
            e.preventDefault();
            this.cancelDownload();
        }
    }

    handleURLPaste(e) {
        setTimeout(() => {
            let url = this.urlInput.value.trim();
            if (url.includes('youtu.be/')) {
                const videoId = this.extractVideoId(url);
                if (videoId) {
                    this.urlInput.value = `https://www.youtube.com/watch?v=${videoId}`;
                }
            }
            this.validateURLRealtime(this.urlInput.value);
            this.fetchVideoInfo(this.urlInput.value);
        }, 100);
    }

    handleURLInput(e) {
        this.validateURLRealtime(e.target.value);
    }

    validateURLRealtime(url) {
        if (!url) {
            this.urlInput.style.borderColor = '#e1e5e9';
            return;
        }
        
        this.urlInput.style.borderColor = this.isValidYouTubeURL(url) ? '#28a745' : '#dc3545';
    }

    handleWindowFocus() {
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(text => {
                if (this.isValidYouTubeURL(text) && !this.urlInput.value) {
                    this.urlInput.value = text;
                    this.validateURLRealtime(text);
                    this.fetchVideoInfo(text);
                }
            }).catch(() => {});
        }
    }

    // 設定・履歴管理 (簡略版)
    saveSettings() {
        const settings = {
            downloadType: document.querySelector('input[name="downloadType"]:checked')?.value,
            quality: this.qualitySelect.value
        };
        localStorage.setItem('youtube-downloader-settings', JSON.stringify(settings));
    }

    restoreSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('youtube-downloader-settings') || '{}');
            
            if (settings.downloadType) {
                const option = document.getElementById(`${settings.downloadType}-option`);
                if (option) {
                    option.checked = true;
                    this.selectOption(settings.downloadType);
                }
            }
            
            if (settings.quality) {
                this.qualitySelect.value = settings.quality;
            }
        } catch (error) {
            console.warn('設定の復元に失敗しました:', error);
        }
    }

    loadHistory() {
        try {
            const history = localStorage.getItem('youtube-downloader-history');
            if (history) {
                this.downloadHistory = JSON.parse(history);
            }
        } catch (error) {
            console.warn('履歴の読み込みに失敗しました:', error);
            this.downloadHistory = [];
        }
    }

    addToHistory(url, type, quality, fileInfo) {
        const historyItem = {
            id: Date.now(),
            url: url,
            type: type,
            quality: quality,
            fileInfo: fileInfo,
            timestamp: new Date().toISOString(),
            status: 'completed'
        };
        
        this.downloadHistory.unshift(historyItem);
        
        if (this.downloadHistory.length > 10) {
            this.downloadHistory = this.downloadHistory.slice(0, 10);
        }
        
        this.saveHistory();
    }

    saveHistory() {
        try {
            localStorage.setItem('youtube-downloader-history', JSON.stringify(this.downloadHistory));
        } catch (error) {
            console.warn('履歴の保存に失敗しました:', error);
        }
    }

    displayStats() {
        // 統計情報の表示実装
    }
}

// グローバル関数
function selectOption(type) {
    if (window.downloaderPro) {
        window.downloaderPro.selectOption(type);
    }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', function() {
    window.downloaderPro = new YouTubeDownloaderPro();
});
