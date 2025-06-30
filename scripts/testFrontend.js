/**
 * اختبار الواجهة الأمامية والتحقق من الأخطاء
 */

const puppeteer = require('puppeteer');
const path = require('path');

// إعدادات الاختبار
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    pages: [
        { name: 'الصفحة الرئيسية', url: '/', protected: false },
        { name: 'تسجيل الدخول', url: '/login.html', protected: false },
        { name: 'إعداد خطبة', url: '/prepare_sermon.html', protected: true },
        { name: 'الخطب الجاهزة', url: '/sermons.html', protected: false },
        { name: 'العلماء', url: '/scholars.html', protected: false },
        { name: 'المفكرون', url: '/thinkers.html', protected: false },
        { name: 'المحاضرات', url: '/lectures.html', protected: false }
    ],
    testUser: {
        email: 'admin@tamsik.com',
        password: 'admin123'
    }
};

// دالة اختبار صفحة واحدة
async function testPage(browser, pageConfig) {
    const page = await browser.newPage();
    const errors = [];
    const warnings = [];
    
    try {
        console.log(`\n🔍 اختبار صفحة: ${pageConfig.name}`);
        
        // مراقبة أخطاء الكونسول
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            
            if (type === 'error') {
                errors.push(`Console Error: ${text}`);
            } else if (type === 'warning') {
                warnings.push(`Console Warning: ${text}`);
            }
        });
        
        // مراقبة أخطاء الشبكة
        page.on('response', response => {
            if (response.status() >= 400) {
                errors.push(`Network Error: ${response.status()} - ${response.url()}`);
            }
        });
        
        // مراقبة أخطاء JavaScript
        page.on('pageerror', error => {
            errors.push(`JavaScript Error: ${error.message}`);
        });
        
        // الانتقال للصفحة
        const response = await page.goto(`${TEST_CONFIG.baseUrl}${pageConfig.url}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        if (!response.ok()) {
            errors.push(`HTTP Error: ${response.status()} - ${response.statusText()}`);
        }
        
        // انتظار تحميل المحتوى
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // فحص العناصر الأساسية
        const basicElements = await page.evaluate(() => {
            const results = {
                hasTitle: !!document.title,
                hasHeader: !!document.querySelector('header'),
                hasNav: !!document.querySelector('nav'),
                hasMain: !!document.querySelector('main'),
                hasFooter: !!document.querySelector('footer'),
                hasLogo: !!document.querySelector('.logo'),
                scriptsLoaded: {
                    authProtection: typeof window.authProtection !== 'undefined',
                    simpleAuth: typeof window.simpleAuth !== 'undefined',
                    authSystem: typeof window.authSystem !== 'undefined'
                }
            };
            
            return results;
        });
        
        // التحقق من العناصر المطلوبة
        if (!basicElements.hasTitle) warnings.push('لا يوجد عنوان للصفحة');
        if (!basicElements.hasHeader) errors.push('لا يوجد header');
        if (!basicElements.hasNav) errors.push('لا يوجد nav');
        if (!basicElements.hasMain) warnings.push('لا يوجد main');
        if (!basicElements.hasFooter) warnings.push('لا يوجد footer');
        if (!basicElements.hasLogo) warnings.push('لا يوجد logo');
        
        // التحقق من تحميل السكريبتات
        if (!basicElements.scriptsLoaded.authProtection) {
            warnings.push('لم يتم تحميل نظام الحماية');
        }
        
        // اختبار نظام الحماية للصفحات المحمية
        if (pageConfig.protected) {
            const isRedirected = await page.evaluate(() => {
                return window.location.pathname.includes('login.html');
            });
            
            if (!isRedirected) {
                warnings.push('الصفحة المحمية لم يتم إعادة توجيهها لتسجيل الدخول');
            } else {
                console.log('✅ تم إعادة التوجيه للصفحة المحمية بنجاح');
            }
        }
        
        // فحص الروابط المكسورة
        const brokenLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href]'));
            const broken = [];
            
            links.forEach(link => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) return; // تجاهل الروابط المحلية
                
                if (!href || href === '' || href === '#') {
                    broken.push(`رابط فارغ: ${link.textContent.trim()}`);
                }
            });
            
            return broken;
        });
        
        warnings.push(...brokenLinks);
        
        // فحص الصور المكسورة
        const brokenImages = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'));
            const broken = [];
            
            images.forEach(img => {
                if (!img.complete || img.naturalWidth === 0) {
                    broken.push(`صورة مكسورة: ${img.src}`);
                }
            });
            
            return broken;
        });
        
        warnings.push(...brokenImages);
        
        // النتائج
        const result = {
            name: pageConfig.name,
            url: pageConfig.url,
            status: errors.length === 0 ? 'نجح' : 'فشل',
            errors: errors,
            warnings: warnings,
            basicElements: basicElements
        };
        
        console.log(`${result.status === 'نجح' ? '✅' : '❌'} ${pageConfig.name}: ${result.status}`);
        if (errors.length > 0) {
            console.log(`  🔴 أخطاء (${errors.length}):`);
            errors.forEach(error => console.log(`    - ${error}`));
        }
        if (warnings.length > 0) {
            console.log(`  🟡 تحذيرات (${warnings.length}):`);
            warnings.forEach(warning => console.log(`    - ${warning}`));
        }
        
        return result;
        
    } catch (error) {
        console.log(`❌ خطأ في اختبار ${pageConfig.name}: ${error.message}`);
        return {
            name: pageConfig.name,
            url: pageConfig.url,
            status: 'خطأ',
            errors: [error.message],
            warnings: warnings
        };
    } finally {
        await page.close();
    }
}

// دالة اختبار تسجيل الدخول
async function testLogin(browser) {
    const page = await browser.newPage();
    
    try {
        console.log('\n🔐 اختبار تسجيل الدخول...');
        
        await page.goto(`${TEST_CONFIG.baseUrl}/login.html`, {
            waitUntil: 'networkidle2'
        });
        
        // ملء نموذج تسجيل الدخول
        await page.type('#email', TEST_CONFIG.testUser.email);
        await page.type('#password', TEST_CONFIG.testUser.password);
        
        // النقر على زر تسجيل الدخول
        await page.click('button[type="submit"]');
        
        // انتظار إعادة التوجيه
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // التحقق من نجاح تسجيل الدخول
        const currentUrl = page.url();
        const isLoggedIn = await page.evaluate(() => {
            return localStorage.getItem('currentUser') !== null;
        });
        
        if (isLoggedIn && currentUrl.includes('index.html')) {
            console.log('✅ تم تسجيل الدخول بنجاح');
            return true;
        } else {
            console.log('❌ فشل في تسجيل الدخول');
            return false;
        }
        
    } catch (error) {
        console.log(`❌ خطأ في اختبار تسجيل الدخول: ${error.message}`);
        return false;
    } finally {
        await page.close();
    }
}

// دالة اختبار الصفحات المحمية بعد تسجيل الدخول
async function testProtectedPagesAfterLogin(browser) {
    const page = await browser.newPage();
    
    try {
        console.log('\n🔒 اختبار الصفحات المحمية بعد تسجيل الدخول...');
        
        // تسجيل الدخول أولاً
        await page.goto(`${TEST_CONFIG.baseUrl}/login.html`);
        await page.type('#email', TEST_CONFIG.testUser.email);
        await page.type('#password', TEST_CONFIG.testUser.password);
        await page.click('button[type="submit"]');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // اختبار الوصول للصفحات المحمية
        const protectedPages = TEST_CONFIG.pages.filter(p => p.protected);
        
        for (const pageConfig of protectedPages) {
            await page.goto(`${TEST_CONFIG.baseUrl}${pageConfig.url}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const currentUrl = page.url();
            if (currentUrl.includes(pageConfig.url)) {
                console.log(`✅ تم الوصول للصفحة المحمية: ${pageConfig.name}`);
            } else {
                console.log(`❌ لم يتم الوصول للصفحة المحمية: ${pageConfig.name}`);
            }
        }
        
    } catch (error) {
        console.log(`❌ خطأ في اختبار الصفحات المحمية: ${error.message}`);
    } finally {
        await page.close();
    }
}

