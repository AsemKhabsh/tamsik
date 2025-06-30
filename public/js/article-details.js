// ملف JavaScript لصفحة تفاصيل المقال

let currentArticle = null;
let currentUser = null;
let comments = [];

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // الحصول على معرف المقال من عنوان URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    if (articleId) {
        loadArticle(articleId);
        loadComments(articleId);
    } else {
        displayErrorMessage();
    }
    
    // تحقق من حالة تسجيل الدخول
    checkUserLogin();
    
    // إعداد مستمعي الأحداث
    setupEventListeners();
});

// تحميل المقال
function loadArticle(articleId) {
    // البحث في البيانات المحلية أولاً
    const storedArticles = JSON.parse(localStorage.getItem('articles')) || [];
    let article = storedArticles.find(a => a.id == articleId);
    
    // إذا لم يتم العثور عليه، البحث في البيانات التجريبية
    if (!article && window.articlesData) {
        article = window.articlesData.find(a => a.id == articleId);
    }
    
    if (article) {
        currentArticle = article;
        displayArticle(article);
        incrementViews(articleId);
        loadRelatedArticles(article.category, articleId);
        
        // تحديث عنوان الصفحة
        document.title = `تمسيك - ${article.title}`;
        
        // تحديث شريط التنقل
        document.getElementById('article-breadcrumb').textContent = article.title;
    } else {
        displayErrorMessage();
    }
}

// عرض المقال
function displayArticle(article) {
    const container = document.getElementById('article-container');
    const categoryNames = {
        'فكر-اسلامي': 'الفكر الإسلامي',
        'دعوة': 'الدعوة والإرشاد',
        'تربية': 'التربية الإسلامية',
        'مجتمع': 'قضايا مجتمعية',
        'شباب': 'الشباب والأسرة',
        'معاصر': 'قضايا معاصرة'
    };
    
    const formattedDate = formatDate(article.publishDate);
    const tagsHtml = article.tags.map(tag => `<a href="thinkers.html?tag=${tag}" class="tag">${tag}</a>`).join('');
    
    container.innerHTML = `
        <div class="article-header">
            <div class="article-actions">
                <button class="action-btn" onclick="openShareModal()" title="مشاركة">
                    <i class="fas fa-share-alt"></i>
                </button>
                <button class="action-btn" onclick="printArticle()" title="طباعة">
                    <i class="fas fa-print"></i>
                </button>
                <button class="action-btn" onclick="bookmarkArticle()" title="إضافة للمفضلة">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
            <div class="article-category">${categoryNames[article.category] || article.category}</div>
            <h1 class="article-title">${article.title}</h1>
            <div class="article-meta">
                <span><i class="fas fa-user"></i> ${article.author}</span>
                <span><i class="fas fa-calendar"></i> ${formattedDate}</span>
                <span><i class="fas fa-clock"></i> ${calculateReadingTime(article.content)} دقائق قراءة</span>
            </div>
            <div class="article-stats">
                <span><i class="fas fa-eye"></i> ${article.views.toLocaleString()} مشاهدة</span>
                <span><i class="fas fa-comments"></i> ${article.comments} تعليق</span>
                <span><i class="fas fa-thumbs-up"></i> ${article.likes || 0} إعجاب</span>
            </div>
        </div>
        
        ${article.image ? `
        <div class="article-image">
            <img src="${article.image}" alt="${article.title}">
        </div>
        ` : ''}
        
        <div class="article-content">
            <div class="article-excerpt">${article.excerpt}</div>
            <div class="article-body">${article.content}</div>
            <div class="article-tags">${tagsHtml}</div>
        </div>
        
        <div class="article-footer">
            <div class="author-info">
                <div class="author-avatar">
                    <i class="fas fa-user"></i>
                </div>
                <div class="author-details">
                    <h4>${article.author}</h4>
                    <p>كاتب ومفكر إسلامي</p>
                </div>
            </div>
            <div class="share-buttons">
                <button class="share-btn facebook" onclick="shareOnFacebook()">
                    <i class="fab fa-facebook"></i>
                    فيسبوك
                </button>
                <button class="share-btn twitter" onclick="shareOnTwitter()">
                    <i class="fab fa-twitter"></i>
                    تويتر
                </button>
                <button class="share-btn whatsapp" onclick="shareOnWhatsApp()">
                    <i class="fab fa-whatsapp"></i>
                    واتساب
                </button>
            </div>
        </div>
    `;
}

