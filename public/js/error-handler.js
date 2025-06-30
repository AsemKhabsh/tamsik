/**
 * نظام معالجة الأخطاء للواجهة الأمامية
 * يوفر طرق موحدة لمعالجة وعرض الأخطاء للمستخدمين
 */

class ErrorHandler {
    constructor() {
        this.errorContainer = null;
        this.init();
    }

    init() {
        // إنشاء حاوي الأخطاء إذا لم يكن موجوداً
        this.createErrorContainer();
        
        // معالجة الأخطاء غير المعالجة
        this.setupGlobalErrorHandlers();
    }

    createErrorContainer() {
        if (!document.getElementById('error-container')) {
            const container = document.createElement('div');
            container.id = 'error-container';
            container.className = 'error-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }
        this.errorContainer = document.getElementById('error-container');
    }

    setupGlobalErrorHandlers() {
        // معالجة أخطاء JavaScript
        window.addEventListener('error', (event) => {
            console.error('خطأ JavaScript:', event.error);
            this.showError('حدث خطأ غير متوقع في الصفحة', 'error');
        });

        // معالجة الوعود المرفوضة
        window.addEventListener('unhandledrejection', (event) => {
            console.error('وعد مرفوض:', event.reason);
            this.showError('حدث خطأ في تحميل البيانات', 'error');
        });
    }

    /**
     * عرض رسالة خطأ للمستخدم
     * @param {string} message - رسالة الخطأ
     * @param {string} type - نوع الرسالة (error, warning, info, success)
     * @param {number} duration - مدة العرض بالميلي ثانية (0 = دائم)
     */
    showError(message, type = 'error', duration = 5000) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.style.cssText = `
            margin-bottom: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
        `;

        const icon = this.getIcon(type);
        alert.innerHTML = `
            <div style="display: flex; align-items: center;">
                <i class="${icon}" style="margin-left: 10px; font-size: 1.2em;"></i>
                <span style="flex: 1;">${message}</span>
                <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        this.errorContainer.appendChild(alert);

        // إزالة الرسالة تلقائياً
        if (duration > 0) {
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.remove();
                }
            }, duration);
        }

        return alert;
    }

    getIcon(type) {
        const icons = {
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle'
        };
        return icons[type] || icons.error;
    }

    /**
     * معالجة أخطاء API
     * @param {Response} response - استجابة fetch
     * @param {string} defaultMessage - رسالة افتراضية
     */
    async handleApiError(response, defaultMessage = 'حدث خطأ في الخادم') {
        try {
            const data = await response.json();
            const message = data.message || defaultMessage;
            
            if (response.status === 401) {
                this.showError('انتهت جلسة العمل، يرجى تسجيل الدخول مرة أخرى', 'warning');
                // إعادة توجيه لصفحة تسجيل الدخول
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else if (response.status === 403) {
                this.showError('ليس لديك صلاحية للقيام بهذا الإجراء', 'warning');
            } else if (response.status === 404) {
                this.showError('المورد المطلوب غير موجود', 'warning');
            } else if (response.status >= 500) {
                this.showError('خطأ في الخادم، يرجى المحاولة لاحقاً', 'error');
            } else {
                this.showError(message, 'error');
            }

            // عرض تفاصيل الأخطاء إذا كانت متاحة
            if (data.errors && Array.isArray(data.errors)) {
                data.errors.forEach(error => {
                    this.showError(`${error.field}: ${error.message}`, 'warning', 7000);
                });
            }

        } catch (e) {
            this.showError(defaultMessage, 'error');
        }
    }

    /**
     * معالجة أخطاء الشبكة
     * @param {Error} error - خطأ الشبكة
     */
    handleNetworkError(error) {
        console.error('خطأ في الشبكة:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            this.showError('فشل في الاتصال بالخادم، تحقق من اتصال الإنترنت', 'error');
        } else {
            this.showError('حدث خطأ في الاتصال', 'error');
        }
    }

    /**
     * معالجة أخطاء النماذج
     * @param {HTMLFormElement} form - النموذج
     * @param {Object} errors - أخطاء التحقق
     */
    handleFormErrors(form, errors) {
        // إزالة الأخطاء السابقة
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

        if (Array.isArray(errors)) {
            errors.forEach(error => {
                const field = form.querySelector(`[name="${error.field}"]`);
                if (field) {
                    field.classList.add('is-invalid');
                    
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error-message text-danger small mt-1';
                    errorDiv.textContent = error.message;
                    
                    field.parentNode.appendChild(errorDiv);
                }
            });
        }
    }

    /**
     * عرض رسالة نجاح
     * @param {string} message - رسالة النجاح
     * @param {number} duration - مدة العرض
     */
    showSuccess(message, duration = 3000) {
        return this.showError(message, 'success', duration);
    }

    /**
     * عرض رسالة تحذير
     * @param {string} message - رسالة التحذير
     * @param {number} duration - مدة العرض
     */
    showWarning(message, duration = 4000) {
        return this.showError(message, 'warning', duration);
    }

    /**
     * عرض رسالة معلومات
     * @param {string} message - رسالة المعلومات
     * @param {number} duration - مدة العرض
     */
    showInfo(message, duration = 4000) {
        return this.showError(message, 'info', duration);
    }

    /**
     * إزالة جميع الرسائل
     */
    clearAll() {
        if (this.errorContainer) {
            this.errorContainer.innerHTML = '';
        }
    }

    /**
     * معالج شامل للطلبات
     * @param {Promise} fetchPromise - وعد fetch
     * @param {string} successMessage - رسالة النجاح
     * @param {string} errorMessage - رسالة الخطأ
     */
    async handleRequest(fetchPromise, successMessage = null, errorMessage = null) {
        try {
            const response = await fetchPromise;
            
            if (!response.ok) {
                await this.handleApiError(response, errorMessage);
                return null;
            }

            const data = await response.json();
            
            if (successMessage) {
                this.showSuccess(successMessage);
            }

            return data;

        } catch (error) {
            this.handleNetworkError(error);
            return null;
        }
    }
}

// إنشاء مثيل عام
window.errorHandler = new ErrorHandler();

// تصدير للاستخدام في الوحدات
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}