// دالة الاختبار الرئيسية
async function runFrontendTests() {
    console.log('🚀 بدء اختبار الواجهة الأمامية...\n');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const results = [];
        
        // اختبار جميع الصفحات
        for (const pageConfig of TEST_CONFIG.pages) {
            const result = await testPage(browser, pageConfig);
            results.push(result);
        }
        
        // اختبار تسجيل الدخول
        const loginSuccess = await testLogin(browser);
        
        // اختبار الصفحات المحمية بعد تسجيل الدخول
        if (loginSuccess) {
            await testProtectedPagesAfterLogin(browser);
        }
        
        // تلخيص النتائج
        console.log('\n📊 ملخص النتائج:');
        const successful = results.filter(r => r.status === 'نجح').length;
        const failed = results.filter(r => r.status === 'فشل').length;
        const errors = results.filter(r => r.status === 'خطأ').length;
        
        console.log(`✅ نجح: ${successful}`);
        console.log(`❌ فشل: ${failed}`);
        console.log(`🔴 أخطاء: ${errors}`);
        
        const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
        const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
        
        console.log(`🟡 إجمالي التحذيرات: ${totalWarnings}`);
        console.log(`🔴 إجمالي الأخطاء: ${totalErrors}`);
        
        return {
            results,
            summary: { successful, failed, errors, totalWarnings, totalErrors },
            loginTest: loginSuccess
        };
        
    } finally {
        await browser.close();
    }
}

// تشغيل الاختبارات إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    runFrontendTests()
        .then((testResults) => {
            console.log('\n🎉 انتهى اختبار الواجهة الأمامية');
            process.exit(testResults.summary.failed > 0 ? 1 : 0);
        })
        .catch((error) => {
            console.error('\n❌ خطأ في تشغيل اختبارات الواجهة الأمامية:', error);
            process.exit(1);
        });
}

module.exports = { runFrontendTests };
