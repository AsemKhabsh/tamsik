const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'tamsik.db');

console.log('🔄 إدراج البيانات الأولية...');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ خطأ في فتح قاعدة البيانات:', err.message);
        process.exit(1);
    }
    console.log('✅ تم فتح قاعدة البيانات');
});

// إدراج الفئات
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

console.log('📝 إدراج الفئات...');
const insertCategory = db.prepare('INSERT OR REPLACE INTO categories (name, description) VALUES (?, ?)');

categories.forEach((category, index) => {
    insertCategory.run(category, `فئة ${category}`, (err) => {
        if (err) {
            console.error(`❌ خطأ في إدراج فئة ${category}:`, err.message);
        } else {
            console.log(`✅ تم إدراج فئة: ${category}`);
        }
    });
});

insertCategory.finalize();

// إدراج الآيات القرآنية
console.log('📖 إدراج الآيات القرآنية...');
const verses = [
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
    },
    {
        verse_text: 'وَاتَّقُوا اللَّهَ الَّذِي تَسَاءَلُونَ بِهِ وَالْأَرْحَامَ إِنَّ اللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا',
        surah_name: 'النساء',
        verse_number: 1,
        context_type: 'أمر',
        topic: 'التقوى'
    },
    {
        verse_text: 'إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ',
        surah_name: 'الحجرات',
        verse_number: 13,
        context_type: 'إخبار',
        topic: 'التقوى'
    }
];

const insertVerse = db.prepare(`
    INSERT OR REPLACE INTO verses_suggestions 
    (verse_text, surah_name, verse_number, context_type, topic, usage_count) 
    VALUES (?, ?, ?, ?, ?, 1)
`);

verses.forEach(verse => {
    insertVerse.run(
        verse.verse_text,
        verse.surah_name,
        verse.verse_number,
        verse.context_type,
        verse.topic,
        (err) => {
            if (err) {
                console.error('❌ خطأ في إدراج آية:', err.message);
            } else {
                console.log(`✅ تم إدراج آية من سورة ${verse.surah_name}`);
            }
        }
    );
});

insertVerse.finalize();

// إدراج الأحاديث
console.log('📚 إدراج الأحاديث...');
const hadithList = [
    {
        hadith_text: 'اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن',
        narrator: 'أبو ذر الغفاري',
        source: 'الترمذي',
        authentication: 'حسن',
        context_type: 'أمر',
        topic: 'التقوى'
    },
    {
        hadith_text: 'إن الله كتب الإحسان على كل شيء، فإذا قتلتم فأحسنوا القتلة، وإذا ذبحتم فأحسنوا الذبح',
        narrator: 'شداد بن أوس',
        source: 'مسلم',
        authentication: 'صحيح',
        context_type: 'أمر',
        topic: 'الإحسان'
    }
];

const insertHadith = db.prepare(`
    INSERT OR REPLACE INTO hadith_suggestions 
    (hadith_text, narrator, source, authentication, context_type, topic, usage_count) 
    VALUES (?, ?, ?, ?, ?, ?, 1)
`);

hadithList.forEach(hadith => {
    insertHadith.run(
        hadith.hadith_text,
        hadith.narrator,
        hadith.source,
        hadith.authentication,
        hadith.context_type,
        hadith.topic,
        (err) => {
            if (err) {
                console.error('❌ خطأ في إدراج حديث:', err.message);
            } else {
                console.log(`✅ تم إدراج حديث للراوي ${hadith.narrator}`);
            }
        }
    );
});

insertHadith.finalize();

// إدراج الدعاء
console.log('🤲 إدراج الدعاء...');
const duaList = [
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
    },
    {
        dua_text: 'اللهم أعز الإسلام والمسلمين، وأذل الشرك والمشركين',
        dua_type: 'دعاء للإسلام والمسلمين',
        topic: 'عام',
        source: 'عام'
    },
    {
        dua_text: 'اللهم أغثنا، اللهم أغثنا، اللهم أغثنا',
        dua_type: 'استسقاء',
        topic: 'المطر',
        source: 'السنة النبوية'
    }
];

const insertDua = db.prepare(`
    INSERT OR REPLACE INTO dua_suggestions 
    (dua_text, dua_type, topic, source, usage_count) 
    VALUES (?, ?, ?, ?, 1)
`);

duaList.forEach(dua => {
    insertDua.run(
        dua.dua_text,
        dua.dua_type,
        dua.topic,
        dua.source,
        (err) => {
            if (err) {
                console.error('❌ خطأ في إدراج دعاء:', err.message);
            } else {
                console.log(`✅ تم إدراج دعاء من نوع ${dua.dua_type}`);
            }
        }
    );
});

insertDua.finalize();

// إدراج أمثلة للشعر
console.log('🎭 إدراج الشعر...');
const poetryList = [
    {
        poetry_text: 'وما من كاتب إلا سيفنى *** ويبقى الدهر ما كتبت يداه\nفلا تكتب بكفك غير شيء *** يسرك في القيامة أن تراه',
        topic: 'الموعظة',
        rhyme: 'اه',
        meter: 'الطويل',
        poet: 'غير معروف',
        reference: 'الشعر العربي'
    }
];

const insertPoetry = db.prepare(`
    INSERT OR REPLACE INTO poetry_suggestions 
    (poetry_text, topic, rhyme, meter, poet, reference, usage_count) 
    VALUES (?, ?, ?, ?, ?, ?, 1)
`);

poetryList.forEach(poetry => {
    insertPoetry.run(
        poetry.poetry_text,
        poetry.topic,
        poetry.rhyme,
        poetry.meter,
        poetry.poet,
        poetry.reference,
        (err) => {
            if (err) {
                console.error('❌ خطأ في إدراج شعر:', err.message);
            } else {
                console.log(`✅ تم إدراج شعر للشاعر ${poetry.poet}`);
            }
        }
    );
});

insertPoetry.finalize();

// إغلاق قاعدة البيانات
setTimeout(() => {
    db.close((err) => {
        if (err) {
            console.error('❌ خطأ في إغلاق قاعدة البيانات:', err.message);
        } else {
            console.log('🎉 تم إدراج جميع البيانات الأولية بنجاح!');
            console.log('✅ قاعدة البيانات جاهزة للاستخدام');
        }
    });
}, 2000); // انتظار ثانيتين للتأكد من إنهاء جميع العمليات
