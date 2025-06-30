const express = require('express');
const Lecture = require('../models/Lecture');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { validateLectureCreation, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// الحصول على جميع المحاضرات
router.get('/', optionalAuth, validatePagination, async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            province: req.query.province,
            day_of_week: req.query.day_of_week,
            type: req.query.type,
            active: req.query.active !== 'false',
            search: req.query.search,
            sort: req.query.sort || 'province'
        };

        const result = await Lecture.findAll(options);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المحاضرات', error: error.message });
    }
});

// الحصول على المحاضرات حسب المحافظة
router.get('/province/:province', async (req, res) => {
    try {
        const { province } = req.params;
        const lectures = await Lecture.findByProvince(province);
        res.json({ success: true, data: { lectures } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المحاضرات', error: error.message });
    }
});

// الحصول على المحاضرات حسب اليوم
router.get('/day/:day', async (req, res) => {
    try {
        const { day } = req.params;
        const lectures = await Lecture.findByDay(day);
        res.json({ success: true, data: { lectures } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المحاضرات', error: error.message });
    }
});

// الحصول على إحصائيات المحاضرات
router.get('/stats', async (req, res) => {
    try {
        const stats = await Lecture.getStats();
        res.json({ success: true, data: { stats } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على الإحصائيات', error: error.message });
    }
});

// الحصول على المحافظات المتاحة
router.get('/provinces', async (req, res) => {
    try {
        const provinces = await Lecture.getProvinces();
        res.json({ success: true, data: { provinces } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المحافظات', error: error.message });
    }
});

// الحصول على محاضرة محددة
router.get('/:id', validateId, async (req, res) => {
    try {
        const lecture = await Lecture.findById(req.params.id);
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        }
        res.json({ success: true, data: { lecture } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المحاضرة', error: error.message });
    }
});

// إنشاء محاضرة جديدة
router.post('/', authenticateToken, validateLectureCreation, async (req, res) => {
    try {
        const lectureData = { ...req.body, user_id: req.user.id };
        const lecture = await Lecture.create(lectureData);
        res.status(201).json({ success: true, message: 'تم إنشاء المحاضرة بنجاح', data: { lecture } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في إنشاء المحاضرة', error: error.message });
    }
});

// تحديث محاضرة
router.put('/:id', authenticateToken, validateId, async (req, res) => {
    try {
        const lecture = await Lecture.findById(req.params.id);
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        }

        if (req.user.role !== 'admin' && lecture.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لتعديل هذه المحاضرة' });
        }

        const updatedLecture = await lecture.update(req.body);
        res.json({ success: true, message: 'تم تحديث المحاضرة بنجاح', data: { lecture: updatedLecture } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في تحديث المحاضرة', error: error.message });
    }
});

// حذف محاضرة
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
    try {
        const lecture = await Lecture.findById(req.params.id);
        if (!lecture) {
            return res.status(404).json({ success: false, message: 'المحاضرة غير موجودة' });
        }

        if (req.user.role !== 'admin' && lecture.user_id !== req.user.id) {
            return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لحذف هذه المحاضرة' });
        }

        await lecture.delete();
        res.json({ success: true, message: 'تم حذف المحاضرة بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في حذف المحاضرة', error: error.message });
    }
});

// البحث في المحاضرات
router.get('/search/:term', async (req, res) => {
    try {
        const { term } = req.params;
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            province: req.query.province,
            type: req.query.type
        };

        const lectures = await Lecture.search(term, options);
        res.json({ success: true, data: { lectures } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في البحث عن المحاضرات', error: error.message });
    }
});

module.exports = router;
