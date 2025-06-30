/**
 * إضافة بيانات أولية شاملة لنظام الاقتراحات
 * يتضمن آيات قرآنية، أحاديث، أدعية، سجع، وشعر
 */

const { pool } = require('../config/database-adapter');

// آيات قرآنية للتقوى
const versesData = [
    {
        verse_text: "يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ",
        surah_name: "آل عمران",
        verse_number: 102,
        context_type: "أمر",
        topic: "التقوى"
    },
    {
        verse_text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ",
        surah_name: "الطلاق",
        verse_number: 2,
        context_type: "وعد",
        topic: "التقوى"
    },
    {
        verse_text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مِنْ أَمْرِهِ يُسْرًا",
        surah_name: "الطلاق",
        verse_number: 4,
        context_type: "وعد",
        topic: "التقوى"
    },
    {
        verse_text: "إِنَّ الْمُتَّقِينَ فِي جَنَّاتٍ وَنَهَرٍ فِي مَقْعَدِ صِدْقٍ عِندَ مَلِيكٍ مُّقْتَدِرٍ",
        surah_name: "القمر",
        verse_number: 54,
        context_type: "وعد",
        topic: "التقوى"
    },
    {
        verse_text: "وَاتَّقُوا اللَّهَ الَّذِي تَسَاءَلُونَ بِهِ وَالْأَرْحَامَ إِنَّ اللَّهَ كَانَ عَلَيْكُمْ رَقِيبًا",
        surah_name: "النساء",
        verse_number: 1,
        context_type: "أمر",
        topic: "التقوى"
    },
    {
        verse_text: "وَلِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ وَكَانَ اللَّهُ بِكُلِّ شَيْءٍ مُّحِيطًا",
        surah_name: "النساء",
        verse_number: 126,
        context_type: "إخبار",
        topic: "عظمة الله"
    }
];

// أحاديث شريفة
const hadithData = [
    {
        hadith_text: "اتق الله حيثما كنت، وأتبع السيئة الحسنة تمحها، وخالق الناس بخلق حسن",
        narrator: "أبو ذر الغفاري",
        source: "الترمذي",
        authentication: "حسن",
        context_type: "أمر",
        topic: "التقوى"
    },
    {
        hadith_text: "التقوى ها هنا، وأشار إلى صدره ثلاث مرات",
        narrator: "أبو هريرة",
        source: "مسلم",
        authentication: "صحيح",
        context_type: "إخبار",
        topic: "التقوى"
    },
    {
        hadith_text: "أكثر ما يدخل الناس الجنة تقوى الله وحسن الخلق",
        narrator: "أبو هريرة",
        source: "الترمذي",
        authentication: "حسن",
        context_type: "وعد",
        topic: "التقوى"
    },
    {
        hadith_text: "من كان يؤمن بالله واليوم الآخر فليقل خيراً أو ليصمت",
        narrator: "أبو هريرة",
        source: "البخاري",
        authentication: "صحيح",
        context_type: "أمر",
        topic: "آداب الكلام"
    }
];

// أدعية متنوعة
const duaData = [
    {
        dua_text: "الحمد لله رب العالمين، والصلاة والسلام على أشرف المرسلين",
        dua_type: "ثناء",
        topic: "حمد وثناء",
        source: "عام"
    },
    {
        dua_text: "ربنا آتنا في الدنيا حسنة وفي الآخرة حسنة وقنا عذاب النار",
        dua_type: "دعاء قرآني",
        topic: "دعاء شامل",
        source: "القرآن الكريم"
    },
    {
        dua_text: "اللهم أصلح لي ديني الذي هو عصمة أمري، وأصلح لي دنياي التي فيها معاشي",
        dua_type: "دعاء نبوي",
        topic: "إصلاح الدين والدنيا",
        source: "مسلم"
    },
    {
        dua_text: "اللهم أعز الإسلام والمسلمين، وأذل الشرك والمشركين",
        dua_type: "دعاء للإسلام والمسلمين",
        topic: "نصرة الإسلام",
        source: "عام"
    },
    {
        dua_text: "اللهم أهلك الظالمين بالظالمين وأخرجنا من بينهم سالمين",
        dua_type: "دعاء لردع الظالمين",
        topic: "ضد الظلم",
        source: "عام"
    },
    {
        dua_text: "اللهم أغثنا، اللهم أغثنا، اللهم أغثنا",
        dua_type: "استسقاء",
        topic: "طلب المطر",
        source: "البخاري"
    }
];

// سجع وخطابة
const sajaData = [
    {
        saja_text: "الحمد لله الذي هدانا للإسلام، وما كنا لنهتدي لولا أن هدانا الله",
        topic: "حمد وشكر",
        rhyme: "الله",
        attribution: "خطباء المساجد",
        reference: "عام"
    },
    {
        saja_text: "نحمده سبحانه ونستعينه، ونستغفره ونتوب إليه",
        topic: "حمد واستعانة",
        rhyme: "إليه",
        attribution: "الخطابة التقليدية",
        reference: "عام"
    }
];

