// ملف JavaScript لصفحة المفكرين والدعاة

// بيانات تجريبية للمقالات
const articlesData = [
    {
        id: 1,
        title: "التربية الإسلامية في العصر الحديث",
        author: "د. عبد الله الحكيمي",
        category: "تربية",
        excerpt: "مقال يتناول تحديات التربية الإسلامية في ظل التطور التكنولوجي والعولمة، وكيفية الحفاظ على القيم الإسلامية في تربية الأجيال الجديدة في اليمن.",
        content: "محتوى المقال الكامل هنا...",
        tags: ["تربية", "تعليم", "قيم"],
        publishDate: "2025-01-15",
        views: 1580,
        comments: 23,
        image: "images/article1.jpg",
        status: "published"
    },
    {
        id: 2,
        title: "الدعوة إلى الله في وسائل التواصل الاجتماعي",
        author: "الشيخ أحمد الشامي",
        category: "دعوة",
        excerpt: "كيف يمكن للدعاة اليمنيين استخدام وسائل التواصل الاجتماعي بطريقة فعالة للدعوة إلى الله مع الحفاظ على أصول الدعوة وآدابها.",
        content: "محتوى المقال الكامل هنا...",
        tags: ["دعوة", "تواصل", "تكنولوجيا"],
        publishDate: "2025-01-12",
        views: 2340,
        comments: 45,
        image: "images/article2.jpg",
        status: "published"
    },
    {
        id: 3,
        title: "الشباب اليمني وتحديات العصر",
        author: "د. محمد الزبيدي",
        category: "شباب",
        excerpt: "نظرة على التحديات التي يواجهها الشباب اليمني المسلم في العصر الحالي وكيفية مواجهتها بالحكمة والإيمان.",
        content: "محتوى المقال الكامل هنا...",
        tags: ["شباب", "تحديات", "إيمان"],
        publishDate: "2025-01-10",
        views: 1890,
        comments: 34,
        image: "images/article3.jpg",
        status: "published"
    },
    {
        id: 4,
        title: "الفكر الإسلامي في اليمن عبر التاريخ",
        author: "د. فاطمة الحضرمية",
        category: "فكر-اسلامي",
        excerpt: "دراسة في تطور الفكر الإسلامي في اليمن عبر التاريخ ودور العلماء اليمنيين في إثراء الحضارة الإسلامية.",
        content: "محتوى المقال الكامل هنا...",
        tags: ["فكر", "تاريخ", "حضارة"],
        publishDate: "2025-01-08",
        views: 1245,
        comments: 18,
        image: "images/article4.jpg",
        status: "published"
    },
    {
        id: 5,
        title: "دور المرأة اليمنية في المجتمع الإسلامي",
        author: "د. عائشة الصنعانية",
        category: "مجتمع",
        excerpt: "مقال يسلط الضوء على دور المرأة اليمنية في بناء المجتمع الإسلامي وإسهاماتها في مختلف المجالات.",
        content: "محتوى المقال الكامل هنا...",
        tags: ["مرأة", "مجتمع", "إسهامات"],
        publishDate: "2025-01-05",
        views: 1650,
        comments: 28,
        image: "images/article5.jpg",
        status: "published"
    },
    {
        id: 6,
        title: "التراث الإسلامي اليمني وأهميته",
        author: "الشيخ يحيى الذماري",
        category: "معاصر",
        excerpt: "استعراض للتراث الإسلامي الغني في اليمن وأهمية المحافظة عليه ونقله للأجيال القادمة.",
        content: "محتوى المقال الكامل هنا...",
        tags: ["تراث", "ثقافة", "محافظة"],
        publishDate: "2025-01-03",
        views: 1320,
        comments: 15,
        image: "images/article6.jpg",
        status: "published"
    }
];

