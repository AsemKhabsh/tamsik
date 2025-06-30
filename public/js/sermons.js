// ملف JavaScript الخاص بصفحة الخطب الجاهزة

// وظيفة تحميل الخطب من الخادم
async function loadSermons() {
    try {
        // عرض مؤشر التحميل
        showLoadingState();

        // جلب الخطب من API
        const response = await fetch('/api/sermons');

        if (!response.ok) {
            await window.errorHandler.handleApiError(response, 'فشل في تحميل الخطب');
            return;
        }

        const data = await response.json();
        const sermons = data.data?.sermons || [];

        // تطبيق الفلترة والترتيب
        const filteredSermons = applyFiltersAndSort(sermons);

        // عرض الخطب
        displaySermons(filteredSermons);

        // إخفاء مؤشر التحميل
        hideLoadingState();

    } catch (error) {
        console.error('خطأ في تحميل الخطب:', error);
        window.errorHandler.handleNetworkError(error);
        hideLoadingState();

        // عرض الخطب المحفوظة محلياً كبديل
        loadLocalSermons();
    }
}

// تطبيق الفلترة والترتيب
function applyFiltersAndSort(sermons) {
    const categoryFilter = document.getElementById('category');
    const sortOrder = document.getElementById('sort');

    let filteredSermons = [...sermons];

    // فلترة حسب التصنيف
    if (categoryFilter && categoryFilter.value !== 'all') {
        const categoryMap = {
            'aqeedah': 'العقيدة',
            'fiqh': 'الفقه',
            'akhlaq': 'الأخلاق',
            'seerah': 'السيرة النبوية',
            'occasions': 'المناسبات'
        };

        const arabicCategory = categoryMap[categoryFilter.value];
        filteredSermons = filteredSermons.filter(sermon => sermon.category === arabicCategory);
    }

    // ترتيب الخطب
    if (sortOrder && sortOrder.value) {
        switch(sortOrder.value) {
            case 'newest':
                filteredSermons.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
                break;
            case 'oldest':
                filteredSermons.sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));
                break;
            case 'popular':
                filteredSermons.sort((a, b) => (b.views || 0) - (a.views || 0));
                break;
        }
    }

    return filteredSermons;
}

// تحميل الخطب المحفوظة محلياً كبديل
function loadLocalSermons() {
    try {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const filteredSermons = applyFiltersAndSort(sermons);
        displaySermons(filteredSermons);

        if (sermons.length > 0) {
            window.errorHandler.showInfo('تم تحميل الخطب المحفوظة محلياً');
        }
    } catch (error) {
        console.error('خطأ في تحميل الخطب المحلية:', error);
        displayEmptyState();
    }
}

// عرض مؤشر التحميل
function showLoadingState() {
    const sermonsGrid = document.querySelector('.all-sermons .sermons-grid');
    if (sermonsGrid) {
        sermonsGrid.innerHTML = `
            <div class="loading-overlay">
                <div class="loading-spinner"></div>
                <p>جاري تحميل الخطب...</p>
            </div>
        `;
    }
}

// إخفاء مؤشر التحميل
function hideLoadingState() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

