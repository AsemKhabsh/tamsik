const { pool, testConnection, DB_TYPE } = require('../config/database-adapter');

let createAllTables, insertInitialData;

if (DB_TYPE === 'sqlite') {
    // استخدم دوال SQLite
    ({ initializeSQLite: createAllTables } = require('../config/sqlite-setup.js'));
    // دالة إدراج البيانات الأولية موجودة ضمن initializeSQLite
    insertInitialData = async () => {};
} else {
    // استخدم جمل MySQL
    const createTables = require('../config/createTables');
    createAllTables = async () => {
        try {
            console.log('🚀 بدء إنشاء الجداول...');
            const tables = [
                { name: 'users', sql: createTables.createUsersTable },
                { name: 'categories', sql: createTables.createCategoriesTable },
                { name: 'scholars', sql: createTables.createScholarsTable },
                { name: 'fatwas', sql: createTables.createFatwasTable },
                { name: 'sermons', sql: createTables.createSermonsTable },
                { name: 'lectures', sql: createTables.createLecturesTable },
                { name: 'thinkers', sql: createTables.createThinkersTable },
                { name: 'newsletter_subscribers', sql: createTables.createNewsletterTable },
                { name: 'questions', sql: createTables.createQuestionsTable }
            ];
            for (const table of tables) {
                try {
                    await pool.execute(table.sql);
                    console.log(`✅ تم إنشاء جدول: ${table.name}`);
                } catch (error) {
                    if (error.message.includes('already exists')) {
                        console.log(`⚠️ جدول ${table.name} موجود مسبقاً`);
                    } else {
                        throw error;
                    }
                }
            }
            console.log('🎉 تم إنشاء جميع الجداول بنجاح!');
        } catch (error) {
            console.error('❌ خطأ في إنشاء الجداول:', error.message);
            throw error;
        }
    };
    insertInitialData = async function() {
        try {
            console.log('📝 إدراج البيانات الأولية...');

            // إدراج التصنيفات الأساسية
            const categories = [
                { name: 'العقيدة', slug: 'aqeedah', type: 'sermon' },
                { name: 'الفقه', slug: 'fiqh', type: 'sermon' },
                { name: 'الأخلاق', slug: 'akhlaq', type: 'sermon' },
                { name: 'السيرة النبوية', slug: 'seerah', type: 'sermon' },
                { name: 'المناسبات', slug: 'occasions', type: 'sermon' },
                { name: 'العبادات', slug: 'worship', type: 'fatwa' },
                { name: 'المعاملات', slug: 'transactions', type: 'fatwa' },
                { name: 'الأسرة والزواج', slug: 'family', type: 'fatwa' },
                { name: 'قضايا معاصرة', slug: 'contemporary', type: 'fatwa' },
                { name: 'الأخلاق والآداب', slug: 'ethics', type: 'fatwa' }
            ];

            for (const category of categories) {
                try {
                    await pool.execute(
                        'INSERT OR IGNORE INTO categories (name, slug, type, description) VALUES (?, ?, ?, ?)',
                        [category.name, category.slug, category.type, `تصنيف ${category.name}`]
                    );
                } catch (error) {
                    console.log(`⚠️ تصنيف ${category.name} موجود مسبقاً`);
                }
            }

            console.log('✅ تم إدراج التصنيفات الأساسية');

            // إنشاء مستخدم إداري افتراضي
            const bcrypt = require('bcryptjs');
            const adminPassword = await bcrypt.hash('admin123', 12);
            
            try {
                await pool.execute(
                    'INSERT OR IGNORE INTO users (username, email, password, full_name, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
                    ['admin', 'admin@tamsik.com', adminPassword, 'مدير النظام', 'admin', true]
                );
                console.log('✅ تم إنشاء المستخدم الإداري الافتراضي');
                console.log('📧 البريد الإلكتروني: admin@tamsik.com');
                console.log('🔑 كلمة المرور: admin123');
            } catch (error) {
                console.log('⚠️ المستخدم الإداري موجود مسبقاً');
            }

            console.log('🎉 تم إدراج جميع البيانات الأولية بنجاح!');
        } catch (error) {
            console.error('❌ خطأ في إدراج البيانات الأولية:', error.message);
            throw error;
        }
    };
}

// دالة رئيسية لإعداد قاعدة البيانات
async function setupDatabase() {
    try {
        console.log('🔧 بدء إعداد قاعدة البيانات...');
        await testConnection();
        await createAllTables();
        await insertInitialData();
        console.log('🎉 تم إعداد قاعدة البيانات بنجاح!');
        process.exit(0);
    } catch (error) {
        console.error('❌ فشل في إعداد قاعدة البيانات:', error.message);
        process.exit(1);
    }
}

// تشغيل الإعداد إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    setupDatabase();
}

module.exports = { setupDatabase, createAllTables, insertInitialData };
