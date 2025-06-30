/**
 * إعدادات الإنتاج - منصة تمسيك
 */

module.exports = {
    // إعدادات الخادم
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'production',
    
    // إعدادات قاعدة البيانات
    database: {
        type: process.env.DB_TYPE || 'sqlite',
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        name: process.env.DB_NAME || 'tamsik_db',
        port: process.env.DB_PORT || 3306
    },
    
    // إعدادات JWT
    jwt: {
        secret: process.env.JWT_SECRET || 'tamsik_jwt_secret_key_2024_production',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    },
    
    // إعدادات البريد الإلكتروني
    email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
    },
    
    // إعدادات الملفات
    upload: {
        maxSize: process.env.MAX_FILE_SIZE || 10485760, // 10MB
        path: process.env.UPLOAD_PATH || './uploads'
    },
    
    // إعدادات الأمان
    security: {
        corsOrigin: process.env.CORS_ORIGIN || '*',
        rateLimitWindow: process.env.RATE_LIMIT_WINDOW || 900000, // 15 minutes
        rateLimitMax: process.env.RATE_LIMIT_MAX || 100
    },
    
    // إعدادات التطبيق
    app: {
        name: process.env.APP_NAME || 'تمسيك',
        url: process.env.APP_URL || 'http://localhost:3000'
    }
}; 