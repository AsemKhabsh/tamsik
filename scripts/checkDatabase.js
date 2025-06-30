/**
 * فحص قاعدة البيانات والجداول الموجودة
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'tamsik.db');

console.log('🔍 فحص قاعدة البيانات...');
console.log('📁 مسار قاعدة البيانات:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ خطأ في الاتصال بقاعدة البيانات:', err.message);
        process.exit(1);
    } else {
        console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    }
});

// فحص الجداول الموجودة
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
        console.error('❌ خطأ في استعلام الجداول:', err.message);
    } else {
        console.log('\n📋 الجداول الموجودة:');
        if (rows.length === 0) {
            console.log('⚠️  لا توجد جداول في قاعدة البيانات');
        } else {
            rows.forEach((row, index) => {
                console.log(`${index + 1}. ${row.name}`);
            });
        }
    }
    
    // فحص بنية كل جدول
    checkTableStructures(rows);
});

function checkTableStructures(tables) {
    if (tables.length === 0) {
        db.close();
        return;
    }
    
    console.log('\n🏗️  بنية الجداول:');
    let completed = 0;
    
    tables.forEach(table => {
        db.all(`PRAGMA table_info(${table.name})`, (err, columns) => {
            if (err) {
                console.error(`❌ خطأ في فحص جدول ${table.name}:`, err.message);
            } else {
                console.log(`\n📊 جدول ${table.name}:`);
                columns.forEach(col => {
                    console.log(`  - ${col.name}: ${col.type}${col.pk ? ' (PRIMARY KEY)' : ''}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
                });
                
                // عد الصفوف في كل جدول
                db.get(`SELECT COUNT(*) as count FROM ${table.name}`, (err, result) => {
                    if (err) {
                        console.error(`❌ خطأ في عد صفوف ${table.name}:`, err.message);
                    } else {
                        console.log(`  📈 عدد الصفوف: ${result.count}`);
                    }
                    
                    completed++;
                    if (completed === tables.length) {
                        console.log('\n✅ تم فحص جميع الجداول');
                        db.close();
                    }
                });
            }
        });
    });
}
