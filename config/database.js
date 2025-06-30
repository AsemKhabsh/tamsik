/**
 * إعدادات قاعدة البيانات - تمسيك
 *
 * @description إعداد الاتصال بقاعدة بيانات MySQL مع دعم UTF8MB4 للنصوص العربية
 * @author فريق تمسيك
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// إعدادات الاتصال بقاعدة البيانات
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tamsik_db',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',              // دعم كامل للنصوص العربية والرموز التعبيرية
    timezone: '+00:00'               // التوقيت العالمي المنسق
};

// إنشاء pool للاتصالات
const pool = mysql.createPool({
    ...dbConfig,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// دالة لاختبار الاتصال
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.code || error.message);

        // إرجاع معلومات مفصلة عن الخطأ
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 تأكد من أن MySQL يعمل على المنفذ', dbConfig.port);
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('💡 تحقق من اسم المستخدم وكلمة المرور في ملف .env');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('💡 قاعدة البيانات غير موجودة، سيتم إنشاؤها تلقائياً');
        }

        return false;
    }
}

// دالة لإنشاء قاعدة البيانات إذا لم تكن موجودة
async function createDatabase() {
    try {
        const tempConnection = await mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port
        });

        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ تم إنشاء قاعدة البيانات: ${dbConfig.database}`);

        await tempConnection.end();
    } catch (error) {
        console.error('❌ خطأ في إنشاء قاعدة البيانات:', error.code || error.message);

        if (error.code === 'ECONNREFUSED') {
            console.log('💡 MySQL غير متاح. تأكد من تثبيت وتشغيل MySQL Server');
            console.log('💡 يمكنك تحميل MySQL من: https://dev.mysql.com/downloads/mysql/');
        }

        throw error;
    }
}

module.exports = {
    pool,
    testConnection,
    createDatabase
};
