/**
 * YouTube Downloader Tool JavaScript
 * 動画・音声ダウンロード機能のメインスクリプト
 */

class YouTubeDownloader {
    constructor() {
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
        
        this.initializeEventListeners();
        this.initializeUI();
    }

    /**
     * イベントリスナーの初期化
     */
    initializeEventListeners() {
        // フォーム送信
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // URL入力フィールドの処理
        this.urlInput.addEventListener('paste', (e) => this.handleURLPaste(e));
        this.urlInput.addEventListener('input', (e) => this.handleURLInput(e));
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // ウィンドウフォーカス時の処理
        window.addEventListener('focus', () => this.handleWindowFocus());
    }

    /**
     * UIの初期化
     */
    initializeUI() {
        // 初期選択状態の設定
        const firstOption = document.querySelector('.option-card');
        if (firstOption) {
            firstOption.classList.add('selected');
        }
        
        // ローカルストレージから設定を復元
        this.restoreSettings();
    }

    /**
     * オプション選択の処理
     */
    selectOption(type) {
        // 既存の選択をクリア
        document.querySelectorAll('.option-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        // 新しい選択を適用
        const selectedCard = document.querySelector(`#${type}-option`).closest('.option-card');
        selectedCard.classList.add('selected');
        document.getElementById(`${type}-option`).checked = true;
        
        // 品質オプションの更新
        this.updateQualityOptions(type);
        
        // 設定を保存
        this.saveSettings();
    }

    /**
     * 品質オプションの更新
     */
    updateQualityOptions(type) {
        if (type === 'audio') {
            this.qualitySelect.innerHTML = `
                <option value="320k">320kbps (最高品質)</option>
                <option value="256k" selected>256kbps (高品質)</option>
                <option value="192k">192kbps (標準)</option>
                <option value="128k">128kbps (低品質)</option>
            `;
        } else {
            this.qualitySelect.innerHTML = `
                <option value="best">最高品質 (利用可能な最高画質)</option>
                <option value="2160p">2160p (4K Ultra HD)</option>
                <option value="1440p">1440p (2K Quad HD)</option>
                <option value="1080p">1080p (フルHD)</option>
                <option value="720p" selected>720p (HD)</option>
                <option value="480p">480p (標準画質)</option>
                <option value="360p">360p (低画質)</option>
                <option value="worst">最低品質 (データ節約)</option>
            `;
        }
    }

    /**
     * URLの妥当性チェック
     */
    isValidYouTubeURL(url) {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(&.*)?$/,
            /^(https?:\/\/)?(www\.)?(youtu\.be\/)([a-zA-Z0-9_-]{11})(\?.*)?$/,
            /^(https?:\/\/)?(www\.)?(youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(\?.*)?$/,
            /^(https?:\/\/)?(www\.)?(youtube\.com\/v\/)([a-zA-Z0-9_-]{11})(\?.*)?$/
        ];
        
        return patterns.some(pattern => pattern.test(url));
    }

    /**
     * YouTube Video IDの抽出
     */
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

    /**
     * プログレスバーの更新
     */
    updateProgress(percentage, message) {
        this.progressFill.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        this.progressText.textContent = message;
        
        // アニメーション効果
        if (percentage === 100) {
            this.progressFill.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
        }
    }

    /**
     * 結果の表示
     */
    showResult(message, isSuccess = true, autoHide = false) {
        this.resultContainer.className = `result-container ${isSuccess ? 'result-success' : 'result-error'}`;
        this.resultMessage.innerHTML = message;
        this.resultContainer.style.display = 'block';
        
        if (autoHide) {
            setTimeout(() => {
                this.hideResult();
            }, 5000);
        }
    }

    /**
     * 結果の非表示
     */
    hideResult() {
        this.resultContainer.style.display = 'none';
    }

    /**
     * ダウンロード処理のシミュレーション
     */
    async simulateDownload(url, type, quality) {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error('無効なYouTube URL');
        }

        // UI状態の変更
        this.showProgress();
        this.setProcessingState(true);
        
        const steps = [
            { percentage: 5, message: 'URLを解析中...', delay: 500 },
            { percentage: 15, message: '動画情報を取得中...', delay: 800 },
            { percentage: 25, message: 'メタデータを読み込み中...', delay: 600 },
            { percentage: 40, message: 'ダウンロード準備中...', delay: 700 },
            { percentage: 55, message: 'ファイルをダウンロード中...', delay: 1200 },
            { percentage: 70, message: 'データを処理中...', delay: 900 },
            { percentage: 85, message: type === 'video' ? '動画を変換中...' : '音声を変換中...', delay: 800 },
            { percentage: 95, message: 'ファイルを最適化中...', delay: 600 },
            { percentage: 100, message: '完了!', delay: 500 }
        ];
        
        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, step.delay));
            this.updateProgress(step.percentage, step.message);
        }
        
        // 完了処理
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const fileInfo = this.generateFileInfo(type, quality);
        const successMessage = `
            <strong>✅ ダウンロード完了!</strong><br>
            <div style="margin-top: 10px; font-size: 0.9em;">
                ファイル形式: ${fileInfo.format}<br>
                品質: ${fileInfo.qualityText}<br>
                予想ファイルサイズ: ${fileInfo.estimatedSize}
            </div>
        `;
        
        this.showResult(successMessage, true, true);
        this.addToHistory(url, type, quality, fileInfo);
        
        // UI状態をリセット
        setTimeout(() => {
            this.resetUI();
        }, 1000);
    }

    /**
     * ファイル情報の生成
     */
    generateFileInfo(type, quality) {
        const formats = {
            video: {
                format: 'MP4',
                sizes: {
                    'best': '200-500MB',
                    '2160p': '400-800MB',
                    '1440p': '200-400MB',
                    '1080p': '100-200MB',
                    '720p': '50-100MB',
                    '480p': '25-50MB',
                    '360p': '15-30MB',
                    'worst': '10-20MB'
                }
            },
            audio: {
                format: 'MP3',
                sizes: {
                    '320k': '7-10MB',
                    '256k': '6-8MB',
                    '192k': '4-6MB',
                    '128k': '3-4MB'
                }
            }
        };
        
        const info = formats[type];
        const qualityText = type === 'video' 
            ? quality === 'best' ? '最高品質' : quality === 'worst' ? '最低品質' : quality
            : quality;
            
        return {
            format: info.format,
            qualityText: qualityText,
            estimatedSize: info.sizes[quality] || '不明'
        };
    }

    /**
     * ダウンロード履歴に追加
     */
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
        
        // 履歴は最大10件まで保持
        if (this.downloadHistory.length > 10) {
            this.downloadHistory = this.downloadHistory.slice(0, 10);
        }
        
        this.saveHistory();
    }

    /**
     * プログレス表示
     */
    showProgress() {
        this.hideResult();
        this.progressContainer.style.display = 'block';
        this.updateProgress(0, '準備中...');
    }

    /**
     * 処理状態の設定
     */
    setProcessingState(isProcessing) {
        this.isProcessing = isProcessing;
        this.downloadBtn.disabled = isProcessing;
        this.btnText.textContent = isProcessing ? '🔄 処理中...' : '📥 ダウンロード開始';
        
        if (isProcessing) {
            this.downloadBtn.style.cursor = 'not-allowed';
        } else {
            this.downloadBtn.style.cursor = 'pointer';
        }
    }

    /**
     * UIリセット
     */
    resetUI() {
        this.progressContainer.style.display = 'none';
        this.setProcessingState(false);
        this.updateProgress(0, '');
        this.progressFill.style.background = 'var(--primary-gradient)';
    }

    /**
     * フォーム送信の処理
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isProcessing) return;
        
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
        
        try {
            await this.simulateDownload(url, type, quality);
        } catch (error) {
            console.error('Download error:', error);
            this.showResult(`❌ エラーが発生しました: ${error.message}`, false);
            this.resetUI();
        }
    }

    /**
     * URL貼り付けの処理
     */
    handleURLPaste(e) {
        setTimeout(() => {
            let url = this.urlInput.value.trim();
            
            // 短縮URLを標準形式に変換
            if (url.includes('youtu.be/')) {
                const videoId = this.extractVideoId(url);
                if (videoId) {
                    this.urlInput.value = `https://www.youtube.com/watch?v=${videoId}`;
                }
            }
            
            // URLの妥当性をリアルタイムチェック
            this.validateURLRealtime(this.urlInput.value);
        }, 100);
    }

    /**
     * URL入力の処理
     */
    handleURLInput(e) {
        this.validateURLRealtime(e.target.value);
    }

    /**
     * リアルタイムURL検証
     */
    validateURLRealtime(url) {
        const input = this.urlInput;
        
        if (!url) {
            input.style.borderColor = '#e1e5e9';
            return;
        }
        
        if (this.isValidYouTubeURL(url)) {
            input.style.borderColor = '#28a745';
        } else {
            input.style.borderColor = '#dc3545';
        }
    }

    /**
     * キーボードショートカットの処理
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter でダウンロード開始
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !this.isProcessing) {
            e.preventDefault();
            this.form.dispatchEvent(new Event('submit'));
        }
        
        // Escape でプログレス中止（デモ版では実際には中止しない）
        if (e.key === 'Escape' && this.isProcessing) {
            e.preventDefault();
            // 実際の実装ではここでダウンロードを中止
            console.log('ダウンロード中止要求');
        }
    }

    /**
     * ウィンドウフォーカス時の処理
     */
    handleWindowFocus() {
        // クリップボードからYouTube URLを自動検出（権限があれば）
        if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(text => {
                if (this.isValidYouTubeURL(text) && !this.urlInput.value) {
                    this.urlInput.value = text;
                    this.validateURLRealtime(text);
                }
            }).catch(() => {
                // クリップボードアクセスが拒否された場合は何もしない
            });
        }
    }

    /**
     * 設定の保存
     */
    saveSettings() {
        const settings = {
            downloadType: document.querySelector('input[name="downloadType"]:checked')?.value,
            quality: this.qualitySelect.value
        };
        
        localStorage.setItem('youtube-downloader-settings', JSON.stringify(settings));
    }

    /**
     * 設定の復元
     */
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

    /**
     * 履歴の保存
     */
    saveHistory() {
        try {
            localStorage.setItem('youtube-downloader-history', JSON.stringify(this.downloadHistory));
        } catch (error) {
            console.warn('履歴の保存に失敗しました:', error);
        }
    }

    /**
     * 履歴の読み込み
     */
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
}

// グローバル関数（HTMLから呼び出される）
function selectOption(type) {
    if (window.downloader) {
        window.downloader.selectOption(type);
    }
}

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', function() {
    window.downloader = new YouTubeDownloader();
    
    // サービスワーカーの登録（オフライン対応）
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.log('Service Worker registration failed:', error);
        });
    }
});
