const express = require('express');
const Newsletter = require('../models/Newsletter');
const { authenticateToken, requireAdmin } = require('../middleware/auth-simple');
const { validatePagination } = require('../middleware/validation-simple');

const router = express.Router();

// الحصول على جميع المشتركين (مسار عام للاختبار)
router.get('/', async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            status: req.query.status,
            verified: req.query.verified !== undefined ? parseInt(req.query.verified) : undefined,
            search: req.query.search
        };

        const result = await Newsletter.findAll(options);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المشتركين', error: error.message });
    }
});

// الاشتراك في النشرة البريدية
router.post('/subscribe', async (req, res) => {
    try {
        const { email, name } = req.body;
        const subscriber = await Newsletter.subscribe({ email, name });
        
        res.status(201).json({
            success: true,
            message: 'تم الاشتراك بنجاح! يرجى تحقق بريدك الإلكتروني لتأكيد الاشتراك',
            data: { subscriber: { id: subscriber.id, email: subscriber.email } }
        });
    } catch (error) {
        if (error.message === 'البريد الإلكتروني مشترك بالفعل') {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'خطأ في الاشتراك', error: error.message });
    }
});

// تحقق الاشتراك
router.get('/verify/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const subscriber = await Newsletter.findByVerificationToken(token);
        
        if (!subscriber) {
            return res.status(400).json({ success: false, message: 'رابط التحقق غير صحيح أو منتهي الصلاحية' });
        }

        await subscriber.verify();
        res.json({ success: true, message: 'تم تحقق الاشتراك بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في تحقق الاشتراك', error: error.message });
    }
});

// إلغاء الاشتراك
router.post('/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        const subscriber = await Newsletter.findByEmail(email);
        
        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'البريد الإلكتروني غير مشترك' });
        }

        await subscriber.unsubscribe();
        res.json({ success: true, message: 'تم إلغاء الاشتراك بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في إلغاء الاشتراك', error: error.message });
    }
});

// الحصول على جميع المشتركين (للمدير فقط)
router.get('/subscribers', authenticateToken, requireAdmin, validatePagination, async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 50,
            active: req.query.active !== undefined ? req.query.active === 'true' : undefined,
            verified: req.query.verified !== undefined ? req.query.verified === 'true' : undefined,
            search: req.query.search
        };

        const result = await Newsletter.findAll(options);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المشتركين', error: error.message });
    }
});

// الحصول على المشتركين النشطين (للمدير فقط)
router.get('/active-subscribers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const subscribers = await Newsletter.getActiveSubscribers();
        res.json({ success: true, data: { subscribers } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على المشتركين النشطين', error: error.message });
    }
});

// الحصول على إحصائيات النشرة البريدية (للمدير فقط)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await Newsletter.getStats();
        res.json({ success: true, data: { stats } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في الحصول على الإحصائيات', error: error.message });
    }
});

// تصدير قائمة المشتركين (للمدير فقط)
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const subscribers = await Newsletter.exportActiveSubscribers();
        
        // تحويل البيانات إلى CSV
        const csvHeader = 'البريد الإلكتروني,الاسم,تاريخ الاشتراك\n';
        const csvData = subscribers.map(sub => 
            `${sub.email},${sub.name || ''},${sub.subscribed_at}`
        ).join('\n');
        
        const csv = csvHeader + csvData;
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=newsletter-subscribers.csv');
        res.send('\uFEFF' + csv); // BOM for UTF-8
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في تصدير البيانات', error: error.message });
    }
});

// حذف مشترك (للمدير فقط)
router.delete('/subscribers/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const subscriber = await Newsletter.findById(req.params.id);
        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'المشترك غير موجود' });
        }

        await subscriber.delete();
        res.json({ success: true, message: 'تم حذف المشترك بنجاح' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في حذف المشترك', error: error.message });
    }
});

// إعادة إرسال رابط التحقق
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        const subscriber = await Newsletter.findByEmail(email);
        
        if (!subscriber) {
            return res.status(404).json({ success: false, message: 'البريد الإلكتروني غير مشترك' });
        }

        if (subscriber.is_verified) {
            return res.status(400).json({ success: false, message: 'البريد الإلكتروني محقق بالفعل' });
        }

        await subscriber.generateNewVerificationToken();
        res.json({ 
            success: true, 
            message: 'تم إرسال رابط التحقق الجديد',
            data: { verification_token: subscriber.verification_token }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في إعادة إرسال رابط التحقق', error: error.message });
    }
});

// البحث في المشتركين (للمدير فقط)
router.get('/search/:term', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { term } = req.params;
        const { active = true, verified = true } = req.query;
        
        const options = { 
            active: active === 'true', 
            verified: verified === 'true' 
        };
        
        const subscribers = await Newsletter.search(term, options);
        res.json({ success: true, data: { subscribers } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'خطأ في البحث عن المشتركين', error: error.message });
    }
});

module.exports = router;
