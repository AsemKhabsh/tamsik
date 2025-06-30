const express = require('express');
const Thinker = require('../models/Thinker');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// الحصول على جميع المفكرين
router.get('/', optionalAuth, validatePagination, async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            featured: req.query.featured !== undefined ? req.query.featured === 'true' : undefined,
            active: req.query.active !== 'false',
            search: req.query.search,
            location: req.query.location,
            specialization: req.query.specialization,
            alive: req.query.alive !== undefined ? req.query.alive === 'true' : undefined
        };

        const result = await Thinker.findAll(options);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المفكرين', error: error.message });
    }
});

// الحصول على المفكرين المميزين
router.get('/featured', async (req, res) => {
    try {
        const { limit = 6 } = req.query;
        const thinkers = await Thinker.getFeatured(parseInt(limit));
        res.json({ success: true, data: { thinkers } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المفكرين المميزين', error: error.message });
    }
});

// الحصول على إحصائيات المفكرين
router.get('/stats', async (req, res) => {
    try {
        const stats = await Thinker.getStats();
        res.json({ success: true, data: { stats } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على الإحصائيات', error: error.message });
    }
});

// الحصول على مفكر محدد
router.get('/:id', validateId, async (req, res) => {
    try {
        const thinker = await Thinker.findById(req.params.id);
        if (!thinker) {
            return res.status(404).json({ success: false, message: 'المفكر غير موجود' });
        }
        res.json({ success: true, data: { thinker } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المفكر', error: error.message });
    }
});

// إنشاء مفكر جديد
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const thinker = await Thinker.create(req.body);
        res.status(201).json({ success: true, message: 'تم إنشاء المفكر بنجاح', data: { thinker } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في إنشاء المفكر', error: error.message });
    }
});

// تحديث مفكر
router.put('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const thinker = await Thinker.findById(req.params.id);
        if (!thinker) {
            return res.status(404).json({ success: false, message: 'المفكر غير موجود' });
        }

        const updatedThinker = await thinker.update(req.body);
        res.json({ success: true, message: 'تم تحديث المفكر بنجاح', data: { thinker: updatedThinker } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في تحديث المفكر', error: error.message });
    }
});

// حذف مفكر
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const thinker = await Thinker.findById(req.params.id);
        if (!thinker) {
            return res.status(404).json({ success: false, message: 'المفكر غير موجود' });
        }

        await thinker.delete();
        res.json({ success: true, message: 'تم حذف المفكر بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في حذف المفكر', error: error.message });
    }
});

// البحث في المفكرين
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            specialization: req.query.specialization
        };

        const thinkers = await Thinker.search(term, options);
        res.json({ success: true, data: { thinkers } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في البحث عن المفكرين', error: error.message });
    }
});

module.exports = router;
