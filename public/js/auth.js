// نظام المستخدمين والمصادقة

// بيانات المستخدمين التجريبية
const defaultUsers = [
    {
        id: 1,
        name: "أحمد الحكيمي",
        email: "ahmed@example.com",
        password: "123456",
        role: "admin",
        joinDate: "2024-01-15",
        isActive: true,
        profile: {
            bio: "مدير الموقع",
            specialization: "إدارة المحتوى",
            location: "صنعاء"
        }
    },
    {
        id: 2,
        name: "د. عبد الله الحكيمي",
        email: "hakimi@example.com",
        password: "123456",
        role: "scholar",
        joinDate: "2024-02-01",
        isActive: true,
        profile: {
            bio: "دكتور في الشريعة الإسلامية",
            specialization: "الفقه والأصول",
            location: "صنعاء"
        }
    },
    {
        id: 3,
        name: "د. فاطمة الحضرمية",
        email: "fatima@example.com",
        password: "123456",
        role: "scholar",
        joinDate: "2024-03-10",
        isActive: true,
        profile: {
            bio: "باحثة في العلوم الشرعية",
            specialization: "التفسير والحديث",
            location: "حضرموت"
        }
    },
    {
        id: 4,
        name: "محمد الزبيدي",
        email: "zubaidi@example.com",
        password: "123456",
        role: "member",
        joinDate: "2024-04-05",
        isActive: true,
        profile: {
            bio: "طالب علم شرعي",
            specialization: "الدعوة والإرشاد",
            location: "عدن"
        }
    },
    {
        id: 5,
        name: "الشيخ أحمد الشامي",
        email: "shami@example.com",
        password: "123456",
        role: "scholar",
        joinDate: "2024-05-01",
        isActive: true,
        profile: {
            bio: "عالم وداعية",
            specialization: "السيرة النبوية والدعوة",
            location: "تعز"
        }
    },
    {
        id: 6,
        name: "الشيخ يحيى الذماري",
        email: "dhamari@example.com",
        password: "123456",
        role: "scholar",
        joinDate: "2024-06-01",
        isActive: true,
        profile: {
            bio: "عالم في علوم القرآن",
            specialization: "علوم القرآن والتفسير",
            location: "ذمار"
        }
    }
];

// تهيئة نظام المستخدمين
function initializeUserSystem() {
    // التحقق من وجود المستخدمين في التخزين المحلي
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) {
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }
}

// تسجيل الدخول
function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password && u.isActive);

    if (user) {
        // حفظ بيانات المستخدم الحالي
        const currentUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // تحديث آخر تسجيل دخول
        user.lastLogin = new Date().toISOString();
        const userIndex = users.findIndex(u => u.id === user.id);
        users[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(users));

        return { success: true, user: currentUser };
    } else {
        return { success: false, message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
    }
}

// تسجيل مستخدم جديد
function registerUser(userData) {
    const users = JSON.parse(localStorage.getItem('users')) || [];

    // التحقق من عدم وجود المستخدم مسبقاً
    const existingUser = users.find(u => u.email === userData.email);
    if (existingUser) {
        return { success: false, message: 'البريد الإلكتروني مستخدم بالفعل' };
    }

    // إنشاء مستخدم جديد
    const newUser = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'member',
        joinDate: new Date().toISOString(),
        isActive: true,
        profile: {
            bio: userData.bio || '',
            specialization: userData.specialization || '',
            location: userData.location || ''
        }
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, user: newUser };
}

// تسجيل الخروج
function logoutUser() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// الحصول على المستخدم الحالي
function getCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

// التحقق من صلاحيات المستخدم
function hasPermission(requiredRole) {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const roleHierarchy = {
        'admin': 4,
        'scholar': 3,
        'member': 2,
        'guest': 1
    };

    const userLevel = roleHierarchy[currentUser.role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
}

// تحديث ملف المستخدم
function updateUserProfile(profileData) {
    const currentUser = getCurrentUser();
    if (!currentUser) return { success: false, message: 'يجب تسجيل الدخول أولاً' };

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex === -1) {
        return { success: false, message: 'المستخدم غير موجود' };
    }

    // تحديث البيانات
    users[userIndex] = { ...users[userIndex], ...profileData };
    localStorage.setItem('users', JSON.stringify(users));

    // تحديث المستخدم الحالي
    const updatedCurrentUser = { ...currentUser, ...profileData };
    localStorage.setItem('currentUser', JSON.stringify(updatedCurrentUser));

    return { success: true, user: updatedCurrentUser };
}

