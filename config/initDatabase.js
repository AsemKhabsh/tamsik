const { pool } = require('./database');
const {
    createUsersTable,
    createCategoriesTable,
    createScholarsTable,
    createFatwasTable,
    createSermonsTable,
    createLecturesTable,
    createThinkersTable,
    createNewsletterTable,
    createQuestionsTable,
    createVersesSuggestionsTable,
    createHadithSuggestionsTable,
    createAtharSuggestionsTable,
    createSajaSuggestionsTable,
    createPoetrySuggestionsTable,
    createDuaSuggestionsTable
} = require('./createTables');

async function initializeDatabase() {
    try {
        console.log('🔄 بدء تهيئة قاعدة البيانات...');

        // إنشاء الجداول الأساسية
        console.log('📋 إنشاء جدول المستخدمين...');
        await pool.execute(createUsersTable);

        console.log('📋 إنشاء جدول الفئات...');
        await pool.execute(createCategoriesTable);

        console.log('📋 إنشاء جدول العلماء...');
        await pool.execute(createScholarsTable);

        console.log('📋 إنشاء جدول الفتاوى...');
        await pool.execute(createFatwasTable);

        console.log('📋 إنشاء جدول الخطب...');
        await pool.execute(createSermonsTable);

        console.log('📋 إنشاء جدول المحاضرات...');
        await pool.execute(createLecturesTable);

        console.log('📋 إنشاء جدول المفكرين...');
        await pool.execute(createThinkersTable);

        console.log('📋 إنشاء جدول النشرة الإخبارية...');
        await pool.execute(createNewsletterTable);

        console.log('📋 إنشاء جدول الأسئلة...');
        await pool.execute(createQuestionsTable);

        // إنشاء جداول الاقتراحات الجديدة
        console.log('📋 إنشاء جدول اقتراحات الآيات القرآنية...');
        await pool.execute(createVersesSuggestionsTable);

        console.log('📋 إنشاء جدول اقتراحات الأحاديث...');
        await pool.execute(createHadithSuggestionsTable);

        console.log('📋 إنشاء جدول اقتراحات الأثار...');
        await pool.execute(createAtharSuggestionsTable);

        console.log('📋 إنشاء جدول اقتراحات السجع...');
        await pool.execute(createSajaSuggestionsTable);

        console.log('📋 إنشاء جدول اقتراحات الشعر...');
        await pool.execute(createPoetrySuggestionsTable);

        console.log('📋 إنشاء جدول اقتراحات الدعاء...');
        await pool.execute(createDuaSuggestionsTable);

        console.log('✅ تم إنشاء جميع الجداول بنجاح!');

        // إدراج بيانات أولية للاختبار
        await insertInitialData();

        console.log('🎉 تم تهيئة قاعدة البيانات بنجاح!');

    } catch (error) {
        console.error('❌ خطأ في تهيئة قاعدة البيانات:', error);
        throw error;
    }
}

async function insertInitialData() {
    try {
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

        for (const category of categories) {
            await pool.execute(
                'INSERT IGNORE INTO categories (name, description) VALUES (?, ?)',
                [category, `فئة ${category}`]
            );
        }

        // إدراج بعض الاقتراحات الأولية للآيات القرآنية
        const initialVerses = [
            {
                verse_text: 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ',
                surah_name: 'آل عمران',
                verse_number: 102,
                context_type: 'أمر',
                topic: 'التقوى'
            },
            {
                verse_text: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ',
                surah_name: 'الطلاق',
                verse_number: 2,
                context_type: 'وعد',
                topic: 'التقوى'
            }
        ];

        for (const verse of initialVerses) {
            await pool.execute(
                'INSERT IGNORE INTO verses_suggestions (verse_text, surah_name, verse_number, context_type, topic) VALUES (?, ?, ?, ?, ?)',
                [verse.verse_text, verse.surah_name, verse.verse_number, verse.context_type, verse.topic]
            );
        }

        // إدراج بعض الاقتراحات الأولية للأحاديث
        const initialHadith = [
            {
                hadith_text: 'اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن',
                narrator: 'أبو ذر الغفاري',
                source: 'الترمذي',
                authentication: 'حسن',
                context_type: 'أمر',
                topic: 'التقوى'
            }
        ];

        for (const hadith of initialHadith) {
            await pool.execute(
                'INSERT IGNORE INTO hadith_suggestions (hadith_text, narrator, source, authentication, context_type, topic) VALUES (?, ?, ?, ?, ?, ?)',
                [hadith.hadith_text, hadith.narrator, hadith.source, hadith.authentication, hadith.context_type, hadith.topic]
            );
        }

        // إدراج بعض الاقتراحات الأولية للدعاء
        const initialDuas = [
            {
                dua_text: 'الحمد لله رب العالمين، الرحمن الرحيم، مالك يوم الدين',
                dua_type: 'ثناء',
                topic: 'عام',
                source: 'القرآن الكريم'
            },
            {
                dua_text: 'ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار',
                dua_type: 'دعاء قرآني',
                topic: 'عام',
                source: 'سورة البقرة'
            },
            {
                dua_text: 'اللهم أصلح لي ديني الذي هو عصمة أمري، وأصلح لي دنياي التي فيها معاشي',
                dua_type: 'دعاء نبوي',
                topic: 'عام',
                source: 'صحيح مسلم'
            }
        ];

        for (const dua of initialDuas) {
            await pool.execute(
                'INSERT IGNORE INTO dua_suggestions (dua_text, dua_type, topic, source) VALUES (?, ?, ?, ?)',
                [dua.dua_text, dua.dua_type, dua.topic, dua.source]
            );
        }

        console.log('✅ تم إدراج البيانات الأولية بنجاح!');

    } catch (error) {
        console.error('❌ خطأ في إدراج البيانات الأولية:', error);
        throw error;
    }
}

// تشغيل التهيئة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('🎉 تمت تهيئة قاعدة البيانات بنجاح!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ فشل في تهيئة قاعدة البيانات:', error);
            process.exit(1);
        });
}

module.exports = { initializeDatabase, insertInitialData };
