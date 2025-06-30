// ملف JavaScript الخاص بصفحة العلماء والفتاوى

// بيانات الفتاوى (يمكن استبدالها بطلب API أو قاعدة بيانات)
const fatwasData = [
    {
        id: 1,
        title: "حكم صلاة الجماعة في المسجد",
        question: "ما حكم صلاة الجماعة في المسجد؟ وهل يجوز التخلف عنها لعذر؟",
        answer: "صلاة الجماعة في المسجد واجبة على الرجال القادرين، لقول النبي صلى الله عليه وسلم: «من سمع النداء فلم يأت فلا صلاة له إلا من عذر». ويجوز التخلف عنها لأعذار شرعية كالمرض والخوف والمطر الشديد ونحو ذلك.",
        category: "worship",
        scholar: {
            id: 1,
            name: "الشيخ عبد العزيز بن باز",
            avatar: "images/scholars/binbaz.jpg"
        },
        date: "2023-01-15",
        views: 1250,
        likes: 85
    },
    {
        id: 2,
        title: "حكم بيع التقسيط بزيادة في السعر",
        question: "ما حكم بيع السلعة بالتقسيط بزيادة في السعر عن بيعها نقداً؟",
        answer: "يجوز بيع السلعة بالتقسيط بزيادة في السعر عن بيعها نقداً، بشرط أن يكون الثمن معلوماً ومحدداً عند العقد، وأن لا يكون هناك زيادة في الثمن بعد ثبوته في ذمة المشتري. وهذا ما عليه جمهور أهل العلم.",
        category: "transactions",
        scholar: {
            id: 2,
            name: "الشيخ محمد بن صالح العثيمين",
            avatar: "images/scholars/uthaymeen.jpg"
        },
        date: "2023-02-20",
        views: 980,
        likes: 62
    },
    {
        id: 3,
        title: "حكم استخدام وسائل التواصل الاجتماعي",
        question: "ما حكم استخدام وسائل التواصل الاجتماعي مثل فيسبوك وتويتر وغيرها؟",
        answer: "استخدام وسائل التواصل الاجتماعي مباح في الأصل، وتختلف أحكامه باختلاف الاستخدام. فإن كان في الخير والدعوة إلى الله ونشر العلم النافع فهو مستحب، وإن كان في المباحات فهو مباح، وإن كان في المحرمات كنشر الفواحش أو الغيبة والنميمة فهو محرم. والمسلم مأمور باستغلال وقته فيما ينفعه في دينه ودنياه.",
        category: "contemporary",
        scholar: {
            id: 3,
            name: "الشيخ صالح الفوزان",
            avatar: "images/scholars/fawzan.jpg"
        },
        date: "2023-03-10",
        views: 1560,
        likes: 120
    },
    {
        id: 4,
        title: "حكم الطلاق في حالة الغضب الشديد",
        question: "ما حكم الطلاق في حالة الغضب الشديد؟ وهل يقع الطلاق في هذه الحالة؟",
        answer: "الطلاق في حالة الغضب الشديد الذي يغلب على عقل الإنسان ولا يدري ما يقول لا يقع، لأنه في حكم المجنون أو فاقد الوعي. أما إذا كان الغضب لا يخرجه عن وعيه وإدراكه لما يقول فإن الطلاق يقع. والأحوط لمن شك في حالته أن يراجع زوجته ويحتاط لدينه.",
        category: "family",
        scholar: {
            id: 4,
            name: "الشيخ عبد الرحمن البراك",
            avatar: "images/scholars/barrak.jpg"
        },
        date: "2023-04-05",
        views: 2100,
        likes: 95
    },
    {
        id: 5,
        title: "حكم الكذب في المزاح",
        question: "هل يجوز الكذب في المزاح؟",
        answer: "لا يجوز الكذب في المزاح، لقول النبي صلى الله عليه وسلم: «ويل للذي يحدث فيكذب ليضحك به القوم، ويل له ويل له». وقال أيضاً: «أنا زعيم ببيت في ربض الجنة لمن ترك المراء وإن كان محقاً، وببيت في وسط الجنة لمن ترك الكذب وإن كان مازحاً».",
        category: "ethics",
        scholar: {
            id: 2,
            name: "الشيخ محمد بن صالح العثيمين",
            avatar: "images/scholars/uthaymeen.jpg"
        },
        date: "2023-05-12",
        views: 850,
        likes: 73
    }
];

