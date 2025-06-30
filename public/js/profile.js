/**
 * JavaScript لصفحة الملف الشخصي
 */

// تحميل بيانات المستخدم عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    setupEventListeners();
});

// تحميل بيانات الملف الشخصي
function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id) {
        window.errorHandler.showError('يجب تسجيل الدخول أولاً', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        return;
    }
    
    // عرض بيانات المستخدم
    document.getElementById('profile-name').textContent = user.name || 'غير محدد';
    document.getElementById('profile-email').textContent = user.email || 'غير محدد';
    
    // عرض الدور
    const roleElement = document.getElementById('profile-role');
    const roleText = user.role === 'admin' ? 'مدير' : 'عضو';
    roleElement.textContent = roleText;
    roleElement.className = `role-badge ${user.role === 'admin' ? 'admin-role' : 'member-role'}`;
    
    // عرض تاريخ التسجيل
    if (user.created_at) {
        const joinDate = new Date(user.created_at).toLocaleDateString('ar-SA');
        document.getElementById('profile-join-date').textContent = joinDate;
    }
    
    // عرض آخر تحديث
    if (user.updated_at) {
        const updateDate = new Date(user.updated_at).toLocaleDateString('ar-SA');
        document.getElementById('profile-last-update').textContent = updateDate;
    }
    
    // ملء نموذج التحرير
    document.getElementById('edit-name').value = user.name || '';
    document.getElementById('edit-email').value = user.email || '';
}

// إعداد مستمعي الأحداث
function setupEventListeners() {
    // نموذج تحرير الملف الشخصي
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
    
    // نموذج تغيير كلمة المرور
    document.getElementById('password-form').addEventListener('submit', handlePasswordChange);
    
    // مفاتيح التبديل
    document.getElementById('notifications-toggle').addEventListener('change', handleNotificationToggle);
    document.getElementById('privacy-toggle').addEventListener('change', handlePrivacyToggle);
}

// معالجة تحديث الملف الشخصي
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const updateData = {
        name: formData.get('name'),
        email: formData.get('email')
    };
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
        const response = await fetch(`/api/users/${user.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'فشل في تحديث البيانات');
        }
        
        const data = await response.json();
        
        // تحديث البيانات المحفوظة محلياً
        const updatedUser = { ...user, ...updateData, updated_at: new Date().toISOString() };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // إعادة تحميل البيانات
        loadUserProfile();
        
        window.errorHandler.showSuccess('تم تحديث البيانات بنجاح');
        
    } catch (error) {
        console.error('خطأ في تحديث الملف الشخصي:', error);
        window.errorHandler.showError(error.message, 'error');
    }
}

// معالجة تغيير كلمة المرور
async function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    // التحقق من تطابق كلمة المرور الجديدة
    if (newPassword !== confirmPassword) {
        window.errorHandler.showError('كلمة المرور الجديدة غير متطابقة', 'warning');
        return;
    }
    
    // التحقق من طول كلمة المرور
    if (newPassword.length < 6) {
        window.errorHandler.showError('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
        return;
    }
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
        const response = await fetch(`/api/users/${user.id}/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'فشل في تغيير كلمة المرور');
        }
        
        // إعادة تعيين النموذج
        document.getElementById('password-form').reset();
        
        window.errorHandler.showSuccess('تم تغيير كلمة المرور بنجاح');
        
    } catch (error) {
        console.error('خطأ في تغيير كلمة المرور:', error);
        window.errorHandler.showError(error.message, 'error');
    }
}

// معالجة تبديل الإشعارات
function handleNotificationToggle(e) {
    const enabled = e.target.checked;
    
    // حفظ الإعداد محلياً
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    settings.notifications = enabled;
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    const message = enabled ? 'تم تفعيل الإشعارات' : 'تم إيقاف الإشعارات';
    window.errorHandler.showInfo(message);
}

// معالجة تبديل الخصوصية
function handlePrivacyToggle(e) {
    const enabled = e.target.checked;
    
    // حفظ الإعداد محلياً
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    settings.privacy = enabled;
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    const message = enabled ? 'تم تفعيل الخصوصية' : 'تم إيقاف الخصوصية';
    window.errorHandler.showInfo(message);
}

// إعادة تعيين نموذج الملف الشخصي
function resetProfileForm() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('edit-name').value = user.name || '';
    document.getElementById('edit-email').value = user.email || '';
    window.errorHandler.showInfo('تم إلغاء التغييرات');
}

// إعادة تعيين نموذج كلمة المرور
function resetPasswordForm() {
    document.getElementById('password-form').reset();
    window.errorHandler.showInfo('تم إلغاء التغييرات');
}

// حذف الحساب
async function deleteAccount() {
    const confirmation = prompt('لحذف حسابك نهائياً، اكتب "حذف الحساب" في المربع أدناه:');
    
    if (confirmation !== 'حذف الحساب') {
        window.errorHandler.showInfo('تم إلغاء عملية الحذف');
        return;
    }
    
    const finalConfirmation = confirm('هل أنت متأكد تماماً؟ هذا الإجراء لا يمكن التراجع عنه!');
    
    if (!finalConfirmation) {
        return;
    }
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
        const response = await fetch(`/api/users/${user.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('فشل في حذف الحساب');
        }
        
        // تنظيف البيانات المحلية
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userSettings');
        
        window.errorHandler.showSuccess('تم حذف الحساب بنجاح');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('خطأ في حذف الحساب:', error);
        window.errorHandler.showError('فشل في حذف الحساب', 'error');
    }
}

// تحميل الإعدادات المحفوظة
function loadUserSettings() {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    // تطبيق إعدادات الإشعارات
    if (settings.notifications !== undefined) {
        document.getElementById('notifications-toggle').checked = settings.notifications;
    }
    
    // تطبيق إعدادات الخصوصية
    if (settings.privacy !== undefined) {
        document.getElementById('privacy-toggle').checked = settings.privacy;
    }
}

// تحميل الإعدادات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadUserSettings);

// إضافة أنماط CSS للأدوار
const style = document.createElement('style');
style.textContent = `
    .admin-role {
        background: rgba(220, 53, 69, 0.2) !important;
        color: #721c24 !important;
    }
    
    .member-role {
        background: rgba(40, 167, 69, 0.2) !important;
        color: #155724 !important;
    }
`;
document.head.appendChild(style);
