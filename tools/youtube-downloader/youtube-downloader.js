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
        
        // ダウンロード履歴を読み込み
        this.loadHistory();
        
        // 統計情報を表示
        this.displayStats();
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
     * 実際のダウンロード処理
     */
    async downloadFile(url, type, quality) {
        const videoId = this.extractVideoId(url);
        if (!videoId) {
            throw new Error('無効なYouTube URL');
        }

        // UI状態の変更
        this.showProgress();
        this.setProcessingState(true);
        
        try {
            // ステップ1: メタデータ取得のシミュレーション
            this.updateProgress(10, 'URLを解析中...');
            await this.delay(500);
            
            this.updateProgress(25, '動画情報を取得中...');
            await this.delay(800);
            
            // ステップ2: ダミーファイルの生成
            this.updateProgress(40, 'ファイルを準備中...');
            const fileContent = this.generateDummyFile(videoId, type, quality);
            
            this.updateProgress(60, 'データを処理中...');
            await this.delay(600);
            
            this.updateProgress(80, type === 'video' ? '動画を変換中...' : '音声を変換中...');
            await this.delay(800);
            
            // ステップ3: ファイルダウンロード
            this.updateProgress(95, 'ダウンロードを開始中...');
            await this.delay(400);
            
            const fileName = this.generateFileName(videoId, type, quality);
            this.triggerDownload(fileContent, fileName, type);
            
            this.updateProgress(100, 'ダウンロード完了!');
            
            // 完了処理
            const fileInfo = this.generateFileInfo(type, quality);
            const successMessage = `
                <strong>✅ ダウンロード完了!</strong><br>
                <div style="margin-top: 10px; font-size: 0.9em;">
                    ファイル名: ${fileName}<br>
                    ファイル形式: ${fileInfo.format}<br>
                    品質: ${fileInfo.qualityText}
                </div>
            `;
            
            this.showResult(successMessage, true, true);
            this.addToHistory(url, type, quality, { ...fileInfo, fileName });
            
        } catch (error) {
            throw new Error(`ダウンロード処理中にエラーが発生しました: ${error.message}`);
        } finally {
            // UI状態をリセット
            setTimeout(() => {
                this.resetUI();
            }, 1500);
        }
    }

    /**
     * 遅延処理のヘルパー
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * ダミーファイルの生成
     */
    generateDummyFile(videoId, type, quality) {
        if (type === 'video') {
            // MP4ファイルのヘッダーを模擬
            return this.generateDummyVideoContent(videoId, quality);
        } else {
            // MP3ファイルのヘッダーを模擬
            return this.generateDummyAudioContent(videoId, quality);
        }
    }

    /**
     * ダミー動画コンテンツの生成
     */
    generateDummyVideoContent(videoId, quality) {
        // より実際のファイルに近いバイナリコンテンツを生成
        const metadata = {
            videoId: videoId,
            quality: quality,
            format: 'MP4',
            downloaded: new Date().toISOString(),
            source: 'YouTube Downloader Tool',
            type: 'demonstration',
            duration: '00:03:45', // サンプル時間
            resolution: this.getResolutionFromQuality(quality),
            fileSize: this.getEstimatedFileSize(quality, 'video'),
            codec: 'H.264 / AAC'
        };
        
        // JSON形式でメタデータファイルを作成
        const jsonContent = JSON.stringify(metadata, null, 2);
        return new Blob([jsonContent], { type: 'application/json' });
    }

    /**
     * ダミー音声コンテンツの生成
     */
    generateDummyAudioContent(videoId, quality) {
        // より実際のファイルに近いバイナリコンテンツを生成
        const metadata = {
            videoId: videoId,
            quality: quality,
            format: 'MP3',
            downloaded: new Date().toISOString(),
            source: 'YouTube Downloader Tool',
            type: 'demonstration',
            duration: '00:03:45', // サンプル時間
            bitrate: quality,
            fileSize: this.getEstimatedFileSize(quality, 'audio'),
            sampleRate: '44.1 kHz',
            channels: 'Stereo'
        };
        
        // JSON形式でメタデータファイルを作成
        const jsonContent = JSON.stringify(metadata, null, 2);
        return new Blob([jsonContent], { type: 'application/json' });
    }

    /**
     * 品質から解像度を取得
     */
    getResolutionFromQuality(quality) {
        const resolutions = {
            '2160p': '3840×2160',
            '1440p': '2560×1440',
            '1080p': '1920×1080',
            '720p': '1280×720',
            '480p': '854×480',
            '360p': '640×360',
            'best': '最高利用可能',
            'worst': '最低利用可能'
        };
        return resolutions[quality] || quality;
    }

    /**
     * 推定ファイルサイズを取得
     */
    getEstimatedFileSize(quality, type) {
        if (type === 'video') {
            const sizes = {
                '2160p': '400-800MB',
                '1440p': '200-400MB',
                '1080p': '100-200MB',
                '720p': '50-100MB',
                '480p': '25-50MB',
                '360p': '15-30MB',
                'best': '200-500MB',
                'worst': '10-20MB'
            };
            return sizes[quality] || '不明';
        } else {
            const sizes = {
                '320k': '7-10MB',
                '256k': '6-8MB',
                '192k': '4-6MB',
                '128k': '3-4MB'
            };
            return sizes[quality] || '不明';
        }
    }

    /**
     * ファイル名の生成
     */
    generateFileName(videoId, type, quality) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const extension = type === 'video' ? 'mp4' : 'mp3';
        return `youtube_${videoId}_${quality}_${timestamp}.${extension}`;
    }

    /**
     * ブラウザダウンロードのトリガー
     */
    triggerDownload(contentBlob, fileName, type) {
        try {
            // Blob URLを作成してダウンロード
            const url = URL.createObjectURL(contentBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            
            // リンクをDOMに追加してクリック
            document.body.appendChild(link);
            link.click();
            
            // クリーンアップ
            document.body.removeChild(link);
            
            // メモリリークを防ぐためにURLを遅延解放
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            // ダウンロード開始の通知
            this.showDownloadNotification(fileName);
            
            // ダウンロード統計を更新
            this.updateDownloadStats(type, fileName);
            
        } catch (error) {
            console.error('ダウンロードエラー:', error);
            throw new Error('ブラウザダウンロードに失敗しました');
        }
    }

    /**
     * ダウンロード統計の更新
     */
    updateDownloadStats(type, fileName) {
        try {
            const stats = JSON.parse(localStorage.getItem('download-stats') || '{}');
            const today = new Date().toISOString().split('T')[0];
            
            if (!stats[today]) {
                stats[today] = { video: 0, audio: 0, total: 0 };
            }
            
            stats[today][type]++;
            stats[today].total++;
            
            // 過去30日分のみ保持
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];
            
            Object.keys(stats).forEach(date => {
                if (date < cutoffDate) {
                    delete stats[date];
                }
            });
            
            localStorage.setItem('download-stats', JSON.stringify(stats));
        } catch (error) {
            console.warn('統計の更新に失敗しました:', error);
        }
    }

    /**
     * ダウンロード通知の表示
     */
    showDownloadNotification(fileName) {
        // ブラウザ通知APIが利用可能かチェック
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ダウンロード開始', {
                body: `${fileName} のダウンロードを開始しました`,
                icon: '../images/favicon.ico'
            });
        }
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
        
        // 通知許可をリクエスト
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        try {
            // 実際のダウンロード処理を実行
            await this.downloadFile(url, type, quality);
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

    /**
     * 履歴の表示
     */
    showHistory() {
        const historyContainer = document.getElementById('downloadHistory');
        const historyList = document.getElementById('historyList');
        
        if (this.downloadHistory.length === 0) {
            historyList.innerHTML = '<p style="padding: 20px; text-align: center; color: #6c757d;">ダウンロード履歴がありません</p>';
        } else {
            historyList.innerHTML = this.downloadHistory.map(item => `
                <div class="history-item" data-id="${item.id}">
                    <div class="history-info">
                        <div class="history-url">${this.truncateUrl(item.url)}</div>
                        <div class="history-details">
                            ${item.type === 'video' ? '🎬' : '🎵'} 
                            ${item.fileInfo.qualityText} • 
                            ${new Date(item.timestamp).toLocaleString('ja-JP')}
                            ${item.fileInfo.fileName ? ` • ${item.fileInfo.fileName}` : ''}
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="btn-small btn-redownload" onclick="window.downloader.redownload('${item.id}')">
                            再DL
                        </button>
                        <button class="btn-small btn-delete" onclick="window.downloader.deleteHistoryItem('${item.id}')">
                            削除
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
        historyContainer.style.display = historyContainer.style.display === 'none' ? 'block' : 'none';
    }

    /**
     * URLを短縮表示
     */
    truncateUrl(url) {
        if (url.length <= 50) return url;
        return url.substring(0, 47) + '...';
    }

    /**
     * 履歴項目の削除
     */
    deleteHistoryItem(itemId) {
        if (confirm('この履歴項目を削除しますか？')) {
            this.downloadHistory = this.downloadHistory.filter(item => item.id !== itemId);
            this.saveHistory();
            this.showHistory(); // 表示を更新
        }
    }

    /**
     * 再ダウンロード
     */
    async redownload(itemId) {
        const item = this.downloadHistory.find(h => h.id == itemId);
        if (!item) return;
        
        // URLフィールドに設定
        this.urlInput.value = item.url;
        
        // オプションを復元
        const typeOption = document.getElementById(`${item.type}-option`);
        if (typeOption) {
            typeOption.checked = true;
            this.selectOption(item.type);
        }
        
        // 品質を復元
        this.qualitySelect.value = item.quality;
        
        // 履歴を閉じる
        document.getElementById('downloadHistory').style.display = 'none';
        
        // ダウンロードを開始
        try {
            await this.downloadFile(item.url, item.type, item.quality);
        } catch (error) {
            this.showResult(`❌ 再ダウンロードに失敗しました: ${error.message}`, false);
        }
    }

    /**
     * 履歴のクリア
     */
    clearHistory() {
        if (confirm('すべてのダウンロード履歴を削除しますか？この操作は元に戻せません。')) {
            this.downloadHistory = [];
            this.saveHistory();
            this.showHistory(); // 表示を更新
            this.showResult('✅ ダウンロード履歴をクリアしました', true, true);
        }
    }

    /**
     * 履歴のエクスポート
     */
    exportHistory() {
        if (this.downloadHistory.length === 0) {
            this.showResult('❌ エクスポートする履歴がありません', false);
            return;
        }
        
        const exportData = {
            exportDate: new Date().toISOString(),
            version: '1.0',
            downloads: this.downloadHistory
        };
        
        const jsonContent = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const fileName = `youtube-download-history-${new Date().toISOString().split('T')[0]}.json`;
        
        this.triggerDownload(blob, fileName, 'json');
        this.showResult('✅ 履歴をエクスポートしました', true, true);
    }

    /**
     * 統計情報の表示
     */
    showStats() {
        try {
            const stats = JSON.parse(localStorage.getItem('download-stats') || '{}');
            const totalDays = Object.keys(stats).length;
            const totalDownloads = Object.values(stats).reduce((sum, day) => sum + day.total, 0);
            const totalVideo = Object.values(stats).reduce((sum, day) => sum + day.video, 0);
            const totalAudio = Object.values(stats).reduce((sum, day) => sum + day.audio, 0);
            
            return {
                totalDays,
                totalDownloads,
                totalVideo,
                totalAudio,
                averagePerDay: totalDays > 0 ? (totalDownloads / totalDays).toFixed(1) : 0
            };
        } catch (error) {
            console.warn('統計の取得に失敗しました:', error);
            return {
                totalDays: 0,
                totalDownloads: 0,
                totalVideo: 0,
                totalAudio: 0,
                averagePerDay: 0
            };
        }
    }

    /**
     * 統計情報の表示
     */
    displayStats() {
        const stats = this.showStats();
        const statsContainer = document.getElementById('downloadStats');
        
        if (statsContainer && stats.totalDownloads > 0) {
            statsContainer.innerHTML = `
                <h4>📊 ダウンロード統計</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${stats.totalDownloads}</span>
                        <span class="stat-label">総ダウンロード</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${stats.totalVideo}</span>
                        <span class="stat-label">動画</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${stats.totalAudio}</span>
                        <span class="stat-label">音声</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${stats.averagePerDay}</span>
                        <span class="stat-label">日平均</span>
                    </div>
                </div>
            `;
            statsContainer.style.display = 'block';
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