// متغيرات عامة
let currentPage = 1;
const articlesPerPage = 6;
let filteredArticles = [...articlesData];
let currentUser = null;

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تحقق من حالة تسجيل الدخول
    checkUserLogin();

    // عرض المقالات
    displayArticles();

    // إعداد الترقيم
    setupPagination();

    // إضافة مستمعي الأحداث
    setupEventListeners();

    // تحميل المقالات من التخزين المحلي
    loadArticlesFromStorage();
});

// تحقق من حالة تسجيل الدخول
function checkUserLogin() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        // إظهار زر إضافة مقال للأعضاء
        if (currentUser.role === 'member' || currentUser.role === 'scholar') {
            document.getElementById('add-article-btn').style.display = 'block';
        }
    }
}

// تحميل المقالات من التخزين المحلي
function loadArticlesFromStorage() {
    const storedArticles = localStorage.getItem('articles');
    if (storedArticles) {
        const articles = JSON.parse(storedArticles);
        articlesData.push(...articles);
        filteredArticles = [...articlesData];
        displayArticles();
        setupPagination();
    } else {
        // حفظ البيانات التجريبية في التخزين المحلي
        localStorage.setItem('articles', JSON.stringify(articlesData));
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // البحث
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', debounce(filterArticles, 300));

    // الفلترة
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');

    categoryFilter.addEventListener('change', filterArticles);
    sortFilter.addEventListener('change', filterArticles);

    // زر إضافة مقال
    const addArticleBtn = document.getElementById('add-article-btn');
    if (addArticleBtn) {
        addArticleBtn.addEventListener('click', openAddArticleModal);
    }

    // إغلاق النافذة المنبثقة
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-article');
    const modal = document.getElementById('add-article-modal');

    closeModal.addEventListener('click', closeAddArticleModal);
    cancelBtn.addEventListener('click', closeAddArticleModal);

    // إغلاق النافذة عند النقر خارجها
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAddArticleModal();
        }
    });

    // نموذج إضافة مقال
    const addArticleForm = document.getElementById('add-article-form');
    addArticleForm.addEventListener('submit', handleAddArticle);

    // محرر النصوص الغني
    setupRichEditor();
}

// فلترة المقالات
function filterArticles() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('category-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;

    // تطبيق الفلترة
    filteredArticles = articlesData.filter(article => {
        const matchesSearch = article.title.toLowerCase().includes(searchTerm) ||
                            article.author.toLowerCase().includes(searchTerm) ||
                            article.excerpt.toLowerCase().includes(searchTerm);

        const matchesCategory = !categoryFilter || article.category === categoryFilter;

        return matchesSearch && matchesCategory && article.status === 'published';
    });

    // تطبيق الترتيب
    switch(sortFilter) {
        case 'newest':
            filteredArticles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
            break;
        case 'oldest':
            filteredArticles.sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
            break;
        case 'most-viewed':
            filteredArticles.sort((a, b) => b.views - a.views);
            break;
        case 'most-commented':
            filteredArticles.sort((a, b) => b.comments - a.comments);
            break;
    }

    currentPage = 1;
    displayArticles();
    setupPagination();
}

