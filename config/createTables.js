const { pool } = require('./database');

// SQL لإنشاء جدول المستخدمين
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'scholar', 'user') DEFAULT 'user',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires DATETIME,
    profile_image VARCHAR(255),
    bio TEXT,
    phone VARCHAR(20),
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول التصنيفات
const createCategoriesTable = `
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    type ENUM('sermon', 'fatwa', 'lecture', 'article') NOT NULL,
    parent_id INT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول العلماء
const createScholarsTable = `
CREATE TABLE IF NOT EXISTS scholars (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200),
    bio TEXT,
    specialization VARCHAR(200),
    location VARCHAR(100),
    image VARCHAR(255),
    education TEXT,
    experience TEXT,
    contact_info JSON,
    social_links JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    fatwa_count INT DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول الفتاوى
const createFatwasTable = `
CREATE TABLE IF NOT EXISTS fatwas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scholar_id INT NOT NULL,
    category_id INT,
    title VARCHAR(500) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    questioner_name VARCHAR(100),
    questioner_email VARCHAR(100),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    tags JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (scholar_id) REFERENCES scholars(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول الخطب
const createSermonsTable = `
CREATE TABLE IF NOT EXISTS sermons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    category_id INT,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    author VARCHAR(100),
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    is_featured BOOLEAN DEFAULT FALSE,
    views_count INT DEFAULT 0,
    downloads_count INT DEFAULT 0,
    likes_count INT DEFAULT 0,
    tags JSON,
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول المحاضرات
const createLecturesTable = `
CREATE TABLE IF NOT EXISTS lectures (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(500) NOT NULL,
    lecturer_name VARCHAR(100) NOT NULL,
    type ENUM('محاضرة', 'درس', 'ندوة', 'دورة') NOT NULL,
    province VARCHAR(50) NOT NULL,
    location VARCHAR(200) NOT NULL,
    day_of_week ENUM('السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة') NOT NULL,
    time TIME NOT NULL,
    description TEXT,
    contact_info VARCHAR(200),
    is_recurring BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول المفكرين والدعاة
const createThinkersTable = `
CREATE TABLE IF NOT EXISTS thinkers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(100) NOT NULL,
    title VARCHAR(200),
    bio TEXT,
    specialization VARCHAR(200),
    location VARCHAR(100),
    image VARCHAR(255),
    birth_date DATE,
    death_date DATE,
    education TEXT,
    works TEXT,
    achievements TEXT,
    quotes JSON,
    books JSON,
    social_links JSON,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول مشتركي النشرة البريدية
const createNewsletterTable = `
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    verification_token VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول الأسئلة
const createQuestionsTable = `
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    category_id INT,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    questioner_name VARCHAR(100),
    questioner_email VARCHAR(100),
    status ENUM('pending', 'answered', 'rejected') DEFAULT 'pending',
    assigned_scholar_id INT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_scholar_id) REFERENCES scholars(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول اقتراحات الآيات القرآنية
const createVersesSuggestionsTable = `
CREATE TABLE IF NOT EXISTS verses_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    verse_text TEXT NOT NULL,
    surah_name VARCHAR(100),
    verse_number INT,
    context_type ENUM('إخبار', 'أمر', 'وعد', 'عام') DEFAULT 'عام',
    topic VARCHAR(200),
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_topic (topic),
    INDEX idx_context_type (context_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول اقتراحات الأحاديث
const createHadithSuggestionsTable = `
CREATE TABLE IF NOT EXISTS hadith_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    hadith_text TEXT NOT NULL,
    narrator VARCHAR(100),
    source VARCHAR(100),
    authentication VARCHAR(100),
    context_type ENUM('إخبار', 'أمر', 'وعد', 'عام') DEFAULT 'عام',
    topic VARCHAR(200),
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_topic (topic),
    INDEX idx_context_type (context_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول اقتراحات الأثار
const createAtharSuggestionsTable = `
CREATE TABLE IF NOT EXISTS athar_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    athar_text TEXT NOT NULL,
    speaker VARCHAR(100),
    context_type ENUM('إخبار', 'قصة', 'عام') DEFAULT 'عام',
    topic VARCHAR(200),
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_topic (topic),
    INDEX idx_context_type (context_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول اقتراحات السجع
const createSajaSuggestionsTable = `
CREATE TABLE IF NOT EXISTS saja_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    saja_text TEXT NOT NULL,
    topic VARCHAR(200),
    rhyme VARCHAR(50),
    attribution VARCHAR(100),
    reference VARCHAR(200),
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_topic (topic),
    INDEX idx_rhyme (rhyme)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول اقتراحات الشعر
const createPoetrySuggestionsTable = `
CREATE TABLE IF NOT EXISTS poetry_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    poetry_text TEXT NOT NULL,
    topic VARCHAR(200),
    rhyme VARCHAR(50),
    meter VARCHAR(50),
    poet VARCHAR(100),
    reference VARCHAR(200),
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_topic (topic),
    INDEX idx_rhyme (rhyme),
    INDEX idx_poet (poet)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// SQL لإنشاء جدول اقتراحات الدعاء
const createDuaSuggestionsTable = `
CREATE TABLE IF NOT EXISTS dua_suggestions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    dua_text TEXT NOT NULL,
    dua_type ENUM('ثناء', 'دعاء قرآني', 'دعاء نبوي', 'دعاء للإسلام والمسلمين', 'دعاء لردع الظالمين', 'دعاء إضافي', 'استسقاء') NOT NULL,
    topic VARCHAR(200),
    source VARCHAR(200),
    usage_count INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_dua_type (dua_type),
    INDEX idx_topic (topic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

module.exports = {
    createUsersTable,
    createCategoriesTable,
    createScholarsTable,
    createFatwasTable,
    createSermonsTable,
    createLecturesTable,
    createThinkersTable,
    createNewsletterTable,
    createQuestionsTable,
    createVersesSuggestionsTable,
    createHadithSuggestionsTable,
    createAtharSuggestionsTable,
    createSajaSuggestionsTable,
    createPoetrySuggestionsTable,
    createDuaSuggestionsTable
};
