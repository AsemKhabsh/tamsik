/**
 * JavaScript للوحة الإدارة
 */

// التحقق من صلاحيات المدير
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAccess();
    loadDashboardData();
});

// التحقق من صلاحيات المدير
function checkAdminAccess() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!user.id || user.role !== 'admin') {
        window.errorHandler.showError('ليس لديك صلاحية للوصول إلى لوحة الإدارة', 'error');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return false;
    }
    
    return true;
}

// تحميل بيانات لوحة التحكم
async function loadDashboardData() {
    try {
        // تحميل الإحصائيات
        await loadStatistics();
    } catch (error) {
        console.error('خطأ في تحميل بيانات لوحة التحكم:', error);
        window.errorHandler.showError('خطأ في تحميل البيانات', 'error');
    }
}

// تحميل الإحصائيات
async function loadStatistics() {
    const token = localStorage.getItem('token');
    
    try {
        // تحميل إحصائيات المستخدمين
        const usersResponse = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            document.getElementById('users-count').textContent = usersData.data?.pagination?.total || 0;
        }

        // تحميل إحصائيات الخطب
        const sermonsResponse = await fetch('/api/sermons');
        if (sermonsResponse.ok) {
            const sermonsData = await sermonsResponse.json();
            document.getElementById('sermons-count').textContent = sermonsData.data?.pagination?.total || 0;
        }

        // تحميل إحصائيات العلماء
        const scholarsResponse = await fetch('/api/scholars');
        if (scholarsResponse.ok) {
            const scholarsData = await scholarsResponse.json();
            document.getElementById('scholars-count').textContent = scholarsData.data?.pagination?.total || 0;
        }

        // تحميل إحصائيات الفتاوى
        const fatwasResponse = await fetch('/api/fatwas');
        if (fatwasResponse.ok) {
            const fatwasData = await fatwasResponse.json();
            document.getElementById('fatwas-count').textContent = fatwasData.data?.pagination?.total || 0;
        }

        // تحميل إحصائيات المحاضرات
        const lecturesResponse = await fetch('/api/lectures');
        if (lecturesResponse.ok) {
            const lecturesData = await lecturesResponse.json();
            document.getElementById('lectures-count').textContent = lecturesData.data?.pagination?.total || 0;
        }

        // تحميل إحصائيات المفكرين
        const thinkersResponse = await fetch('/api/thinkers');
        if (thinkersResponse.ok) {
            const thinkersData = await thinkersResponse.json();
            document.getElementById('thinkers-count').textContent = thinkersData.data?.pagination?.total || 0;
        }

    } catch (error) {
        console.error('خطأ في تحميل الإحصائيات:', error);
    }
}

// عرض المستخدمين
async function showUsers() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('فشل في تحميل المستخدمين');
        }
        
        const data = await response.json();
        const users = data.data?.users || [];
        
        displayUsersTable(users);
        document.getElementById('users-table-section').style.display = 'block';
        
    } catch (error) {
        console.error('خطأ في تحميل المستخدمين:', error);
        window.errorHandler.showError('فشل في تحميل المستخدمين', 'error');
    }
}

// عرض جدول المستخدمين
function displayUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}">
                    ${user.role === 'admin' ? 'مدير' : 'عضو'}
                </span>
            </td>
            <td>${new Date(user.created_at).toLocaleDateString('ar-SA')}</td>
            <td>
                <button class="btn btn-sm btn-warning" onclick="editUser(${user.id})">
                    <i class="fas fa-edit"></i>
                    تعديل
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                    <i class="fas fa-trash"></i>
                    حذف
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// إخفاء جدول المستخدمين
function hideUsers() {
    document.getElementById('users-table-section').style.display = 'none';
}

// إضافة مستخدم جديد
function addUser() {
    document.getElementById('add-user-modal').style.display = 'flex';
}

// إغلاق نافذة إضافة المستخدم
function closeAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'none';
    document.getElementById('add-user-form').reset();
}

// معالجة نموذج إضافة المستخدم
document.getElementById('add-user-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        role: formData.get('role')
    };
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'فشل في إضافة المستخدم');
        }
        
        window.errorHandler.showSuccess('تم إضافة المستخدم بنجاح');
        closeAddUserModal();
        loadStatistics();
        
        // إعادة تحميل جدول المستخدمين إذا كان مفتوحاً
        const usersSection = document.getElementById('users-table-section');
        if (usersSection.style.display !== 'none') {
            showUsers();
        }
        
    } catch (error) {
        console.error('خطأ في إضافة المستخدم:', error);
        window.errorHandler.showError(error.message, 'error');
    }
});

// تعديل مستخدم
function editUser(userId) {
    window.errorHandler.showInfo('ميزة التعديل قيد التطوير');
}

// حذف مستخدم
async function deleteUser(userId) {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('فشل في حذف المستخدم');
        }
        
        window.errorHandler.showSuccess('تم حذف المستخدم بنجاح');
        loadStatistics();
        showUsers(); // إعادة تحميل الجدول
        
    } catch (error) {
        console.error('خطأ في حذف المستخدم:', error);
        window.errorHandler.showError('فشل في حذف المستخدم', 'error');
    }
}

// إدارة الخطب
function manageSermons() {
    window.location.href = 'sermons.html';
}

// إدارة العلماء
function manageScholars() {
    window.location.href = 'scholars.html';
}

// إدارة الفتاوى
function manageFatwas() {
    window.errorHandler.showInfo('صفحة إدارة الفتاوى قيد التطوير');
}

// إدارة المحاضرات
function manageLectures() {
    window.location.href = 'lectures.html';
}

// إعدادات النظام
function systemSettings() {
    window.errorHandler.showInfo('صفحة إعدادات النظام قيد التطوير');
}

// نسخ احتياطي
function backupData() {
    window.errorHandler.showInfo('ميزة النسخ الاحتياطي قيد التطوير');
}

// عرض السجلات
function viewLogs() {
    window.errorHandler.showInfo('صفحة السجلات قيد التطوير');
}

// تسجيل الخروج
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

// إضافة أنماط CSS للشارات
const style = document.createElement('style');
style.textContent = `
    .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 500;
        color: white;
    }
    
    .badge-primary {
        background-color: #007bff;
    }
    
    .badge-danger {
        background-color: #dc3545;
    }
`;
document.head.appendChild(style);