// متغيرات عامة للترقيم
let currentPage = 1;
const itemsPerPage = 3; // عدد الفتاوى في كل صفحة
let filteredFatwas = [...fatwasData]; // نسخة من الفتاوى المفلترة

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // عرض الفتاوى
    displayFatwas(fatwasData);

    // إعداد الترقيم
    setupPagination();

    // إضافة مستمعي الأحداث
    setupEventListeners();
});

// عرض الفتاوى في الصفحة
function displayFatwas(fatwas) {
    const fatwasContainer = document.getElementById('fatwas-container');
    if (!fatwasContainer) return;

    // تحديث الفتاوى المفلترة
    filteredFatwas = [...fatwas];

    // إعادة تعيين الصفحة الحالية
    currentPage = 1;

    // إفراغ الحاوية
    fatwasContainer.innerHTML = '';

    // إذا لم تكن هناك فتاوى للعرض
    if (fatwas.length === 0) {
        fatwasContainer.innerHTML = '<div class="no-results">لا توجد فتاوى متاحة بهذه المعايير</div>';
        // إخفاء الترقيم
        document.querySelector('.pagination').style.display = 'none';
        return;
    }

    // إظهار الترقيم
    document.querySelector('.pagination').style.display = 'flex';

    // حساب الفتاوى للصفحة الحالية
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, fatwas.length);
    const currentFatwas = fatwas.slice(startIndex, endIndex);

    // إضافة الفتاوى
    currentFatwas.forEach(fatwa => {
        const fatwaCard = createFatwaCard(fatwa);
        fatwasContainer.appendChild(fatwaCard);
    });

    // تحديث الترقيم
    updatePagination();
}