// شعر إسلامي
const poetryData = [
    {
        poetry_text: "تقوى الله خير الزاد للعبد في غد\nوأفضل ما يقدم للآخرة",
        topic: "التقوى",
        rhyme: "الآخرة",
        meter: "البسيط",
        poet: "مجهول",
        reference: "الشعر الإسلامي"
    },
    {
        poetry_text: "إذا المرء لم يدنس من اللؤم عرضه\nفكل رداء يرتديه جميل",
        topic: "الأخلاق",
        rhyme: "جميل",
        meter: "الطويل",
        poet: "السموأل",
        reference: "ديوان السموأل"
    }
];

// آثار وأقوال
const atharData = [
    {
        athar_text: "التقوى أن تعمل بطاعة الله على نور من الله ترجو ثواب الله، وأن تترك معصية الله على نور من الله تخاف عقاب الله",
        speaker: "طلق بن حبيب",
        context_type: "إخبار",
        topic: "تعريف التقوى"
    },
    {
        athar_text: "اتقوا الله في السر، فإن الذي يعلم السر يعلم العلانية",
        speaker: "عمر بن الخطاب",
        context_type: "أمر",
        topic: "التقوى"
    }
];

async function addInitialSuggestions() {
    try {
        console.log('🔄 بدء إضافة البيانات الأولية...');

        // إضافة الآيات القرآنية
        console.log('📖 إضافة الآيات القرآنية...');
        for (const verse of versesData) {
            await pool.execute(
                `INSERT OR IGNORE INTO verses_suggestions (verse_text, surah_name, verse_number, context_type, topic, usage_count, created_at) 
                 VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`,
                [verse.verse_text, verse.surah_name, verse.verse_number, verse.context_type, verse.topic]
            );
        }

        // إضافة الأحاديث
        console.log('📚 إضافة الأحاديث الشريفة...');
        for (const hadith of hadithData) {
            await pool.execute(
                `INSERT OR IGNORE INTO hadith_suggestions (hadith_text, narrator, source, authentication, context_type, topic, usage_count, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
                [hadith.hadith_text, hadith.narrator, hadith.source, hadith.authentication, hadith.context_type, hadith.topic]
            );
        }

        // إضافة الأدعية
        console.log('🤲 إضافة الأدعية...');
        for (const dua of duaData) {
            await pool.execute(
                `INSERT OR IGNORE INTO dua_suggestions (dua_text, dua_type, topic, source, usage_count, created_at) 
                 VALUES (?, ?, ?, ?, 1, datetime('now'))`,
                [dua.dua_text, dua.dua_type, dua.topic, dua.source]
            );
        }

        // إضافة السجع
        console.log('🎭 إضافة السجع...');
        for (const saja of sajaData) {
            await pool.execute(
                `INSERT OR IGNORE INTO saja_suggestions (saja_text, topic, rhyme, attribution, reference, usage_count, created_at) 
                 VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`,
                [saja.saja_text, saja.topic, saja.rhyme, saja.attribution, saja.reference]
            );
        }

        // إضافة الشعر
        console.log('📜 إضافة الشعر...');
        for (const poetry of poetryData) {
            await pool.execute(
                `INSERT OR IGNORE INTO poetry_suggestions (poetry_text, topic, rhyme, meter, poet, reference, usage_count, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`,
                [poetry.poetry_text, poetry.topic, poetry.rhyme, poetry.meter, poetry.poet, poetry.reference]
            );
        }

        // إضافة الآثار
        console.log('💬 إضافة الآثار والأقوال...');
        for (const athar of atharData) {
            await pool.execute(
                `INSERT OR IGNORE INTO athar_suggestions (athar_text, speaker, context_type, topic, usage_count, created_at) 
                 VALUES (?, ?, ?, ?, 1, datetime('now'))`,
                [athar.athar_text, athar.speaker, athar.context_type, athar.topic]
            );
        }

        console.log('✅ تم إضافة جميع البيانات الأولية بنجاح!');
        
        // عرض إحصائيات
        const [versesCount] = await pool.execute('SELECT COUNT(*) as count FROM verses_suggestions');
        const [hadithCount] = await pool.execute('SELECT COUNT(*) as count FROM hadith_suggestions');
        const [duaCount] = await pool.execute('SELECT COUNT(*) as count FROM dua_suggestions');
        const [sajaCount] = await pool.execute('SELECT COUNT(*) as count FROM saja_suggestions');
        const [poetryCount] = await pool.execute('SELECT COUNT(*) as count FROM poetry_suggestions');
        const [atharCount] = await pool.execute('SELECT COUNT(*) as count FROM athar_suggestions');

        console.log('\n📊 إحصائيات قاعدة البيانات:');
        console.log(`📖 الآيات القرآنية: ${versesCount[0].count}`);
        console.log(`📚 الأحاديث: ${hadithCount[0].count}`);
        console.log(`🤲 الأدعية: ${duaCount[0].count}`);
        console.log(`🎭 السجع: ${sajaCount[0].count}`);
        console.log(`📜 الشعر: ${poetryCount[0].count}`);
        console.log(`💬 الآثار: ${atharCount[0].count}`);

    } catch (error) {
        console.error('❌ خطأ في إضافة البيانات:', error);
    }
}

// تشغيل الدالة إذا تم استدعاء الملف مباشرة
if (require.main === module) {
    addInitialSuggestions().then(() => {
        console.log('🎉 انتهت عملية إضافة البيانات الأولية');
        process.exit(0);
    }).catch(error => {
        console.error('❌ فشل في إضافة البيانات:', error);
        process.exit(1);
    });
}

module.exports = { addInitialSuggestions };
