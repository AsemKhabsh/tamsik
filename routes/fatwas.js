const express = require('express');
const Fatwa = require('../models/Fatwa');
const { authenticateToken, requireAdmin, requireScholar, optionalAuth } = require('../middleware/auth');
const { validateFatwaCreation, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// الحصول على جميع الفتاوى
router.get('/', optionalAuth, validatePagination, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status = 'approved',
            category_id,
            scholar_id,
            featured,
            search,
            sort = 'newest'
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            status: req.user && req.user.role === 'admin' ? status : 'approved',
            category_id: category_id ? parseInt(category_id) : undefined,
            scholar_id: scholar_id ? parseInt(scholar_id) : undefined,
            featured: featured !== undefined ? featured === 'true' : undefined,
            search,
            sort
        };

        const result = await Fatwa.findAll(options);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('خطأ في الحصول على الفتاوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على الفتاوى',
            error: error.message
        });
    }
});

// الحصول على الفتاوى المميزة
router.get('/featured', async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        const fatwas = await Fatwa.getFeatured(parseInt(limit));

        res.json({
            success: true,
            data: {
                fatwas
            }
        });

    } catch (error) {
        console.error('خطأ في الحصول على الفتاوى المميزة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على الفتاوى المميزة',
            error: error.message
        });
    }
});

// الحصول على إحصائيات الفتاوى
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await Fatwa.getStats();

        res.json({
            success: true,
            data: {
                stats
            }
        });

    } catch (error) {
        console.error('خطأ في الحصول على إحصائيات الفتاوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على إحصائيات الفتاوى',
            error: error.message
        });
    }
});

// الحصول على فتوى محددة
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const fatwa = await Fatwa.findById(id);

        if (!fatwa) {
            return res.status(404).json({
                success: false,
                message: 'الفتوى غير موجودة'
            });
        }

        // زيادة عدد المشاهدات
        await fatwa.incrementViews();

        res.json({
            success: true,
            data: {
                fatwa
            }
        });

    } catch (error) {
        console.error('خطأ في الحصول على الفتوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على الفتوى',
            error: error.message
        });
    }
});

// إنشاء فتوى جديدة (سؤال)
router.post('/', optionalAuth, validateFatwaCreation, async (req, res) => {
    try {
        const fatwaData = {
            ...req.body,
            status: 'pending' // الفتاوى الجديدة تحتاج موافقة
        };

        // إذا كان المستخدم عالم، يمكنه إنشاء فتوى مباشرة
        if (req.user && req.user.role === 'scholar') {
            fatwaData.status = 'approved';
        }

        const fatwa = await Fatwa.create(fatwaData);

        res.status(201).json({
            success: true,
            message: 'تم إرسال السؤال بنجاح',
            data: {
                fatwa
            }
        });

    } catch (error) {
        console.error('خطأ في إنشاء الفتوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إرسال السؤال',
            error: error.message
        });
    }
});

// تحديث فتوى
router.put('/:id', authenticateToken, requireScholar, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const fatwa = await Fatwa.findById(id);

        if (!fatwa) {
            return res.status(404).json({
                success: false,
                message: 'الفتوى غير موجودة'
            });
        }

        // التحقق من الصلاحية
        if (req.user.role !== 'admin' && fatwa.scholar_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لتعديل هذه الفتوى'
            });
        }

        const updatedFatwa = await fatwa.update(req.body);

        res.json({
            success: true,
            message: 'تم تحديث الفتوى بنجاح',
            data: {
                fatwa: updatedFatwa
            }
        });

    } catch (error) {
        console.error('خطأ في تحديث الفتوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الفتوى',
            error: error.message
        });
    }
});

// حذف فتوى
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const fatwa = await Fatwa.findById(id);

        if (!fatwa) {
            return res.status(404).json({
                success: false,
                message: 'الفتوى غير موجودة'
            });
        }

        await fatwa.delete();

        res.json({
            success: true,
            message: 'تم حذف الفتوى بنجاح'
        });

    } catch (error) {
        console.error('خطأ في حذف الفتوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف الفتوى',
            error: error.message
        });
    }
});

// الموافقة على فتوى
router.post('/:id/approve', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const fatwa = await Fatwa.findById(id);

        if (!fatwa) {
            return res.status(404).json({
                success: false,
                message: 'الفتوى غير موجودة'
            });
        }

        const updatedFatwa = await fatwa.update({ status: 'approved' });

        res.json({
            success: true,
            message: 'تم الموافقة على الفتوى',
            data: {
                fatwa: updatedFatwa
            }
        });

    } catch (error) {
        console.error('خطأ في الموافقة على الفتوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الموافقة على الفتوى',
            error: error.message
        });
    }
});

// رفض فتوى
router.post('/:id/reject', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const fatwa = await Fatwa.findById(id);

        if (!fatwa) {
            return res.status(404).json({
                success: false,
                message: 'الفتوى غير موجودة'
            });
        }

        const updatedFatwa = await fatwa.update({ status: 'rejected' });

        res.json({
            success: true,
            message: 'تم رفض الفتوى',
            data: {
                fatwa: updatedFatwa
            }
        });

    } catch (error) {
        console.error('خطأ في رفض الفتوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في رفض الفتوى',
            error: error.message
        });
    }
});

// تبديل حالة التميز للفتوى
router.post('/:id/toggle-featured', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const fatwa = await Fatwa.findById(id);

        if (!fatwa) {
            return res.status(404).json({
                success: false,
                message: 'الفتوى غير موجودة'
            });
        }

        const updatedFatwa = await fatwa.update({
            is_featured: !fatwa.is_featured
        });

        res.json({
            success: true,
            message: `تم ${updatedFatwa.is_featured ? 'إضافة' : 'إزالة'} الفتوى ${updatedFatwa.is_featured ? 'إلى' : 'من'} المميزة`,
            data: {
                fatwa: updatedFatwa
            }
        });

    } catch (error) {
        console.error('خطأ في تبديل حالة التميز:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تبديل حالة التميز',
            error: error.message
        });
    }
});

// إعجاب بفتوى
router.post('/:id/like', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const fatwa = await Fatwa.findById(id);

        if (!fatwa) {
            return res.status(404).json({
                success: false,
                message: 'الفتوى غير موجودة'
            });
        }

        await fatwa.incrementLikes();

        res.json({
            success: true,
            message: 'تم الإعجاب بالفتوى',
            data: {
                likes_count: fatwa.likes_count
            }
        });

    } catch (error) {
        console.error('خطأ في الإعجاب بالفتوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الإعجاب بالفتوى',
            error: error.message
        });
    }
});

// البحث في الفتاوى
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const { page = 1, limit = 10, category_id } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            category_id: category_id ? parseInt(category_id) : undefined
        };

        const fatwas = await Fatwa.search(term, options);

        res.json({
            success: true,
            data: {
                fatwas
            }
        });

    } catch (error) {
        console.error('خطأ في البحث عن الفتاوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في البحث عن الفتاوى',
            error: error.message
        });
    }
});

module.exports = router;