// إنشاء بطاقة فتوى
function createFatwaCard(fatwa) {
    const fatwaCard = document.createElement('div');
    fatwaCard.className = 'fatwa-card';
    fatwaCard.setAttribute('data-category', fatwa.category);
    fatwaCard.setAttribute('data-scholar', fatwa.scholar.id);
    fatwaCard.setAttribute('data-id', fatwa.id);

    // تنسيق التاريخ
    const formattedDate = formatDate(fatwa.date);

    // تحديد اسم التصنيف بالعربية
    const categoryName = getCategoryName(fatwa.category);

    // اقتطاع الإجابة إذا كانت طويلة
    const shortAnswer = fatwa.answer.length > 150 ?
        fatwa.answer.substring(0, 150) + '...' :
        fatwa.answer;

    fatwaCard.innerHTML = `
        <div class="fatwa-header">
            <span class="fatwa-category">${categoryName}</span>
            <span class="fatwa-date"><i class="fas fa-calendar"></i> ${formattedDate}</span>
        </div>
        <h3 class="fatwa-title">${fatwa.title}</h3>
        <div class="fatwa-meta">
            <div class="scholar-name">
                <img src="${fatwa.scholar.avatar}" alt="${fatwa.scholar.name}" class="scholar-avatar">
                ${fatwa.scholar.name}
            </div>
            <span><i class="fas fa-eye"></i> ${fatwa.views} مشاهدة</span>
        </div>
        <div class="fatwa-content">
            <div class="fatwa-question">
                <i class="fas fa-question-circle"></i> السؤال:
                <p>${fatwa.question}</p>
            </div>
            <div class="fatwa-answer">
                <i class="fas fa-comment-dots"></i> الإجابة:
                <p>${shortAnswer}</p>
                ${fatwa.answer.length > 150 ? '<a href="#" class="read-more" data-id="' + fatwa.id + '">قراءة المزيد...</a>' : ''}
            </div>
        </div>
        <div class="fatwa-footer">
            <div class="fatwa-actions">
                <button class="like-btn" data-id="${fatwa.id}">
                    <i class="far fa-thumbs-up"></i> إعجاب (${fatwa.likes})
                </button>
                <button class="share-btn" data-id="${fatwa.id}">
                    <i class="fas fa-share-alt"></i> مشاركة
                </button>
                <button class="save-btn" data-id="${fatwa.id}">
                    <i class="far fa-bookmark"></i> حفظ
                </button>
            </div>
            <div class="fatwa-stats">
                <span><i class="fas fa-eye"></i> ${fatwa.views}</span>
                <span><i class="fas fa-thumbs-up"></i> ${fatwa.likes}</span>
            </div>
        </div>
    `;

    // إضافة مستمع حدث لرابط "قراءة المزيد"
    const readMoreLink = fatwaCard.querySelector('.read-more');
    if (readMoreLink) {
        readMoreLink.addEventListener('click', function(e) {
            e.preventDefault();
            const fatwaId = this.getAttribute('data-id');
            openFatwaModal(fatwaId);
        });
    }

    // إضافة مستمع حدث للنقر على العنوان
    const fatwaTitle = fatwaCard.querySelector('.fatwa-title');
    if (fatwaTitle) {
        fatwaTitle.addEventListener('click', function() {
            const fatwaId = fatwaCard.getAttribute('data-id');
            openFatwaModal(fatwaId);
        });
        fatwaTitle.style.cursor = 'pointer';
    }

    return fatwaCard;
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('ar-SA', options);
}