// تحقق من حالة تسجيل الدخول
function checkUserLogin() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        document.getElementById('add-comment-section').style.display = 'block';
        document.getElementById('login-message').style.display = 'none';
    } else {
        document.getElementById('add-comment-section').style.display = 'none';
        document.getElementById('login-message').style.display = 'block';
    }
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // نموذج التعليق
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', handleAddComment);
    }
    
    // إلغاء التعليق
    const cancelComment = document.getElementById('cancel-comment');
    if (cancelComment) {
        cancelComment.addEventListener('click', function() {
            document.getElementById('comment-text').value = '';
        });
    }
    
    // إغلاق نافذة المشاركة
    const closeShareModal = document.getElementById('close-share-modal');
    if (closeShareModal) {
        closeShareModal.addEventListener('click', function() {
            document.getElementById('share-modal').classList.remove('active');
        });
    }
    
    // إغلاق النافذة عند النقر خارجها
    const shareModal = document.getElementById('share-modal');
    if (shareModal) {
        shareModal.addEventListener('click', function(e) {
            if (e.target === shareModal) {
                shareModal.classList.remove('active');
            }
        });
    }
}

// تحميل التعليقات
function loadComments(articleId) {
    const storedComments = JSON.parse(localStorage.getItem('comments')) || [];
    comments = storedComments.filter(comment => comment.articleId == articleId);
    
    displayComments();
    updateCommentsCount();
}

// عرض التعليقات
function displayComments() {
    const commentsList = document.getElementById('comments-list');
    const noComments = document.getElementById('no-comments');
    
    if (comments.length === 0) {
        commentsList.style.display = 'none';
        noComments.style.display = 'block';
        return;
    }
    
    commentsList.style.display = 'block';
    noComments.style.display = 'none';
    
    // ترتيب التعليقات حسب التاريخ (الأحدث أولاً)
    comments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    commentsList.innerHTML = comments.map(comment => createCommentHTML(comment)).join('');
}

// إنشاء HTML للتعليق
function createCommentHTML(comment) {
    const formattedDate = formatDate(comment.date);
    
    return `
        <div class="comment-item">
            <div class="comment-header">
                <div class="comment-author">
                    <div class="comment-avatar">
                        ${comment.author.charAt(0).toUpperCase()}
                    </div>
                    <div class="comment-info">
                        <h5>${comment.author}</h5>
                        <span>${formattedDate}</span>
                    </div>
                </div>
                <div class="comment-actions">
                    <button class="comment-btn" onclick="likeComment(${comment.id})">
                        <i class="fas fa-thumbs-up"></i> ${comment.likes || 0}
                    </button>
                    <button class="comment-btn" onclick="replyToComment(${comment.id})">
                        <i class="fas fa-reply"></i> رد
                    </button>
                </div>
            </div>
            <div class="comment-text">${comment.text}</div>
        </div>
    `;
}

// معالجة إضافة تعليق
function handleAddComment(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('يجب تسجيل الدخول أولاً');
        return;
    }
    
    const commentText = document.getElementById('comment-text').value.trim();
    if (!commentText) {
        alert('يرجى كتابة تعليق');
        return;
    }
    
    const newComment = {
        id: Date.now(),
        articleId: currentArticle.id,
        author: currentUser.name,
        text: commentText,
        date: new Date().toISOString(),
        likes: 0,
        status: 'pending' // يحتاج موافقة
    };
    
    // إضافة التعليق إلى القائمة
    comments.unshift(newComment);
    
    // حفظ في التخزين المحلي
    const storedComments = JSON.parse(localStorage.getItem('comments')) || [];
    storedComments.push(newComment);
    localStorage.setItem('comments', JSON.stringify(storedComments));
    
    // تحديث عدد التعليقات في المقال
    currentArticle.comments++;
    updateArticleInStorage();
    
    // إعادة عرض التعليقات
    displayComments();
    updateCommentsCount();
    
    // إعادة تعيين النموذج
    document.getElementById('comment-text').value = '';
    
    alert('تم إضافة التعليق بنجاح! سيتم مراجعته قبل النشر.');
}

// تحديث عدد التعليقات
function updateCommentsCount() {
    document.getElementById('comments-count').textContent = comments.length;
}

