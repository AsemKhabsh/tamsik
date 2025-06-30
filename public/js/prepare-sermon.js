// prepare-sermon.js - JavaScript لصفحة إعداد الخطب المحسنة

// متغيرات عامة
let currentSuggestionTarget = null;
let currentSuggestionType = null;
let selectedSuggestion = null;
let additionalElementsCounter = 0;
let autoSaveInterval = null;
let undoStack = [];
let redoStack = [];
let currentSermonId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('تم تحميل صفحة إعداد الخطب المحسنة');

    // تهيئة الصفحة
    initializePage();

    // إعداد مستمعي الأحداث
    setupEventListeners();

    // تحميل البيانات المحفوظة
    loadSavedData();
});

function initializePage() {
    // إخفاء نافذة الاقتراحات في البداية
    const modal = document.getElementById('suggestions-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // تهيئة عدادات الكلمات
    initializeWordCounters();

    // تهيئة نظام التراجع والإعادة
    initializeUndoRedo();

    // تهيئة القوالب الجاهزة
    initializeTemplates();

    // تحديث حالة الحفظ
    updateSaveStatus('غير محفوظ');
}

function setupEventListeners() {
    // أزرار الاقتراحات الجديدة
    const suggestBtns = document.querySelectorAll('.suggest-btn');
    suggestBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            const type = this.getAttribute('data-type');
            const context = this.getAttribute('data-context');
            const duaType = this.getAttribute('data-dua-type');
            showSuggestionsModal(target, type, context, duaType);
        });
    });

    // حفظ تلقائي
    setupAutoSave();

    // أزرار الإجراءات
    setupActionButtons();

    // البحث في الاقتراحات
    const searchInput = document.getElementById('suggestions-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchSuggestions, 500));
    }
}

function showSuggestionsModal(target, type, context = null, duaType = null) {
    currentSuggestionTarget = target;
    currentSuggestionType = type;

    const modal = document.getElementById('suggestions-modal');
    if (modal) {
        modal.style.display = 'flex';

        // تحميل الاقتراحات
        loadSuggestions(type, context, duaType);
    }
}

function closeSuggestionsModal() {
    const modal = document.getElementById('suggestions-modal');
    if (modal) {
        modal.style.display = 'none';

        // مسح البيانات
        currentSuggestionTarget = null;
        currentSuggestionType = null;
        selectedSuggestion = null;

        const suggestionsList = document.getElementById('suggestions-list');
        if (suggestionsList) {
            suggestionsList.innerHTML = '';
        }
    }
}

