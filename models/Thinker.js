const { pool } = require('../config/database-adapter');

class Thinker {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.name = data.name;
        this.title = data.title;
        this.bio = data.bio;
        this.specialization = data.specialization;
        this.location = data.location;
        this.image = data.image;
        this.birth_date = data.birth_date;
        this.death_date = data.death_date;
        this.education = data.education;
        this.works = data.works;
        this.achievements = data.achievements;
        this.quotes = data.quotes;
        this.books = data.books;
        this.social_links = data.social_links;
        this.is_featured = data.is_featured;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // بيانات إضافية
        this.user_name = data.user_name;
    }

    // إنشاء مفكر جديد
    static async create(thinkerData) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO thinkers (user_id, name, title, bio, specialization, location, 
                 image, birth_date, death_date, education, works, achievements, quotes, books, 
                 social_links, is_featured, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    thinkerData.user_id || null,
                    thinkerData.name,
                    thinkerData.title || null,
                    thinkerData.bio || null,
                    thinkerData.specialization || null,
                    thinkerData.location || null,
                    thinkerData.image || null,
                    thinkerData.birth_date || null,
                    thinkerData.death_date || null,
                    thinkerData.education || null,
                    thinkerData.works || null,
                    thinkerData.achievements || null,
                    JSON.stringify(thinkerData.quotes || []),
                    JSON.stringify(thinkerData.books || []),
                    JSON.stringify(thinkerData.social_links || {}),
                    thinkerData.is_featured || false,
                    thinkerData.is_active !== undefined ? thinkerData.is_active : true
                ]
            );

            return await Thinker.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مفكر بالمعرف
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT t.*, u.full_name as user_name 
                 FROM thinkers t 
                 LEFT JOIN users u ON t.user_id = u.id 
                 WHERE t.id = ?`,
                [id]
            );

            if (rows.length === 0) {
                return null;
            }

            const thinker = rows[0];
            // تحويل JSON strings إلى objects
            if (thinker.quotes) {
                thinker.quotes = JSON.parse(thinker.quotes);
            }
            if (thinker.books) {
                thinker.books = JSON.parse(thinker.books);
            }
            if (thinker.social_links) {
                thinker.social_links = JSON.parse(thinker.social_links);
            }

            return new Thinker(thinker);
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع المفكرين مع التصفية والترقيم
    static async findAll(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                featured, 
                active, 
                search, 
                location,
                specialization,
                alive // true للأحياء، false للمتوفين
            } = options;
            
            const offset = (page - 1) * limit;

            let query = `SELECT t.*, u.full_name as user_name 
                        FROM thinkers t 
                        LEFT JOIN users u ON t.user_id = u.id 
                        WHERE 1=1`;
            
            let countQuery = 'SELECT COUNT(*) as total FROM thinkers t WHERE 1=1';
            const params = [];

            if (featured !== undefined) {
                query += ' AND t.is_featured = ?';
                countQuery += ' AND t.is_featured = ?';
                params.push(featured);
            }

            if (active !== undefined) {
                query += ' AND t.is_active = ?';
                countQuery += ' AND t.is_active = ?';
                params.push(active);
            }

            if (location) {
                query += ' AND t.location LIKE ?';
                countQuery += ' AND t.location LIKE ?';
                params.push(`%${location}%`);
            }

            if (specialization) {
                query += ' AND t.specialization LIKE ?';
                countQuery += ' AND t.specialization LIKE ?';
                params.push(`%${specialization}%`);
            }

            if (alive !== undefined) {
                if (alive) {
                    query += ' AND t.death_date IS NULL';
                    countQuery += ' AND t.death_date IS NULL';
                } else {
                    query += ' AND t.death_date IS NOT NULL';
                    countQuery += ' AND t.death_date IS NOT NULL';
                }
            }

            if (search) {
                query += ' AND (t.name LIKE ? OR t.title LIKE ? OR t.specialization LIKE ? OR t.bio LIKE ?)';
                countQuery += ' AND (t.name LIKE ? OR t.title LIKE ? OR t.specialization LIKE ? OR t.bio LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm, searchTerm);
            }

            query += ' ORDER BY t.is_featured DESC, t.name ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            const thinkers = rows.map(row => {
                // تحويل JSON strings إلى objects
                if (row.quotes) {
                    row.quotes = JSON.parse(row.quotes);
                }
                if (row.books) {
                    row.books = JSON.parse(row.books);
                }
                if (row.social_links) {
                    row.social_links = JSON.parse(row.social_links);
                }
                return new Thinker(row);
            });

            const total = countResult[0].total;

            return {
                thinkers,
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

    // الحصول على المفكرين المميزين
    static async getFeatured(limit = 6) {
        try {
            const [rows] = await pool.execute(
                `SELECT t.*, u.full_name as user_name 
                 FROM thinkers t 
                 LEFT JOIN users u ON t.user_id = u.id 
                 WHERE t.is_featured = true AND t.is_active = true 
                 ORDER BY t.name ASC LIMIT ?`,
                [limit]
            );

            return rows.map(row => {
                if (row.quotes) {
                    row.quotes = JSON.parse(row.quotes);
                }
                if (row.books) {
                    row.books = JSON.parse(row.books);
                }
                if (row.social_links) {
                    row.social_links = JSON.parse(row.social_links);
                }
                return new Thinker(row);
            });
        } catch (error) {
            throw error;
        }
    }

    // تحديث بيانات المفكر
    async update(updateData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && key !== 'id') {
                    if (key === 'quotes' || key === 'books' || key === 'social_links') {
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
                `UPDATE thinkers SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // إعادة تحميل البيانات
            const updatedThinker = await Thinker.findById(this.id);
            Object.assign(this, updatedThinker);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // حذف المفكر
    async delete() {
        try {
            await pool.execute(
                'DELETE FROM thinkers WHERE id = ?',
                [this.id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    // البحث في المفكرين
    static async search(searchTerm, options = {}) {
        try {
            const { page = 1, limit = 10, specialization } = options;
            const offset = (page - 1) * limit;

            let query = `SELECT t.*, u.full_name as user_name 
                        FROM thinkers t 
                        LEFT JOIN users u ON t.user_id = u.id 
                        WHERE t.is_active = true AND (t.name LIKE ? OR t.title LIKE ? OR t.specialization LIKE ? OR t.bio LIKE ?)`;
            
            const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

            if (specialization) {
                query += ' AND t.specialization LIKE ?';
                params.push(`%${specialization}%`);
            }

            query += ' ORDER BY t.name ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);

            return rows.map(row => {
                if (row.quotes) {
                    row.quotes = JSON.parse(row.quotes);
                }
                if (row.books) {
                    row.books = JSON.parse(row.books);
                }
                if (row.social_links) {
                    row.social_links = JSON.parse(row.social_links);
                }
                return new Thinker(row);
            });
        } catch (error) {
            throw error;
        }
    }

    // الحصول على إحصائيات المفكرين
    static async getStats() {
        try {
            const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM thinkers');
            const [activeResult] = await pool.execute('SELECT COUNT(*) as active FROM thinkers WHERE is_active = true');
            const [aliveResult] = await pool.execute('SELECT COUNT(*) as alive FROM thinkers WHERE death_date IS NULL AND is_active = true');
            const [featuredResult] = await pool.execute('SELECT COUNT(*) as featured FROM thinkers WHERE is_featured = true');

            return {
                total: totalResult[0].total,
                active: activeResult[0].active,
                alive: aliveResult[0].alive,
                featured: featuredResult[0].featured
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Thinker;
