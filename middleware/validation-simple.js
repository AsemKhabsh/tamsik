/**
 * نسخة مبسطة من middleware التحقق للاختبار
 */

// معالج أخطاء التحقق المبسط
const handleValidationErrors = (req, res, next) => {
    // للاختبار، نتجاهل التحقق ونكمل
    next();
};

// قواعد التحقق المبسطة للخطب
const validateSermonCreation = [
    (req, res, next) => {
        // تحقق بسيط
        if (!req.body.title && !req.body['main-title']) {
            return res.status(400).json({
                success: false,
                message: 'عنوان الخطبة مطلوب'
            });
        }
        next();
    }
];

// قواعد التحقق للمعرفات
const validateId = [
    (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id < 1) {
            return res.status(400).json({
                success: false,
                message: 'معرف غير صحيح'
            });
        }
        next();
    }
];

// قواعد التحقق لمعاملات الاستعلام
const validatePagination = [
    (req, res, next) => {
        // تحقق بسيط من معاملات الصفحة
        if (req.query.page && (isNaN(req.query.page) || parseInt(req.query.page) < 1)) {
            req.query.page = 1;
        }
        if (req.query.limit && (isNaN(req.query.limit) || parseInt(req.query.limit) < 1)) {
            req.query.limit = 10;
        }
        next();
    }
];

module.exports = {
    handleValidationErrors,
    validateSermonCreation,
    validateId,
    validatePagination
};
