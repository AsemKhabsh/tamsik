const { pool } = require('../config/database-adapter');

class Fatwa {
    constructor(data) {
        this.id = data.id;
        this.scholar_id = data.scholar_id;
        this.category_id = data.category_id;
        this.title = data.title;
        this.question = data.question;
        this.answer = data.answer;
        this.questioner_name = data.questioner_name;
        this.questioner_email = data.questioner_email;
        this.status = data.status;
        this.is_featured = data.is_featured;
        this.views_count = data.views_count;
        this.likes_count = data.likes_count;
        this.tags = data.tags;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // بيانات إضافية من الجداول المرتبطة
        this.scholar_name = data.scholar_name;
        this.category_name = data.category_name;
    }

    // إنشاء فتوى جديدة
    static async create(fatwaData) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO fatwas (scholar_id, category_id, title, question, answer, 
                 questioner_name, questioner_email, status, is_featured, tags) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    fatwaData.scholar_id,
                    fatwaData.category_id || null,
                    fatwaData.title,
                    fatwaData.question,
                    fatwaData.answer || null,
                    fatwaData.questioner_name || null,
                    fatwaData.questioner_email || null,
                    fatwaData.status || 'pending',
                    fatwaData.is_featured || false,
                    JSON.stringify(fatwaData.tags || [])
                ]
            );

            return await Fatwa.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن فتوى بالمعرف
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT f.*, s.name as scholar_name, c.name as category_name 
                 FROM fatwas f 
                 LEFT JOIN scholars s ON f.scholar_id = s.id 
                 LEFT JOIN categories c ON f.category_id = c.id 
                 WHERE f.id = ?`,
                [id]
            );

            if (rows.length === 0) {
                return null;
            }

            const fatwa = rows[0];
            if (fatwa.tags) {
                fatwa.tags = JSON.parse(fatwa.tags);
            }

            return new Fatwa(fatwa);
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع الفتاوى مع التصفية والترقيم
    static async findAll(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status, 
                category_id, 
                scholar_id, 
                featured, 
                search,
                sort = 'newest'
            } = options;
            
            const offset = (page - 1) * limit;

            let query = `SELECT f.*, s.name as scholar_name, c.name as category_name 
                        FROM fatwas f 
                        LEFT JOIN scholars s ON f.scholar_id = s.id 
                        LEFT JOIN categories c ON f.category_id = c.id 
                        WHERE 1=1`;
            
            let countQuery = 'SELECT COUNT(*) as total FROM fatwas f WHERE 1=1';
            const params = [];

            if (status) {
                query += ' AND f.status = ?';
                countQuery += ' AND f.status = ?';
                params.push(status);
            }

            if (category_id) {
                query += ' AND f.category_id = ?';
                countQuery += ' AND f.category_id = ?';
                params.push(category_id);
            }

            if (scholar_id) {
                query += ' AND f.scholar_id = ?';
                countQuery += ' AND f.scholar_id = ?';
                params.push(scholar_id);
            }

            if (featured !== undefined) {
                query += ' AND f.is_featured = ?';
                countQuery += ' AND f.is_featured = ?';
                params.push(featured);
            }

            if (search) {
                query += ' AND (f.title LIKE ? OR f.question LIKE ? OR f.answer LIKE ?)';
                countQuery += ' AND (f.title LIKE ? OR f.question LIKE ? OR f.answer LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // ترتيب النتائج
            switch (sort) {
                case 'oldest':
                    query += ' ORDER BY f.created_at ASC';
                    break;
                case 'most-viewed':
                    query += ' ORDER BY f.views_count DESC';
                    break;
                case 'most-liked':
                    query += ' ORDER BY f.likes_count DESC';
                    break;
                default: // newest
                    query += ' ORDER BY f.created_at DESC';
            }

            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            const fatwas = rows.map(row => {
                if (row.tags) {
                    row.tags = JSON.parse(row.tags);
                }
                return new Fatwa(row);
            });

            const total = countResult[0].total;

            return {
                fatwas,
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

    // الحصول على الفتاوى المميزة
    static async getFeatured(limit = 6) {
        try {
            const [rows] = await pool.execute(
                `SELECT f.*, s.name as scholar_name, c.name as category_name 
                 FROM fatwas f 
                 LEFT JOIN scholars s ON f.scholar_id = s.id 
                 LEFT JOIN categories c ON f.category_id = c.id 
                 WHERE f.is_featured = true AND f.status = 'approved' 
                 ORDER BY f.views_count DESC LIMIT ?`,
                [limit]
            );

            return rows.map(row => {
                if (row.tags) {
                    row.tags = JSON.parse(row.tags);
                }
                return new Fatwa(row);
            });
        } catch (error) {
            throw error;
        }
    }

    // تحديث بيانات الفتوى
    async update(updateData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && key !== 'id') {
                    if (key === 'tags') {
                        fields.push(`${key} = ?`);
                        values.push(JSON.stringify(updateData[key]));
                    } else {
                        fields.push(`${key} = ?`);
                        values.push(updateData[key]);
                    }
                }
            });

            if (fields.length === 0) {
                return this;
            }

            values.push(this.id);

            await pool.execute(
                `UPDATE fatwas SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // إعادة تحميل البيانات
            const updatedFatwa = await Fatwa.findById(this.id);
            Object.assign(this, updatedFatwa);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // حذف الفتوى
    async delete() {
        try {
            await pool.execute(
                'DELETE FROM fatwas WHERE id = ?',
                [this.id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    // زيادة عدد المشاهدات
    async incrementViews() {
        try {
            await pool.execute(
                'UPDATE fatwas SET views_count = views_count + 1 WHERE id = ?',
                [this.id]
            );
            this.views_count += 1;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // زيادة عدد الإعجابات
    async incrementLikes() {
        try {
            await pool.execute(
                'UPDATE fatwas SET likes_count = likes_count + 1 WHERE id = ?',
                [this.id]
            );
            this.likes_count += 1;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // البحث في الفتاوى
    static async search(searchTerm, options = {}) {
        try {
            const { page = 1, limit = 10, category_id } = options;
            const offset = (page - 1) * limit;

            let query = `SELECT f.*, s.name as scholar_name, c.name as category_name
                        FROM fatwas f
                        LEFT JOIN scholars s ON f.scholar_id = s.id
                        LEFT JOIN categories c ON f.category_id = c.id
                        WHERE f.status = 'approved' AND (f.title LIKE ? OR f.question LIKE ? OR f.answer LIKE ?)`;

            const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

            if (category_id) {
                query += ' AND f.category_id = ?';
                params.push(category_id);
            }

            query += ' ORDER BY f.views_count DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);

            return rows.map(row => {
                if (row.tags) {
                    row.tags = JSON.parse(row.tags);
                }
                return new Fatwa(row);
            });
        } catch (error) {
            throw error;
        }
    }

    // الحصول على إحصائيات الفتاوى
    static async getStats() {
        try {
            const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM fatwas');
            const [approvedResult] = await pool.execute('SELECT COUNT(*) as approved FROM fatwas WHERE status = "approved"');
            const [pendingResult] = await pool.execute('SELECT COUNT(*) as pending FROM fatwas WHERE status = "pending"');
            const [featuredResult] = await pool.execute('SELECT COUNT(*) as featured FROM fatwas WHERE is_featured = true');

            return {
                total: totalResult[0].total,
                approved: approvedResult[0].approved,
                pending: pendingResult[0].pending,
                featured: featuredResult[0].featured
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Fatwa;
