/**
 * اختبار مسارات API للتأكد من عملها
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// دالة لاختبار مسار API
async function testEndpoint(method, endpoint, data = null, description = '') {
    try {
        console.log(`\n🔍 اختبار: ${description || endpoint}`);
        
        let response;
        switch (method.toUpperCase()) {
            case 'GET':
                response = await axios.get(`${BASE_URL}${endpoint}`);
                break;
            case 'POST':
                response = await axios.post(`${BASE_URL}${endpoint}`, data);
                break;
            case 'PUT':
                response = await axios.put(`${BASE_URL}${endpoint}`, data);
                break;
            case 'DELETE':
                response = await axios.delete(`${BASE_URL}${endpoint}`);
                break;
            default:
                throw new Error(`HTTP method ${method} غير مدعوم`);
        }
        
        console.log(`✅ نجح: ${response.status} - ${response.statusText}`);
        if (response.data) {
            console.log(`📊 البيانات:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
        }
        return { success: true, data: response.data };
    } catch (error) {
        console.log(`❌ فشل: ${error.response?.status || 'خطأ في الشبكة'} - ${error.response?.statusText || error.message}`);
        if (error.response?.data) {
            console.log(`📊 رسالة الخطأ:`, error.response.data);
        }
        return { success: false, error: error.message };
    }
}

// دالة الاختبار الرئيسية
async function runAPITests() {
    console.log('🚀 بدء اختبار مسارات API...\n');
    
    // اختبار صحة الخادم
    await testEndpoint('GET', '/health', null, 'فحص صحة الخادم');
    
    // اختبار مسارات التصنيفات
    console.log('\n📂 اختبار مسارات التصنيفات:');
    await testEndpoint('GET', '/categories', null, 'الحصول على جميع التصنيفات');
    await testEndpoint('GET', '/categories/main', null, 'الحصول على التصنيفات الرئيسية');
    
    // اختبار مسارات الاقتراحات
    console.log('\n💡 اختبار مسارات الاقتراحات:');
    await testEndpoint('GET', '/suggestions/verses', null, 'الحصول على اقتراحات الآيات');
    await testEndpoint('GET', '/suggestions/hadith', null, 'الحصول على اقتراحات الأحاديث');
    await testEndpoint('GET', '/suggestions/dua', null, 'الحصول على اقتراحات الأدعية');
    await testEndpoint('GET', '/suggestions/saja', null, 'الحصول على اقتراحات السجع');
    await testEndpoint('GET', '/suggestions/poetry', null, 'الحصول على اقتراحات الشعر');
    
    // اختبار مسارات الخطب
    console.log('\n📖 اختبار مسارات الخطب:');
    await testEndpoint('GET', '/sermons', null, 'الحصول على جميع الخطب');
    await testEndpoint('GET', '/sermons?featured=true', null, 'الحصول على الخطب المميزة');
    
    // اختبار مسارات العلماء
    console.log('\n👨‍🏫 اختبار مسارات العلماء:');
    await testEndpoint('GET', '/scholars', null, 'الحصول على جميع العلماء');
    await testEndpoint('GET', '/scholars?featured=true', null, 'الحصول على العلماء المميزين');
    
    // اختبار مسارات الفتاوى
    console.log('\n📜 اختبار مسارات الفتاوى:');
    await testEndpoint('GET', '/fatwas', null, 'الحصول على جميع الفتاوى');
    await testEndpoint('GET', '/fatwas?status=published', null, 'الحصول على الفتاوى المنشورة');
    
    // اختبار مسارات المحاضرات
    console.log('\n🎓 اختبار مسارات المحاضرات:');
    await testEndpoint('GET', '/lectures', null, 'الحصول على جميع المحاضرات');
    await testEndpoint('GET', '/lectures?is_active=true', null, 'الحصول على المحاضرات النشطة');
    
    // اختبار مسارات المفكرين
    console.log('\n🧠 اختبار مسارات المفكرين:');
    await testEndpoint('GET', '/thinkers', null, 'الحصول على جميع المفكرين');
    await testEndpoint('GET', '/thinkers?featured=true', null, 'الحصول على المفكرين المميزين');
    
    // اختبار مسارات النشرة البريدية
    console.log('\n📧 اختبار مسارات النشرة البريدية:');
    await testEndpoint('GET', '/newsletter', null, 'الحصول على المشتركين');
    
    // اختبار مسار غير موجود
    console.log('\n❓ اختبار مسار غير موجود:');
    await testEndpoint('GET', '/nonexistent', null, 'مسار غير موجود');
    
    console.log('\n🎉 انتهى اختبار مسارات API');
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    runAPITests()
        .then(() => {
            console.log('\n✅ تم الانتهاء من جميع الاختبارات');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ خطأ في تشغيل الاختبارات:', error);
            process.exit(1);
        });
}

module.exports = { testEndpoint, runAPITests };
