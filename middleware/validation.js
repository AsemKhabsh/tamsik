const { body, param, query, validationResult } = require('express-validator');

// معالج أخطاء التحقق
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'بيانات غير صحيحة',
            errors: errors.array().map(error => ({
                field: error.path,
                message: error.msg,
                value: error.value
            }))
        });
    }
    next();
};

// قواعد التحقق للمستخدمين
const validateUserRegistration = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرف')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('اسم المستخدم يجب أن يحتوي على أحرف وأرقام و _ فقط'),
    
    body('email')
        .isEmail()
        .withMessage('البريد الإلكتروني غير صحيح')
        .normalizeEmail(),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم'),
    
    body('full_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('رقم الهاتف غير صحيح'),
    
    handleValidationErrors
];

const validateUserLogin = [
    body('email')
        .isEmail()
        .withMessage('البريد الإلكتروني غير صحيح')
        .normalizeEmail(),
    
    body('password')
        .notEmpty()
        .withMessage('كلمة المرور مطلوبة'),
    
    handleValidationErrors
];

const validateUserUpdate = [
    body('username')
        .optional()
        .isLength({ min: 3, max: 50 })
        .withMessage('اسم المستخدم يجب أن يكون بين 3 و 50 حرف'),
    
    body('full_name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('الاسم الكامل يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    
    body('phone')
        .optional()
        .isMobilePhone('any')
        .withMessage('رقم الهاتف غير صحيح'),
    
    body('bio')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('النبذة الشخصية يجب أن تكون أقل من 1000 حرف'),
    
    handleValidationErrors
];

// قواعد التحقق للعلماء
const validateScholarCreation = [
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم العالم يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    
    body('title')
        .optional()
        .isLength({ max: 200 })
        .withMessage('اللقب يجب أن يكون أقل من 200 حرف'),
    
    body('specialization')
        .optional()
        .isLength({ max: 200 })
        .withMessage('التخصص يجب أن يكون أقل من 200 حرف'),
    
    body('location')
        .optional()
        .isLength({ max: 100 })
        .withMessage('الموقع يجب أن يكون أقل من 100 حرف'),
    
    handleValidationErrors
];

// قواعد التحقق للفتاوى
const validateFatwaCreation = [
    body('scholar_id')
        .isInt({ min: 1 })
        .withMessage('معرف العالم مطلوب ويجب أن يكون رقم صحيح'),
    
    body('title')
        .isLength({ min: 5, max: 500 })
        .withMessage('عنوان الفتوى يجب أن يكون بين 5 و 500 حرف')
        .trim(),
    
    body('question')
        .isLength({ min: 10 })
        .withMessage('السؤال يجب أن يكون 10 أحرف على الأقل')
        .trim(),
    
    body('answer')
        .optional()
        .isLength({ min: 10 })
        .withMessage('الإجابة يجب أن تكون 10 أحرف على الأقل')
        .trim(),
    
    body('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('معرف التصنيف يجب أن يكون رقم صحيح'),
    
    handleValidationErrors
];

// قواعد التحقق للخطب
const validateSermonCreation = [
    body('title')
        .isLength({ min: 5, max: 500 })
        .withMessage('عنوان الخطبة يجب أن يكون بين 5 و 500 حرف')
        .trim(),
    
    body('content')
        .isLength({ min: 50 })
        .withMessage('محتوى الخطبة يجب أن يكون 50 حرف على الأقل')
        .trim(),
    
    body('author')
        .optional()
        .isLength({ max: 100 })
        .withMessage('اسم المؤلف يجب أن يكون أقل من 100 حرف'),
    
    body('category_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('معرف التصنيف يجب أن يكون رقم صحيح'),
    
    handleValidationErrors
];

// قواعد التحقق للمحاضرات
const validateLectureCreation = [
    body('title')
        .isLength({ min: 5, max: 500 })
        .withMessage('عنوان المحاضرة يجب أن يكون بين 5 و 500 حرف')
        .trim(),
    
    body('lecturer_name')
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم المحاضر يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    
    body('type')
        .isIn(['محاضرة', 'درس', 'ندوة', 'دورة'])
        .withMessage('نوع المحاضرة غير صحيح'),
    
    body('province')
        .isLength({ min: 2, max: 50 })
        .withMessage('المحافظة مطلوبة')
        .trim(),
    
    body('location')
        .isLength({ min: 2, max: 200 })
        .withMessage('المكان يجب أن يكون بين 2 و 200 حرف')
        .trim(),
    
    body('day_of_week')
        .isIn(['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'])
        .withMessage('يوم الأسبوع غير صحيح'),
    
    body('time')
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('الوقت يجب أن يكون بصيغة HH:MM'),
    
    handleValidationErrors
];

// قواعد التحقق للتصنيفات
const validateCategoryCreation = [
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم التصنيف يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    
    body('slug')
        .isLength({ min: 2, max: 100 })
        .withMessage('الرابط المختصر يجب أن يكون بين 2 و 100 حرف')
        .matches(/^[a-z0-9-_]+$/)
        .withMessage('الرابط المختصر يجب أن يحتوي على أحرف صغيرة وأرقام و - و _ فقط'),
    
    body('type')
        .isIn(['sermon', 'fatwa', 'lecture', 'article'])
        .withMessage('نوع التصنيف غير صحيح'),
    
    body('parent_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('معرف التصنيف الأب يجب أن يكون رقم صحيح'),
    
    handleValidationErrors
];

// قواعد التحقق للنشرة البريدية
const validateNewsletterSubscription = [
    body('email')
        .isEmail()
        .withMessage('البريد الإلكتروني غير صحيح')
        .normalizeEmail(),
    
    body('name')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('الاسم يجب أن يكون بين 2 و 100 حرف')
        .trim(),
    
    handleValidationErrors
];

// قواعد التحقق للمعرفات
const validateId = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('المعرف يجب أن يكون رقم صحيح'),
    
    handleValidationErrors
];

// قواعد التحقق لمعاملات الاستعلام
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('رقم الصفحة يجب أن يكون رقم صحيح أكبر من 0'),
    
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('حد النتائج يجب أن يكون بين 1 و 100'),
    
    handleValidationErrors
];

// قواعد التحقق للبحث
const validateSearch = [
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('كلمة البحث يجب أن تكون بين 2 و 100 حرف')
        .trim(),
    
    handleValidationErrors
];

// دالة مساعدة لإنشاء قواعد تحقق مخصصة
const createCustomValidator = (field, rules) => {
    return [
        body(field).custom(rules),
        handleValidationErrors
    ];
};

// قواعد التحقق للمفكرين
const validateThinkerCreation = [
    body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('اسم المفكر يجب أن يكون بين 2 و 100 حرف')
        .trim(),

    body('title')
        .optional()
        .isLength({ max: 200 })
        .withMessage('اللقب يجب أن يكون أقل من 200 حرف'),

    body('bio')
        .optional()
        .isLength({ max: 2000 })
        .withMessage('السيرة الذاتية يجب أن تكون أقل من 2000 حرف'),

    body('specialization')
        .optional()
        .isLength({ max: 200 })
        .withMessage('التخصص يجب أن يكون أقل من 200 حرف'),

    handleValidationErrors
];

// قواعد التحقق للاقتراحات
const validateSuggestionCreation = [
    body('type')
        .isIn(['verse', 'hadith', 'poetry', 'saja', 'athar', 'dua'])
        .withMessage('نوع الاقتراح غير صحيح'),

    body('content')
        .isLength({ min: 5, max: 2000 })
        .withMessage('محتوى الاقتراح يجب أن يكون بين 5 و 2000 حرف')
        .trim(),

    body('source')
        .optional()
        .isLength({ max: 200 })
        .withMessage('المصدر يجب أن يكون أقل من 200 حرف'),

    body('category')
        .optional()
        .isLength({ max: 100 })
        .withMessage('التصنيف يجب أن يكون أقل من 100 حرف'),

    handleValidationErrors
];

// قواعد التحقق لتحديث كلمة المرور
const validatePasswordChange = [
    body('currentPassword')
        .notEmpty()
        .withMessage('كلمة المرور الحالية مطلوبة'),

    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('كلمة المرور الجديدة يجب أن تحتوي على حرف كبير وصغير ورقم'),

    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.newPassword) {
                throw new Error('تأكيد كلمة المرور غير متطابق');
            }
            return true;
        }),

    handleValidationErrors
];

