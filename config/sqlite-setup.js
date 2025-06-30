/**
 * إعداد قاعدة بيانات SQLite كبديل مؤقت لـ MySQL
 * يمكن استخدامها للاختبار والتطوير قبل تثبيت MySQL
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// مسار ملف قاعدة البيانات
const dbPath = path.join(__dirname, '..', 'data', 'tamsik.db');

// إنشاء مجلد البيانات إذا لم يكن موجوداً
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// إنشاء قاعدة البيانات
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ خطأ في إنشاء قاعدة بيانات SQLite:', err.message);
    } else {
        console.log('✅ تم إنشاء قاعدة بيانات SQLite بنجاح');
    }
});

// تحويل استعلامات MySQL إلى SQLite
const createTables = {
    users: `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'user',
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
    
    categories: `
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,
    
    verses_suggestions: `
        CREATE TABLE IF NOT EXISTS verses_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            verse_text TEXT NOT NULL,
            surah_name TEXT,
            verse_number INTEGER,
            context_type TEXT DEFAULT 'عام',
            topic TEXT,
            usage_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
    
    hadith_suggestions: `
        CREATE TABLE IF NOT EXISTS hadith_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            hadith_text TEXT NOT NULL,
            narrator TEXT,
            source TEXT,
            authentication TEXT,
            context_type TEXT DEFAULT 'عام',
            topic TEXT,
            usage_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
    
    athar_suggestions: `
        CREATE TABLE IF NOT EXISTS athar_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            athar_text TEXT NOT NULL,
            speaker TEXT,
            context_type TEXT DEFAULT 'عام',
            topic TEXT,
            usage_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
    
    saja_suggestions: `
        CREATE TABLE IF NOT EXISTS saja_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            saja_text TEXT NOT NULL,
            topic TEXT,
            rhyme TEXT,
            attribution TEXT,
            reference TEXT,
            usage_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
    
    poetry_suggestions: `
        CREATE TABLE IF NOT EXISTS poetry_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            poetry_text TEXT NOT NULL,
            topic TEXT,
            rhyme TEXT,
            meter TEXT,
            poet TEXT,
            reference TEXT,
            usage_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
    
    dua_suggestions: `
        CREATE TABLE IF NOT EXISTS dua_suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            dua_text TEXT NOT NULL,
            dua_type TEXT NOT NULL,
            topic TEXT,
            source TEXT,
            usage_count INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    `,
    
    sermons: `
        CREATE TABLE IF NOT EXISTS sermons (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category_id INTEGER,
            title TEXT NOT NULL,
            content TEXT,
            excerpt TEXT,
            author TEXT,
            status TEXT DEFAULT 'draft',
            is_featured INTEGER DEFAULT 0,
            views_count INTEGER DEFAULT 0,
            tags TEXT,
            attachments TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    `
};

// دالة لإنشاء الجداول
async function createAllTables() {
    return new Promise((resolve, reject) => {
        const tableNames = Object.keys(createTables);
        let completed = 0;
        
        console.log('🔄 إنشاء جداول قاعدة البيانات...');
        
        tableNames.forEach(tableName => {
            db.run(createTables[tableName], (err) => {
                if (err) {
                    console.error(`❌ خطأ في إنشاء جدول ${tableName}:`, err.message);
                    reject(err);
                } else {
                    console.log(`✅ تم إنشاء جدول ${tableName}`);
                    completed++;
                    
                    if (completed === tableNames.length) {
                        resolve();
                    }
                }
            });
        });
    });
}

// دالة لإدراج البيانات الأولية
async function insertInitialData() {
    return new Promise((resolve, reject) => {
        console.log('📝 إدراج البيانات الأولية...');
        
        // إدراج فئات أساسية
        const categories = [
            'العقيدة',
            'الفقه', 
            'الأخلاق والآداب',
            'السيرة النبوية',
            'التفسير',
            'الحديث',
            'الدعوة والإرشاد',
            'المناسبات الإسلامية'
        ];
        
        const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
        
        categories.forEach(category => {
            insertCategory.run(category, `فئة ${category}`);
        });
        
        insertCategory.finalize();
        
        // إدراج اقتراحات أولية للآيات
        const insertVerse = db.prepare(`
            INSERT OR IGNORE INTO verses_suggestions 
            (verse_text, surah_name, verse_number, context_type, topic) 
            VALUES (?, ?, ?, ?, ?)
        `);
        
        insertVerse.run(
            'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ',
            'آل عمران',
            102,
            'أمر',
            'التقوى'
        );

        insertVerse.run(
            'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
            'الطلاق',
            2,
            'وعد',
            'التقوى'
        );

        insertVerse.finalize((err) => {
            if (err) {
                console.error('❌ خطأ في إدراج الآيات:', err);
            } else {
                console.log('✅ تم إدراج الآيات بنجاح');
            }
        });
        
        // إدراج اقتراحات أولية للدعاء
        const insertDua = db.prepare(`
            INSERT OR IGNORE INTO dua_suggestions 
            (dua_text, dua_type, topic, source) 
            VALUES (?, ?, ?, ?)
        `);
        
        insertDua.run(
            'الحمد لله رب العالمين، الرحمن الرحيم، مالك يوم الدين',
            'ثناء',
            'عام',
            'القرآن الكريم'
        );
        
        insertDua.run(
            'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار',
            'دعاء قرآني',
            'عام',
            'سورة البقرة'
        );
        
        insertDua.finalize();
        
        console.log('✅ تم إدراج البيانات الأولية بنجاح');
        resolve();
    });
}

// دالة التهيئة الرئيسية
async function initializeSQLite() {
    try {
        await createAllTables();
        await insertInitialData();
        console.log('🎉 تم تهيئة قاعدة بيانات SQLite بنجاح!');
        console.log(`📁 مسار قاعدة البيانات: ${dbPath}`);
        return true;
    } catch (error) {
        console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
        return false;
    }
}

// تشغيل التهيئة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    initializeSQLite()
        .then((success) => {
            if (success) {
                console.log('✅ SQLite جاهز للاستخدام!');
                console.log('💡 لاستخدام MySQL بدلاً من SQLite، اتبع دليل MYSQL_SETUP_GUIDE.md');
            }
            db.close();
            process.exit(success ? 0 : 1);
        });
}

module.exports = { db, initializeSQLite, dbPath };
