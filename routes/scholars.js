const express = require('express');
const Scholar = require('../models/Scholar');
const { authenticateToken, requireAdmin, requireScholar, optionalAuth } = require('../middleware/auth');
const { validateScholarCreation, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// الحصول على جميع العلماء
router.get('/', optionalAuth, validatePagination, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            featured,
            active = true,
            search,
            location
        } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            featured: featured !== undefined ? featured === 'true' : undefined,
            active: active === 'true',
            search,
            location
        };

        const result = await Scholar.findAll(options);

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('خطأ في الحصول على العلماء:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على العلماء',
            error: error.message
        });
    }
});

// الحصول على العلماء المميزين
router.get('/featured', async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        const scholars = await Scholar.getFeatured(parseInt(limit));

        res.json({
            success: true,
            data: {
                scholars
            }
        });

    } catch (error) {
        console.error('خطأ في الحصول على العلماء المميزين:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على العلماء المميزين',
            error: error.message
        });
    }
});

// الحصول على عالم محدد
router.get('/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const scholar = await Scholar.findById(id);

        if (!scholar) {
            return res.status(404).json({
                success: false,
                message: 'العالم غير موجود'
            });
        }

        res.json({
            success: true,
            data: {
                scholar
            }
        });

    } catch (error) {
        console.error('خطأ في الحصول على العالم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على العالم',
            error: error.message
        });
    }
});

// إنشاء عالم جديد
router.post('/', authenticateToken, requireAdmin, validateScholarCreation, async (req, res) => {
    try {
        const scholarData = {
            ...req.body,
            user_id: req.body.user_id || null
        };

        const scholar = await Scholar.create(scholarData);

        res.status(201).json({
            success: true,
            message: 'تم إنشاء العالم بنجاح',
            data: {
                scholar
            }
        });

    } catch (error) {
        console.error('خطأ في إنشاء العالم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء العالم',
            error: error.message
        });
    }
});

// تحديث بيانات عالم
router.put('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const scholar = await Scholar.findById(id);

        if (!scholar) {
            return res.status(404).json({
                success: false,
                message: 'العالم غير موجود'
            });
        }

        const updatedScholar = await scholar.update(req.body);

        res.json({
            success: true,
            message: 'تم تحديث بيانات العالم بنجاح',
            data: {
                scholar: updatedScholar
            }
        });

    } catch (error) {
        console.error('خطأ في تحديث العالم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث العالم',
            error: error.message
        });
    }
});

// حذف عالم
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const scholar = await Scholar.findById(id);

        if (!scholar) {
            return res.status(404).json({
                success: false,
                message: 'العالم غير موجود'
            });
        }

        await scholar.delete();

        res.json({
            success: true,
            message: 'تم حذف العالم بنجاح'
        });

    } catch (error) {
        console.error('خطأ في حذف العالم:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف العالم',
            error: error.message
        });
    }
});

// تحديث عدد الفتاوى للعالم
router.post('/:id/update-fatwa-count', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const scholar = await Scholar.findById(id);

        if (!scholar) {
            return res.status(404).json({
                success: false,
                message: 'العالم غير موجود'
            });
        }

        await scholar.updateFatwaCount();

        res.json({
            success: true,
            message: 'تم تحديث عدد الفتاوى بنجاح',
            data: {
                fatwa_count: scholar.fatwa_count
            }
        });

    } catch (error) {
        console.error('خطأ في تحديث عدد الفتاوى:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث عدد الفتاوى',
            error: error.message
        });
    }
});

// تبديل حالة التميز للعالم
router.post('/:id/toggle-featured', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const scholar = await Scholar.findById(id);

        if (!scholar) {
            return res.status(404).json({
                success: false,
                message: 'العالم غير موجود'
            });
        }

        const updatedScholar = await scholar.update({
            is_featured: !scholar.is_featured
        });

        res.json({
            success: true,
            message: `تم ${updatedScholar.is_featured ? 'إضافة' : 'إزالة'} العالم ${updatedScholar.is_featured ? 'إلى' : 'من'} المميزين`,
            data: {
                scholar: updatedScholar
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

// تبديل حالة النشاط للعالم
router.post('/:id/toggle-active', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const scholar = await Scholar.findById(id);

        if (!scholar) {
            return res.status(404).json({
                success: false,
                message: 'العالم غير موجود'
            });
        }

        const updatedScholar = await scholar.update({
            is_active: !scholar.is_active
        });

        res.json({
            success: true,
            message: `تم ${updatedScholar.is_active ? 'تفعيل' : 'إلغاء تفعيل'} العالم`,
            data: {
                scholar: updatedScholar
            }
        });

    } catch (error) {
        console.error('خطأ في تبديل حالة النشاط:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تبديل حالة النشاط',
            error: error.message
        });
    }
});

// البحث في العلماء
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const { page = 1, limit = 10, location } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            location,
            active: true
        };

        const scholars = await Scholar.findAll({
            ...options,
            search: term
        });

        res.json({
            success: true,
            data: scholars
        });

    } catch (error) {
        console.error('خطأ في البحث عن العلماء:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في البحث عن العلماء',
            error: error.message
        });
    }
});

module.exports = router;