// الحصول على اسم التصنيف بالعربية
function getCategoryName(categoryKey) {
    const categories = {
        'worship': 'العبادات',
        'transactions': 'المعاملات',
        'family': 'الأسرة والزواج',
        'contemporary': 'قضايا معاصرة',
        'ethics': 'الأخلاق والآداب'
    };

    return categories[categoryKey] || categoryKey;
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // مستمعي أحداث لتصنيفات الفتاوى (في الشريط الجانبي)
    const categoryItems = document.querySelectorAll('.category-list li');
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            // إزالة الفئة النشطة من جميع العناصر
            categoryItems.forEach(cat => cat.classList.remove('active'));

            // إضافة الفئة النشطة للعنصر المحدد
            this.classList.add('active');

            // تصفية الفتاوى حسب التصنيف
            const category = this.getAttribute('data-category');
            filterFatwasByCategory(category);

            // تحديث أزرار التصنيف في المحتوى الرئيسي
            updateCategoryButtons(category);
        });
    });

    // مستمعي أحداث لأزرار التصنيف في المحتوى الرئيسي
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // إزالة الفئة النشطة من جميع الأزرار
            categoryButtons.forEach(btn => btn.classList.remove('active'));

            // إضافة الفئة النشطة للزر المحدد
            this.classList.add('active');

            // تصفية الفتاوى حسب التصنيف
            const category = this.getAttribute('data-category');
            filterFatwasByCategory(category);

            // تحديث عناصر التصنيف في الشريط الجانبي
            updateCategorySidebar(category);
        });
    });

    // مستمعي أحداث لأزرار عرض فتاوى العالم
    const viewScholarButtons = document.querySelectorAll('.view-scholar');
    viewScholarButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const scholarId = this.getAttribute('data-scholar');
            filterFatwasByScholar(scholarId);

            // تحديث عناصر تصفية العلماء في الشريط الجانبي
            updateScholarSidebar(scholarId);

            // التمرير إلى قسم الفتاوى
            document.querySelector('.fatwas-header').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // مستمعي أحداث لتصفية العلماء
    const scholarItems = document.querySelectorAll('.scholars-filter li');
    scholarItems.forEach(item => {
        item.addEventListener('click', function() {
            // إزالة الفئة النشطة من جميع العناصر
            scholarItems.forEach(scholar => scholar.classList.remove('active'));

            // إضافة الفئة النشطة للعنصر المحدد
            this.classList.add('active');

            // تصفية الفتاوى حسب العالم
            const scholarId = this.getAttribute('data-scholar');
            filterFatwasByScholar(scholarId);
        });
    });

    // مستمع حدث للبحث
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('fatwa-search');

    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            searchFatwas(searchInput.value);
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchFatwas(this.value);
            }
        });
    }

    // مستمع حدث لترتيب الفتاوى
    const sortSelect = document.getElementById('sort-fatwas');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortFatwas(this.value);
        });
    }

    // مستمع حدث لتصفية الفتاوى حسب التصنيف (في قسم البحث والتصفية)
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const category = this.value;
            filterFatwasByCategory(category);

            // تحديث عناصر التصنيف في الشريط الجانبي
            updateCategorySidebar(category);
        });
    }

    // مستمع حدث لزر طرح سؤال في الشريط الجانبي
    const askQuestionBtn = document.getElementById('ask-question-btn');
    const questionModal = document.getElementById('question-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');

    if (askQuestionBtn && questionModal) {
        askQuestionBtn.addEventListener('click', function() {
            questionModal.classList.add('show');
        });
    }

    // مستمع حدث لزر طرح سؤال في القسم الرئيسي
    const askQuestionBtnMain = document.getElementById('ask-question-btn-main');
    if (askQuestionBtnMain && questionModal) {
        askQuestionBtnMain.addEventListener('click', function() {
            questionModal.classList.add('show');
        });
    }

    // إظهار ملاحظة تسجيل الدخول للمستخدمين غير المسجلين
    // في تطبيق حقيقي، سيتم التحقق من حالة تسجيل الدخول
    const loginNote = document.querySelector('.login-note');
    if (loginNote) {
        // للتجربة فقط: إظهار ملاحظة تسجيل الدخول
        loginNote.style.display = 'block';
    }

    // مستمعي أحداث لأزرار إغلاق النوافذ المنبثقة
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });

    // إغلاق النوافذ المنبثقة عند النقر خارجها
    const modals = document.querySelectorAll('.modal');
    window.addEventListener('click', function(e) {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
    });

    // مستمع حدث لنموذج طرح سؤال
    const questionForm = document.getElementById('question-form');
    if (questionForm) {
        questionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitQuestion();
        });
    }

    // مستمع حدث لزر إلغاء السؤال
    const cancelQuestionBtn = document.querySelector('.cancel-question');
    if (cancelQuestionBtn && questionModal) {
        cancelQuestionBtn.addEventListener('click', function() {
            questionModal.classList.remove('show');
        });
    }

    // مستمع حدث لزر مشاركة الفتوى
    const shareFatwaBtn = document.getElementById('share-fatwa');
    if (shareFatwaBtn) {
        shareFatwaBtn.addEventListener('click', function() {
            shareFatwa();
        });
    }

    // مستمعي أحداث لأزرار الترقيم
    setupPaginationEvents();
}

// تصفية الفتاوى حسب التصنيف
function filterFatwasByCategory(category) {
    if (category === 'all') {
        displayFatwas(fatwasData);
    } else {
        const filteredFatwas = fatwasData.filter(fatwa => fatwa.category === category);
        displayFatwas(filteredFatwas);
    }
}

// تصفية الفتاوى حسب العالم
function filterFatwasByScholar(scholarId) {
    if (scholarId === 'all') {
        displayFatwas(fatwasData);
    } else {
        const filteredFatwas = fatwasData.filter(fatwa => fatwa.scholar.id == scholarId);
        displayFatwas(filteredFatwas);
    }
}

