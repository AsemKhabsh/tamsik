const jwt = require('jsonwebtoken');
const User = require('../models/UserSQLite');

// التحقق من صحة الـ JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'رمز الوصول مطلوب'
            });
        }

        // التحقق من صحة الـ token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // البحث عن المستخدم
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'رمز الوصول غير صحيح'
            });
        }

        // إضافة بيانات المستخدم إلى الطلب
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'رمز الوصول غير صحيح'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'رمز الوصول منتهي الصلاحية'
            });
        } else {
            console.error('خطأ في التحقق من المصادقة:', error);
            return res.status(500).json({
                success: false,
                message: 'خطأ في الخادم'
            });
        }
    }
};

// التحقق من صحة الـ token (اختياري)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            if (user) {
                req.user = user;
            }
        }

        next();
    } catch (error) {
        // في حالة الـ optional auth، نتجاهل الأخطاء ونكمل
        next();
    }
};

// التحقق من دور المستخدم
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        // تحويل roles إلى array إذا كان string
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
            });
        }

        next();
    };
};

// التحقق من أن المستخدم مدير
const requireAdmin = requireRole('admin');

// التحقق من أن المستخدم عالم أو مدير
const requireScholar = requireRole(['scholar', 'admin']);

// التحقق من أن المستخدم محقق (verified)
const requireVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'يجب تسجيل الدخول أولاً'
        });
    }

    if (!req.user.is_verified) {
        return res.status(403).json({
            success: false,
            message: 'يجب تحقق البريد الإلكتروني أولاً'
        });
    }

    next();
};

// التحقق من ملكية المورد أو كونه مدير
const requireOwnershipOrAdmin = (resourceUserIdField = 'user_id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'يجب تسجيل الدخول أولاً'
            });
        }

        // المدير يمكنه الوصول لكل شيء
        if (req.user.role === 'admin') {
            return next();
        }

        // التحقق من الملكية
        const resourceUserId = req.resource && req.resource[resourceUserIdField];
        if (resourceUserId && resourceUserId === req.user.id) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
        });
    };
};

// إنشاء JWT token
const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// التحقق من صحة refresh token (للاستخدام المستقبلي)
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// إنشاء refresh token
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// middleware لتسجيل محاولات الوصول
const logAccess = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const userId = req.user ? req.user.id : 'غير مسجل';

    console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - User: ${userId} - Agent: ${userAgent}`);
    
    next();
};

// middleware لمعدل الطلبات (Rate Limiting)
const rateLimitStore = new Map();

const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;

        // تنظيف الطلبات القديمة
        if (rateLimitStore.has(key)) {
            const requests = rateLimitStore.get(key).filter(time => time > windowStart);
            rateLimitStore.set(key, requests);
        } else {
            rateLimitStore.set(key, []);
        }

        const requests = rateLimitStore.get(key);

        if (requests.length >= maxRequests) {
            return res.status(429).json({
                success: false,
                message: 'تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً'
            });
        }

        requests.push(now);
        rateLimitStore.set(key, requests);

        next();
    };
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireRole,
    requireAdmin,
    requireScholar,
    requireVerified,
    requireOwnershipOrAdmin,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken,
    logAccess,
    rateLimit
};
