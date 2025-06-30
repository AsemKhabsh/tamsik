// ملف JavaScript الرئيسي لموقع تمسيك

document.addEventListener('DOMContentLoaded', function() {
    // تفعيل القائمة المنسدلة للأجهزة الصغيرة
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }

    // تفعيل عداد الإحصائيات
    animateCounters();

    // تفعيل التبويبات في قسم آخر المحتويات
    initContentTabs();

    // تفعيل تأثيرات التمرير
    initScrollAnimations();

    // إغلاق القائمة عند النقر على أي رابط
    const navItems = document.querySelectorAll('.nav-links a');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                navLinks.classList.remove('active');
            }
        });
    });

    // إعادة ضبط القائمة عند تغيير حجم النافذة
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
        }
    });

    // عرض الخطب المضافة في صفحة الخطب الجاهزة
    const sermonsGrid = document.querySelector('.all-sermons .sermons-grid');
    if (sermonsGrid) {
        // تأكد من تحميل الخطب بعد تحميل الصفحة بالكامل
        setTimeout(() => {
            loadSermons(sermonsGrid);
        }, 100);
    }

    // تفعيل أزرار تصنيف الخطب
    const categoryButtons = document.querySelectorAll('.category-btn');
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                // إزالة الفئة النشطة من جميع الأزرار
                categoryButtons.forEach(btn => btn.classList.remove('active'));
                // إضافة الفئة النشطة للزر المضغوط
                this.classList.add('active');

                const category = this.getAttribute('data-category');
                filterSermonsByCategory(category);
            });
        });
    }

    // تفعيل وظيفة البحث
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');

    if (searchInput && searchButton) {
        searchButton.addEventListener('click', function(e) {
            e.preventDefault();
            const searchTerm = searchInput.value.trim();
            searchSermons(searchTerm);
        });

        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                searchSermons(searchTerm);
            }
        });
    }

    // تفعيل قائمة التصفية
    const categorySelect = document.getElementById('category');
    const sortSelect = document.getElementById('sort');

    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const selectedCategory = this.value;
            filterSermonsByCategory(selectedCategory);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const selectedSort = this.value;
            sortSermons(selectedSort);
        });
    }

    // تحميل الخطب من التخزين المحلي وعرضها
    function loadSermons(container) {
        // الحصول على الخطب المخزنة
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];

        console.log('الخطب المخزنة:', sermons); // للتأكد من وجود خطب مخزنة

        // إذا كانت هناك خطب مضافة، عرضها
        if (sermons.length > 0) {
            // إضافة عنوان للخطب المضافة
            let userSermonsTitle = document.querySelector('.user-sermons-title');
            if (!userSermonsTitle) {
                userSermonsTitle = document.createElement('h3');
                userSermonsTitle.className = 'user-sermons-title section-title';
                userSermonsTitle.textContent = 'الخطب المضافة من المستخدمين';
                container.parentNode.insertBefore(userSermonsTitle, container.nextSibling);
            }

            // إنشاء حاوية للخطب المضافة إذا لم تكن موجودة
            let userSermonsGrid = document.querySelector('.user-sermons-grid');
            if (!userSermonsGrid) {
                userSermonsGrid = document.createElement('div');
                userSermonsGrid.className = 'sermons-grid user-sermons-grid';
                container.parentNode.insertBefore(userSermonsGrid, userSermonsTitle.nextSibling);
            } else {
                // تفريغ الحاوية قبل إضافة الخطب لتجنب التكرار
                userSermonsGrid.innerHTML = '';
            }

            // عرض الخطب
            sermons.forEach(sermon => {
                userSermonsGrid.appendChild(createSermonCard(sermon));
            });

            // إضافة معالجات الأحداث للخطب المضافة
            addSermonEventListeners();
        }
    }

    // إنشاء بطاقة خطبة
    function createSermonCard(sermon) {
        const sermonCard = document.createElement('div');
        sermonCard.className = 'sermon-card';
        sermonCard.setAttribute('data-id', sermon.id);
        sermonCard.setAttribute('data-category', sermon.category);

        sermonCard.innerHTML = `
            <div class="sermon-header">
                <span class="sermon-category">${sermon.category}</span>
                ${sermon.featured ? '<span class="featured-badge"><i class="fas fa-star"></i> مميزة</span>' : ''}
            </div>
            <h3 class="sermon-title">${sermon.title}</h3>
            <div class="sermon-meta">
                <span><i class="fas fa-user"></i> ${sermon.preacher}</span>
                <span><i class="fas fa-calendar"></i> ${sermon.date}</span>
            </div>
            <p class="sermon-excerpt">${sermon.excerpt}</p>
            <div class="sermon-footer">
                <a href="sermon_details.html?id=${sermon.id}" class="btn btn-primary">قراءة الخطبة</a>
                <div class="sermon-stats">
                    <span><i class="fas fa-eye"></i> ${sermon.views}</span>
                    <span><i class="fas fa-download"></i> ${sermon.downloads}</span>
                </div>
            </div>
        `;

        return sermonCard;
    }

    // تصفية الخطب حسب التصنيف
    function filterSermonsByCategory(category) {
        const sermonCards = document.querySelectorAll('.sermon-card');

        sermonCards.forEach(card => {
            const cardCategory = card.querySelector('.sermon-category').textContent;

            if (category === 'all' || cardCategory === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // البحث في الخطب
    function searchSermons(searchTerm) {
        if (!searchTerm) {
            // إذا كان حقل البحث فارغاً، عرض جميع الخطب
            filterSermonsByCategory('all');
            return;
        }

        const sermonCards = document.querySelectorAll('.sermon-card');
        const searchTermLower = searchTerm.toLowerCase();

        sermonCards.forEach(card => {
            const title = card.querySelector('.sermon-title').textContent.toLowerCase();
            const excerpt = card.querySelector('.sermon-excerpt').textContent.toLowerCase();
            const preacher = card.querySelector('.sermon-meta').textContent.toLowerCase();

            if (title.includes(searchTermLower) ||
                excerpt.includes(searchTermLower) ||
                preacher.includes(searchTermLower)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // ترتيب الخطب
    function sortSermons(sortType) {
        const sermonsGrid = document.querySelector('.sermons-grid');
        const sermonCards = Array.from(document.querySelectorAll('.sermon-card'));

        if (sortType === 'newest') {
            // ترتيب حسب الأحدث (افتراضياً الخطب المضافة حديثاً تكون في النهاية)
            sermonCards.sort((a, b) => {
                const idA = parseInt(a.getAttribute('data-id'));
                const idB = parseInt(b.getAttribute('data-id'));
                return idB - idA;
            });
        } else if (sortType === 'oldest') {
            // ترتيب حسب الأقدم
            sermonCards.sort((a, b) => {
                const idA = parseInt(a.getAttribute('data-id'));
                const idB = parseInt(b.getAttribute('data-id'));
                return idA - idB;
            });
        } else if (sortType === 'popular') {
            // ترتيب حسب الأكثر مشاهدة
            sermonCards.sort((a, b) => {
                const viewsA = parseInt(a.querySelector('.sermon-stats .fa-eye').parentNode.textContent.match(/\d+/)[0]);
                const viewsB = parseInt(b.querySelector('.sermon-stats .fa-eye').parentNode.textContent.match(/\d+/)[0]);
                return viewsB - viewsA;
            });
        }

        // إعادة ترتيب العناصر في الصفحة
        sermonCards.forEach(card => {
            sermonsGrid.appendChild(card);
        });
    }

    // تحريك عداد الإحصائيات
    function animateCounters() {
        const counters = document.querySelectorAll('.stat-number[data-count]');

        const animateCounter = (counter) => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000; // مدة الرسوم المتحركة بالميلي ثانية
            const increment = target / (duration / 16); // 60 FPS
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current).toLocaleString('ar-SA');
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString('ar-SA');
                }
            };

            updateCounter();
        };

        // تشغيل العداد عند ظهور العنصر في الشاشة
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        });

        counters.forEach(counter => {
            observer.observe(counter);
        });
    }

    // تفعيل التبويبات في قسم آخر المحتويات
    function initContentTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetTab = this.getAttribute('data-tab');

                // إزالة الفئة النشطة من جميع الأزرار والمحتويات
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // إضافة الفئة النشطة للزر المحدد والمحتوى المقابل
                this.classList.add('active');
                document.getElementById(targetTab + '-tab').classList.add('active');
            });
        });
    }

    // تفعيل تأثيرات التمرير
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.feature-card, .section-card, .content-card, .testimonial-card, .stat-card');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    }

    // تفعيل النشرة البريدية
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;

            if (email) {
                // في تطبيق حقيقي، سيتم إرسال البريد الإلكتروني إلى الخادم
                alert('تم الاشتراك بنجاح! شكراً لك.');
                this.reset();
            }
        });
    }

    // إضافة معالجات الأحداث للخطب
    function addSermonEventListeners() {
        // معالجة النقر على روابط "قراءة المزيد"
        const readMoreLinks = document.querySelectorAll('.read-more');
        readMoreLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                // يمكن إضافة وظيفة لعرض تفاصيل المحتوى هنا
                alert('سيتم توجيهك إلى صفحة التفاصيل قريباً');
            });
        });
    }

    // استدعاء الوظيفة عند تحميل الصفحة
    addSermonEventListeners();
});