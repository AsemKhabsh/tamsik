/**
 * نسخة مبسطة من middleware المصادقة للاختبار
 */

// مصادقة مبسطة للاختبار
const authenticateToken = (req, res, next) => {
    // للاختبار، نفترض أن المستخدم مسجل دخول
    req.user = {
        id: 1,
        username: 'test_user',
        role: 'user'
    };
    next();
};

// مصادقة اختيارية
const optionalAuth = (req, res, next) => {
    // للاختبار، نضع مستخدم افتراضي
    req.user = {
        id: 1,
        username: 'test_user',
        role: 'user'
    };
    next();
};

// التحقق من دور المدير
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'ليس لديك صلاحية المدير'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    optionalAuth,
    requireAdmin
};
