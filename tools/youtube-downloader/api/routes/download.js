const express = require('express');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sanitize = require('sanitize-filename');
const Joi = require('joi');

const router = express.Router();

// FFmpeg パスを設定
ffmpeg.setFfmpegPath(ffmpegStatic);

// 一時ファイル用ディレクトリ
const TEMP_DIR = path.join(__dirname, '../temp');
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB制限

// 一時ディレクトリの作成
async function ensureTempDir() {
    try {
        await fs.access(TEMP_DIR);
    } catch {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    }
}

// バリデーションスキーマ
const downloadSchema = Joi.object({
    url: Joi.string()
        .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        .required()
        .messages({
            'string.pattern.base': '有効なYouTube URLを入力してください'
        }),
    type: Joi.string()
        .valid('video', 'audio')
        .required(),
    quality: Joi.string()
        .when('type', {
            is: 'video',
            then: Joi.valid('highest', 'lowest', '2160p', '1440p', '1080p', '720p', '480p', '360p'),
            otherwise: Joi.valid('highestaudio', 'lowestaudio', '320k', '256k', '192k', '128k')
        })
        .required()
});

// ユーティリティ関数
function getVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getQualityFilter(quality, type) {
    if (type === 'video') {
        switch (quality) {
            case 'highest': return 'highestvideo';
            case 'lowest': return 'lowestvideo';
            case '2160p': return 'highestvideo[height<=2160]';
            case '1440p': return 'highestvideo[height<=1440]';
            case '1080p': return 'highestvideo[height<=1080]';
            case '720p': return 'highestvideo[height<=720]';
            case '480p': return 'highestvideo[height<=480]';
            case '360p': return 'highestvideo[height<=360]';
            default: return 'highestvideo';
        }
    } else {
        switch (quality) {
            case 'highestaudio': return 'highestaudio';
            case 'lowestaudio': return 'lowestaudio';
            case '320k': return 'highestaudio[abr<=320]';
            case '256k': return 'highestaudio[abr<=256]';
            case '192k': return 'highestaudio[abr<=192]';
            case '128k': return 'highestaudio[abr<=128]';
            default: return 'highestaudio';
        }
    }
}

// メイン ダウンロードエンドポイント
router.post('/', async (req, res) => {
    try {
        // バリデーション
        const { error, value } = downloadSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }

        const { url, type, quality } = value;
        const videoId = getVideoId(url);
        
        if (!videoId) {
            return res.status(400).json({
                error: 'Invalid URL',
                message: '有効なYouTube URLを入力してください'
            });
        }

        // 動画情報の取得
        let info;
        try {
            info = await ytdl.getInfo(videoId);
        } catch (error) {
            console.error('ytdl.getInfo error:', error);
            return res.status(404).json({
                error: 'Video Not Found',
                message: '動画が見つからないか、プライベート動画です。'
            });
        }

        // ファイル名の生成
        const title = sanitize(info.videoDetails.title || 'Unknown Title');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const extension = type === 'video' ? 'mp4' : 'mp3';
        const filename = `${title}_${quality}_${timestamp}.${extension}`;
        
        // 一時ファイルパス
        await ensureTempDir();
        const tempFilePath = path.join(TEMP_DIR, `${uuidv4()}.${extension}`);

        // ダウンロード処理開始の応答
        res.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            'X-Video-Title': encodeURIComponent(info.videoDetails.title),
            'X-Video-Duration': info.videoDetails.lengthSeconds,
            'X-Video-Author': encodeURIComponent(info.videoDetails.author.name)
        });

        if (type === 'video') {
            await downloadVideo(url, quality, res, tempFilePath);
        } else {
            await downloadAudio(url, quality, res, tempFilePath);
        }

        // 一時ファイルのクリーンアップ
        setTimeout(async () => {
            try {
                await fs.unlink(tempFilePath);
            } catch (error) {
                console.error('Temp file cleanup error:', error);
            }
        }, 30000); // 30秒後にクリーンアップ

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: 'Download Error',
                message: 'ダウンロード中にエラーが発生しました。'
            });
        }
    }
});

// 動画ダウンロード処理
async function downloadVideo(url, quality, res, tempFilePath) {
    return new Promise((resolve, reject) => {
        const qualityFilter = getQualityFilter(quality, 'video');
        
        const videoStream = ytdl(url, {
            filter: qualityFilter,
            quality: qualityFilter
        });

        const audioStream = ytdl(url, {
            filter: 'highestaudio',
            quality: 'highestaudio'
        });

        // FFmpegで動画と音声を結合
        const ffmpegCommand = ffmpeg()
            .input(videoStream)
            .input(audioStream)
            .videoCodec('libx264')
            .audioCodec('aac')
            .format('mp4')
            .outputOptions([
                '-preset fast',
                '-crf 23',
                '-movflags +faststart'
            ])
            .on('start', () => {
                console.log('FFmpeg processing started');
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`Processing: ${Math.round(progress.percent)}%`);
                }
            })
            .on('end', () => {
                console.log('FFmpeg processing completed');
                // 完成したファイルをストリーミング
                const fileStream = require('fs').createReadStream(tempFilePath);
                fileStream.pipe(res);
                fileStream.on('end', resolve);
                fileStream.on('error', reject);
            })
            .on('error', (error) => {
                console.error('FFmpeg error:', error);
                reject(error);
            });

        // 一時ファイルに出力
        ffmpegCommand.save(tempFilePath);
    });
}

// 音声ダウンロード処理
async function downloadAudio(url, quality, res, tempFilePath) {
    return new Promise((resolve, reject) => {
        const qualityFilter = getQualityFilter(quality, 'audio');
        
        const audioStream = ytdl(url, {
            filter: 'audioonly',
            quality: qualityFilter
        });

        // FFmpegで音声をMP3に変換
        const ffmpegCommand = ffmpeg()
            .input(audioStream)
            .audioCodec('libmp3lame')
            .audioBitrate(quality === '320k' ? 320 : 
                         quality === '256k' ? 256 :
                         quality === '192k' ? 192 : 128)
            .format('mp3')
            .on('start', () => {
                console.log('Audio conversion started');
            })
            .on('progress', (progress) => {
                if (progress.percent) {
                    console.log(`Converting: ${Math.round(progress.percent)}%`);
                }
            })
            .on('end', () => {
                console.log('Audio conversion completed');
                // 完成したファイルをストリーミング
                const fileStream = require('fs').createReadStream(tempFilePath);
                fileStream.pipe(res);
                fileStream.on('end', resolve);
                fileStream.on('error', reject);
            })
            .on('error', (error) => {
                console.error('Audio conversion error:', error);
                reject(error);
            });

        // 一時ファイルに出力
        ffmpegCommand.save(tempFilePath);
    });
}

// プログレス更新用のWebSocket風エンドポイント
router.get('/progress/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // プログレス更新のシミュレーション
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;

        res.write(`data: ${JSON.stringify({
            sessionId,
            progress: Math.round(progress),
            status: progress < 100 ? 'processing' : 'completed'
        })}\n\n`);

        if (progress >= 100) {
            clearInterval(interval);
            res.end();
        }
    }, 500);

    req.on('close', () => {
        clearInterval(interval);
    });
});

module.exports = router;