// عرض حالة فارغة
function displayEmptyState() {
    const sermonsGrid = document.querySelector('.all-sermons .sermons-grid');
    if (sermonsGrid) {
        sermonsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-book-open"></i>
                <h3>لا توجد خطب متاحة</h3>
                <p>لم يتم العثور على خطب تطابق معايير البحث المحددة</p>
            </div>
        `;
    }
}

// عرض الخطب في الصفحة
function displaySermons(sermons) {
    const sermonsGrid = document.querySelector('.all-sermons .sermons-grid');
    if (!sermonsGrid) return;

    if (!sermons || sermons.length === 0) {
        displayEmptyState();
        return;
    }

    // حفظ الخطب الموجودة مسبقاً في الصفحة (الخطب الثابتة)
    const staticSermons = Array.from(sermonsGrid.querySelectorAll('.sermon-card'));

    // إفراغ الشبكة
    sermonsGrid.innerHTML = '';

    // إعادة إضافة الخطب الثابتة
    staticSermons.forEach(sermon => {
        sermonsGrid.appendChild(sermon);
    });

    // إضافة الخطب المضافة من المستخدمين
    sermons.forEach(sermon => {
        const sermonCard = createSermonCard(sermon);
        sermonsGrid.appendChild(sermonCard);
    });

    // إذا لم تكن هناك خطب للعرض
    if (sermonsGrid.children.length === 0) {
        sermonsGrid.innerHTML = '<div class="no-results">لا توجد خطب متاحة بهذه المعايير</div>';
    }
}

// إنشاء بطاقة خطبة جديدة
function createSermonCard(sermon) {
    const sermonCard = document.createElement('div');
    sermonCard.className = 'sermon-card';

    sermonCard.innerHTML = `
        <div class="sermon-header">
            <span class="sermon-category">${sermon.category}</span>
            ${sermon.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> مميزة</span>' : ''}
        </div>
        <h3 class="sermon-title">${sermon.title}</h3>
        <div class="sermon-meta">
            <span><i class="fas fa-user"></i> ${sermon.preacher}</span>
            <span><i class="fas fa-calendar"></i> ${formatDate(sermon.date)}</span>
        </div>
        <p class="sermon-excerpt">${sermon.excerpt}</p>
        <div class="sermon-footer">
            <div class="sermon-actions">
                <a href="sermon_details.html?id=${sermon.id}" class="btn btn-primary">قراءة الخطبة</a>
                <button class="btn btn-danger btn-sm delete-sermon" data-id="${sermon.id}">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
            <div class="sermon-stats">
                <span><i class="fas fa-eye"></i> ${sermon.views || 0}</span>
                <span><i class="fas fa-download"></i> ${sermon.downloads || 0}</span>
            </div>
        </div>
    `;

    // إضافة مستمع حدث لزر الحذف
    const deleteButton = sermonCard.querySelector('.delete-sermon');
    if (deleteButton) {
        deleteButton.addEventListener('click', function() {
            const sermonId = this.getAttribute('data-id');
            if (confirm('هل أنت متأكد من رغبتك في حذف هذه الخطبة؟')) {
                deleteSermon(sermonId);
            }
        });
    }

    return sermonCard;
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    // يمكن تعديل هذه الدالة لعرض التاريخ بالتنسيق الهجري إذا لزم الأمر
    return date.toLocaleDateString('ar-SA');
}

// إضافة مستمعي الأحداث
document.addEventListener('DOMContentLoaded', function() {
    // تحميل الخطب عند تحميل الصفحة
    loadSermons();

    // مستمع حدث لتغيير التصنيف
    const categoryFilter = document.getElementById('category');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadSermons);
    }

    // مستمع حدث لتغيير الترتيب
    const sortOrder = document.getElementById('sort');
    if (sortOrder) {
        sortOrder.addEventListener('change', loadSermons);
    }

    // مستمع حدث للبحث
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', searchSermons);
    }

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchSermons();
            }
        });
    }

    // مستمعي أحداث لأزرار التصنيفات
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
        button.addEventListener('click', function() {
            // إزالة الفئة النشطة من جميع الأزرار
            categoryButtons.forEach(btn => btn.classList.remove('active'));

            // إضافة الفئة النشطة للزر المحدد
            this.classList.add('active');

            // تحديث قيمة فلتر التصنيف
            const category = this.getAttribute('data-category');
            if (categoryFilter) {
                categoryFilter.value = category;
                loadSermons();
            }
        });
    });
});

// وظيفة البحث عن الخطب
function searchSermons() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    const searchTerm = searchInput.value.trim().toLowerCase();
    const sermons = JSON.parse(localStorage.getItem('sermons')) || [];

    if (!searchTerm) {
        loadSermons();
        return;
    }

    const searchResults = sermons.filter(sermon =>
        sermon.title.toLowerCase().includes(searchTerm) ||
        sermon.preacher.toLowerCase().includes(searchTerm) ||
        sermon.excerpt.toLowerCase().includes(searchTerm) ||
        (sermon.content && sermon.content.toLowerCase().includes(searchTerm))
    );

    displaySermons(searchResults);
}

// إضافة دالة حذف الخطبة
function deleteSermon(sermonId) {
    let sermons = JSON.parse(localStorage.getItem('sermons')) || [];
    sermons = sermons.filter(sermon => sermon.id != sermonId);
    localStorage.setItem('sermons', JSON.stringify(sermons));

    // إعادة تحميل الخطب بعد الحذف
    loadSermons();

    // عرض رسالة نجاح
    showNotification('تم حذف الخطبة بنجاح', 'success');
}

// دالة لعرض إشعارات للمستخدم
function showNotification(message, type = 'info') {
    // إنشاء عنصر الإشعار
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    // إضافة الإشعار إلى الصفحة
    document.body.appendChild(notification);

    // إظهار الإشعار بتأثير متحرك
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // إخفاء الإشعار بعد 3 ثوان
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);

    // إضافة مستمع حدث لزر الإغلاق
    const closeButton = notification.querySelector('.notification-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
    }
}