/**
 * محول قاعدة البيانات - يدعم MySQL و SQLite
 * يتيح التبديل بين قواعد البيانات بسهولة
 */

const fs = require('fs');
const path = require('path');

// تحديد نوع قاعدة البيانات المستخدمة
let DB_TYPE = process.env.DB_TYPE || 'sqlite'; // mysql أو sqlite

let pool;

if (DB_TYPE === 'mysql') {
    // استخدام MySQL
    try {
        const mysql = require('mysql2/promise');
        require('dotenv').config();
        
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tamsik_db',
            port: process.env.DB_PORT || 3306,
            charset: 'utf8mb4',
            timezone: '+00:00'
        };
        
        pool = mysql.createPool({
            ...dbConfig,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('🔄 استخدام MySQL كقاعدة بيانات');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة MySQL:', error.message);
        console.log('🔄 التبديل إلى SQLite...');
        DB_TYPE = 'sqlite';
        pool = null; // إعادة تعيين pool
    }
}

if (DB_TYPE === 'sqlite' || !pool) {
    // استخدام SQLite
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, '..', 'data', 'tamsik.db');
    
    // التأكد من وجود ملف قاعدة البيانات
    if (!fs.existsSync(dbPath)) {
        console.error('❌ ملف قاعدة البيانات غير موجود. يرجى تشغيل: node config/sqlite-setup.js');
        process.exit(1);
    }
    
    const db = new sqlite3.Database(dbPath);
    
    // محول لجعل SQLite يعمل مثل MySQL
    pool = {
        execute: (query, params = []) => {
            return new Promise((resolve, reject) => {
                // تحويل استعلامات MySQL إلى SQLite
                let sqliteQuery = query
                    .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
                    .replace(/LIMIT \? OFFSET \?/gi, 'LIMIT ? OFFSET ?')
                    .replace(/NOW\(\)/gi, "datetime('now')")
                    .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')");
                
                if (query.toLowerCase().includes('insert')) {
                    db.run(sqliteQuery, params, function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve([{ insertId: this.lastID, affectedRows: this.changes }]);
                        }
                    });
                } else if (query.toLowerCase().includes('update') || query.toLowerCase().includes('delete')) {
                    db.run(sqliteQuery, params, function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve([{ affectedRows: this.changes }]);
                        }
                    });
                } else {
                    db.all(sqliteQuery, params, (err, rows) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve([rows]);
                        }
                    });
                }
            });
        },
        
        getConnection: () => {
            return Promise.resolve({
                execute: pool.execute,
                release: () => {}
            });
        }
    };
    
    console.log('🔄 استخدام SQLite كقاعدة بيانات');
}

// دالة لاختبار الاتصال
async function testConnection() {
    try {
        const [rows] = await pool.execute('SELECT 1 as test');
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
        return true;
    } catch (error) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
        
        if (DB_TYPE === 'mysql') {
            if (error.code === 'ECONNREFUSED') {
                console.log('💡 تأكد من أن MySQL يعمل على المنفذ', process.env.DB_PORT || 3306);
            } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('💡 تحقق من اسم المستخدم وكلمة المرور في ملف .env');
            } else if (error.code === 'ER_BAD_DB_ERROR') {
                console.log('💡 قاعدة البيانات غير موجودة، سيتم إنشاؤها تلقائياً');
            }
        }
        
        return false;
    }
}

// دالة للحصول على نوع قاعدة البيانات
function getDatabaseType() {
    return DB_TYPE;
}

// دالة لتحويل الاستعلامات حسب نوع قاعدة البيانات
function adaptQuery(query, dbType = DB_TYPE) {
    if (dbType === 'sqlite') {
        return query
            .replace(/AUTO_INCREMENT/gi, 'AUTOINCREMENT')
            .replace(/LIMIT \? OFFSET \?/gi, 'LIMIT ? OFFSET ?')
            .replace(/NOW\(\)/gi, "datetime('now')")
            .replace(/CURRENT_TIMESTAMP/gi, "datetime('now')")
            .replace(/ENUM\([^)]+\)/gi, 'TEXT')
            .replace(/INT AUTO_INCREMENT/gi, 'INTEGER')
            .replace(/INT\s+AUTO_INCREMENT/gi, 'INTEGER')
            .replace(/TINYINT\(1\)/gi, 'INTEGER')
            .replace(/BOOLEAN/gi, 'INTEGER')
            .replace(/DATETIME/gi, 'TEXT')
            .replace(/TIMESTAMP/gi, 'TEXT');
    }
    return query;
}

// دالة لتحويل النتائج حسب نوع قاعدة البيانات
function adaptResults(results, dbType = DB_TYPE) {
    if (dbType === 'sqlite' && Array.isArray(results)) {
        // تحويل النتائج لتتوافق مع تنسيق MySQL
        return results.map(row => {
            if (row && typeof row === 'object') {
                // تحويل القيم المنطقية
                Object.keys(row).forEach(key => {
                    if (row[key] === 1 || row[key] === 0) {
                        if (key.includes('is_') || key.includes('_active') || key.includes('_featured')) {
                            row[key] = Boolean(row[key]);
                        }
                    }
                });
            }
            return row;
        });
    }
    return results;
}

module.exports = {
    pool,
    testConnection,
    getDatabaseType,
    adaptQuery,
    adaptResults,
    DB_TYPE
};
