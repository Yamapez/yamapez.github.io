const express = require('express');
const ytdl = require('ytdl-core');
const Joi = require('joi');

const router = express.Router();

// バリデーションスキーマ
const infoSchema = Joi.object({
    url: Joi.string()
        .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
        .messages({
            'string.pattern.base': '有効なYouTube URLを入力してください'
        })
});

// ユーティリティ関数
function getVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
}

function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 動画情報を取得するエンドポイント
router.get('/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        // Video IDの妥当性チェック
        if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
            return res.status(400).json({
                error: 'Invalid Video ID',
                message: '有効なYouTube Video IDを入力してください'
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

        const { videoDetails } = info;
        
        // 利用可能なフォーマットを整理
        const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
        const videoFormats = ytdl.filterFormats(info.formats, 'video');
        const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');

        // 動画品質オプションを生成
        const videoQualities = [...new Set(
            videoFormats
                .filter(format => format.height)
                .map(format => `${format.height}p`)
                .sort((a, b) => parseInt(b) - parseInt(a))
        )];

        // 音声品質オプションを生成
        const audioQualities = [...new Set(
            audioFormats
                .filter(format => format.audioBitrate)
                .map(format => `${format.audioBitrate}k`)
                .sort((a, b) => parseInt(b) - parseInt(a))
        )];

        // サムネイル画像を取得
        const thumbnails = videoDetails.thumbnails || [];
        const thumbnail = thumbnails.length > 0 
            ? thumbnails[thumbnails.length - 1].url 
            : null;

        // レスポンスデータの構築
        const responseData = {
            videoInfo: {
                id: videoDetails.videoId,
                title: videoDetails.title,
                author: {
                    name: videoDetails.author.name,
                    channelUrl: videoDetails.author.channel_url,
                    thumbnails: videoDetails.author.thumbnails
                },
                description: videoDetails.description,
                duration: {
                    seconds: parseInt(videoDetails.lengthSeconds),
                    formatted: formatDuration(parseInt(videoDetails.lengthSeconds))
                },
                viewCount: parseInt(videoDetails.viewCount),
                publishDate: videoDetails.publishDate,
                uploadDate: videoDetails.uploadDate,
                thumbnail: thumbnail,
                isLiveContent: videoDetails.isLiveContent,
                category: videoDetails.category,
                keywords: videoDetails.keywords || []
            },
            availableQualities: {
                video: videoQualities,
                audio: audioQualities
            },
            formats: {
                combined: formats.map(format => ({
                    itag: format.itag,
                    quality: format.qualityLabel,
                    format: format.container,
                    size: format.contentLength ? formatBytes(parseInt(format.contentLength)) : 'Unknown',
                    hasVideo: format.hasVideo,
                    hasAudio: format.hasAudio
                })),
                videoOnly: videoFormats.map(format => ({
                    itag: format.itag,
                    quality: format.qualityLabel,
                    format: format.container,
                    size: format.contentLength ? formatBytes(parseInt(format.contentLength)) : 'Unknown',
                    fps: format.fps,
                    codec: format.videoCodec
                })),
                audioOnly: audioFormats.map(format => ({
                    itag: format.itag,
                    bitrate: format.audioBitrate ? `${format.audioBitrate}kbps` : 'Unknown',
                    format: format.container,
                    size: format.contentLength ? formatBytes(parseInt(format.contentLength)) : 'Unknown',
                    codec: format.audioCodec
                }))
            },
            downloadEstimate: {
                video: {
                    '720p': '50-100MB',
                    '1080p': '100-200MB',
                    '1440p': '200-400MB',
                    '2160p': '400-800MB'
                },
                audio: {
                    '128k': '3-4MB',
                    '192k': '4-6MB',
                    '256k': '6-8MB',
                    '320k': '7-10MB'
                }
            }
        };

        res.json(responseData);

    } catch (error) {
        console.error('Info retrieval error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: '動画情報の取得中にエラーが発生しました。'
        });
    }
});

// URL から動画情報を取得するエンドポイント
router.post('/from-url', async (req, res) => {
    try {
        const { error, value } = infoSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation Error',
                message: error.details[0].message
            });
        }

        const { url } = value;
        const videoId = getVideoId(url);
        
        if (!videoId) {
            return res.status(400).json({
                error: 'Invalid URL',
                message: '有効なYouTube URLを入力してください'
            });
        }

        // 動画IDを使って情報を取得（上記のGETエンドポイントと同じ処理）
        req.params.videoId = videoId;
        return router.get('/:videoId')(req, res);

    } catch (error) {
        console.error('URL info error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: '動画情報の取得中にエラーが発生しました。'
        });
    }
});

// 複数動画の情報を一括取得（プレイリスト対応）
router.post('/batch', async (req, res) => {
    try {
        const { urls } = req.body;
        
        if (!Array.isArray(urls) || urls.length === 0) {
            return res.status(400).json({
                error: 'Invalid Input',
                message: 'URLsの配列を入力してください'
            });
        }

        if (urls.length > 10) {
            return res.status(400).json({
                error: 'Too Many URLs',
                message: '一度に処理できるURLは10個までです'
            });
        }

        const results = await Promise.allSettled(
            urls.map(async (url) => {
                const videoId = getVideoId(url);
                if (!videoId) {
                    throw new Error('Invalid URL');
                }
                
                const info = await ytdl.getInfo(videoId);
                return {
                    url,
                    videoId,
                    title: info.videoDetails.title,
                    duration: formatDuration(parseInt(info.videoDetails.lengthSeconds)),
                    author: info.videoDetails.author.name,
                    thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url
                };
            })
        );

        const successful = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
            
        const failed = results
            .filter(result => result.status === 'rejected')
            .map((result, index) => ({
                url: urls[index],
                error: result.reason.message
            }));

        res.json({
            successful,
            failed,
            summary: {
                total: urls.length,
                successful: successful.length,
                failed: failed.length
            }
        });

    } catch (error) {
        console.error('Batch info error:', error);
        res.status(500).json({
            error: 'Server Error',
            message: 'バッチ処理中にエラーが発生しました。'
        });
    }
});

module.exports = router;
