const { pool } = require('../config/database-adapter');

class Scholar {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.name = data.name;
        this.title = data.title;
        this.bio = data.bio;
        this.specialization = data.specialization;
        this.location = data.location;
        this.image = data.image;
        this.education = data.education;
        this.experience = data.experience;
        this.contact_info = data.contact_info;
        this.social_links = data.social_links;
        this.is_featured = data.is_featured;
        this.is_active = data.is_active;
        this.fatwa_count = data.fatwa_count;
        this.rating = data.rating;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // إنشاء عالم جديد
    static async create(scholarData) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO scholars (user_id, name, title, bio, specialization, location, 
                 image, education, experience, contact_info, social_links, is_featured, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    scholarData.user_id || null,
                    scholarData.name,
                    scholarData.title || null,
                    scholarData.bio || null,
                    scholarData.specialization || null,
                    scholarData.location || null,
                    scholarData.image || null,
                    scholarData.education || null,
                    scholarData.experience || null,
                    JSON.stringify(scholarData.contact_info || {}),
                    JSON.stringify(scholarData.social_links || {}),
                    scholarData.is_featured || false,
                    scholarData.is_active !== undefined ? scholarData.is_active : true
                ]
            );

            return await Scholar.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن عالم بالمعرف
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM scholars WHERE id = ?',
                [id]
            );

            if (rows.length === 0) {
                return null;
            }

            const scholar = rows[0];
            // تحويل JSON strings إلى objects
            if (scholar.contact_info) {
                scholar.contact_info = JSON.parse(scholar.contact_info);
            }
            if (scholar.social_links) {
                scholar.social_links = JSON.parse(scholar.social_links);
            }

            return new Scholar(scholar);
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع العلماء مع التصفية والترقيم
    static async findAll(options = {}) {
        try {
            const { page = 1, limit = 10, featured, active, search, location } = options;
            const offset = (page - 1) * limit;

            let query = 'SELECT * FROM scholars WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as total FROM scholars WHERE 1=1';
            const params = [];

            if (featured !== undefined) {
                query += ' AND is_featured = ?';
                countQuery += ' AND is_featured = ?';
                params.push(featured);
            }

            if (active !== undefined) {
                query += ' AND is_active = ?';
                countQuery += ' AND is_active = ?';
                params.push(active);
            }

            if (location) {
                query += ' AND location LIKE ?';
                countQuery += ' AND location LIKE ?';
                params.push(`%${location}%`);
            }

            if (search) {
                query += ' AND (name LIKE ? OR title LIKE ? OR specialization LIKE ?)';
                countQuery += ' AND (name LIKE ? OR title LIKE ? OR specialization LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ' ORDER BY is_featured DESC, fatwa_count DESC, created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            const scholars = rows.map(row => {
                // تحويل JSON strings إلى objects
                if (row.contact_info) {
                    row.contact_info = JSON.parse(row.contact_info);
                }
                if (row.social_links) {
                    row.social_links = JSON.parse(row.social_links);
                }
                return new Scholar(row);
            });

            const total = countResult[0].total;

            return {
                scholars,
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

    // الحصول على العلماء المميزين
    static async getFeatured(limit = 6) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM scholars WHERE is_featured = true AND is_active = true ORDER BY fatwa_count DESC LIMIT ?',
                [limit]
            );

            return rows.map(row => {
                if (row.contact_info) {
                    row.contact_info = JSON.parse(row.contact_info);
                }
                if (row.social_links) {
                    row.social_links = JSON.parse(row.social_links);
                }
                return new Scholar(row);
            });
        } catch (error) {
            throw error;
        }
    }

    // تحديث بيانات العالم
    async update(updateData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && key !== 'id') {
                    if (key === 'contact_info' || key === 'social_links') {
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
                `UPDATE scholars SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // إعادة تحميل البيانات
            const updatedScholar = await Scholar.findById(this.id);
            Object.assign(this, updatedScholar);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // حذف العالم
    async delete() {
        try {
            await pool.execute(
                'DELETE FROM scholars WHERE id = ?',
                [this.id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    // تحديث عدد الفتاوى
    async updateFatwaCount() {
        try {
            const [result] = await pool.execute(
                'SELECT COUNT(*) as count FROM fatwas WHERE scholar_id = ? AND status = "approved"',
                [this.id]
            );

            const count = result[0].count;

            await pool.execute(
                'UPDATE scholars SET fatwa_count = ? WHERE id = ?',
                [count, this.id]
            );

            this.fatwa_count = count;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // البحث عن عالم بمعرف المستخدم
    static async findByUserId(userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM scholars WHERE user_id = ?',
                [userId]
            );

            if (rows.length === 0) {
                return null;
            }

            const scholar = rows[0];
            if (scholar.contact_info) {
                scholar.contact_info = JSON.parse(scholar.contact_info);
            }
            if (scholar.social_links) {
                scholar.social_links = JSON.parse(scholar.social_links);
            }

            return new Scholar(scholar);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Scholar;