async function loadSuggestions(type, context = null, duaType = null) {
    const loading = document.getElementById('suggestions-loading');
    const suggestionsList = document.getElementById('suggestions-list');

    if (loading) loading.style.display = 'block';
    if (suggestionsList) suggestionsList.innerHTML = '';

    try {
        let url = `/api/suggestions/${type}?limit=20`;

        if (context) {
            url += `&context_type=${encodeURIComponent(context)}`;
        }

        if (duaType) {
            url += `&dua_type=${encodeURIComponent(duaType)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            displaySuggestions(data.data, type);
        } else {
            showError('فشل في تحميل الاقتراحات');
        }
    } catch (error) {
        console.error('خطأ في تحميل الاقتراحات:', error);
        showError('خطأ في الاتصال بالخادم');
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

function displaySuggestions(suggestions, type) {
    const suggestionsList = document.getElementById('suggestions-list');
    if (!suggestionsList) return;

    suggestionsList.innerHTML = '';

    if (suggestions.length === 0) {
        suggestionsList.innerHTML = '<p class="no-suggestions">لا توجد اقتراحات متاحة</p>';
        return;
    }

    suggestions.forEach((suggestion, index) => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.className = 'suggestion-item';
        suggestionDiv.setAttribute('data-index', index);

        let content = '';
        switch (type) {
            case 'verses':
                content = `
                    <div class="suggestion-header">
                        <h4>${suggestion.surah_name} - آية ${suggestion.verse_number}</h4>
                        <span class="suggestion-meta">${suggestion.context_type} | استخدم ${suggestion.usage_count} مرة</span>
                    </div>
                    <div class="suggestion-content">${suggestion.verse_text}</div>
                `;
                break;
            case 'hadith':
                content = `
                    <div class="suggestion-header">
                        <h4>حديث - ${suggestion.narrator}</h4>
                        <span class="suggestion-meta">${suggestion.context_type} | ${suggestion.source} | استخدم ${suggestion.usage_count} مرة</span>
                    </div>
                    <div class="suggestion-content">${suggestion.hadith_text}</div>
                    <div class="suggestion-auth">${suggestion.authentication}</div>
                `;
                break;
            case 'poetry':
                content = `
                    <div class="suggestion-header">
                        <h4>شعر - ${suggestion.poet}</h4>
                        <span class="suggestion-meta">${suggestion.rhyme} | ${suggestion.meter} | استخدم ${suggestion.usage_count} مرة</span>
                    </div>
                    <div class="suggestion-content">${suggestion.poetry_text}</div>
                `;
                break;
            case 'saja':
                content = `
                    <div class="suggestion-header">
                        <h4>سجع - ${suggestion.attribution}</h4>
                        <span class="suggestion-meta">${suggestion.rhyme} | استخدم ${suggestion.usage_count} مرة</span>
                    </div>
                    <div class="suggestion-content">${suggestion.saja_text}</div>
                `;
                break;
            case 'athar':
                content = `
                    <div class="suggestion-header">
                        <h4>أثر - ${suggestion.speaker}</h4>
                        <span class="suggestion-meta">${suggestion.context_type} | استخدم ${suggestion.usage_count} مرة</span>
                    </div>
                    <div class="suggestion-content">${suggestion.athar_text}</div>
                `;
                break;
            case 'dua':
                content = `
                    <div class="suggestion-header">
                        <h4>${suggestion.dua_type}</h4>
                        <span class="suggestion-meta">${suggestion.source || 'عام'} | استخدم ${suggestion.usage_count} مرة</span>
                    </div>
                    <div class="suggestion-content">${suggestion.dua_text}</div>
                `;
                break;
            default:
                content = `
                    <div class="suggestion-content">${suggestion.text || suggestion.content || 'محتوى غير محدد'}</div>
                `;
        }

        suggestionDiv.innerHTML = content;

        // إضافة مستمع النقر
        suggestionDiv.addEventListener('click', function() {
            selectSuggestion(index, suggestion);
        });

        suggestionsList.appendChild(suggestionDiv);
    });
}

function selectSuggestion(index, suggestion) {
    // إزالة التحديد من جميع الاقتراحات
    const suggestions = document.querySelectorAll('.suggestion-item');
    suggestions.forEach(item => item.classList.remove('selected'));

    // تحديد الاقتراح الحالي
    const selectedItem = document.querySelector(`[data-index="${index}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
        selectedSuggestion = suggestion;
    }
}

function useSuggestion() {
    if (!selectedSuggestion || !currentSuggestionTarget) {
        alert('يرجى اختيار اقتراح أولاً');
        return;
    }

    const targetElement = document.getElementById(currentSuggestionTarget);
    if (!targetElement) {
        alert('عنصر الهدف غير موجود');
        return;
    }

    // استخراج النص المناسب حسب نوع الاقتراح
    let textToInsert = '';
    switch (currentSuggestionType) {
        case 'verses':
            textToInsert = selectedSuggestion.verse_text;
            break;
        case 'hadith':
            textToInsert = selectedSuggestion.hadith_text;
            break;
        case 'poetry':
            textToInsert = selectedSuggestion.poetry_text;
            break;
        case 'saja':
            textToInsert = selectedSuggestion.saja_text;
            break;
        case 'athar':
            textToInsert = selectedSuggestion.athar_text;
            break;
        case 'dua':
            textToInsert = selectedSuggestion.dua_text;
            break;
        default:
            textToInsert = selectedSuggestion.text || selectedSuggestion.content || '';
    }

    // إدراج النص في الحقل
    targetElement.value = textToInsert;

    // حفظ تلقائي
    saveData();

    // إغلاق النافذة
    closeSuggestionsModal();

    // إظهار رسالة نجاح
    showToast('تم استخدام الاقتراح بنجاح');
}

async function searchSuggestions() {
    const searchTerm = document.getElementById('suggestions-search').value.trim();

    if (searchTerm.length < 2) {
        // إعادة تحميل جميع الاقتراحات
        loadSuggestions(currentSuggestionType);
        return;
    }

    const loading = document.getElementById('suggestions-loading');

    if (loading) loading.style.display = 'block';

    try {
        let url = `/api/suggestions/${currentSuggestionType}?limit=20&search=${encodeURIComponent(searchTerm)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            displaySuggestions(data.data, currentSuggestionType);
        }
    } catch (error) {
        console.error('خطأ في البحث:', error);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// إضافة عناصر إضافية للخاتمة
function addAdditionalElement(type) {
    const container = document.getElementById('additional-elements');
    if (!container) return;

    additionalElementsCounter++;
    const elementId = `additional-${type}-${additionalElementsCounter}`;

    let elementHTML = '';
    switch (type) {
        case 'verse':
            elementHTML = `
                <div class="additional-element" data-type="verse" data-id="${elementId}">
                    <div class="element-header">
                        <h5><i class="fas fa-book"></i> آية قرآنية</h5>
                        <button type="button" class="remove-element-btn" onclick="removeAdditionalElement('${elementId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>نص الآية</label>
                        <textarea name="${elementId}-text" rows="3" placeholder="أدخل نص الآية..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>اسم السورة</label>
                            <input type="text" name="${elementId}-surah" placeholder="اسم السورة">
                        </div>
                        <div class="form-group">
                            <label>رقم الآية</label>
                            <input type="number" name="${elementId}-number" placeholder="رقم الآية">
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'hadith':
            elementHTML = `
                <div class="additional-element" data-type="hadith" data-id="${elementId}">
                    <div class="element-header">
                        <h5><i class="fas fa-quote-right"></i> حديث شريف</h5>
                        <button type="button" class="remove-element-btn" onclick="removeAdditionalElement('${elementId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>نص الحديث</label>
                        <textarea name="${elementId}-text" rows="3" placeholder="أدخل نص الحديث..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>الراوي</label>
                            <input type="text" name="${elementId}-narrator" placeholder="اسم الراوي">
                        </div>
                        <div class="form-group">
                            <label>المصدر</label>
                            <input type="text" name="${elementId}-source" placeholder="مصدر الحديث">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>التخريج</label>
                        <input type="text" name="${elementId}-auth" placeholder="درجة الحديث">
                    </div>
                </div>
            `;
            break;
        case 'poetry':
            elementHTML = `
                <div class="additional-element" data-type="poetry" data-id="${elementId}">
                    <div class="element-header">
                        <h5><i class="fas fa-scroll"></i> شعر</h5>
                        <button type="button" class="remove-element-btn" onclick="removeAdditionalElement('${elementId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>الأبيات</label>
                        <textarea name="${elementId}-text" rows="4" placeholder="أدخل الأبيات الشعرية..."></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>الشاعر</label>
                            <input type="text" name="${elementId}-poet" placeholder="اسم الشاعر">
                        </div>
                        <div class="form-group">
                            <label>البحر</label>
                            <input type="text" name="${elementId}-meter" placeholder="البحر الشعري">
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'athar':
            elementHTML = `
                <div class="additional-element" data-type="athar" data-id="${elementId}">
                    <div class="element-header">
                        <h5><i class="fas fa-user-tie"></i> قول أو أثر</h5>
                        <button type="button" class="remove-element-btn" onclick="removeAdditionalElement('${elementId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>نص الأثر</label>
                        <textarea name="${elementId}-text" rows="3" placeholder="أدخل نص الأثر..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>القائل</label>
                        <input type="text" name="${elementId}-speaker" placeholder="اسم القائل">
                    </div>
                </div>
            `;
            break;
        case 'story':
            elementHTML = `
                <div class="additional-element" data-type="story" data-id="${elementId}">
                    <div class="element-header">
                        <h5><i class="fas fa-book-open"></i> قصة</h5>
                        <button type="button" class="remove-element-btn" onclick="removeAdditionalElement('${elementId}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="form-group">
                        <label>عنوان القصة</label>
                        <input type="text" name="${elementId}-title" placeholder="عنوان القصة">
                    </div>
                    <div class="form-group">
                        <label>نص القصة</label>
                        <textarea name="${elementId}-text" rows="5" placeholder="أدخل نص القصة..."></textarea>
                    </div>
                </div>
            `;
            break;
    }

    container.insertAdjacentHTML('beforeend', elementHTML);
}

function removeAdditionalElement(elementId) {
    const element = document.querySelector(`[data-id="${elementId}"]`);
    if (element) {
        element.remove();
    }
}

// دوال مساعدة
function setupAutoSave() {
    // حفظ تلقائي كل 30 ثانية
    setInterval(saveData, 30000);

    // حفظ عند تغيير المحتوى
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(saveData, 2000));
    });
}

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

function saveData() {
    const formData = collectFormData();

    // حفظ في التخزين المحلي مع الوقت
    localStorage.setItem('sermon-draft', JSON.stringify(formData));
    localStorage.setItem('sermon-last-saved', new Date().toISOString());

    console.log('تم حفظ البيانات تلقائياً');
}

function loadSavedData() {
    const savedData = localStorage.getItem('sermon-draft');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            const lastSaved = localStorage.getItem('sermon-last-saved');

            // عرض رسالة استرداد إذا كانت هناك بيانات محفوظة
            if (lastSaved) {
                const lastSavedDate = new Date(lastSaved);
                const now = new Date();
                const diffMinutes = Math.floor((now - lastSavedDate) / (1000 * 60));

                if (diffMinutes < 60) { // إذا كان الحفظ خلال الساعة الماضية
                    showRecoveryDialog(data, diffMinutes);
                    return;
                }
            }

            // تحميل البيانات مباشرة
            loadFormData(data);
            updateSaveStatus('تم استرداد المسودة');
            console.log('تم تحميل البيانات المحفوظة');
        } catch (error) {
            console.error('خطأ في تحميل البيانات المحفوظة:', error);
        }
    }
}

// عرض نافذة استرداد المسودة
function showRecoveryDialog(data, minutesAgo) {
    const dialog = document.createElement('div');
    dialog.className = 'recovery-dialog';
    dialog.innerHTML = `
        <div class="recovery-content">
            <div class="recovery-header">
                <h3><i class="fas fa-history"></i> استرداد المسودة</h3>
            </div>
            <div class="recovery-body">
                <p>تم العثور على مسودة محفوظة منذ ${minutesAgo} دقيقة.</p>
                <p>هل تريد استرداد هذه المسودة؟</p>
                <div class="recovery-preview">
                    <strong>العنوان:</strong> ${data['main-title'] || 'غير محدد'}<br>
                    <strong>عدد الكلمات:</strong> ${countWords(data)}
                </div>
            </div>
            <div class="recovery-footer">
                <button class="btn btn-primary" onclick="recoverDraft()">
                    <i class="fas fa-undo"></i> استرداد المسودة
                </button>
                <button class="btn btn-secondary" onclick="dismissRecovery()">
                    <i class="fas fa-times"></i> بدء جديد
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // حفظ البيانات للاسترداد
    window.recoveryData = data;
}

// استرداد المسودة
function recoverDraft() {
    if (window.recoveryData) {
        loadFormData(window.recoveryData);
        updateSaveStatus('تم استرداد المسودة');
        showToast('تم استرداد المسودة بنجاح');
    }
    dismissRecovery();
}

// رفض الاسترداد
function dismissRecovery() {
    const dialog = document.querySelector('.recovery-dialog');
    if (dialog) {
        dialog.remove();
    }
    window.recoveryData = null;
}

// حساب عدد الكلمات في البيانات
function countWords(data) {
    let totalWords = 0;
    Object.values(data).forEach(value => {
        if (value && typeof value === 'string') {
            const words = value.trim().split(/\s+/).filter(word => word.length > 0);
            totalWords += words.length;
        }
    });
    return totalWords;
}

function collectFormData() {
    const form = document.getElementById('prepare-sermon-form');
    const formData = new FormData(form);
    const data = {};

    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    return data;
}

function setupActionButtons() {
    // زر الحفظ كمسودة
    const saveDraftBtn = document.getElementById('save-draft-btn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', saveDraft);
    }

    // زر المعاينة
    const previewBtn = document.getElementById('preview-btn');
    if (previewBtn) {
        previewBtn.addEventListener('click', previewSermon);
    }

    // زر التصدير
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', toggleExportOptions);
    }

    // خيارات التصدير
    const exportWord = document.getElementById('export-word');
    if (exportWord) {
        exportWord.addEventListener('click', exportToWord);
    }

    const printSermon = document.getElementById('print-sermon');
    if (printSermon) {
        printSermon.addEventListener('click', printSermon);
    }

    const exportPdf = document.getElementById('export-pdf');
    if (exportPdf) {
        exportPdf.addEventListener('click', exportToPDF);
    }

    // زر المسح
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }

    // أزرار التراجع والإعادة
    const undoBtn = document.getElementById('undo-btn');
    if (undoBtn) {
        undoBtn.addEventListener('click', undo);
    }

    const redoBtn = document.getElementById('redo-btn');
    if (redoBtn) {
        redoBtn.addEventListener('click', redo);
    }

    // تحديث الإحصائيات
    updateSermonStats();

    // مراقبة التغييرات لتحديث الإحصائيات
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(updateSermonStats, 500));
    });
}

