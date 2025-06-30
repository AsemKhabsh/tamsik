/**
 * نظام مصادقة مبسط للاختبار
 */

// مستخدمين تجريبيين
const TEST_USERS = {
    'admin@tamsik.com': {
        id: 1,
        username: 'admin',
        name: 'المدير العام',
        email: 'admin@tamsik.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
    },
    'scholar@tamsik.com': {
        id: 2,
        username: 'scholar',
        name: 'الشيخ محمد',
        email: 'scholar@tamsik.com',
        password: 'scholar123',
        role: 'scholar',
        isActive: true
    },
    'member@tamsik.com': {
        id: 3,
        username: 'member',
        name: 'عضو عادي',
        email: 'member@tamsik.com',
        password: 'member123',
        role: 'member',
        isActive: true
    }
};

// دالة تسجيل الدخول
function loginUser(email, password, rememberMe = false) {
    return new Promise((resolve, reject) => {
        // محاكاة تأخير الشبكة
        setTimeout(() => {
            const user = TEST_USERS[email];
            
            if (!user) {
                reject(new Error('البريد الإلكتروني غير مسجل'));
                return;
            }
            
            if (user.password !== password) {
                reject(new Error('كلمة المرور غير صحيحة'));
                return;
            }
            
            if (!user.isActive) {
                reject(new Error('الحساب غير مفعل'));
                return;
            }
            
            // إنشاء جلسة المستخدم
            const sessionExpiry = rememberMe 
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 يوم
                : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة
            
            const userSession = {
                id: user.id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                sessionExpiry: sessionExpiry.toISOString(),
                loginTime: new Date().toISOString()
            };
            
            // حفظ بيانات المستخدم
            localStorage.setItem('currentUser', JSON.stringify(userSession));
            localStorage.setItem('authToken', 'test-token-' + user.id);
            
            resolve(userSession);
        }, 1000);
    });
}

// دالة تسجيل الخروج
function logoutUser() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('returnUrl');
    
    // إشعار باقي علامات التبويب
    localStorage.setItem('logout-event', Date.now());
}

// دالة التحقق من صحة الجلسة
function validateSession() {
    try {
        const userData = localStorage.getItem('currentUser');
        if (!userData) return null;
        
        const user = JSON.parse(userData);
        
        // التحقق من انتهاء صلاحية الجلسة
        if (user.sessionExpiry && new Date() > new Date(user.sessionExpiry)) {
            logoutUser();
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
        logoutUser();
        return null;
    }
}

// دالة إنشاء حساب جديد (مبسطة)
function registerUser(userData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // التحقق من وجود البريد الإلكتروني
            if (TEST_USERS[userData.email]) {
                reject(new Error('البريد الإلكتروني مسجل بالفعل'));
                return;
            }
            
            // إنشاء مستخدم جديد
            const newUser = {
                id: Object.keys(TEST_USERS).length + 1,
                username: userData.username || userData.email.split('@')[0],
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: 'member',
                isActive: true
            };
            
            // إضافة المستخدم للقائمة (في التطبيق الحقيقي سيتم حفظه في قاعدة البيانات)
            TEST_USERS[userData.email] = newUser;
            
            resolve(newUser);
        }, 1000);
    });
}

// دالة إعادة تعيين كلمة المرور
function resetPassword(email) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = TEST_USERS[email];
            
            if (!user) {
                reject(new Error('البريد الإلكتروني غير مسجل'));
                return;
            }
            
            // في التطبيق الحقيقي سيتم إرسال رابط إعادة التعيين
            console.log(`تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}`);
            resolve({ message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });
        }, 1000);
    });
}

// معالج نموذج تسجيل الدخول
function handleLoginForm() {
    const loginForm = document.querySelector('.auth-form');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember')?.checked || false;
        
        // إظهار مؤشر التحميل
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'جاري تسجيل الدخول...';
        submitButton.disabled = true;
        
        try {
            const user = await loginUser(email, password, rememberMe);
            
            // إظهار رسالة نجاح
            showMessage('تم تسجيل الدخول بنجاح!', 'success');
            
            // إعادة التوجيه
            setTimeout(() => {
                const returnUrl = sessionStorage.getItem('returnUrl');
                if (returnUrl) {
                    sessionStorage.removeItem('returnUrl');
                    window.location.href = returnUrl;
                } else {
                    window.location.href = 'index.html';
                }
            }, 1500);
            
        } catch (error) {
            showMessage(error.message, 'error');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

// معالج نموذج التسجيل
function handleRegisterForm() {
    const registerForm = document.querySelector('.auth-form');
    if (!registerForm || !window.location.pathname.includes('register')) return;
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(registerForm);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        // التحقق من تطابق كلمات المرور
        if (userData.password !== userData.confirmPassword) {
            showMessage('كلمات المرور غير متطابقة', 'error');
            return;
        }
        
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'جاري إنشاء الحساب...';
        submitButton.disabled = true;
        
        try {
            await registerUser(userData);
            showMessage('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            showMessage(error.message, 'error');
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}

// دالة إظهار الرسائل
function showMessage(message, type = 'info') {
    // إزالة الرسائل السابقة
    const existingMessages = document.querySelectorAll('.auth-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message auth-message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    const authCard = document.querySelector('.auth-card');
    if (authCard) {
        authCard.insertBefore(messageDiv, authCard.firstChild);
        
        // إزالة الرسالة بعد 5 ثوان
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// دالة إظهار معلومات المستخدمين التجريبيين
function showTestUsers() {
    if (window.location.pathname.includes('login.html')) {
        const authCard = document.querySelector('.auth-card');
        if (authCard) {
            const testUsersDiv = document.createElement('div');
            testUsersDiv.className = 'test-users-info';
            testUsersDiv.innerHTML = `
                <div class="test-users-header">
                    <h4><i class="fas fa-users"></i> حسابات تجريبية للاختبار</h4>
                </div>
                <div class="test-users-list">
                    <div class="test-user">
                        <strong>مدير:</strong> admin@tamsik.com / admin123
                    </div>
                    <div class="test-user">
                        <strong>عالم:</strong> scholar@tamsik.com / scholar123
                    </div>
                    <div class="test-user">
                        <strong>عضو:</strong> member@tamsik.com / member123
                    </div>
                </div>
            `;
            
            authCard.appendChild(testUsersDiv);
        }
    }
}

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التحقق من الجلسة الحالية
    const currentUser = validateSession();
    
    // إذا كان المستخدم مسجل دخول ويحاول الوصول لصفحة تسجيل الدخول
    if (currentUser && window.location.pathname.includes('login.html')) {
        window.location.href = 'index.html';
        return;
    }
    
    // تهيئة النماذج
    handleLoginForm();
    handleRegisterForm();
    
    // إظهار المستخدمين التجريبيين
    showTestUsers();
});

// تصدير الوظائف
window.simpleAuth = {
    loginUser,
    logoutUser,
    validateSession,
    registerUser,
    resetPassword,
    TEST_USERS
};
