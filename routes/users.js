const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateUserUpdate, validateId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// الحصول على جميع المستخدمين (للمدير فقط)
router.get('/', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
            role: req.query.role,
            search: req.query.search
        };

        const result = await User.findAll(options);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المستخدمين', error: error.message });
    }
});

// الحصول على مستخدم محدد (للمدير فقط)
router.get('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }
        res.json({ success: true, data: { user: user.toJSON() } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المستخدم', error: error.message });
    }
});

// تحديث مستخدم (للمدير فقط)
router.put('/:id', authenticateToken, requireAdmin, validateId, validateUserUpdate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const updatedUser = await user.update(req.body);
        res.json({ success: true, message: 'تم تحديث المستخدم بنجاح', data: { user: updatedUser.toJSON() } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في تحديث المستخدم', error: error.message });
    }
});

// حذف مستخدم (للمدير فقط)
router.delete('/:id', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        // منع حذف المدير الحالي
        if (user.id === req.user.id) {
            return res.status(400).json({ success: false, message: 'لا يمكنك حذف حسابك الخاص' });
        }

        await user.delete();
        res.json({ success: true, message: 'تم حذف المستخدم بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في حذف المستخدم', error: error.message });
    }
});

// تغيير دور المستخدم (للمدير فقط)
router.put('/:id/role', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { role } = req.body;
        
        if (!['user', 'scholar', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'دور المستخدم غير صحيح' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        // منع تغيير دور المدير الحالي
        if (user.id === req.user.id && role !== 'admin') {
            return res.status(400).json({ success: false, message: 'لا يمكنك تغيير دورك الخاص' });
        }

        const updatedUser = await user.update({ role });
        res.json({ success: true, message: 'تم تغيير دور المستخدم بنجاح', data: { user: updatedUser.toJSON() } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في تغيير دور المستخدم', error: error.message });
    }
});

// تفعيل/إلغاء تفعيل المستخدم (للمدير فقط)
router.put('/:id/verify', authenticateToken, requireAdmin, validateId, async (req, res) => {
    try {
        const { is_verified } = req.body;
        
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
        }

        const updatedUser = await user.update({ 
            is_verified: is_verified,
            verification_token: is_verified ? null : user.verification_token
        });
        
        res.json({ 
            success: true, 
            message: `تم ${is_verified ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم بنجاح`, 
            data: { user: updatedUser.toJSON() } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في تفعيل المستخدم', error: error.message });
    }
});

module.exports = router;