// تحديث المقال في التخزين المحلي
function updateArticleInStorage() {
    const storedArticles = JSON.parse(localStorage.getItem('articles')) || [];
    const articleIndex = storedArticles.findIndex(a => a.id === currentArticle.id);
    
    if (articleIndex !== -1) {
        storedArticles[articleIndex] = currentArticle;
        localStorage.setItem('articles', JSON.stringify(storedArticles));
    }
}

// زيادة عدد المشاهدات
function incrementViews(articleId) {
    const viewedArticles = JSON.parse(localStorage.getItem('viewedArticles')) || [];
    
    if (!viewedArticles.includes(articleId)) {
        currentArticle.views++;
        updateArticleInStorage();
        viewedArticles.push(articleId);
        localStorage.setItem('viewedArticles', JSON.stringify(viewedArticles));
    }
}

// تحميل المقالات ذات الصلة
function loadRelatedArticles(category, currentArticleId) {
    const storedArticles = JSON.parse(localStorage.getItem('articles')) || [];
    const allArticles = [...storedArticles];
    
    if (window.articlesData) {
        allArticles.push(...window.articlesData);
    }
    
    const relatedArticles = allArticles
        .filter(article => article.category === category && article.id != currentArticleId && article.status === 'published')
        .slice(0, 3);
    
    displayRelatedArticles(relatedArticles);
}

// عرض المقالات ذات الصلة
function displayRelatedArticles(articles) {
    const relatedGrid = document.getElementById('related-grid');
    
    if (articles.length === 0) {
        relatedGrid.innerHTML = '<p>لا توجد مقالات ذات صلة</p>';
        return;
    }
    
    relatedGrid.innerHTML = articles.map(article => `
        <div class="related-card">
            <img src="${article.image}" alt="${article.title}">
            <div class="related-card-content">
                <h4><a href="article-details.html?id=${article.id}">${article.title}</a></h4>
                <p>${article.excerpt}</p>
            </div>
        </div>
    `).join('');
}

// فتح نافذة المشاركة
function openShareModal() {
    const modal = document.getElementById('share-modal');
    const urlInput = document.getElementById('article-url');
    
    urlInput.value = window.location.href;
    modal.classList.add('active');
}

// مشاركة على فيسبوك
function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticle.title);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${title}`, '_blank');
}

// مشاركة على تويتر
function shareOnTwitter() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticle.title);
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank');
}

// مشاركة على واتساب
function shareOnWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticle.title);
    window.open(`https://wa.me/?text=${title} ${url}`, '_blank');
}

// مشاركة على تيليجرام
function shareOnTelegram() {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(currentArticle.title);
    window.open(`https://t.me/share/url?url=${url}&text=${title}`, '_blank');
}

// نسخ الرابط
function copyLink() {
    const urlInput = document.getElementById('article-url');
    urlInput.select();
    document.execCommand('copy');
    alert('تم نسخ الرابط بنجاح!');
}

// طباعة المقال
function printArticle() {
    window.print();
}

// إضافة للمفضلة
function bookmarkArticle() {
    if (!currentUser) {
        alert('يجب تسجيل الدخول أولاً');
        return;
    }
    
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || [];
    const isBookmarked = bookmarks.some(b => b.articleId === currentArticle.id && b.userId === currentUser.id);
    
    if (isBookmarked) {
        alert('المقال موجود في المفضلة بالفعل');
        return;
    }
    
    bookmarks.push({
        articleId: currentArticle.id,
        userId: currentUser.id,
        date: new Date().toISOString()
    });
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    alert('تم إضافة المقال إلى المفضلة');
}

// حساب وقت القراءة
function calculateReadingTime(content) {
    const wordsPerMinute = 200; // متوسط سرعة القراءة بالعربية
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
}

// تنسيق التاريخ
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
    };
    return date.toLocaleDateString('ar-SA', options);
}

// عرض رسالة خطأ
function displayErrorMessage() {
    const container = document.getElementById('article-container');
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #f39c12; margin-bottom: 20px;"></i>
            <h2>المقال غير موجود</h2>
            <p>عذراً، لم يتم العثور على المقال المطلوب.</p>
            <a href="thinkers.html" class="btn btn-primary">العودة إلى المقالات</a>
        </div>
    `;
}
