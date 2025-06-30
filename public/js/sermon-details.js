// ملف JavaScript لصفحة تفاصيل الخطبة

document.addEventListener('DOMContentLoaded', function() {
    // الحصول على معرف الخطبة من عنوان URL
    const urlParams = new URLSearchParams(window.location.search);
    const sermonId = urlParams.get('id');
    
    if (sermonId) {
        // البحث عن الخطبة في التخزين المحلي
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const sermon = sermons.find(s => s.id == sermonId);
        
        if (sermon) {
            // عرض تفاصيل الخطبة
            displaySermonDetails(sermon);
            
            // زيادة عدد المشاهدات
            incrementSermonViews(sermonId);
        } else {
            // إذا لم يتم العثور على الخطبة، عرض رسالة خطأ
            displayErrorMessage();
        }
    } else {
        // إذا لم يتم تحديد معرف الخطبة، عرض رسالة خطأ
        displayErrorMessage();
    }
    
    // عرض تفاصيل الخطبة
    function displaySermonDetails(sermon) {
        // تحديث عنوان الصفحة
        document.title = `تمسيك - ${sermon.title}`;
        
        // تحديث عنوان الخطبة
        const sermonTitle = document.querySelector('.sermon-title');
        if (sermonTitle) sermonTitle.textContent = sermon.title;
        
        // تحديث معلومات الخطبة
        const sermonInfo = document.querySelector('.sermon-info');
        if (sermonInfo) {
            sermonInfo.innerHTML = `
                <div class="sermon-meta">
                    <span><i class="fas fa-user"></i> الخطيب: ${sermon.preacher}</span>
                    <span><i class="fas fa-calendar"></i> تاريخ الخطبة: ${sermon.date}</span>
                    <span><i class="fas fa-folder"></i> التصنيف: ${sermon.category}</span>
                </div>
                <div class="sermon-stats">
                    <span><i class="fas fa-eye"></i> المشاهدات: ${sermon.views}</span>
                    <span><i class="fas fa-download"></i> التحميلات: ${sermon.downloads}</span>
                </div>
            `;
        }
        
        // تحديث محتوى الخطبة
        const sermonContent = document.querySelector('.sermon-content');
        if (sermonContent) {
            // تنسيق محتوى الخطبة (تحويل السطور الجديدة إلى فقرات)
            const formattedContent = sermon.content
                .split('\n\n')
                .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
                .join('');
            
            sermonContent.innerHTML = formattedContent;
        }
        
        // تحديث المراجع إذا وجدت
        const referencesSection = document.querySelector('.sermon-references');
        if (referencesSection && sermon.references) {
            const referencesList = document.querySelector('.references-list');
            if (referencesList) {
                // تنسيق المراجع (تحويل كل سطر إلى عنصر قائمة)
                const formattedReferences = sermon.references
                    .split('\n')
                    .filter(ref => ref.trim() !== '')
                    .map(ref => `<li>${ref}</li>`)
                    .join('');
                
                referencesList.innerHTML = formattedReferences || '<li>لا توجد مراجع</li>';
            }
        }
        
        // تحديث الكلمات المفتاحية إذا وجدت
        const tagsContainer = document.querySelector('.sermon-tags');
        if (tagsContainer && sermon.tags && sermon.tags.length > 0) {
            tagsContainer.innerHTML = sermon.tags
                .map(tag => `<span class="tag">${tag}</span>`)
                .join('');
        }
    }
    
    // عرض رسالة خطأ
    function displayErrorMessage() {
        const sermonContainer = document.querySelector('.sermon-details-container');
        if (sermonContainer) {
            sermonContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h2>عذراً، لم يتم العثور على الخطبة</h2>
                    <p>الخطبة التي تبحث عنها غير موجودة أو تم حذفها.</p>
                    <a href="sermons.html" class="btn btn-primary">العودة إلى الخطب الجاهزة</a>
                </div>
            `;
        }
    }
    
    // زيادة عدد مشاهدات الخطبة
    function incrementSermonViews(sermonId) {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const sermonIndex = sermons.findIndex(s => s.id == sermonId);
        
        if (sermonIndex !== -1) {
            sermons[sermonIndex].views += 1;
            localStorage.setItem('sermons', JSON.stringify(sermons));
            
            // تحديث عدد المشاهدات في الصفحة
            const viewsElement = document.querySelector('.sermon-stats .fa-eye').parentNode;
            if (viewsElement) {
                viewsElement.innerHTML = `<i class="fas fa-eye"></i> المشاهدات: ${sermons[sermonIndex].views}`;
            }
        }
    }
    
    // معالج حدث زر التحميل
    const downloadButton = document.querySelector('.download-btn');
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            if (sermonId) {
                incrementSermonDownloads(sermonId);
                
                // إنشاء ملف نصي للتحميل
                const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
                const sermon = sermons.find(s => s.id == sermonId);
                
                if (sermon) {
                    const sermonText = `
عنوان الخطبة: ${sermon.title}
الخطيب: ${sermon.preacher}
التاريخ: ${sermon.date}
التصنيف: ${sermon.category}

${sermon.content}

المراجع:
${sermon.references || 'لا توجد مراجع'}
                    `;
                    
                    const blob = new Blob([sermonText], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${sermon.title}.txt`;
                    a.click();
                    
                    URL.revokeObjectURL(url);
                }
            }
        });
    }
    
    // زيادة عدد تحميلات الخطبة
    function incrementSermonDownloads(sermonId) {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const sermonIndex = sermons.findIndex(s => s.id == sermonId);
        
        if (sermonIndex !== -1) {
            sermons[sermonIndex].downloads += 1;
            localStorage.setItem('sermons', JSON.stringify(sermons));
            
            // تحديث عدد التحميلات في الصفحة
            const downloadsElement = document.querySelector('.sermon-stats .fa-download').parentNode;
            if (downloadsElement) {
                downloadsElement.innerHTML = `<i class="fas fa-download"></i> التحميلات: ${sermons[sermonIndex].downloads}`;
            }
        }
    }
    
    // معالجات أحداث لخيارات التحميل
    const downloadPdfBtn = document.getElementById('download-pdf');
    const downloadDocxBtn = document.getElementById('download-docx');
    const printSermonBtn = document.getElementById('print-sermon');
    
    // إزالة معالج الحدث الخاص بتحميل PDF
    // if (downloadPdfBtn) {
    //     downloadPdfBtn.addEventListener('click', function() {
    //         if (sermonId) {
    //             incrementSermonDownloads(sermonId);
    //             downloadSermonAsPdf();
    //         }
    //     });
    // }
    
    if (downloadDocxBtn) {
        downloadDocxBtn.addEventListener('click', function() {
            if (sermonId) {
                incrementSermonDownloads(sermonId);
                downloadSermonAsDocx();
            }
        });
    }
    
    if (printSermonBtn) {
        printSermonBtn.addEventListener('click', function() {
            printSermon();
        });
    }
    
    // إزالة كود إضافة زر حذف الخطبة
    /*
    // إضافة زر حذف الخطبة
    const sermonActions = document.querySelector('.sermon-actions');
    if (sermonActions) {
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger';
        deleteButton.innerHTML = '<i class="fas fa-trash"></i> حذف الخطبة';
        deleteButton.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من رغبتك في حذف هذه الخطبة؟')) {
                deleteSermon(sermonId);
            }
        });
        sermonActions.appendChild(deleteButton);
    }
    */
    
    // تفعيف وظيفة المشاركة
    const shareBtn = document.querySelector('.share-btn');
    if (shareBtn) {
        // إنشاء قائمة خيارات المشاركة
        const shareMenu = document.createElement('div');
        shareMenu.className = 'share-menu';
        shareMenu.innerHTML = `
            <div class="share-menu-item" id="share-whatsapp">
                <i class="fab fa-whatsapp"></i> مشاركة عبر واتساب
            </div>
            <div class="share-menu-item" id="share-twitter">
                <i class="fab fa-twitter"></i> مشاركة عبر تويتر
            </div>
            <div class="share-menu-item" id="share-facebook">
                <i class="fab fa-facebook"></i> مشاركة عبر فيسبوك
            </div>
            <div class="share-menu-item" id="share-email">
                <i class="fas fa-envelope"></i> مشاركة عبر البريد الإلكتروني
            </div>
            <div class="share-menu-item" id="copy-link">
                <i class="fas fa-link"></i> نسخ الرابط
            </div>
        `;
        
        // إضافة قائمة المشاركة بعد زر المشاركة
        shareBtn.parentNode.classList.add('share-options');
        shareBtn.parentNode.appendChild(shareMenu);
        
        // إضافة معالجات أحداث لخيارات المشاركة
        document.getElementById('share-whatsapp').addEventListener('click', function() {
            shareViaWhatsApp();
        });
        
        document.getElementById('share-twitter').addEventListener('click', function() {
            shareViaTwitter();
        });
        
        document.getElementById('share-facebook').addEventListener('click', function() {
            shareViaFacebook();
        });
        
        document.getElementById('share-email').addEventListener('click', function() {
            shareViaEmail();
        });
        
        document.getElementById('copy-link').addEventListener('click', function() {
            copyPageLink();
        });
        
        // تبديل عرض قائمة المشاركة عند النقر على زر المشاركة
        shareBtn.addEventListener('click', function(e) {
            e.preventDefault();
            shareMenu.classList.toggle('show');
        });
        
        // إخفاء قائمة المشاركة عند النقر خارجها
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.share-options')) {
                shareMenu.classList.remove('show');
            }
        });
    }
    
    // وظائف المشاركة
    function shareViaWhatsApp() {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const sermon = sermons.find(s => s.id == sermonId);
        
        if (sermon) {
            const text = `${sermon.title} - ${sermon.preacher}\n${window.location.href}`;
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
            window.open(whatsappUrl, '_blank');
        }
    }
    
    function shareViaTwitter() {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const sermon = sermons.find(s => s.id == sermonId);
        
        if (sermon) {
            const text = `${sermon.title} - ${sermon.preacher}`;
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
            window.open(twitterUrl, '_blank');
        }
    }
    
    function shareViaFacebook() {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
        window.open(facebookUrl, '_blank');
    }
    
    function shareViaEmail() {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const sermon = sermons.find(s => s.id == sermonId);
        
        if (sermon) {
            const subject = `خطبة: ${sermon.title}`;
            const body = `مرحباً،\n\nأود مشاركة هذه الخطبة معك:\n\nالعنوان: ${sermon.title}\nالخطيب: ${sermon.preacher}\nالتاريخ: ${sermon.date}\n\nيمكنك الاطلاع عليها من خلال الرابط التالي:\n${window.location.href}\n\nمع تحياتي،`;
            
            const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
            window.location.href = mailtoUrl;
        }
    }
    
    function copyPageLink() {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                alert('تم نسخ الرابط بنجاح');
            })
            .catch(err => {
                console.error('فشل في نسخ الرابط: ', err);
                alert('حدث خطأ أثناء نسخ الرابط');
            });
    }
    
    // وظيفة حذف الخطبة
    function deleteSermon(sermonId) {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const updatedSermons = sermons.filter(s => s.id != sermonId);
        
        localStorage.setItem('sermons', JSON.stringify(updatedSermons));
        alert('تم حذف الخطبة بنجاح');
        
        // الانتقال إلى صفحة الخطب الجاهزة
        window.location.href = 'sermons.html';
    }
    
    // تحميل الخطبة كملف Word
    function downloadSermonAsDocx() {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const sermon = sermons.find(s => s.id == sermonId);
        
        if (sermon) {
            try {
                // إنشاء محتوى HTML للتحويل إلى DOCX
                const htmlContent = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                          xmlns:w="urn:schemas-microsoft-com:office:word" 
                          xmlns="http://www.w3.org/TR/REC-html40">
                    <head>
                        <meta charset="utf-8">
                        <title>${sermon.title}</title>
                        <!--[if gte mso 9]>
                        <xml>
                            <w:WordDocument>
                                <w:View>Print</w:View>
                                <w:Zoom>90</w:Zoom>
                                <w:DoNotOptimizeForBrowser/>
                            </w:WordDocument>
                        </xml>
                        <![endif]-->
                        <style>
                            @page {
                                size: 21cm 29.7cm;
                                margin: 2cm;
                            }
                            body {
                                font-family: 'Arial', sans-serif;
                                font-size: 12pt;
                                line-height: 1.6;
                                direction: rtl;
                                text-align: right;
                            }
                            h1 {
                                font-size: 18pt;
                                text-align: center;
                                margin-bottom: 20pt;
                            }
                            .sermon-meta {
                                text-align: center;
                                margin-bottom: 20pt;
                                font-size: 11pt;
                                color: #666;
                            }
                            .divider {
                                border-bottom: 1pt solid #ddd;
                                margin: 20pt 0;
                            }
                            p {
                                margin-bottom: 10pt;
                            }
                            .references {
                                margin-top: 20pt;
                                border-top: 1pt solid #ddd;
                                padding-top: 15pt;
                            }
                            .references h3 {
                                font-size: 14pt;
                                margin-bottom: 10pt;
                            }
                            ul {
                                padding-right: 20pt;
                                margin: 0;
                            }
                            li {
                                margin-bottom: 5pt;
                            }
                            .footer {
                                text-align: center;
                                margin-top: 30pt;
                                font-size: 9pt;
                                color: #999;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>${sermon.title}</h1>
                        <div class="sermon-meta">
                            <div>الخطيب: ${sermon.preacher}</div>
                            <div>التاريخ: ${sermon.date}</div>
                            <div>التصنيف: ${sermon.category}</div>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <div class="sermon-content">
                            ${sermon.content.split('\n\n').map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('')}
                        </div>
                        
                        ${sermon.references && sermon.references.trim() !== '' ? `
                            <div class="references">
                                <h3>المراجع:</h3>
                                <ul>
                                    ${sermon.references.split('\n').filter(ref => ref.trim() !== '').map(ref => `<li>${ref}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        <div class="footer">
                            تم إنشاء هذا الملف بواسطة منصة تمسيك - ${new Date().toLocaleDateString('ar-SA')}
                        </div>
                    </body>
                    </html>
                `;
                
                // تحويل HTML إلى Blob
                const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
                
                // إنشاء رابط للتحميل
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${sermon.title}.doc`;
                link.click();
                
                // تحرير الموارد
                URL.revokeObjectURL(link.href);
            } catch (error) {
                console.error("حدث خطأ أثناء إنشاء ملف Word:", error);
                alert("حدث خطأ أثناء إنشاء ملف Word. يرجى المحاولة مرة أخرى.");
            }
        }
    }
    
    // طباعة الخطبة
    function printSermon() {
        const sermons = JSON.parse(localStorage.getItem('sermons')) || [];
        const sermon = sermons.find(s => s.id == sermonId);
        
        if (sermon) {
            // إنشاء نافذة طباعة جديدة
            const printWindow = window.open('', '_blank');
            
            // إنشاء محتوى HTML للطباعة
            const printContent = `
                <!DOCTYPE html>
                <html lang="ar" dir="rtl">
                <head>
                    <meta charset="UTF-8">
                    <title>${sermon.title}</title>
                    <style>
                        body {
                            font-family: 'Arial', sans-serif;
                            line-height: 1.6;
                            color: #333;
                            padding: 20px;
                        }
                        .sermon-header {
                            text-align: center;
                            margin-bottom: 30px;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 20px;
                        }
                        .sermon-title {
                            font-size: 24px;
                            margin-bottom: 10px;
                        }
                        .sermon-meta {
                            display: flex;
                            justify-content: center;
                            gap: 20px;
                            margin-bottom: 10px;
                            font-size: 14px;
                            color: #666;
                        }
                        .sermon-content {
                            margin-bottom: 30px;
                            text-align: justify;
                        }
                        .sermon-references {
                            border-top: 1px solid #eee;
                            padding-top: 20px;
                            font-size: 14px;
                        }
                        .references-title {
                            font-weight: bold;
                            margin-bottom: 10px;
                        }
                        .references-list {
                            padding-right: 20px;
                        }
                        @media print {
                            body {
                                font-size: 12pt;
                            }
                            .sermon-title {
                                font-size: 18pt;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="sermon-header">
                        <h1 class="sermon-title">${sermon.title}</h1>
                        <div class="sermon-meta">
                            <span>الخطيب: ${sermon.preacher}</span>
                            <span>التاريخ: ${sermon.date}</span>
                            <span>التصنيف: ${sermon.category}</span>
                        </div>
                    </div>
                    
                    <div class="sermon-content">
                        ${sermon.content.split('\n\n').map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`).join('')}
                    </div>
                    
                    <div class="sermon-references">
                        <div class="references-title">المراجع:</div>
                        <ul class="references-list">
                            ${sermon.references ? sermon.references.split('\n').filter(ref => ref.trim() !== '').map(ref => `<li>${ref}</li>`).join('') : '<li>لا توجد مراجع</li>'}
                        </ul>
                    </div>
                </body>
                </html>
            `;
            
            // كتابة المحتوى في نافذة الطباعة
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();
            
            // انتظار تحميل المحتوى ثم طباعته
            printWindow.onload = function() {
                printWindow.print();
                // printWindow.close(); // اختياري: إغلاق النافذة بعد الطباعة
            };
        }
    }
});