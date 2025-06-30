const express = require('express');
const Category = require('../models/Category');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateCategoryCreation, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// الحصول على جميع التصنيفات
router.get('/', validatePagination, async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            type: req.query.type,
            parent_id: req.query.parent_id !== undefined ? (req.query.parent_id === 'null' ? null : parseInt(req.query.parent_id)) : undefined,
            active: req.query.active !== 'false',
            search: req.query.search
        };

        const result = await Category.findAll(options);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على التصنيفات', error: error.message });
    }
});

// الحصول على التصنيفات حسب النوع
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { parent_id } = req.query;
        
        const options = {
            active: true,
            parent_id: parent_id !== undefined ? (parent_id === 'null' ? null : parseInt(parent_id)) : undefined
        };

        const categories = await Category.findByType(type, options);
        res.json({ success: true, data: { categories } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على التصنيفات', error: error.message });
    }
});

// الحصول على التصنيفات الرئيسية
router.get('/main', async (req, res) => {
    try {
        const { type } = req.query;
        const categories = await Category.getMainCategories(type);
        res.json({ success: true, data: { categories } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على التصنيفات الرئيسية', error: error.message });
    }
});

// الحصول على إحصائيات التصنيفات
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await Category.getStats();
        res.json({ success: true, data: { stats } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على الإحصائيات', error: error.message });
    }
});

// الحصول على تصنيف محدد
router.get('/:id', validateId, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
        }
        res.json({ success: true, data: { category } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على التصنيف', error: error.message });
    }
});

// الحصول على التصنيفات الفرعية
router.get('/:id/subcategories', validateId, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
        }

        const subcategories = await category.getSubCategories();
        res.json({ success: true, data: { subcategories } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على التصنيفات الفرعية', error: error.message });
    }
});

// إنشاء تصنيف جديد
router.post('/', authenticateToken, requireAdmin, validateCategoryCreation, async (req, res) => {
    try {
        const category = await Category.create(req.body);
        res.status(201).json({ success: true, message: 'تم إنشاء التصنيف بنجاح', data: { category } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في إنشاء التصنيف', error: error.message });
    }
});

// تحديث تصنيف
router.put('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
        }

        const updatedCategory = await category.update(req.body);
        res.json({ success: true, message: 'تم تحديث التصنيف بنجاح', data: { category: updatedCategory } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في تحديث التصنيف', error: error.message });
    }
});

// حذف تصنيف
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'التصنيف غير موجود' });
        }

        await category.delete();
        res.json({ success: true, message: 'تم حذف التصنيف بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في حذف التصنيف', error: error.message });
    }
});

// البحث في التصنيفات
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const { type } = req.query;
        
        const options = { type, active: true };
        const categories = await Category.search(term, options);
        res.json({ success: true, data: { categories } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في البحث عن التصنيفات', error: error.message });
    }
});

module.exports = router;
