const express = require('express');
const router = express.Router();
const SermonSuggestions = require('../models/SermonSuggestions');
const { authenticateToken } = require('../middleware/auth-simple');

// الحصول على اقتراحات الآيات القرآنية
router.get('/verses', async (req, res) => {
    try {
        const { topic, context_type, limit = 10 } = req.query;
        const suggestions = await SermonSuggestions.getVersesSuggestions(topic, context_type, parseInt(limit));
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Error fetching verse suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في استرجاع اقتراحات الآيات'
        });
    }
});

// إضافة اقتراح آية قرآنية
router.post('/verses', authenticateToken, async (req, res) => {
    try {
        const suggestionData = {
            user_id: req.user.id,
            ...req.body
        };
        const suggestionId = await SermonSuggestions.addVerseSuggestion(suggestionData);
        res.json({
            success: true,
            message: 'تم حفظ اقتراح الآية بنجاح',
            data: { id: suggestionId }
        });
    } catch (error) {
        console.error('Error adding verse suggestion:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حفظ اقتراح الآية'
        });
    }
});

// الحصول على اقتراحات الأحاديث
router.get('/hadith', async (req, res) => {
    try {
        const { topic, context_type, limit = 10 } = req.query;
        const suggestions = await SermonSuggestions.getHadithSuggestions(topic, context_type, parseInt(limit));
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Error fetching hadith suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في استرجاع اقتراحات الأحاديث'
        });
    }
});

// إضافة اقتراح حديث
router.post('/hadith', authenticateToken, async (req, res) => {
    try {
        const suggestionData = {
            user_id: req.user.id,
            ...req.body
        };
        const suggestionId = await SermonSuggestions.addHadithSuggestion(suggestionData);
        res.json({
            success: true,
            message: 'تم حفظ اقتراح الحديث بنجاح',
            data: { id: suggestionId }
        });
    } catch (error) {
        console.error('Error adding hadith suggestion:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حفظ اقتراح الحديث'
        });
    }
});

// الحصول على اقتراحات الأثار
router.get('/athar', async (req, res) => {
    try {
        const { topic, context_type, limit = 10 } = req.query;
        const suggestions = await SermonSuggestions.getAtharSuggestions(topic, context_type, parseInt(limit));
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Error fetching athar suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في استرجاع اقتراحات الأثار'
        });
    }
});

// إضافة اقتراح أثر
router.post('/athar', authenticateToken, async (req, res) => {
    try {
        const suggestionData = {
            user_id: req.user.id,
            ...req.body
        };
        const suggestionId = await SermonSuggestions.addAtharSuggestion(suggestionData);
        res.json({
            success: true,
            message: 'تم حفظ اقتراح الأثر بنجاح',
            data: { id: suggestionId }
        });
    } catch (error) {
        console.error('Error adding athar suggestion:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حفظ اقتراح الأثر'
        });
    }
});

// الحصول على اقتراحات السجع
router.get('/saja', async (req, res) => {
    try {
        const { topic, rhyme, limit = 10 } = req.query;
        const suggestions = await SermonSuggestions.getSajaSuggestions(topic, rhyme, parseInt(limit));
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Error fetching saja suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في استرجاع اقتراحات السجع'
        });
    }
});

// إضافة اقتراح سجع
router.post('/saja', authenticateToken, async (req, res) => {
    try {
        const suggestionData = {
            user_id: req.user.id,
            ...req.body
        };
        const suggestionId = await SermonSuggestions.addSajaSuggestion(suggestionData);
        res.json({
            success: true,
            message: 'تم حفظ اقتراح السجع بنجاح',
            data: { id: suggestionId }
        });
    } catch (error) {
        console.error('Error adding saja suggestion:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حفظ اقتراح السجع'
        });
    }
});

// الحصول على اقتراحات الشعر
router.get('/poetry', async (req, res) => {
    try {
        const { topic, rhyme, poet, limit = 10 } = req.query;
        const suggestions = await SermonSuggestions.getPoetrySuggestions(topic, rhyme, poet, parseInt(limit));
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Error fetching poetry suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في استرجاع اقتراحات الشعر'
        });
    }
});

// إضافة اقتراح شعر
router.post('/poetry', authenticateToken, async (req, res) => {
    try {
        const suggestionData = {
            user_id: req.user.id,
            ...req.body
        };
        const suggestionId = await SermonSuggestions.addPoetrySuggestion(suggestionData);
        res.json({
            success: true,
            message: 'تم حفظ اقتراح الشعر بنجاح',
            data: { id: suggestionId }
        });
    } catch (error) {
        console.error('Error adding poetry suggestion:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حفظ اقتراح الشعر'
        });
    }
});

// الحصول على اقتراحات الدعاء
router.get('/dua', async (req, res) => {
    try {
        const { dua_type, topic, limit = 10 } = req.query;
        const suggestions = await SermonSuggestions.getDuaSuggestions(dua_type, topic, parseInt(limit));
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        console.error('Error fetching dua suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في استرجاع اقتراحات الدعاء'
        });
    }
});

// إضافة اقتراح دعاء
router.post('/dua', authenticateToken, async (req, res) => {
    try {
        const suggestionData = {
            user_id: req.user.id,
            ...req.body
        };
        const suggestionId = await SermonSuggestions.addDuaSuggestion(suggestionData);
        res.json({
            success: true,
            message: 'تم حفظ اقتراح الدعاء بنجاح',
            data: { id: suggestionId }
        });
    } catch (error) {
        console.error('Error adding dua suggestion:', error);
        res.status(500).json({
            success: false,
            message: 'خطأ في حفظ اقتراح الدعاء'
        });
    }
});

module.exports = router;
