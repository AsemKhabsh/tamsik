#!/usr/bin/env node

/**
 * سكريبت النشر التلقائي - منصة تمسيك
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء عملية النشر...');

// التحقق من وجود الملفات المطلوبة
const requiredFiles = [
    'package.json',
    'server.js',
    'config/database-adapter.js'
];

console.log('📋 فحص الملفات المطلوبة...');
requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`❌ الملف المطلوب غير موجود: ${file}`);
        process.exit(1);
    }
    console.log(`✅ ${file}`);
});

// تثبيت التبعيات
console.log('📦 تثبيت التبعيات...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ تم تثبيت التبعيات بنجاح');
} catch (error) {
    console.error('❌ فشل في تثبيت التبعيات');
    process.exit(1);
}

// فحص قاعدة البيانات
console.log('🗄️ فحص قاعدة البيانات...');
try {
    execSync('node scripts/checkDatabase.js', { stdio: 'inherit' });
    console.log('✅ قاعدة البيانات جاهزة');
} catch (error) {
    console.log('⚠️ مشكلة في قاعدة البيانات، محاولة إعادة إنشائها...');
    try {
        execSync('node config/sqlite-setup.js', { stdio: 'inherit' });
        console.log('✅ تم إعادة إنشاء قاعدة البيانات');
    } catch (setupError) {
        console.error('❌ فشل في إعداد قاعدة البيانات');
        process.exit(1);
    }
}

// إنشاء مجلدات مطلوبة
console.log('📁 إنشاء المجلدات المطلوبة...');
const requiredDirs = ['uploads', 'logs', 'data'];
requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ تم إنشاء مجلد: ${dir}`);
    }
});

// اختبار التطبيق
console.log('🧪 اختبار التطبيق...');
try {
    const testResult = execSync('node -e "require(\'./config/database-adapter\').testConnection()"', { encoding: 'utf8' });
    console.log('✅ اختبار قاعدة البيانات ناجح');
} catch (error) {
    console.error('❌ فشل في اختبار قاعدة البيانات');
    process.exit(1);
}

// إنشاء ملف .env إذا لم يكن موجوداً
if (!fs.existsSync('.env')) {
    console.log('⚙️ إنشاء ملف .env...');
    const envContent = `NODE_ENV=production
PORT=3000
DB_TYPE=sqlite
JWT_SECRET=tamsik_jwt_secret_key_${Date.now()}
`;
    fs.writeFileSync('.env', envContent);
    console.log('✅ تم إنشاء ملف .env');
}

console.log('🎉 تم إعداد النشر بنجاح!');
console.log('');
console.log('📋 الخطوات التالية:');
console.log('1. تشغيل التطبيق: npm start');
console.log('2. أو باستخدام PM2: pm2 start server.js --name "tamsik"');
console.log('3. أو باستخدام Docker: docker-compose up -d');
console.log('');
console.log('🌐 الوصول للتطبيق: http://localhost:3000');
console.log('🔗 API Health Check: http://localhost:3000/api/health'); 