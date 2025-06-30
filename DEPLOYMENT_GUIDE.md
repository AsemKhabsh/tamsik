# 🚀 دليل النشر - منصة تمسيك

## 📋 متطلبات النشر

### المتطلبات الأساسية
- Node.js 14+ 
- npm 6+
- Git

### للنشر باستخدام Docker
- Docker
- Docker Compose

## 🎯 طرق النشر

### 1. النشر التقليدي
```bash
# تثبيت التبعيات
npm install

# تشغيل التطبيق
npm start
```

### 2. النشر بـ Docker
```bash
# بناء وتشغيل
docker-compose up -d
```

### 3. النشر بـ PM2
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل التطبيق
pm2 start server.js --name "tamsik"
```

## 🔧 إعدادات الإنتاج

### ملف .env
```env
NODE_ENV=production
PORT=3000
DB_TYPE=sqlite
JWT_SECRET=your_secure_secret
```

### إعداد Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3000;
    }
}
```

## 📊 المراقبة
```bash
# PM2
pm2 monit
pm2 logs tamsik

# Docker
docker-compose logs -f
```

## 🔒 الأمان
- تحديث JWT_SECRET
- إعداد SSL
- فتح Firewall للمنافذ 80, 443

## 📈 النسخ الاحتياطي

### إنشاء سكريبت النسخ الاحتياطي
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/tamsik"

# إنشاء مجلد النسخ الاحتياطي
mkdir -p $BACKUP_DIR

# نسخ قاعدة البيانات
cp data/tamsik.db $BACKUP_DIR/tamsik_$DATE.db

# نسخ الملفات المرفوعة
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz uploads/

# حذف النسخ الاحتياطية القديمة (أكثر من 7 أيام)
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

### جدولة النسخ الاحتياطي
```bash
# إضافة إلى crontab
crontab -e

# نسخ احتياطي يومي في الساعة 2 صباحاً
0 2 * * * /path/to/backup.sh
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. مشكلة المنفذ مشغول
```bash
# البحث عن العمليات التي تستخدم المنفذ 3000
lsof -i :3000

# إنهاء العملية
kill -9 PID
```

#### 2. مشكلة قاعدة البيانات
```bash
# إعادة إنشاء قاعدة البيانات
node config/sqlite-setup.js

# فحص الاتصال
node -e "require('./config/database-adapter').testConnection()"
```

#### 3. مشكلة الذاكرة
```bash
# زيادة ذاكرة Node.js
export NODE_OPTIONS="--max-old-space-size=2048"
```

## 📞 الدعم

في حالة مواجهة أي مشاكل:

1. **تحقق من السجلات**: `pm2 logs` أو `docker-compose logs`
2. **فحص حالة الخدمات**: `pm2 status` أو `docker-compose ps`
3. **اختبار الاتصال**: `curl http://localhost:3000/api/health`
4. **مراجعة الإعدادات**: تحقق من ملف `.env`

---

**تمسيك** - منصة إسلامية شاملة 