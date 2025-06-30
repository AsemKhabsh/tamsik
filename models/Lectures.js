/**
 * نموذج المحاضرات والدروس
 * يدير جدول المحاضرات والدروس الدورية في قاعدة البيانات
 */

const { pool } = require('../config/database-adapter');

class Lectures {
    /**
     * إنشاء جدول المحاضرات
     */
    static async createTable() {
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS lectures (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(255) NOT NULL,
                lecturer_name VARCHAR(255) NOT NULL,
                type ENUM('محاضرة', 'درس', 'ندوة', 'دورة') NOT NULL DEFAULT 'محاضرة',
                province VARCHAR(100) NOT NULL,
                city VARCHAR(100),
                location VARCHAR(255) NOT NULL,
                day_of_week ENUM('السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة') NOT NULL,
                time TIME NOT NULL,
                description TEXT,
                contact_info VARCHAR(255),
                is_active BOOLEAN DEFAULT 1,
                is_recurring BOOLEAN DEFAULT 1,
                start_date DATE,
                end_date DATE,
                created_by INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )
        `;

        try {
            await pool.execute(createTableQuery);
            console.log('✅ تم إنشاء جدول المحاضرات بنجاح');
        } catch (error) {
            console.error('❌ خطأ في إنشاء جدول المحاضرات:', error);
            throw error;
        }
    }

    /**
     * إضافة محاضرة جديدة
     */
    static async create(lectureData) {
        const {
            title,
            lecturer_name,
            type,
            province,
            city,
            location,
            day_of_week,
            time,
            description,
            contact_info,
            start_date,
            end_date,
            created_by
        } = lectureData;

        const insertQuery = `
            INSERT INTO lectures (
                title, lecturer_name, type, province, city, location, 
                day_of_week, time, description, contact_info, 
                start_date, end_date, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            const [result] = await pool.execute(insertQuery, [
                title, lecturer_name, type, province, city, location,
                day_of_week, time, description, contact_info,
                start_date, end_date, created_by
            ]);

            return {
                success: true,
                data: {
                    id: result.insertId,
                    ...lectureData
                }
            };
        } catch (error) {
            console.error('خطأ في إضافة المحاضرة:', error);
            return {
                success: false,
                message: 'فشل في إضافة المحاضرة'
            };
        }
    }

    /**
     * الحصول على جميع المحاضرات مع الفلترة
     */
    static async getAll(filters = {}) {
        let query = `
            SELECT 
                id, title, lecturer_name, type, province, city, location,
                day_of_week, time, description, contact_info, is_active,
                start_date, end_date, created_at
            FROM lectures 
            WHERE is_active = 1
        `;
        
        const params = [];

        // تطبيق الفلاتر
        if (filters.province) {
            query += ' AND province = ?';
            params.push(filters.province);
        }

        if (filters.day_of_week) {
            query += ' AND day_of_week = ?';
            params.push(filters.day_of_week);
        }

        if (filters.type) {
            query += ' AND type = ?';
            params.push(filters.type);
        }

        if (filters.search) {
            query += ' AND (title LIKE ? OR lecturer_name LIKE ? OR location LIKE ?)';
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // ترتيب النتائج
        query += ' ORDER BY day_of_week, time';

        // الترقيم
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
            
            if (filters.offset) {
                query += ' OFFSET ?';
                params.push(parseInt(filters.offset));
            }
        }

        try {
            const [rows] = await pool.execute(query, params);
            return {
                success: true,
                data: rows
            };
        } catch (error) {
            console.error('خطأ في جلب المحاضرات:', error);
            return {
                success: false,
                message: 'فشل في جلب المحاضرات'
            };
        }
    }

    /**
     * الحصول على محاضرة بالمعرف
     */
    static async getById(id) {
        const query = `
            SELECT * FROM lectures 
            WHERE id = ? AND is_active = 1
        `;

        try {
            const [rows] = await pool.execute(query, [id]);
            
            if (rows.length === 0) {
                return {
                    success: false,
                    message: 'المحاضرة غير موجودة'
                };
            }

            return {
                success: true,
                data: rows[0]
            };
        } catch (error) {
            console.error('خطأ في جلب المحاضرة:', error);
            return {
                success: false,
                message: 'فشل في جلب المحاضرة'
            };
        }
    }

    /**
     * تحديث محاضرة
     */
    static async update(id, updateData) {
        const allowedFields = [
            'title', 'lecturer_name', 'type', 'province', 'city', 'location',
            'day_of_week', 'time', 'description', 'contact_info', 'start_date', 'end_date'
        ];

        const updateFields = [];
        const params = [];

        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key) && updateData[key] !== undefined) {
                updateFields.push(`${key} = ?`);
                params.push(updateData[key]);
            }
        });

        if (updateFields.length === 0) {
            return {
                success: false,
                message: 'لا توجد بيانات للتحديث'
            };
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        const query = `
            UPDATE lectures 
            SET ${updateFields.join(', ')} 
            WHERE id = ? AND is_active = 1
        `;

        try {
            const [result] = await pool.execute(query, params);
            
            if (result.affectedRows === 0) {
                return {
                    success: false,
                    message: 'المحاضرة غير موجودة'
                };
            }

            return {
                success: true,
                message: 'تم تحديث المحاضرة بنجاح'
            };
        } catch (error) {
            console.error('خطأ في تحديث المحاضرة:', error);
            return {
                success: false,
                message: 'فشل في تحديث المحاضرة'
            };
        }
    }

    /**
     * حذف محاضرة (حذف منطقي)
     */
    static async delete(id) {
        const query = `
            UPDATE lectures 
            SET is_active = 0, updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
        `;

        try {
            const [result] = await pool.execute(query, [id]);
            
            if (result.affectedRows === 0) {
                return {
                    success: false,
                    message: 'المحاضرة غير موجودة'
                };
            }

            return {
                success: true,
                message: 'تم حذف المحاضرة بنجاح'
            };
        } catch (error) {
            console.error('خطأ في حذف المحاضرة:', error);
            return {
                success: false,
                message: 'فشل في حذف المحاضرة'
            };
        }
    }

    /**
     * الحصول على إحصائيات المحاضرات
     */
    static async getStats() {
        const queries = {
            total: 'SELECT COUNT(*) as count FROM lectures WHERE is_active = 1',
            byProvince: 'SELECT province, COUNT(*) as count FROM lectures WHERE is_active = 1 GROUP BY province',
            byType: 'SELECT type, COUNT(*) as count FROM lectures WHERE is_active = 1 GROUP BY type',
            byDay: 'SELECT day_of_week, COUNT(*) as count FROM lectures WHERE is_active = 1 GROUP BY day_of_week'
        };

        try {
            const [totalResult] = await pool.execute(queries.total);
            const [provinceResult] = await pool.execute(queries.byProvince);
            const [typeResult] = await pool.execute(queries.byType);
            const [dayResult] = await pool.execute(queries.byDay);

            return {
                success: true,
                data: {
                    total: totalResult[0].count,
                    byProvince: provinceResult,
                    byType: typeResult,
                    byDay: dayResult
                }
            };
        } catch (error) {
            console.error('خطأ في جلب إحصائيات المحاضرات:', error);
            return {
                success: false,
                message: 'فشل في جلب الإحصائيات'
            };
        }
    }
}

module.exports = Lectures;
