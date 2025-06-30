/**
 * اختبار شامل للمنصة
 * يختبر جميع الوظائف الأساسية والـ API endpoints
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
let authToken = null;
let testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

// ألوان للطباعة
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
    testResults.passed++;
}

function logError(message, error = null) {
    log(`❌ ${message}`, 'red');
    if (error) {
        log(`   خطأ: ${error.message}`, 'red');
        testResults.errors.push({ message, error: error.message });
    }
    testResults.failed++;
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// اختبار الاتصال بالخادم
async function testServerConnection() {
    log('\n🔍 اختبار الاتصال بالخادم...', 'bold');
    
    try {
        const response = await fetch(`${BASE_URL}/`);
        if (response.ok) {
            logSuccess('الخادم يعمل بشكل صحيح');
        } else {
            logError(`الخادم يستجيب بحالة: ${response.status}`);
        }
    } catch (error) {
        logError('فشل في الاتصال بالخادم', error);
    }
}

// اختبار قاعدة البيانات
async function testDatabase() {
    log('\n🔍 اختبار قاعدة البيانات...', 'bold');
    
    try {
        // التحقق من وجود ملف قاعدة البيانات
        const dbPath = path.join(__dirname, '..', 'database.sqlite');
        if (fs.existsSync(dbPath)) {
            logSuccess('ملف قاعدة البيانات موجود');
            
            // التحقق من حجم قاعدة البيانات
            const stats = fs.statSync(dbPath);
            if (stats.size > 0) {
                logSuccess(`حجم قاعدة البيانات: ${(stats.size / 1024).toFixed(2)} KB`);
            } else {
                logWarning('قاعدة البيانات فارغة');
            }
        } else {
            logError('ملف قاعدة البيانات غير موجود');
        }
    } catch (error) {
        logError('خطأ في فحص قاعدة البيانات', error);
    }
}

// اختبار تسجيل الدخول
async function testAuthentication() {
    log('\n🔍 اختبار نظام المصادقة...', 'bold');
    
    try {
        // محاولة تسجيل الدخول
        const loginData = {
            email: 'admin@tamsik.com',
            password: 'admin123'
        };
        
        const response = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data && data.data.token) {
                authToken = data.data.token;
                logSuccess('تسجيل الدخول نجح');
                logInfo(`رمز المصادقة: ${authToken.substring(0, 20)}...`);
            } else {
                logError('تسجيل الدخول فشل - لا يوجد رمز مصادقة');
            }
        } else {
            const errorData = await response.json().catch(() => ({}));
            logError(`تسجيل الدخول فشل: ${response.status} - ${errorData.message || 'خطأ غير معروف'}`);
        }
    } catch (error) {
        logError('خطأ في اختبار المصادقة', error);
    }
}

// اختبار API endpoints
async function testAPIEndpoints() {
    log('\n🔍 اختبار API endpoints...', 'bold');
    
    const endpoints = [
        { path: '/api/sermons', method: 'GET', name: 'الخطب' },
        { path: '/api/scholars', method: 'GET', name: 'العلماء' },
        { path: '/api/fatwas', method: 'GET', name: 'الفتاوى' },
        { path: '/api/lectures', method: 'GET', name: 'المحاضرات' },
        { path: '/api/thinkers', method: 'GET', name: 'المفكرون' },
        { path: '/api/categories', method: 'GET', name: 'التصنيفات' }
    ];
    
    for (const endpoint of endpoints) {
        try {
            const headers = {};
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(`${BASE_URL}${endpoint.path}`, {
                method: endpoint.method,
                headers
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    logSuccess(`${endpoint.name}: API يعمل بشكل صحيح`);
                } else {
                    logWarning(`${endpoint.name}: API يستجيب لكن البيانات قد تكون غير صحيحة`);
                }
            } else {
                logError(`${endpoint.name}: API فشل بحالة ${response.status}`);
            }
        } catch (error) {
            logError(`${endpoint.name}: خطأ في الاتصال`, error);
        }
        
        // تأخير قصير بين الطلبات
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// اختبار الملفات الثابتة
async function testStaticFiles() {
    log('\n🔍 اختبار الملفات الثابتة...', 'bold');
    
    const staticFiles = [
        '/style.css',
        '/css/main.css',
        '/js/main.js',
        '/js/auth.js',
        '/js/error-handler.js'
    ];
    
    for (const file of staticFiles) {
        try {
            const response = await fetch(`${BASE_URL}${file}`);
            if (response.ok) {
                logSuccess(`ملف ${file} متاح`);
            } else {
                logError(`ملف ${file} غير متاح: ${response.status}`);
            }
        } catch (error) {
            logError(`خطأ في تحميل ${file}`, error);
        }
    }
}

// اختبار الصفحات الرئيسية
async function testMainPages() {
    log('\n🔍 اختبار الصفحات الرئيسية...', 'bold');
    
    const pages = [
        '/',
        '/login.html',
        '/sermons.html',
        '/scholars.html',
        '/thinkers.html',
        '/lectures.html'
    ];
    
    for (const page of pages) {
        try {
            const response = await fetch(`${BASE_URL}${page}`);
            if (response.ok) {
                const content = await response.text();
                if (content.includes('<html') && content.includes('</html>')) {
                    logSuccess(`صفحة ${page} تحمل بشكل صحيح`);
                } else {
                    logWarning(`صفحة ${page} قد تحتوي على مشاكل في HTML`);
                }
            } else {
                logError(`صفحة ${page} غير متاحة: ${response.status}`);
            }
        } catch (error) {
            logError(`خطأ في تحميل صفحة ${page}`, error);
        }
    }
}

// اختبار إنشاء بيانات جديدة
async function testDataCreation() {
    log('\n🔍 اختبار إنشاء البيانات...', 'bold');
    
    if (!authToken) {
        logWarning('تخطي اختبار إنشاء البيانات - لا يوجد رمز مصادقة');
        return;
    }
    
    try {
        // اختبار إنشاء خطبة جديدة
        const sermonData = {
            title: 'خطبة اختبار',
            content: 'محتوى خطبة الاختبار',
            category: 'العقيدة'
        };
        
        const response = await fetch(`${BASE_URL}/api/sermons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(sermonData)
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                logSuccess('إنشاء خطبة جديدة نجح');
            } else {
                logError('إنشاء خطبة جديدة فشل - استجابة غير صحيحة');
            }
        } else {
            logError(`إنشاء خطبة جديدة فشل: ${response.status}`);
        }
    } catch (error) {
        logError('خطأ في اختبار إنشاء البيانات', error);
    }
}

// تشغيل جميع الاختبارات
async function runAllTests() {
    log('🚀 بدء الاختبار الشامل للمنصة...', 'bold');
    log('=' .repeat(50), 'blue');
    
    await testServerConnection();
    await testDatabase();
    await testAuthentication();
    await testAPIEndpoints();
    await testStaticFiles();
    await testMainPages();
    await testDataCreation();
    
    // عرض النتائج النهائية
    log('\n📊 ملخص نتائج الاختبار:', 'bold');
    log('=' .repeat(50), 'blue');
    logSuccess(`اختبارات نجحت: ${testResults.passed}`);
    if (testResults.failed > 0) {
        logError(`اختبارات فشلت: ${testResults.failed}`);
    }
    
    if (testResults.errors.length > 0) {
        log('\n🔍 تفاصيل الأخطاء:', 'bold');
        testResults.errors.forEach((error, index) => {
            log(`${index + 1}. ${error.message}: ${error.error}`, 'red');
        });
    }
    
    const successRate = ((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1);
    log(`\n🎯 معدل النجاح: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');
    
    if (successRate >= 90) {
        log('🎉 المنصة جاهزة للإنتاج!', 'green');
    } else if (successRate >= 70) {
        log('⚠️  المنصة تحتاج بعض التحسينات قبل الإنتاج', 'yellow');
    } else {
        log('🚨 المنصة تحتاج إصلاحات مهمة قبل الإنتاج', 'red');
    }
}

// تشغيل الاختبارات
if (require.main === module) {
    runAllTests().catch(error => {
        logError('خطأ عام في تشغيل الاختبارات', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };
