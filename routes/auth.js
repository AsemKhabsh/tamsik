const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/UserSQLite');
const { generateToken, authenticateToken, rateLimit } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { logger, asyncHandler, AppError } = require('../utils/errorHandler');

const router = express.Router();

// تسجيل مستخدم جديد
router.post('/register', rateLimit(5, 15 * 60 * 1000), validateUserRegistration, async (req, res) => {
    try {
        const { username, email, password, full_name, phone } = req.body;

        // التحقق من عدم وجود المستخدم مسبقاً
        const existingUserByEmail = await User.findByEmail(email);
        if (existingUserByEmail) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مستخدم بالفعل'
            });
        }

        const existingUserByUsername = await User.findByUsername(username);
        if (existingUserByUsername) {
            return res.status(400).json({
                success: false,
                message: 'اسم المستخدم مستخدم بالفعل'
            });
        }

        // إنشاء token للتحقق
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // إنشاء المستخدم
        const user = await User.create({
            username,
            email,
            password,
            full_name,
            phone,
            verification_token: verificationToken
        });

        // إنشاء JWT token
        const token = generateToken(user.id);

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            data: {
                user: user.toJSON(),
                token,
                verification_required: true
            }
        });

    } catch (error) {
        logger.error('خطأ في تسجيل المستخدم', error, req);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء الحساب',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// تسجيل الدخول
router.post('/login', rateLimit(10, 15 * 60 * 1000), validateUserLogin, async (req, res) => {
    try {
        const { email, password } = req.body;

        // البحث عن المستخدم
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // التحقق من كلمة المرور
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            });
        }

        // إنشاء JWT token
        const token = generateToken(user.id);

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: {
                user: user.toJSON(),
                token
            }
        });

    } catch (error) {
        console.error('خطأ في تسجيل الدخول:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تسجيل الدخول',
            error: error.message
        });
    }
});

// الحصول على بيانات المستخدم الحالي
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                user: req.user.toJSON()
            }
        });
    } catch (error) {
        console.error('خطأ في الحصول على بيانات المستخدم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على البيانات'
        });
    }
});

// تحديث بيانات المستخدم
router.put('/me', authenticateToken, async (req, res) => {
    try {
        const { full_name, phone, bio, location } = req.body;

        const updatedUser = await req.user.update({
            full_name,
            phone,
            bio,
            location
        });

        res.json({
            success: true,
            message: 'تم تحديث البيانات بنجاح',
            data: {
                user: updatedUser.toJSON()
            }
        });

    } catch (error) {
        console.error('خطأ في تحديث البيانات:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث البيانات',
            error: error.message
        });
    }
});

// تغيير كلمة المرور
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        // التحقق من كلمة المرور الحالية
        const isCurrentPasswordValid = await req.user.comparePassword(current_password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'كلمة المرور الحالية غير صحيحة'
            });
        }

        // تشفير كلمة المرور الجديدة
        const hashedNewPassword = await bcrypt.hash(new_password, 12);

        // تحديث كلمة المرور
        await req.user.update({ password: hashedNewPassword });

        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح'
        });

    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تغيير كلمة المرور',
            error: error.message
        });
    }
});

// تحقق البريد الإلكتروني
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;

        // البحث عن المستخدم بـ verification token
        const user = await User.findByVerificationToken(token);
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'رابط التحقق غير صحيح أو منتهي الصلاحية'
            });
        }

        // التحقق من أن المستخدم لم يتم تحققه مسبقاً
        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                message: 'تم تحقق البريد الإلكتروني مسبقاً'
            });
        }

        // تحديث حالة التحقق
        await user.update({
            is_verified: true,
            verification_token: null
        });

        res.json({
            success: true,
            message: 'تم تحقق البريد الإلكتروني بنجاح'
        });

    } catch (error) {
        console.error('خطأ في تحقق البريد الإلكتروني:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحقق البريد الإلكتروني',
            error: error.message
        });
    }
});

// طلب إعادة إرسال رابط التحقق
router.post('/resend-verification', authenticateToken, async (req, res) => {
    try {
        if (req.user.is_verified) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني محقق بالفعل'
            });
        }

        // إنشاء token جديد
        const verificationToken = crypto.randomBytes(32).toString('hex');
        await req.user.update({ verification_token: verificationToken });

        res.json({
            success: true,
            message: 'تم إرسال رابط التحقق الجديد',
            data: {
                verification_token: verificationToken
            }
        });

    } catch (error) {
        console.error('خطأ في إعادة إرسال رابط التحقق:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إعادة إرسال رابط التحقق',
            error: error.message
        });
    }
});

// طلب إعادة تعيين كلمة المرور
router.post('/forgot-password', rateLimit(3, 15 * 60 * 1000), async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            // لا نكشف عن عدم وجود المستخدم لأسباب أمنية
            return res.json({
                success: true,
                message: 'إذا كان البريد الإلكتروني موجود، ستصلك رسالة لإعادة تعيين كلمة المرور'
            });
        }

        // إنشاء token لإعادة تعيين كلمة المرور
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

        await user.update({
            reset_password_token: resetToken,
            reset_password_expires: resetExpires
        });

        res.json({
            success: true,
            message: 'إذا كان البريد الإلكتروني موجود، ستصلك رسالة لإعادة تعيين كلمة المرور',
            data: {
                reset_token: resetToken // في الإنتاج، يتم إرسال هذا عبر البريد الإلكتروني
            }
        });

    } catch (error) {
        console.error('خطأ في طلب إعادة تعيين كلمة المرور:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في طلب إعادة تعيين كلمة المرور',
            error: error.message
        });
    }
});

// إعادة تعيين كلمة المرور
router.post('/reset-password', async (req, res) => {
    try {
        const { token, new_password, email } = req.body;

        // التحقق من وجود البيانات المطلوبة
        if (!token || !new_password || !email) {
            return res.status(400).json({
                success: false,
                message: 'جميع البيانات مطلوبة (token, new_password, email)'
            });
        }

        // البحث عن المستخدم بـ reset token
        const user = await User.findByResetToken(token);
        if (!user || user.email !== email) {
            return res.status(400).json({
                success: false,
                message: 'رابط إعادة تعيين كلمة المرور غير صحيح أو منتهي الصلاحية'
            });
        }

        // تشفير كلمة المرور الجديدة
        const hashedPassword = await bcrypt.hash(new_password, 12);

        // تحديث كلمة المرور وحذف token إعادة التعيين
        await user.update({
            password: hashedPassword,
            reset_password_token: null,
            reset_password_expires: null
        });

        res.json({
            success: true,
            message: 'تم إعادة تعيين كلمة المرور بنجاح'
        });

    } catch (error) {
        console.error('خطأ في إعادة تعيين كلمة المرور:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إعادة تعيين كلمة المرور',
            error: error.message
        });
    }
});

module.exports = router;