// قواعد التحقق للملفات
const validateFileUpload = [
    body('file')
        .custom((value, { req }) => {
            if (!req.file) {
                throw new Error('الملف مطلوب');
            }

            // التحقق من نوع الملف
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
            if (!allowedTypes.includes(req.file.mimetype)) {
                throw new Error('نوع الملف غير مدعوم');
            }

            // التحقق من حجم الملف (5MB)
            if (req.file.size > 5 * 1024 * 1024) {
                throw new Error('حجم الملف كبير جداً (الحد الأقصى 5MB)');
            }

            return true;
        }),

    handleValidationErrors
];

// قواعد التحقق للتقييمات
const validateRating = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('التقييم يجب أن يكون بين 1 و 5'),

    body('comment')
        .optional()
        .isLength({ max: 500 })
        .withMessage('التعليق يجب أن يكون أقل من 500 حرف')
        .trim(),

    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateUserRegistration,
    validateUserLogin,
    validateUserUpdate,
    validateScholarCreation,
    validateFatwaCreation,
    validateSermonCreation,
    validateLectureCreation,
    validateCategoryCreation,
    validateNewsletterSubscription,
    validateThinkerCreation,
    validateSuggestionCreation,
    validatePasswordChange,
    validateFileUpload,
    validateRating,
    validateId,
    validatePagination,
    validateSearch,
    createCustomValidator
};