async function saveDraft() {
    const formData = collectFormData();

    try {
        const response = await fetch('/api/sermons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...formData,
                status: 'draft'
            })
        });

        const data = await response.json();

        if (data.success) {
            showToast('تم حفظ المسودة بنجاح');
        } else {
            showToast('فشل في حفظ المسودة');
        }
    } catch (error) {
        console.error('خطأ في حفظ المسودة:', error);
        showToast('خطأ في حفظ المسودة');
    }
}

function previewSermon() {
    const data = collectFormData();

    // إنشاء نافذة معاينة
    const previewWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');

    const previewContent = generatePreviewHTML(data);
    previewWindow.document.write(previewContent);
    previewWindow.document.close();
}

function generatePreviewHTML(data) {
    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>معاينة الخطبة</title>
            <style>
                body { font-family: 'Amiri', serif; line-height: 1.8; padding: 20px; }
                h1, h2, h3 { color: #2c5530; }
                .section { margin-bottom: 30px; }
                .verse { background: #f8f9fa; padding: 15px; border-right: 4px solid #2c5530; margin: 10px 0; }
            </style>
        </head>
        <body>
            <h1>${data['main-title'] || 'عنوان الخطبة'}</h1>

            <div class="section">
                <h2>المقدمة</h2>
                <div class="verse">${data['introduction-athar'] || ''}</div>
            </div>

            <div class="section">
                <h2>أما بعد</h2>
                <h3>الوصية بالتقوى</h3>
                <div class="verse">${data['taqwa-verses-informative'] || ''}</div>
                <div class="verse">${data['taqwa-verses-command'] || ''}</div>
                <div class="verse">${data['taqwa-verses-promise'] || ''}</div>
            </div>

            <div class="section">
                <h2>نص الخطبة</h2>
                <p>${data['sermon-text'] || ''}</p>
            </div>

            <div class="section">
                <h2>خاتمة الخطبة الأولى</h2>
                <p>${data['first-sermon-conclusion'] || ''}</p>
            </div>

            <div class="section">
                <h2>الخطبة الثانية</h2>
                <p>${data['second-sermon'] || ''}</p>
            </div>

            <div class="section">
                <h2>الدعاء</h2>
                <div class="verse">${data['dua-praise'] || ''}</div>
                <div class="verse">${data['dua-quranic'] || ''}</div>
                <div class="verse">${data['dua-prophetic'] || ''}</div>
            </div>
        </body>
        </html>
    `;
}

function toggleExportOptions() {
    const options = document.querySelector('.export-options');
    if (options) {
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    }
}

function exportToWord() {
    const data = collectFormData();

    try {
        // إنشاء محتوى HTML منسق للتصدير
        const htmlContent = generateSermonHTML(data);

        // إنشاء blob وتحميله
        const blob = new Blob([htmlContent], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `خطبة_${data['main-title'] || 'جديدة'}_${new Date().toISOString().split('T')[0]}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('تم تصدير الخطبة بنجاح');
    } catch (error) {
        console.error('خطأ في التصدير:', error);
        showToast('حدث خطأ أثناء التصدير');
    }
}

// إنشاء HTML منسق للخطبة
function generateSermonHTML(data) {
    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${data['main-title'] || 'خطبة جديدة'}</title>
    <style>
        body {
            font-family: 'Traditional Arabic', 'Amiri', serif;
            line-height: 1.8;
            margin: 40px;
            direction: rtl;
            text-align: right;
        }
        h1 {
            color: #2c5530;
            text-align: center;
            border-bottom: 2px solid #2c5530;
            padding-bottom: 10px;
            margin-bottom: 30px;
        }
        h2 {
            color: #2c5530;
            margin-top: 30px;
            margin-bottom: 15px;
        }
        h3 {
            color: #4a6741;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .verse {
            background: #f8f9fa;
            padding: 15px;
            border-right: 4px solid #2c5530;
            margin: 15px 0;
            font-weight: bold;
        }
        .hadith {
            background: #fff8e1;
            padding: 15px;
            border-right: 4px solid #ff9800;
            margin: 15px 0;
            font-style: italic;
        }
        .dua {
            background: #e8f5e8;
            padding: 15px;
            border-right: 4px solid #4caf50;
            margin: 15px 0;
            text-align: center;
        }
        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }
        .preacher-info {
            margin-top: 40px;
            text-align: center;
            border-top: 1px solid #ddd;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <h1>${data['main-title'] || 'خطبة جديدة'}</h1>

    ${data['introduction-athar'] ? `
    <div class="section">
        <h2>المقدمة</h2>
        <div class="verse">${data['introduction-athar']}</div>
    </div>
    ` : ''}

    ${data['saja-text'] ? `
    <div class="section">
        <h3>السجع</h3>
        <p>${data['saja-text']}</p>
    </div>
    ` : ''}

    ${data['poetry-text'] ? `
    <div class="section">
        <h3>الشعر</h3>
        <p style="white-space: pre-line;">${data['poetry-text']}</p>
    </div>
    ` : ''}

    <div class="section">
        <h2>أما بعد</h2>
        <h3>الوصية بالتقوى</h3>

        ${data['taqwa-verses-informative'] ? `<div class="verse">${data['taqwa-verses-informative']}</div>` : ''}
        ${data['taqwa-verses-command'] ? `<div class="verse">${data['taqwa-verses-command']}</div>` : ''}
        ${data['taqwa-verses-promise'] ? `<div class="verse">${data['taqwa-verses-promise']}</div>` : ''}

        ${data['taqwa-hadith-informative'] ? `<div class="hadith">${data['taqwa-hadith-informative']}</div>` : ''}
        ${data['taqwa-hadith-command'] ? `<div class="hadith">${data['taqwa-hadith-command']}</div>` : ''}
        ${data['taqwa-hadith-promise'] ? `<div class="hadith">${data['taqwa-hadith-promise']}</div>` : ''}
    </div>

    ${data['sermon-text'] ? `
    <div class="section">
        <h2>نص الخطبة</h2>
        <p style="white-space: pre-line;">${data['sermon-text']}</p>
    </div>
    ` : ''}

    ${data['first-sermon-conclusion'] ? `
    <div class="section">
        <h2>خاتمة الخطبة الأولى</h2>
        <p>${data['first-sermon-conclusion']}</p>
    </div>
    ` : ''}

    ${data['second-sermon'] ? `
    <div class="section">
        <h2>الخطبة الثانية</h2>
        <p style="white-space: pre-line;">${data['second-sermon']}</p>
    </div>
    ` : ''}

    <div class="section">
        <h2>خاتمة الخطبة الثانية</h2>

        ${data['salah-on-prophet'] ? `<div class="dua">${data['salah-on-prophet']}</div>` : ''}

        <h3>الدعاء</h3>
        ${data['dua-praise'] ? `<div class="dua">${data['dua-praise']}</div>` : ''}
        ${data['dua-quranic'] ? `<div class="dua">${data['dua-quranic']}</div>` : ''}
        ${data['dua-prophetic'] ? `<div class="dua">${data['dua-prophetic']}</div>` : ''}
        ${data['dua-muslim'] ? `<div class="dua">${data['dua-muslim']}</div>` : ''}
        ${data['dua-oppressor'] ? `<div class="dua">${data['dua-oppressor']}</div>` : ''}
        ${data['dua-additional'] ? `<div class="dua">${data['dua-additional']}</div>` : ''}
        ${data['dua-istisqa'] ? `<div class="dua">${data['dua-istisqa']}</div>` : ''}
    </div>

    ${data['preacher-name'] ? `
    <div class="preacher-info">
        <p><strong>الخطيب:</strong> ${data['preacher-name']}</p>
        <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-SA')}</p>
    </div>
    ` : ''}
</body>
</html>
    `;
}

function printSermon() {
    const data = collectFormData();
    const printContent = generatePreviewHTML(data);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
}

function clearForm() {
    if (confirm('هل أنت متأكد من مسح جميع البيانات؟')) {
        document.getElementById('prepare-sermon-form').reset();
        localStorage.removeItem('sermon-draft');
        showToast('تم مسح النموذج');
    }
}

function showToast(message) {
    // إنشاء عنصر التوست
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // إضافة التوست للصفحة
    document.body.appendChild(toast);

    // إظهار التوست
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);

    // إخفاء التوست بعد 3 ثوان
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

function showError(message) {
    showToast(message);
}

// === دوال جديدة محسنة ===

// تهيئة عدادات الكلمات
function initializeWordCounters() {
    const textareas = document.querySelectorAll('textarea');
    textareas.forEach(textarea => {
        addWordCounter(textarea);
        textarea.addEventListener('input', () => updateWordCounter(textarea));
    });
}

// إضافة عداد كلمات لحقل نص
function addWordCounter(textarea) {
    const container = textarea.parentElement;
    const counter = document.createElement('div');
    counter.className = 'word-counter';
    counter.innerHTML = `
        <span class="words-count">0 كلمة</span> |
        <span class="chars-count">0 حرف</span>
    `;
    container.appendChild(counter);
    updateWordCounter(textarea);
}

// تحديث عداد الكلمات
function updateWordCounter(textarea) {
    const text = textarea.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const chars = text.length;

    const container = textarea.parentElement;
    const counter = container.querySelector('.word-counter');
    if (counter) {
        counter.querySelector('.words-count').textContent = `${words} كلمة`;
        counter.querySelector('.chars-count').textContent = `${chars} حرف`;
    }
}

// تهيئة نظام التراجع والإعادة
function initializeUndoRedo() {
    // إضافة اختصارات لوحة المفاتيح
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undo();
        } else if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redo();
        } else if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveData();
        }
    });

    // حفظ حالة أولية
    saveState();
}

// حفظ حالة الخطبة للتراجع
function saveState() {
    const currentState = collectFormData();
    undoStack.push(JSON.stringify(currentState));

    // الحد الأقصى للتراجع 20 خطوة
    if (undoStack.length > 20) {
        undoStack.shift();
    }

    // مسح مكدس الإعادة عند حفظ حالة جديدة
    redoStack = [];
}

// التراجع
function undo() {
    if (undoStack.length > 1) {
        const currentState = undoStack.pop();
        redoStack.push(currentState);

        const previousState = JSON.parse(undoStack[undoStack.length - 1]);
        loadFormData(previousState);

        showToast('تم التراجع');
    }
}

// الإعادة
function redo() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);

        const stateData = JSON.parse(nextState);
        loadFormData(stateData);

        showToast('تم الإعادة');
    }
}

// تحميل بيانات في النموذج
function loadFormData(data) {
    Object.keys(data).forEach(key => {
        const element = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
        if (element) {
            element.value = data[key];
            // تحديث عداد الكلمات إذا كان textarea
            if (element.tagName === 'TEXTAREA') {
                updateWordCounter(element);
            }
        }
    });
}

// تهيئة القوالب الجاهزة
function initializeTemplates() {
    const templates = [
        {
            name: 'خطبة جمعة عامة',
            data: {
                'main-title': 'خطبة جمعة',
                'introduction-athar': 'إن الحمد لله نحمده ونستعينه ونستغفره...',
                'taqwa-verses-command': 'يَا أَيُّهَا الَّذِينَ آمَنُوا اتَّقُوا اللَّهَ حَقَّ تُقَاتِهِ وَلَا تَمُوتُنَّ إِلَّا وَأَنتُم مُّسْلِمُونَ',
                'dua-praise': 'الحمد لله رب العالمين، والصلاة والسلام على أشرف المرسلين'
            }
        },
        {
            name: 'خطبة رمضان',
            data: {
                'main-title': 'فضل شهر رمضان',
                'introduction-athar': 'شهر رمضان الذي أنزل فيه القرآن...',
                'sermon-text': 'إن شهر رمضان شهر عظيم، فيه تفتح أبواب الجنة وتغلق أبواب النار...'
            }
        }
    ];

    // إضافة قائمة القوالب للواجهة
    addTemplatesMenu(templates);
}

// إضافة قائمة القوالب
function addTemplatesMenu(templates) {
    const formActions = document.querySelector('.form-actions');
    const templatesBtn = document.createElement('button');
    templatesBtn.type = 'button';
    templatesBtn.className = 'btn btn-secondary';
    templatesBtn.innerHTML = '<i class="fas fa-file-alt"></i> قوالب جاهزة';

    const templatesMenu = document.createElement('div');
    templatesMenu.className = 'templates-menu';
    templatesMenu.style.display = 'none';

    templates.forEach(template => {
        const templateItem = document.createElement('div');
        templateItem.className = 'template-item';
        templateItem.textContent = template.name;
        templateItem.addEventListener('click', () => {
            loadTemplate(template.data);
            templatesMenu.style.display = 'none';
        });
        templatesMenu.appendChild(templateItem);
    });

    templatesBtn.addEventListener('click', () => {
        templatesMenu.style.display = templatesMenu.style.display === 'none' ? 'block' : 'none';
    });

    const container = document.createElement('div');
    container.style.position = 'relative';
    container.appendChild(templatesBtn);
    container.appendChild(templatesMenu);

    formActions.insertBefore(container, formActions.firstChild);
}

// تحميل قالب
function loadTemplate(templateData) {
    if (confirm('هل تريد تحميل هذا القالب؟ سيتم استبدال المحتوى الحالي.')) {
        saveState(); // حفظ الحالة الحالية للتراجع
        loadFormData(templateData);
        showToast('تم تحميل القالب بنجاح');
    }
}

// تحديث حالة الحفظ
function updateSaveStatus(status) {
    let statusElement = document.getElementById('save-status');
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'save-status';
        statusElement.className = 'save-status';
        document.querySelector('.sermon-form-card h2').appendChild(statusElement);
    }

    statusElement.textContent = status;
    statusElement.className = `save-status ${status === 'محفوظ' ? 'saved' : 'unsaved'}`;
}

// تحسين دالة الحفظ التلقائي
function setupAutoSave() {
    // حفظ تلقائي كل 30 ثانية
    autoSaveInterval = setInterval(() => {
        saveData();
        updateSaveStatus('محفوظ تلقائياً');
    }, 30000);

    // حفظ عند تغيير المحتوى
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', debounce(() => {
            saveState(); // حفظ للتراجع
            saveData();
            updateSaveStatus('غير محفوظ');
        }, 2000));
    });
}

// تصدير إلى PDF
function exportToPDF() {
    const data = collectFormData();
    const htmlContent = generateSermonHTML(data);

    // فتح نافذة جديدة للطباعة كـ PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // إضافة CSS خاص بالطباعة
    const style = printWindow.document.createElement('style');
    style.textContent = `
        @media print {
            body { margin: 0; }
            @page { margin: 2cm; }
        }
    `;
    printWindow.document.head.appendChild(style);

    printWindow.print();
    showToast('جاري تحضير ملف PDF...');
}

// تحديث إحصائيات الخطبة
function updateSermonStats() {
    const data = collectFormData();
    let totalWords = 0;
    let completedSections = 0;
    const totalSections = 7; // عدد الأقسام الرئيسية

    // حساب إجمالي الكلمات
    Object.values(data).forEach(value => {
        if (value && typeof value === 'string') {
            const words = value.trim().split(/\s+/).filter(word => word.length > 0);
            totalWords += words.length;
        }
    });

    // حساب نسبة الإكمال
    const requiredFields = [
        'main-title', 'introduction-athar', 'taqwa-verses-command',
        'sermon-text', 'first-sermon-conclusion', 'second-sermon', 'dua-praise'
    ];

    requiredFields.forEach(field => {
        if (data[field] && data[field].trim().length > 0) {
            completedSections++;
        }
    });

    const completionPercentage = Math.round((completedSections / totalSections) * 100);

    // تحديث العرض
    const totalWordsElement = document.getElementById('total-words');
    const completionElement = document.getElementById('completion-percentage');

    if (totalWordsElement) {
        totalWordsElement.textContent = totalWords;
    }

    if (completionElement) {
        completionElement.textContent = `${completionPercentage}%`;
        completionElement.style.color = completionPercentage >= 80 ? '#28a745' :
                                       completionPercentage >= 50 ? '#ffc107' : '#dc3545';
    }

    // تحديث مؤشر التقدم
    updateProgressIndicator(completionPercentage);
}

// تحديث مؤشر التقدم
function updateProgressIndicator(percentage) {
    const steps = document.querySelectorAll('.progress-step');
    const currentStep = Math.ceil((percentage / 100) * steps.length);

    steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index < currentStep - 1) {
            step.classList.add('completed');
        } else if (index === currentStep - 1) {
            step.classList.add('active');
        }
    });
}

// تحسين دالة الحفظ
async function saveDraft() {
    const formData = collectFormData();

    // التحقق من وجود عنوان على الأقل
    if (!formData['main-title'] || formData['main-title'].trim().length === 0) {
        showToast('يرجى إدخال عنوان الخطبة أولاً');
        document.getElementById('main-title').focus();
        return;
    }

    try {
        updateSaveStatus('جاري الحفظ...');

        const response = await fetch('/api/sermons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...formData,
                status: 'draft',
                created_at: new Date().toISOString()
            })
        });

        const data = await response.json();

        if (data.success) {
            currentSermonId = data.data.id;
            updateSaveStatus('محفوظ');
            showToast('تم حفظ المسودة بنجاح');
        } else {
            updateSaveStatus('خطأ في الحفظ');
            showToast('فشل في حفظ المسودة: ' + (data.message || 'خطأ غير معروف'));
        }
    } catch (error) {
        console.error('خطأ في حفظ المسودة:', error);
        updateSaveStatus('خطأ في الحفظ');
        showToast('خطأ في الاتصال بالخادم');
    }
}











// إضافة CSS للنظام الجديد
const style = document.createElement('style');
style.textContent = `
    .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #2c5530;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
        transform: translateX(120%);
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 1000;
        max-width: 300px;
    }

    .toast.show {
        transform: translateX(0);
        opacity: 1;
    }

    .suggestions-modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .suggestions-content {
        background-color: white;
        border-radius: 10px;
        width: 90%;
        max-width: 800px;
        max-height: 80vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .suggestions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid #eee;
        background-color: #f8f9fa;
    }

    .suggestions-header h3 {
        margin: 0;
        color: #2c5530;
    }

    .close-modal-btn {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        padding: 5px;
    }

    .suggestions-body {
        padding: 20px;
        overflow-y: auto;
        flex-grow: 1;
    }

    .suggestions-search {
        display: flex;
        margin-bottom: 20px;
        gap: 10px;
    }

    .suggestions-search input {
        flex-grow: 1;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        font-size: 14px;
    }

    .suggestions-search button {
        padding: 10px 15px;
        background-color: #2c5530;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    }

    .suggestions-list {
        max-height: 400px;
        overflow-y: auto;
    }

    .suggestion-item {
        border: 1px solid #eee;
        border-radius: 8px;
        margin-bottom: 15px;
        padding: 15px;
        cursor: pointer;
        transition: all 0.2s ease;
        background-color: white;
    }

    .suggestion-item:hover {
        border-color: #2c5530;
        box-shadow: 0 2px 8px rgba(44, 85, 48, 0.1);
    }

    .suggestion-item.selected {
        border-color: #2c5530;
        background-color: #f0f8f0;
        box-shadow: 0 2px 8px rgba(44, 85, 48, 0.2);
    }

    .suggestion-header {
        margin-bottom: 10px;
    }

    .suggestion-header h4 {
        margin: 0 0 5px 0;
        color: #2c5530;
        font-size: 16px;
    }

    .suggestion-meta {
        font-size: 12px;
        color: #666;
        background-color: #f8f9fa;
        padding: 2px 8px;
        border-radius: 12px;
        display: inline-block;
    }

    .suggestion-content {
        line-height: 1.6;
        color: #333;
        margin: 10px 0;
    }

    .suggestion-auth {
        font-size: 12px;
        color: #888;
        font-style: italic;
        margin-top: 8px;
    }

    .suggestions-loading {
        display: none;
        text-align: center;
        padding: 40px;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2c5530;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 15px;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .suggestions-footer {
        padding: 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        background-color: #f8f9fa;
    }

    .no-suggestions {
        text-align: center;
        color: #666;
        padding: 40px;
        font-style: italic;
    }

    .additional-element {
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        background-color: #f9f9f9;
    }

    .element-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .element-header h5 {
        margin: 0;
        color: #2c5530;
    }

    .remove-element-btn {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .add-element-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 15px;
    }

    .btn.btn-outline {
        background: transparent;
        border: 2px solid #2c5530;
        color: #2c5530;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
    }

    .btn.btn-outline:hover {
        background: #2c5530;
        color: white;
    }

    .form-row {
        display: flex;
        gap: 15px;
        margin-bottom: 15px;
    }

    .form-row .form-group {
        flex: 1;
    }

    .subsection {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
    }

    .subsection h4 {
        color: #2c5530;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 1px solid #dee2e6;
    }

    .subsection h5 {
        color: #495057;
        margin-bottom: 15px;
        font-size: 16px;
    }

    .taqwa-subsection {
        background-color: white;
        border: 1px solid #dee2e6;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 15px;
    }

    .suggest-btn {
        background: #17a2b8;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background-color 0.2s ease;
    }

    .suggest-btn:hover {
        background: #138496;
    }

    .textarea-actions {
        display: flex;
        gap: 5px;
        margin-top: 5px;
    }

    /* أنماط الميزات الجديدة */
    .word-counter {
        font-size: 12px;
        color: #666;
        text-align: left;
        margin-top: 5px;
        padding: 5px;
        background: #f8f9fa;
        border-radius: 3px;
    }

    .save-status {
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 12px;
        margin-right: 10px;
    }

    .save-status.saved {
        background: #d4edda;
        color: #155724;
    }

    .save-status.unsaved {
        background: #f8d7da;
        color: #721c24;
    }

    .templates-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 100;
        min-width: 200px;
        margin-top: 5px;
    }

    .template-item {
        padding: 10px 15px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
        transition: background 0.2s;
    }

    .template-item:hover {
        background: #f8f9fa;
    }

    .template-item:last-child {
        border-bottom: none;
    }

    /* تحسينات إضافية */
    .form-group.required label::after {
        content: ' *';
        color: #dc3545;
    }

    .progress-indicator {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
        padding: 0 20px;
    }

    .progress-step {
        flex: 1;
        text-align: center;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 5px;
        margin: 0 5px;
        transition: all 0.3s;
    }

    .progress-step.active {
        background: #2c5530;
        color: white;
    }

    .progress-step.completed {
        background: #28a745;
        color: white;
    }

    /* أنماط أزرار التراجع والإعادة */
    .undo-redo-group {
        display: flex;
        gap: 5px;
        margin-left: 15px;
    }

    .undo-redo-group .btn {
        padding: 8px 12px;
        font-size: 14px;
    }

    /* أنماط الإحصائيات */
    .sermon-stats {
        display: flex;
        gap: 20px;
        margin-right: auto;
        padding: 10px;
        background: #f8f9fa;
        border-radius: 5px;
        font-size: 14px;
    }

    .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .stat-label {
        color: #666;
        font-size: 12px;
    }

    .stat-value {
        font-weight: bold;
        color: #2c5530;
        font-size: 16px;
    }

    /* تحسينات الاستجابة */
    @media (max-width: 768px) {
        .form-actions {
            flex-direction: column;
            gap: 10px;
        }

        .undo-redo-group {
            margin-right: 0;
            justify-content: center;
        }

        .sermon-stats {
            justify-content: center;
            margin-right: 0;
        }

        .progress-indicator {
            flex-direction: column;
            gap: 10px;
        }

        .progress-step {
            margin: 0;
        }
    }

    /* أنماط التحقق من الصحة */
    .form-group.error input,
    .form-group.error textarea {
        border-color: #dc3545;
    }

    .form-group.error .error-message {
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
    }

    .form-group.success input,
    .form-group.success textarea {
        border-color: #28a745;
    }

    /* أنماط نافذة الاسترداد */
    .recovery-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
    }

    .recovery-content {
        background: white;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .recovery-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
        text-align: center;
    }

    .recovery-header h3 {
        margin: 0;
        color: #2c5530;
    }

    .recovery-body {
        padding: 20px;
        text-align: center;
    }

    .recovery-preview {
        background: #f8f9fa;
        padding: 15px;
        border-radius: 5px;
        margin: 15px 0;
        text-align: right;
        border-right: 4px solid #2c5530;
    }

    .recovery-footer {
        padding: 20px;
        display: flex;
        justify-content: center;
        gap: 15px;
        border-top: 1px solid #eee;
    }

    /* تحسينات إضافية للأزرار */
    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn.loading {
        position: relative;
        color: transparent;
    }

    .btn.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    /* تحسينات للطباعة */
    @media print {
        .recovery-dialog,
        .suggestions-modal,
        .form-actions,
        .progress-indicator {
            display: none !important;
        }
    }
`;

document.head.appendChild(style);