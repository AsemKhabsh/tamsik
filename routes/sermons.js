const express = require('express');
const Sermon = require('../models/Sermon');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth-simple');
const { validateSermonCreation, validateId, validatePagination } = require('../middleware/validation-simple');
const {
    asyncHandler,
    handleNotFound,
    createSuccessResponse,
    createErrorResponse
} = require('../utils/errorHandler');

const router = express.Router();

// الحصول على جميع الخطب
router.get('/', optionalAuth, validatePagination, asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        status = 'published',
        category_id,
        user_id,
        featured,
        search,
        sort = 'newest'
    } = req.query;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status: req.user && req.user.role === 'admin' ? status : 'published',
        category_id: category_id ? parseInt(category_id) : undefined,
        user_id: user_id ? parseInt(user_id) : undefined,
        featured: featured !== undefined ? featured === 'true' : undefined,
        search,
        sort
    };

    const result = await Sermon.findAll(options);
    res.json(createSuccessResponse(result, 'تم الحصول على الخطب بنجاح'));
}));

// الحصول على الخطب المميزة
router.get('/featured', async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        const sermons = await Sermon.getFeatured(parseInt(limit));
        res.json({ success: true, data: { sermons } });
    } catch (error) {
        console.error('خطأ في الحصول على الخطب المميزة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في الحصول على الخطب المميزة',
            error: error.message
        });
    }
});

// الحصول على خطبة محددة
router.get('/:id', validateId, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const sermon = await Sermon.findById(id);

    if (!sermon) {
        throw handleNotFound('الخطبة');
    }

    await sermon.incrementViews();
    res.json(createSuccessResponse({ sermon }, 'تم الحصول على الخطبة بنجاح'));
}));

// إنشاء خطبة جديدة
router.post('/', authenticateToken, validateSermonCreation, async (req, res) => {
    try {
        const sermonData = {
            ...req.body,
            user_id: req.user.id,
            status: req.user.role === 'admin' ? 'published' : 'draft'
        };

        const sermon = await Sermon.create(sermonData);
        res.status(201).json({
            success: true,
            message: 'تم إنشاء الخطبة بنجاح',
            data: { sermon }
        });

    } catch (error) {
        console.error('خطأ في إنشاء الخطبة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في إنشاء الخطبة',
            error: error.message
        });
    }
});

// تحديث خطبة
router.put('/:id', authenticateToken, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const sermon = await Sermon.findById(id);

        if (!sermon) {
            return res.status(404).json({
                success: false,
                message: 'الخطبة غير موجودة'
            });
        }

        // التحقق من الصلاحية
        if (req.user.role !== 'admin' && sermon.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لتعديل هذه الخطبة'
            });
        }

        const updatedSermon = await sermon.update(req.body);
        res.json({
            success: true,
            message: 'تم تحديث الخطبة بنجاح',
            data: { sermon: updatedSermon }
        });

    } catch (error) {
        console.error('خطأ في تحديث الخطبة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحديث الخطبة',
            error: error.message
        });
    }
});

// حذف خطبة
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const sermon = await Sermon.findById(id);

        if (!sermon) {
            return res.status(404).json({
                success: false,
                message: 'الخطبة غير موجودة'
            });
        }

        // التحقق من الصلاحية
        if (req.user.role !== 'admin' && sermon.user_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'ليس لديك صلاحية لحذف هذه الخطبة'
            });
        }

        await sermon.delete();
        res.json({
            success: true,
            message: 'تم حذف الخطبة بنجاح'
        });

    } catch (error) {
        console.error('خطأ في حذف الخطبة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حذف الخطبة',
            error: error.message
        });
    }
});

// تحميل خطبة
router.post('/:id/download', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const sermon = await Sermon.findById(id);

        if (!sermon) {
            return res.status(404).json({
                success: false,
                message: 'الخطبة غير موجودة'
            });
        }

        await sermon.incrementDownloads();
        res.json({
            success: true,
            message: 'تم تسجيل التحميل',
            data: { downloads_count: sermon.downloads_count }
        });

    } catch (error) {
        console.error('خطأ في تحميل الخطبة:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في تحميل الخطبة',
            error: error.message
        });
    }
});

// البحث في الخطب
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const { page = 1, limit = 10, category_id } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            category_id: category_id ? parseInt(category_id) : undefined
        };

        const sermons = await Sermon.search(term, options);
        res.json({ success: true, data: { sermons } });

    } catch (error) {
        console.error('خطأ في البحث عن الخطب:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في البحث عن الخطب',
            error: error.message
        });
    }
});

module.exports = router;