// البحث في الفتاوى
function searchFatwas(searchTerm) {
    if (!searchTerm.trim()) {
        displayFatwas(fatwasData);
        return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filteredFatwas = fatwasData.filter(fatwa =>
        fatwa.title.toLowerCase().includes(searchTermLower) ||
        fatwa.question.toLowerCase().includes(searchTermLower) ||
        fatwa.answer.toLowerCase().includes(searchTermLower)
    );

    displayFatwas(filteredFatwas);
}

// ترتيب الفتاوى
function sortFatwas(sortBy) {
    let sortedFatwas = [...fatwasData];

    switch(sortBy) {
        case 'newest':
            sortedFatwas.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            sortedFatwas.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'most-viewed':
            sortedFatwas.sort((a, b) => b.views - a.views);
            break;
    }

    displayFatwas(sortedFatwas);
}

// إعداد الترقيم
function setupPagination() {
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');

    // تحديث حالة أزرار الترقيم
    updatePagination();
}

// إعداد مستمعي أحداث الترقيم
function setupPaginationEvents() {
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');

    // مستمع حدث لزر الصفحة السابقة
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                changePage(currentPage);
            }
        });
    }

    // مستمع حدث لزر الصفحة التالية
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredFatwas.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                changePage(currentPage);
            }
        });
    }

    // مستمعي أحداث لأرقام الصفحات
    if (pageNumbers) {
        pageNumbers.addEventListener('click', function(e) {
            if (e.target.classList.contains('page-number')) {
                const pageNum = parseInt(e.target.textContent);
                if (pageNum !== currentPage) {
                    currentPage = pageNum;
                    changePage(currentPage);
                }
            }
        });
    }
}

// تحديث حالة الترقيم
function updatePagination() {
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageNumbers = document.getElementById('page-numbers');

    if (!prevPageBtn || !nextPageBtn || !pageNumbers) return;

    // حساب إجمالي عدد الصفحات
    const totalPages = Math.ceil(filteredFatwas.length / itemsPerPage);

    // تحديث أزرار التنقل
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;

    // تحديث أرقام الصفحات
    pageNumbers.innerHTML = '';

    // تحديد نطاق الصفحات للعرض
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(totalPages, startPage + 2);

    // ضبط نطاق الصفحات إذا كنا في نهاية القائمة
    if (endPage - startPage < 2) {
        startPage = Math.max(1, endPage - 2);
    }

    // إضافة أرقام الصفحات
    for (let i = startPage; i <= endPage; i++) {
        const pageNumber = document.createElement('span');
        pageNumber.className = 'page-number' + (i === currentPage ? ' active' : '');
        pageNumber.textContent = i;
        pageNumbers.appendChild(pageNumber);
    }
}

// تغيير الصفحة
function changePage(page) {
    currentPage = page;

    // حساب الفتاوى للصفحة الحالية
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredFatwas.length);
    const currentFatwas = filteredFatwas.slice(startIndex, endIndex);

    // عرض الفتاوى
    const fatwasContainer = document.getElementById('fatwas-container');
    if (fatwasContainer) {
        fatwasContainer.innerHTML = '';
        currentFatwas.forEach(fatwa => {
            const fatwaCard = createFatwaCard(fatwa);
            fatwasContainer.appendChild(fatwaCard);
        });
    }

    // تحديث الترقيم
    updatePagination();
}

