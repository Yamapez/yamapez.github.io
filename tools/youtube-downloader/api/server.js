const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('rate-limiter-flexible');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// ルートインポート
const downloadRoutes = require('./routes/download');
const infoRoutes = require('./routes/info');
const healthRoutes = require('./routes/health');

// Express アプリケーション初期化
const app = express();
const PORT = process.env.PORT || 3001;
const ENV = process.env.NODE_ENV || 'development';

// セキュリティ設定
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// レート制限設定
const rateLimiter = new rateLimit.RateLimiterMemory({
    points: ENV === 'production' ? 10 : 100, // リクエスト数
    duration: 60, // 1分間
    blockDuration: 60 * 5, // 5分間ブロック
});

// レート制限ミドルウェア
const rateLimiterMiddleware = async (req, res, next) => {
    try {
        const clientIP = req.ip || req.connection.remoteAddress;
        await rateLimiter.consume(clientIP);
        next();
    } catch (rejRes) {
        const remainingPoints = rejRes.remainingPoints || 0;
        const msBeforeNext = rejRes.msBeforeNext || 0;
        
        res.set({
            'Retry-After': Math.round(msBeforeNext / 1000) || 1,
            'X-RateLimit-Limit': 10,
            'X-RateLimit-Remaining': remainingPoints,
            'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext),
        });
        
        res.status(429).json({
            error: 'Too Many Requests',
            message: 'レート制限に達しました。しばらく待ってから再試行してください。',
            retryAfter: Math.round(msBeforeNext / 1000)
        });
    }
};

// ミドルウェア設定
app.use(compression());
app.use(morgan(ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS設定
const corsOptions = {
    origin: ENV === 'production' 
        ? ['https://yamapez.github.io', 'https://www.yamapez.github.io']
        : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// 静的ファイル配信（開発環境のみ）
if (ENV === 'development') {
    app.use('/tools', express.static(path.join(__dirname, '../tools')));
}

// レート制限適用
app.use('/api/', rateLimiterMiddleware);

// ルート設定
app.use('/api/health', healthRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/download', downloadRoutes);

// ルートエンドポイント
app.get('/', (req, res) => {
    res.json({
        name: 'YouTube Downloader API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            health: '/api/health',
            info: '/api/info/:videoId',
            download: '/api/download'
        },
        documentation: 'https://yamapez.github.io/tools/README.md'
    });
});

// 404エラーハンドリング
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'リクエストされたエンドポイントが見つかりません。',
        path: req.originalUrl
    });
});

// エラーハンドリング
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    // ytdl-core特有のエラー
    if (error.message && error.message.includes('Video unavailable')) {
        return res.status(404).json({
            error: 'Video Not Found',
            message: '動画が見つからないか、プライベート動画です。'
        });
    }
    
    // バリデーションエラー
    if (error.isJoi) {
        return res.status(400).json({
            error: 'Validation Error',
            message: error.details[0].message
        });
    }
    
    // デフォルトエラー
    res.status(500).json({
        error: 'Internal Server Error',
        message: ENV === 'production' 
            ? 'サーバー内部エラーが発生しました。' 
            : error.message
    });
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// サーバー起動
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 YouTube Downloader API Server`);
        console.log(`📡 Running on http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${ENV}`);
        console.log(`📝 Logs: ${ENV === 'production' ? 'combined' : 'dev'}`);
        console.log(`⏰ Started at: ${new Date().toISOString()}`);
    });
}

module.exports = app;