// عرض المقالات
function displayArticles() {
    const articlesGrid = document.getElementById('articles-grid');
    const noResults = document.getElementById('no-results');

    if (filteredArticles.length === 0) {
        articlesGrid.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    articlesGrid.style.display = 'grid';
    noResults.style.display = 'none';

    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    const articlesToShow = filteredArticles.slice(startIndex, endIndex);

    articlesGrid.innerHTML = articlesToShow.map(article => createArticleCard(article)).join('');
}

// إنشاء بطاقة مقال
function createArticleCard(article) {
    const categoryNames = {
        'فكر-اسلامي': 'الفكر الإسلامي',
        'دعوة': 'الدعوة والإرشاد',
        'تربية': 'التربية الإسلامية',
        'مجتمع': 'قضايا مجتمعية',
        'شباب': 'الشباب والأسرة',
        'معاصر': 'قضايا معاصرة'
    };

    const formattedDate = formatDate(article.publishDate);
    const tagsHtml = article.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

    return `
        <div class="article-card">
            <div class="article-image">
                <img src="${article.image}" alt="${article.title}">
                <div class="article-badge">${categoryNames[article.category] || article.category}</div>
            </div>
            <div class="article-content">
                <h3 class="article-title">
                    <a href="article-details.html?id=${article.id}">${article.title}</a>
                </h3>
                <div class="article-meta">
                    <span><i class="fas fa-user"></i> ${article.author}</span>
                    <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                </div>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-tags">${tagsHtml}</div>
                <div class="article-stats">
                    <div class="stats-left">
                        <span><i class="fas fa-eye"></i> ${article.views.toLocaleString()}</span>
                        <span><i class="fas fa-comments"></i> ${article.comments}</span>
                    </div>
                    <a href="article-details.html?id=${article.id}" class="read-more">قراءة المزيد</a>
                </div>
            </div>
        </div>
    `;
}

// إعداد الترقيم
function setupPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';

    // زر السابق
    paginationHTML += `
        <button ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-right"></i>
        </button>
    `;

    // أرقام الصفحات
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="changePage(${i})">${i}</button>`;
        }
    }

    // زر التالي
    paginationHTML += `
        <button ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-left"></i>
        </button>
    `;

    pagination.innerHTML = paginationHTML;
}

// تغيير الصفحة
function changePage(page) {
    currentPage = page;
    displayArticles();
    setupPagination();

    // التمرير إلى أعلى الصفحة
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// فتح نافذة إضافة مقال
function openAddArticleModal() {
    if (!currentUser) {
        alert('يجب تسجيل الدخول أولاً');
        window.location.href = 'login.html';
        return;
    }

    const modal = document.getElementById('add-article-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// إغلاق نافذة إضافة مقال
function closeAddArticleModal() {
    const modal = document.getElementById('add-article-modal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // إعادة تعيين النموذج
    document.getElementById('add-article-form').reset();
    document.getElementById('article-content').innerHTML = '';
}

// معالجة إضافة مقال جديد
function handleAddArticle(e) {
    e.preventDefault();

    const title = document.getElementById('article-title').value;
    const category = document.getElementById('article-category').value;
    const excerpt = document.getElementById('article-excerpt').value;
    const content = document.getElementById('article-content').innerHTML;
    const tags = document.getElementById('article-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag);

    if (!title || !category || !excerpt || !content) {
        alert('يرجى ملء جميع الحقول المطلوبة');
        return;
    }

    const newArticle = {
        id: Date.now(),
        title: title,
        author: currentUser.name,
        category: category,
        excerpt: excerpt,
        content: content,
        tags: tags,
        publishDate: new Date().toISOString().split('T')[0],
        views: 0,
        comments: 0,
        image: 'images/default-article.jpg',
        status: 'pending' // يحتاج موافقة الإدارة
    };

    // إضافة المقال إلى البيانات
    articlesData.push(newArticle);

    // حفظ في التخزين المحلي
    const storedArticles = JSON.parse(localStorage.getItem('articles')) || [];
    storedArticles.push(newArticle);
    localStorage.setItem('articles', JSON.stringify(storedArticles));

    // إغلاق النافذة
    closeAddArticleModal();

    // إظهار رسالة نجاح
    alert('تم إرسال المقال بنجاح! سيتم مراجعته من قبل الإدارة قبل النشر.');
}

// إعداد محرر النصوص الغني
function setupRichEditor() {
    const editorButtons = document.querySelectorAll('.editor-btn');
    const editor = document.getElementById('article-content');

    editorButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const command = this.getAttribute('data-command');
            document.execCommand(command, false, null);
            editor.focus();
        });
    });
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'islamic'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// دالة تأخير للبحث
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// تصدير البيانات للاستخدام في صفحات أخرى
window.articlesData = articlesData;
