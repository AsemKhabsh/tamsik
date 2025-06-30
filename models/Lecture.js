const { pool } = require('../config/database-adapter');

class Lecture {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.title = data.title;
        this.lecturer_name = data.lecturer_name;
        this.type = data.type;
        this.province = data.province;
        this.location = data.location;
        this.day_of_week = data.day_of_week;
        this.time = data.time;
        this.description = data.description;
        this.contact_info = data.contact_info;
        this.is_recurring = data.is_recurring;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // بيانات إضافية
        this.user_name = data.user_name;
    }

    // إنشاء محاضرة جديدة
    static async create(lectureData) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO lectures (user_id, title, lecturer_name, type, province, location, 
                 day_of_week, time, description, contact_info, is_recurring, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    lectureData.user_id || null,
                    lectureData.title,
                    lectureData.lecturer_name,
                    lectureData.type,
                    lectureData.province,
                    lectureData.location,
                    lectureData.day_of_week,
                    lectureData.time,
                    lectureData.description || null,
                    lectureData.contact_info || null,
                    lectureData.is_recurring !== undefined ? lectureData.is_recurring : true,
                    lectureData.is_active !== undefined ? lectureData.is_active : true
                ]
            );

            return await Lecture.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن محاضرة بالمعرف
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT l.*, u.full_name as user_name 
                 FROM lectures l 
                 LEFT JOIN users u ON l.user_id = u.id 
                 WHERE l.id = ?`,
                [id]
            );

            if (rows.length === 0) {
                return null;
            }

            return new Lecture(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع المحاضرات مع التصفية والترقيم
    static async findAll(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                province, 
                day_of_week, 
                type, 
                active, 
                search,
                sort = 'province'
            } = options;
            
            const offset = (page - 1) * limit;

            let query = `SELECT l.*, u.full_name as user_name 
                        FROM lectures l 
                        LEFT JOIN users u ON l.user_id = u.id 
                        WHERE 1=1`;
            
            let countQuery = 'SELECT COUNT(*) as total FROM lectures l WHERE 1=1';
            const params = [];

            if (province) {
                query += ' AND l.province = ?';
                countQuery += ' AND l.province = ?';
                params.push(province);
            }

            if (day_of_week) {
                query += ' AND l.day_of_week = ?';
                countQuery += ' AND l.day_of_week = ?';
                params.push(day_of_week);
            }

            if (type) {
                query += ' AND l.type = ?';
                countQuery += ' AND l.type = ?';
                params.push(type);
            }

            if (active !== undefined) {
                query += ' AND l.is_active = ?';
                countQuery += ' AND l.is_active = ?';
                params.push(active);
            }

            if (search) {
                query += ' AND (l.title LIKE ? OR l.lecturer_name LIKE ? OR l.location LIKE ?)';
                countQuery += ' AND (l.title LIKE ? OR l.lecturer_name LIKE ? OR l.location LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // ترتيب النتائج (SQLite compatible)
            switch (sort) {
                case 'lecturer':
                    query += ' ORDER BY l.lecturer_name ASC';
                    break;
                case 'location':
                    query += ' ORDER BY l.location ASC';
                    break;
                case 'day':
                    query += ' ORDER BY CASE l.day_of_week WHEN "السبت" THEN 1 WHEN "الأحد" THEN 2 WHEN "الاثنين" THEN 3 WHEN "الثلاثاء" THEN 4 WHEN "الأربعاء" THEN 5 WHEN "الخميس" THEN 6 WHEN "الجمعة" THEN 7 END';
                    break;
                case 'time':
                    query += ' ORDER BY l.time ASC';
                    break;
                case 'type':
                    query += ' ORDER BY l.type ASC';
                    break;
                default: // province
                    query += ' ORDER BY l.province ASC, l.day_of_week ASC, l.time ASC';
            }

            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            const lectures = rows.map(row => new Lecture(row));
            const total = countResult[0].total;

            return {
                lectures,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // الحصول على المحاضرات حسب المحافظة
    static async findByProvince(province, options = {}) {
        try {
            const { limit = 50, active = true } = options;

            const [rows] = await pool.execute(
                `SELECT l.*, u.full_name as user_name 
                 FROM lectures l 
                 LEFT JOIN users u ON l.user_id = u.id 
                 WHERE l.province = ? AND l.is_active = ? 
                 ORDER BY CASE l.day_of_week WHEN "السبت" THEN 1 WHEN "الأحد" THEN 2 WHEN "الاثنين" THEN 3 WHEN "الثلاثاء" THEN 4 WHEN "الأربعاء" THEN 5 WHEN "الخميس" THEN 6 WHEN "الجمعة" THEN 7 END, l.time ASC
                 LIMIT ?`,
                [province, active, limit]
            );

            return rows.map(row => new Lecture(row));
        } catch (error) {
            throw error;
        }
    }

    // الحصول على المحاضرات حسب اليوم
    static async findByDay(day, options = {}) {
        try {
            const { limit = 50, active = true } = options;

            const [rows] = await pool.execute(
                `SELECT l.*, u.full_name as user_name 
                 FROM lectures l 
                 LEFT JOIN users u ON l.user_id = u.id 
                 WHERE l.day_of_week = ? AND l.is_active = ? 
                 ORDER BY l.province ASC, l.time ASC 
                 LIMIT ?`,
                [day, active, limit]
            );

            return rows.map(row => new Lecture(row));
        } catch (error) {
            throw error;
        }
    }

    // الحصول على إحصائيات المحاضرات
    static async getStats() {
        try {
            const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM lectures');
            const [activeResult] = await pool.execute('SELECT COUNT(*) as active FROM lectures WHERE is_active = true');
            const [provinceResult] = await pool.execute('SELECT province, COUNT(*) as count FROM lectures WHERE is_active = true GROUP BY province ORDER BY count DESC');
            const [typeResult] = await pool.execute('SELECT type, COUNT(*) as count FROM lectures WHERE is_active = true GROUP BY type ORDER BY count DESC');

            return {
                total: totalResult[0].total,
                active: activeResult[0].active,
                by_province: provinceResult,
                by_type: typeResult
            };
        } catch (error) {
            throw error;
        }
    }

    // تحديث بيانات المحاضرة
    async update(updateData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(updateData[key]);
                }
            });

            if (fields.length === 0) {
                return this;
            }

            values.push(this.id);

            await pool.execute(
                `UPDATE lectures SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // إعادة تحميل البيانات
            const updatedLecture = await Lecture.findById(this.id);
            Object.assign(this, updatedLecture);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // حذف المحاضرة
    async delete() {
        try {
            await pool.execute(
                'DELETE FROM lectures WHERE id = ?',
                [this.id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    // البحث في المحاضرات
    static async search(searchTerm, options = {}) {
        try {
            const { page = 1, limit = 10, province, type } = options;
            const offset = (page - 1) * limit;

            let query = `SELECT l.*, u.full_name as user_name 
                        FROM lectures l 
                        LEFT JOIN users u ON l.user_id = u.id 
                        WHERE l.is_active = true AND (l.title LIKE ? OR l.lecturer_name LIKE ? OR l.location LIKE ?)`;
            
            const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

            if (province) {
                query += ' AND l.province = ?';
                params.push(province);
            }

            if (type) {
                query += ' AND l.type = ?';
                params.push(type);
            }

            query += ' ORDER BY l.province ASC, l.day_of_week ASC, l.time ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);

            return rows.map(row => new Lecture(row));
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع المحافظات المتاحة
    static async getProvinces() {
        try {
            const [rows] = await pool.execute(
                'SELECT DISTINCT province FROM lectures WHERE is_active = true ORDER BY province ASC'
            );

            return rows.map(row => row.province);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Lecture;
