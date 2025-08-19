const express = require('express');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// システム情報の取得
function getSystemInfo() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024)
        },
        cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
        },
        system: {
            platform: os.platform(),
            arch: os.arch(),
            nodeVersion: process.version,
            totalMemory: Math.round(os.totalmem() / 1024 / 1024),
            freeMemory: Math.round(os.freemem() / 1024 / 1024),
            loadAverage: os.loadavg()
        }
    };
}

// 基本的なヘルスチェック
router.get('/', (req, res) => {
    const healthCheck = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        service: 'YouTube Downloader API',
        version: '1.0.0',
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
    };

    res.json(healthCheck);
});

// 詳細なシステム情報
router.get('/detailed', async (req, res) => {
    try {
        const systemInfo = getSystemInfo();
        
        // 一時ディレクトリの情報
        const tempDir = path.join(__dirname, '../temp');
        let tempDirInfo = {
            exists: false,
            files: 0,
            totalSize: 0
        };

        try {
            await fs.access(tempDir);
            tempDirInfo.exists = true;
            
            const files = await fs.readdir(tempDir);
            tempDirInfo.files = files.length;
            
            for (const file of files) {
                try {
                    const stats = await fs.stat(path.join(tempDir, file));
                    tempDirInfo.totalSize += stats.size;
                } catch (error) {
                    // ファイルが削除された場合などはスキップ
                }
            }
        } catch (error) {
            // 一時ディレクトリが存在しない場合
        }

        const detailedHealth = {
            ...systemInfo,
            tempDirectory: {
                ...tempDirInfo,
                totalSizeMB: Math.round(tempDirInfo.totalSize / 1024 / 1024)
            },
            dependencies: {
                ytdlCore: require('ytdl-core/package.json').version,
                ffmpeg: 'static',
                express: require('express/package.json').version
            }
        };

        res.json(detailedHealth);

    } catch (error) {
        console.error('Detailed health check error:', error);
        res.status(500).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// 依存関係のチェック
router.get('/dependencies', async (req, res) => {
    const checks = [];

    // ytdl-core のテスト
    try {
        const ytdl = require('ytdl-core');
        const testVideoId = 'dQw4w9WgXcQ'; // Rick Astley - Never Gonna Give You Up
        const info = await ytdl.getBasicInfo(testVideoId);
        checks.push({
            name: 'ytdl-core',
            status: 'OK',
            message: 'YouTube API access working',
            testVideo: info.videoDetails.title
        });
    } catch (error) {
        checks.push({
            name: 'ytdl-core',
            status: 'ERROR',
            message: error.message
        });
    }

    // FFmpeg のテスト
    try {
        const ffmpeg = require('fluent-ffmpeg');
        const ffmpegStatic = require('ffmpeg-static');
        ffmpeg.setFfmpegPath(ffmpegStatic);
        
        checks.push({
            name: 'ffmpeg',
            status: 'OK',
            message: 'FFmpeg binary available',
            path: ffmpegStatic
        });
    } catch (error) {
        checks.push({
            name: 'ffmpeg',
            status: 'ERROR',
            message: error.message
        });
    }

    // 一時ディレクトリの書き込みテスト
    try {
        const tempDir = path.join(__dirname, '../temp');
        await fs.mkdir(tempDir, { recursive: true });
        
        const testFile = path.join(tempDir, 'health-check-test.txt');
        await fs.writeFile(testFile, 'test');
        await fs.unlink(testFile);
        
        checks.push({
            name: 'temp-directory',
            status: 'OK',
            message: 'Temp directory writable',
            path: tempDir
        });
    } catch (error) {
        checks.push({
            name: 'temp-directory',
            status: 'ERROR',
            message: error.message
        });
    }

    const allOk = checks.every(check => check.status === 'OK');
    
    res.status(allOk ? 200 : 503).json({
        status: allOk ? 'OK' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        checks
    });
});

// サーバー統計情報
router.get('/stats', (req, res) => {
    const stats = {
        timestamp: new Date().toISOString(),
        server: {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            cpuUsage: process.cpuUsage(),
            pid: process.pid,
            platform: process.platform,
            nodeVersion: process.version
        },
        system: {
            hostname: os.hostname(),
            platform: os.platform(),
            arch: os.arch(),
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAverage: os.loadavg(),
            cpus: os.cpus().length
        }
    };

    res.json(stats);
});

module.exports = router;