// الحصول على جميع المستخدمين (للمدراء فقط)
function getAllUsers() {
    if (!hasPermission('admin')) {
        return { success: false, message: 'ليس لديك صلاحية للوصول لهذه البيانات' };
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    return { success: true, users: users };
}

// تفعيل/إلغاء تفعيل المستخدم
function toggleUserStatus(userId) {
    if (!hasPermission('admin')) {
        return { success: false, message: 'ليس لديك صلاحية لهذا الإجراء' };
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'المستخدم غير موجود' };
    }

    users[userIndex].isActive = !users[userIndex].isActive;
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, user: users[userIndex] };
}

// تغيير دور المستخدم
function changeUserRole(userId, newRole) {
    if (!hasPermission('admin')) {
        return { success: false, message: 'ليس لديك صلاحية لهذا الإجراء' };
    }

    const validRoles = ['admin', 'scholar', 'member', 'guest'];
    if (!validRoles.includes(newRole)) {
        return { success: false, message: 'دور المستخدم غير صحيح' };
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) {
        return { success: false, message: 'المستخدم غير موجود' };
    }

    users[userIndex].role = newRole;
    localStorage.setItem('users', JSON.stringify(users));

    return { success: true, user: users[userIndex] };
}

// تحديث شريط التنقل حسب حالة المستخدم
function updateNavigation() {
    const currentUser = getCurrentUser();
    const navLinks = document.querySelector('.nav-links');

    if (!navLinks) return;

    // إزالة روابط تسجيل الدخول/التسجيل إذا كان المستخدم مسجل الدخول
    const loginLink = navLinks.querySelector('a[href="login.html"]');
    const registerLink = navLinks.querySelector('a[href="register.html"]');

    if (currentUser) {
        // إخفاء روابط تسجيل الدخول والتسجيل
        if (loginLink) loginLink.parentElement.style.display = 'none';
        if (registerLink) registerLink.parentElement.style.display = 'none';

        // إضافة رابط الملف الشخصي وتسجيل الخروج
        const profileHTML = `
            <li class="user-menu">
                <a href="#" class="user-profile">
                    <i class="fas fa-user"></i> ${currentUser.name}
                </a>
                <ul class="dropdown-menu">
                    <li><a href="profile.html"><i class="fas fa-user-edit"></i> الملف الشخصي</a></li>
                    ${currentUser.role === 'admin' ? '<li><a href="admin.html"><i class="fas fa-cog"></i> لوحة الإدارة</a></li>' : ''}
                    <li><a href="#" onclick="logoutUser()"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</a></li>
                </ul>
            </li>
        `;

        // التحقق من عدم وجود القائمة مسبقاً
        if (!navLinks.querySelector('.user-menu')) {
            navLinks.insertAdjacentHTML('beforeend', profileHTML);
        }
    } else {
        // إظهار روابط تسجيل الدخول والتسجيل
        if (loginLink) loginLink.parentElement.style.display = 'block';
        if (registerLink) registerLink.parentElement.style.display = 'block';

        // إزالة قائمة المستخدم
        const userMenu = navLinks.querySelector('.user-menu');
        if (userMenu) userMenu.remove();
    }
}

// تهيئة نظام المصادقة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    initializeUserSystem();
    updateNavigation();

    // إضافة مستمع أحداث لنموذج تسجيل الدخول
    const loginForm = document.querySelector('.auth-form');
    if (loginForm && window.location.pathname.includes('login.html')) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // إضافة مستمع أحداث لنموذج التسجيل
    const registerForm = document.querySelector('.auth-form');
    if (registerForm && window.location.pathname.includes('register.html')) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// معالجة تسجيل الدخول
function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('يرجى ملء جميع الحقول');
        return;
    }

    const result = loginUser(email, password);

    if (result.success) {
        alert(`مرحباً ${result.user.name}! تم تسجيل الدخول بنجاح`);
        window.location.href = 'index.html';
    } else {
        alert(result.message);
    }
}

// معالجة التسجيل
function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const role = document.getElementById('role') ? document.getElementById('role').value : 'member';

    if (!name || !email || !password || !confirmPassword) {
        alert('يرجى ملء جميع الحقول');
        return;
    }

    if (password !== confirmPassword) {
        alert('كلمة المرور وتأكيد كلمة المرور غير متطابقتين');
        return;
    }

    if (password.length < 6) {
        alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }

    const userData = { name, email, password, role };
    const result = registerUser(userData);

    if (result.success) {
        alert('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول');
        window.location.href = 'login.html';
    } else {
        alert(result.message);
    }
}

// تصدير الوظائف للاستخدام في ملفات أخرى
window.authSystem = {
    loginUser,
    registerUser,
    logoutUser,
    getCurrentUser,
    hasPermission,
    updateUserProfile,
    getAllUsers,
    toggleUserStatus,
    changeUserRole,
    updateNavigation
};