// فتح نافذة عرض الفتوى كاملة
function openFatwaModal(fatwaId) {
    const fatwa = fatwasData.find(f => f.id == fatwaId);
    if (!fatwa) return;

    const modal = document.getElementById('fatwa-modal');
    const modalTitle = document.getElementById('fatwa-modal-title');
    const modalBody = document.getElementById('fatwa-modal-body');

    if (!modal || !modalTitle || !modalBody) return;

    // تنسيق التاريخ
    const formattedDate = formatDate(fatwa.date);

    // تحديد اسم التصنيف بالعربية
    const categoryName = getCategoryName(fatwa.category);

    // تعيين عنوان النافذة
    modalTitle.textContent = fatwa.title;

    // تعيين محتوى النافذة
    modalBody.innerHTML = `
        <div class="fatwa-modal-meta">
            <div class="scholar-info">
                <img src="${fatwa.scholar.avatar}" alt="${fatwa.scholar.name}" class="scholar-avatar">
                <span>${fatwa.scholar.name}</span>
            </div>
            <div class="fatwa-info">
                <span class="fatwa-category">${categoryName}</span>
                <span class="fatwa-date"><i class="fas fa-calendar"></i> ${formattedDate}</span>
            </div>
        </div>
        <div class="fatwa-modal-content">
            <div class="fatwa-question">
                <h4><i class="fas fa-question-circle"></i> السؤال:</h4>
                <p>${fatwa.question}</p>
            </div>
            <div class="fatwa-answer">
                <h4><i class="fas fa-comment-dots"></i> الإجابة:</h4>
                <p>${fatwa.answer}</p>
            </div>
        </div>
        <div class="fatwa-modal-stats">
            <span><i class="fas fa-eye"></i> ${fatwa.views} مشاهدة</span>
            <span><i class="fas fa-thumbs-up"></i> ${fatwa.likes} إعجاب</span>
        </div>
    `;

    // إظهار النافذة
    modal.classList.add('show');

    // زيادة عدد المشاهدات
    fatwa.views++;
}

// مشاركة الفتوى
function shareFatwa() {
    // في تطبيق حقيقي، يمكن استخدام Web Share API أو نسخ الرابط إلى الحافظة
    alert('تم نسخ رابط الفتوى إلى الحافظة');
}

// تحديث أزرار التصنيف في المحتوى الرئيسي
function updateCategoryButtons(category) {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        if (button.getAttribute('data-category') === category) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

// تحديث عناصر التصنيف في الشريط الجانبي
function updateCategorySidebar(category) {
    const categoryItems = document.querySelectorAll('.category-list li');
    categoryItems.forEach(item => {
        if (item.getAttribute('data-category') === category) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // تحديث قائمة التصنيف في قسم البحث والتصفية
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }
}

// تحديث عناصر تصفية العلماء في الشريط الجانبي
function updateScholarSidebar(scholarId) {
    const scholarItems = document.querySelectorAll('.scholars-filter li');
    scholarItems.forEach(item => {
        if (item.getAttribute('data-scholar') === scholarId) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// إرسال سؤال جديد
function submitQuestion() {
    const titleInput = document.getElementById('question-title');
    const categorySelect = document.getElementById('question-category');
    const contentTextarea = document.getElementById('question-content');
    const nameInput = document.getElementById('question-name');
    const emailInput = document.getElementById('question-email');

    // التحقق من صحة البيانات
    if (!titleInput.value.trim() || !categorySelect.value || !contentTextarea.value.trim()) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    // إنشاء كائن السؤال
    const newQuestion = {
        title: titleInput.value.trim(),
        category: categorySelect.value,
        question: contentTextarea.value.trim(),
        name: nameInput.value.trim() || 'مستخدم مجهول',
        email: emailInput.value.trim() || '',
        date: new Date().toISOString().split('T')[0]
    };

    // في تطبيق حقيقي، سيتم إرسال السؤال إلى الخادم هنا
    console.log('تم إرسال السؤال:', newQuestion);

    // إظهار رسالة نجاح
    alert('تم إرسال سؤالك بنجاح. سيتم الرد عليه في أقرب وقت ممكن.');

    // إغلاق النافذة وإعادة تعيين النموذج
    const questionModal = document.getElementById('question-modal');
    if (questionModal) {
        questionModal.classList.remove('show');
    }

    // إعادة تعيين النموذج
    const questionForm = document.getElementById('question-form');
    if (questionForm) {
        questionForm.reset();
    }
}
