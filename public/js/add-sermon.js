// ملف JavaScript لإدارة إضافة الخطب الجديدة

document.addEventListener('DOMContentLoaded', function() {
    // عناصر النموذج
    const sermonForm = document.getElementById('add-sermon-form');
    const excerptField = document.getElementById('sermon-excerpt');
    const excerptCount = document.getElementById('excerpt-count');
    const submissionMessage = document.getElementById('submission-message');
    const addAnotherBtn = document.getElementById('add-another');
    
    // تحديث عداد الأحرف في ملخص الخطبة
    if (excerptField && excerptCount) {
        excerptField.addEventListener('input', function() {
            excerptCount.textContent = this.value.length;
        });
    }
    
    // معالجة تقديم النموذج
    if (sermonForm) {
        sermonForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // جمع بيانات الخطبة
            const sermonData = {
                id: Date.now(), // استخدام الطابع الزمني كمعرف فريد
                title: document.getElementById('sermon-title').value,
                preacher: document.getElementById('preacher-name').value,
                date: formatDate(document.getElementById('sermon-date').value),
                category: document.getElementById('sermon-category').value,
                excerpt: document.getElementById('sermon-excerpt').value,
                content: document.getElementById('sermon-content').value,
                references: document.getElementById('sermon-references').value,
                tags: document.getElementById('sermon-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
                views: 0,
                downloads: 0,
                dateAdded: new Date().toISOString(),
                featured: false
            };
            
            // تخزين الخطبة في التخزين المحلي
            saveSermon(sermonData);
            
            // عرض رسالة النجاح
            sermonForm.style.display = 'none';
            submissionMessage.style.display = 'block';
        });
    }
    
    // زر إضافة خطبة أخرى
    if (addAnotherBtn) {
        addAnotherBtn.addEventListener('click', function() {
            sermonForm.reset();
            sermonForm.style.display = 'block';
            submissionMessage.style.display = 'none';
        });
    }
    
    // تنسيق التاريخ بالصيغة العربية
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        
        // تحويل التاريخ إلى صيغة عربية (مثال: 15 رمضان 1444)
        // هذا مجرد مثال بسيط، يمكن استخدام مكتبات متخصصة لتحويل التاريخ الميلادي إلى هجري
        return date.toLocaleDateString('ar-SA', options);
    }
    
    // حفظ الخطبة في التخزين المحلي
    function saveSermon(sermon) {
        // الحصول على الخطب المخزنة سابقاً
        let sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        
        // إضافة الخطبة الجديدة
        sermons.push(sermon);
        
        // حفظ القائمة المحدثة
        localStorage.setItem('sermons', JSON.stringify(sermons));
    }
});