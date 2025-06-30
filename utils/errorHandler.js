const fs = require('fs');
const path = require('path');

// إنشاء مجلد logs إذا لم يكن موجوداً
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// دالة لكتابة السجلات
const writeLog = (level, message, error = null, req = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        error: error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
        } : null,
        request: req ? {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            userId: req.user ? req.user.id : null
        } : null
    };

    const logString = JSON.stringify(logEntry, null, 2) + '\n';
    const logFile = path.join(logsDir, `${level}-${new Date().toISOString().split('T')[0]}.log`);
    
    fs.appendFileSync(logFile, logString);
    
    // طباعة في وحدة التحكم أيضاً
    if (level === 'error') {
        console.error(`[${timestamp}] ERROR: ${message}`, error);
    } else if (level === 'warn') {
        console.warn(`[${timestamp}] WARN: ${message}`);
    } else {
        console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
};

// دوال مساعدة للسجلات
const logger = {
    error: (message, error = null, req = null) => writeLog('error', message, error, req),
    warn: (message, req = null) => writeLog('warn', message, null, req),
    info: (message, req = null) => writeLog('info', message, null, req),
    debug: (message, req = null) => writeLog('debug', message, null, req)
};

// معالج الأخطاء المخصص
class AppError extends Error {
    constructor(message, statusCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

        Error.captureStackTrace(this, this.constructor);
    }
}

// دالة لمعالجة الأخطاء في async functions
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// معالج الأخطاء العام
const globalErrorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // تسجيل الخطأ
    logger.error('خطأ غير متوقع', err, req);

    // أخطاء قاعدة البيانات SQLite
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const message = 'البيانات مكررة، يرجى استخدام قيم مختلفة';
        error = new AppError(message, 400);
    }

    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        const message = 'مرجع غير صحيح في البيانات';
        error = new AppError(message, 400);
    }

    if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
        const message = 'حقل مطلوب مفقود';
        error = new AppError(message, 400);
    }

    // أخطاء قاعدة البيانات MySQL (للتوافق)
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'البيانات مكررة، يرجى استخدام قيم مختلفة';
        error = new AppError(message, 400);
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = 'مرجع غير صحيح في البيانات';
        error = new AppError(message, 400);
    }

    // أخطاء JWT
    if (err.name === 'JsonWebTokenError') {
        const message = 'رمز الوصول غير صحيح';
        error = new AppError(message, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'رمز الوصول منتهي الصلاحية';
        error = new AppError(message, 401);
    }

    // أخطاء التحقق من صحة البيانات
    if (err.name === 'ValidationError') {
        const message = 'بيانات غير صحيحة';
        error = new AppError(message, 400);
    }

    // أخطاء الملفات
    if (err.code === 'ENOENT') {
        const message = 'الملف المطلوب غير موجود';
        error = new AppError(message, 404);
    }

    if (err.code === 'EACCES') {
        const message = 'ليس لديك صلاحية للوصول إلى هذا الملف';
        error = new AppError(message, 403);
    }

    // أخطاء الشبكة
    if (err.code === 'ECONNREFUSED') {
        const message = 'فشل في الاتصال بالخدمة';
        error = new AppError(message, 503);
    }

    // أخطاء حجم الملف
    if (err.code === 'LIMIT_FILE_SIZE') {
        const message = 'حجم الملف كبير جداً';
        error = new AppError(message, 413);
    }

    // إرسال الاستجابة
    const statusCode = error.statusCode || 500;
    const message = error.isOperational ? error.message : 'خطأ داخلي في الخادم';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack,
            code: err.code
        })
    });
};

// دالة لمعالجة الأخطاء غير المعالجة
const handleUncaughtExceptions = () => {
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception', err);
        console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
        process.exit(1);
    });

    process.on('unhandledRejection', (err) => {
        logger.error('Unhandled Rejection', err);
        console.log('UNHANDLED REJECTION! 💥 Shutting down...');
        process.exit(1);
    });
};

// دالة لتنظيف السجلات القديمة (أكثر من 30 يوم)
const cleanOldLogs = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        const files = fs.readdirSync(logsDir);
        files.forEach(file => {
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.mtime < thirtyDaysAgo) {
                fs.unlinkSync(filePath);
                logger.info(`تم حذف ملف السجل القديم: ${file}`);
            }
        });
    } catch (error) {
        logger.error('خطأ في تنظيف السجلات القديمة', error);
    }
};

// تشغيل تنظيف السجلات يومياً
setInterval(cleanOldLogs, 24 * 60 * 60 * 1000); // كل 24 ساعة

// دوال مساعدة لمعالجة الأخطاء الشائعة
const handleNotFound = (resource = 'المورد') => {
    return new AppError(`${resource} غير موجود`, 404);
};

const handleUnauthorized = (message = 'يجب تسجيل الدخول أولاً') => {
    return new AppError(message, 401);
};

const handleForbidden = (message = 'ليس لديك صلاحية للوصول إلى هذا المورد') => {
    return new AppError(message, 403);
};

const handleValidationError = (errors) => {
    const message = 'بيانات غير صحيحة';
    const error = new AppError(message, 400);
    error.errors = errors;
    return error;
};

const handleDuplicateError = (field = 'البيانات') => {
    return new AppError(`${field} مكررة، يرجى استخدام قيم مختلفة`, 400);
};

// دالة لإنشاء استجابة خطأ موحدة
const createErrorResponse = (message, statusCode = 500, errors = null) => {
    return {
        success: false,
        message,
        ...(errors && { errors }),
        timestamp: new Date().toISOString()
    };
};

// دالة لإنشاء استجابة نجاح موحدة
const createSuccessResponse = (data, message = 'تمت العملية بنجاح') => {
    return {
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    logger,
    AppError,
    asyncHandler,
    globalErrorHandler,
    handleUncaughtExceptions,
    cleanOldLogs,
    handleNotFound,
    handleUnauthorized,
    handleForbidden,
    handleValidationError,
    handleDuplicateError,
    createErrorResponse,
    createSuccessResponse
};
