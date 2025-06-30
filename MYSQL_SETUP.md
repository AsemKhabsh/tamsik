# 🗄️ دليل تثبيت وإعداد MySQL

## 🪟 تثبيت MySQL على Windows

### 1. تحميل MySQL
1. انتقل إلى [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
2. اختر **MySQL Installer for Windows**
3. حمل النسخة **mysql-installer-web-community**

### 2. تثبيت MySQL
1. شغل ملف التثبيت كمدير
2. اختر **Developer Default** للتثبيت الكامل
3. اتبع خطوات التثبيت
4. في صفحة **Authentication Method**، اختر **Use Strong Password Encryption**
5. قم بتعيين كلمة مرور قوية لمستخدم root
6. في صفحة **Windows Service**، تأكد من تفعيل **Start the MySQL Server at System Startup**

### 3. التحقق من التثبيت
افتح Command Prompt كمدير وشغل:
```cmd
mysql --version
```

### 4. تشغيل MySQL
```cmd
net start mysql80
```

### 5. الاتصال بـ MySQL
```cmd
mysql -u root -p
```
أدخل كلمة المرور التي قمت بتعيينها

---

## 🍎 تثبيت MySQL على macOS

### باستخدام Homebrew (الطريقة المفضلة)
```bash
# تثبيت Homebrew إذا لم يكن مثبتاً
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# تثبيت MySQL
brew install mysql

# تشغيل MySQL
brew services start mysql

# إعداد MySQL (اختياري)
mysql_secure_installation
```

### باستخدام MySQL Installer
1. حمل من [MySQL Downloads](https://dev.mysql.com/downloads/mysql/)
2. اختر **macOS DMG Archive**
3. شغل ملف .dmg واتبع التعليمات

---

## 🐧 تثبيت MySQL على Ubuntu/Debian

```bash
# تحديث قائمة الحزم
sudo apt update

# تثبيت MySQL Server
sudo apt install mysql-server

# تشغيل MySQL
sudo systemctl start mysql

# تفعيل التشغيل التلقائي
sudo systemctl enable mysql

# إعداد MySQL الآمن
sudo mysql_secure_installation
```

---

## ⚙️ إعداد MySQL لمشروع تمسك

### 1. إنشاء مستخدم جديد (اختياري)
```sql
-- الاتصال بـ MySQL كـ root
mysql -u root -p

-- إنشاء مستخدم جديد
CREATE USER 'tamsik_user'@'localhost' IDENTIFIED BY 'strong_password';

-- منح الصلاحيات
GRANT ALL PRIVILEGES ON *.* TO 'tamsik_user'@'localhost';

-- تطبيق التغييرات
FLUSH PRIVILEGES;

-- الخروج
EXIT;
```

### 2. تحديث ملف .env
```env
DB_HOST=localhost
DB_USER=tamsik_user
DB_PASSWORD=strong_password
DB_NAME=tamsik_db
DB_PORT=3306
```

### 3. اختبار الاتصال
```bash
mysql -u tamsik_user -p -e "SELECT VERSION();"
```

---

## 🔧 أوامر MySQL المفيدة

### إدارة الخدمة

#### Windows
```cmd
# تشغيل MySQL
net start mysql80

# إيقاف MySQL
net stop mysql80

# إعادة تشغيل MySQL
net stop mysql80 && net start mysql80
```

#### macOS (Homebrew)
```bash
# تشغيل MySQL
brew services start mysql

# إيقاف MySQL
brew services stop mysql

# إعادة تشغيل MySQL
brew services restart mysql
```

#### Ubuntu/Linux
```bash
# تشغيل MySQL
sudo systemctl start mysql

# إيقاف MySQL
sudo systemctl stop mysql

# إعادة تشغيل MySQL
sudo systemctl restart mysql

# حالة MySQL
sudo systemctl status mysql
```

### إدارة قاعدة البيانات
```sql
-- عرض قواعد البيانات
SHOW DATABASES;

-- إنشاء قاعدة بيانات
CREATE DATABASE tamsik_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- استخدام قاعدة بيانات
USE tamsik_db;

-- عرض الجداول
SHOW TABLES;

-- حذف قاعدة بيانات
DROP DATABASE tamsik_db;
```

---

## ❗ استكشاف الأخطاء الشائعة

### مشكلة: Access denied for user 'root'@'localhost'
```sql
-- إعادة تعيين كلمة مرور root
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### مشكلة: Can't connect to MySQL server
1. تأكد من تشغيل خدمة MySQL
2. تحقق من المنفذ (3306 افتراضياً)
3. تأكد من إعدادات الجدار الناري

### مشكلة: MySQL service won't start
1. تحقق من ملفات السجل
2. تأكد من عدم استخدام المنفذ 3306 من تطبيق آخر
3. أعد تثبيت MySQL إذا لزم الأمر

---

## 🔒 نصائح الأمان

1. **استخدم كلمات مرور قوية**
2. **لا تستخدم مستخدم root للتطبيقات**
3. **قم بتحديث MySQL بانتظام**
4. **فعل SSL للاتصالات الخارجية**
5. **احذف المستخدمين والقواعد غير المستخدمة**

---

## 📚 موارد إضافية

- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Workbench](https://dev.mysql.com/downloads/workbench/) - أداة إدارة رسومية
- [phpMyAdmin](https://www.phpmyadmin.net/) - إدارة عبر الويب

---

**بعد إعداد MySQL بنجاح، يمكنك العودة إلى ملف QUICK_START.md لمتابعة إعداد مشروع تمسك** 🚀
