const { pool } = require('../config/database-adapter');

class Sermon {
    constructor(data) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.category_id = data.category_id;
        this.title = data.title;
        this.content = data.content;
        this.excerpt = data.excerpt;
        this.author = data.author;
        this.status = data.status;
        this.is_featured = data.is_featured;
        this.views_count = data.views_count;
        this.downloads_count = data.downloads_count;
        this.likes_count = data.likes_count;
        this.tags = data.tags;
        this.attachments = data.attachments;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // بيانات إضافية من الجداول المرتبطة
        this.category_name = data.category_name;
        this.user_name = data.user_name;
    }

    // إنشاء خطبة جديدة
    static async create(sermonData) {
        try {
            // تحويل البيانات المعقدة إلى JSON
            const structuredContent = {
                main_title: sermonData.main_title || '',
                introduction: {
                    athar: sermonData.introduction_athar || '',
                    saja: {
                        topic: sermonData.saja_topic || '',
                        rhyme: sermonData.saja_rhyme || '',
                        attribution: sermonData.saja_attribution || '',
                        reference: sermonData.saja_reference || ''
                    },
                    poetry: {
                        topic: sermonData.poetry_topic || '',
                        rhyme: sermonData.poetry_rhyme || '',
                        meter: sermonData.poetry_meter || '',
                        poet: sermonData.poetry_poet || '',
                        reference: sermonData.poetry_reference || ''
                    }
                },
                amma_baad: {
                    taqwa_advice: {
                        verses: {
                            informative: sermonData.taqwa_verses_informative || '',
                            command: sermonData.taqwa_verses_command || '',
                            promise: sermonData.taqwa_verses_promise || ''
                        },
                        hadith: {
                            informative: sermonData.taqwa_hadith_informative || '',
                            command: sermonData.taqwa_hadith_command || '',
                            promise: sermonData.taqwa_hadith_promise || ''
                        },
                        athar: {
                            text: sermonData.taqwa_athar_text || '',
                            speaker: sermonData.taqwa_athar_speaker || '',
                            type: sermonData.taqwa_athar_type || 'إخبار'
                        }
                    }
                },
                sermon_text: sermonData.sermon_text || '',
                first_sermon_conclusion: sermonData.first_sermon_conclusion || '',
                second_sermon: sermonData.second_sermon || '',
                second_sermon_conclusion: {
                    salah_on_prophet: sermonData.salah_on_prophet || '',
                    dua: {
                        praise: sermonData.dua_praise || '',
                        quranic_dua: sermonData.dua_quranic || '',
                        prophetic_dua: sermonData.dua_prophetic || '',
                        muslim_dua: sermonData.dua_muslim || '',
                        oppressor_dua: sermonData.dua_oppressor || '',
                        additional_dua: sermonData.dua_additional || '',
                        istisqa: sermonData.dua_istisqa || ''
                    },
                    additional_elements: sermonData.additional_elements || []
                }
            };

            const [result] = await pool.execute(
                `INSERT INTO sermons (user_id, category_id, title, content, excerpt, author,
                 status, is_featured, tags, attachments)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    sermonData.user_id || null,
                    sermonData.category_id || null,
                    sermonData.main_title || sermonData.title,
                    JSON.stringify(structuredContent),
                    sermonData.excerpt || null,
                    sermonData.author || null,
                    sermonData.status || 'draft',
                    sermonData.is_featured || false,
                    JSON.stringify(sermonData.tags || []),
                    JSON.stringify(sermonData.attachments || [])
                ]
            );

            return await Sermon.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن خطبة بالمعرف
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT s.*, c.name as category_name, u.full_name as user_name 
                 FROM sermons s 
                 LEFT JOIN categories c ON s.category_id = c.id 
                 LEFT JOIN users u ON s.user_id = u.id 
                 WHERE s.id = ?`,
                [id]
            );

            if (rows.length === 0) {
                return null;
            }

            const sermon = rows[0];
            if (sermon.tags) {
                sermon.tags = JSON.parse(sermon.tags);
            }
            if (sermon.attachments) {
                sermon.attachments = JSON.parse(sermon.attachments);
            }
            if (sermon.content) {
                try {
                    sermon.structured_content = JSON.parse(sermon.content);
                } catch (e) {
                    // إذا كان المحتوى نص عادي وليس JSON
                    sermon.structured_content = null;
                }
            }

            return new Sermon(sermon);
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع الخطب مع التصفية والترقيم
    static async findAll(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 10, 
                status, 
                category_id, 
                user_id, 
                featured, 
                search,
                sort = 'newest'
            } = options;
            
            const offset = (page - 1) * limit;

            let query = `SELECT s.*, c.name as category_name, u.full_name as user_name 
                        FROM sermons s 
                        LEFT JOIN categories c ON s.category_id = c.id 
                        LEFT JOIN users u ON s.user_id = u.id 
                        WHERE 1=1`;
            
            let countQuery = 'SELECT COUNT(*) as total FROM sermons s WHERE 1=1';
            const params = [];

            if (status) {
                query += ' AND s.status = ?';
                countQuery += ' AND s.status = ?';
                params.push(status);
            }

            if (category_id) {
                query += ' AND s.category_id = ?';
                countQuery += ' AND s.category_id = ?';
                params.push(category_id);
            }

            if (user_id) {
                query += ' AND s.user_id = ?';
                countQuery += ' AND s.user_id = ?';
                params.push(user_id);
            }

            if (featured !== undefined) {
                query += ' AND s.is_featured = ?';
                countQuery += ' AND s.is_featured = ?';
                params.push(featured);
            }

            if (search) {
                query += ' AND (s.title LIKE ? OR s.content LIKE ? OR s.author LIKE ?)';
                countQuery += ' AND (s.title LIKE ? OR s.content LIKE ? OR s.author LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            // ترتيب النتائج
            switch (sort) {
                case 'oldest':
                    query += ' ORDER BY s.created_at ASC';
                    break;
                case 'popular':
                    query += ' ORDER BY s.views_count DESC';
                    break;
                case 'downloads':
                    query += ' ORDER BY s.downloads_count DESC';
                    break;
                default: // newest
                    query += ' ORDER BY s.created_at DESC';
            }

            query += ' LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            const sermons = rows.map(row => {
                if (row.tags) {
                    row.tags = JSON.parse(row.tags);
                }
                if (row.attachments) {
                    row.attachments = JSON.parse(row.attachments);
                }
                return new Sermon(row);
            });

            const total = countResult[0].total;

            return {
                sermons,
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

    // الحصول على الخطب المميزة
    static async getFeatured(limit = 6) {
        try {
            const [rows] = await pool.execute(
                `SELECT s.*, c.name as category_name, u.full_name as user_name 
                 FROM sermons s 
                 LEFT JOIN categories c ON s.category_id = c.id 
                 LEFT JOIN users u ON s.user_id = u.id 
                 WHERE s.is_featured = true AND s.status = 'published' 
                 ORDER BY s.views_count DESC LIMIT ?`,
                [limit]
            );

            return rows.map(row => {
                if (row.tags) {
                    row.tags = JSON.parse(row.tags);
                }
                if (row.attachments) {
                    row.attachments = JSON.parse(row.attachments);
                }
                return new Sermon(row);
            });
        } catch (error) {
            throw error;
        }
    }

    // تحديث بيانات الخطبة
    async update(updateData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(updateData).forEach(key => {
                if (updateData[key] !== undefined && key !== 'id') {
                    if (key === 'tags' || key === 'attachments') {
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
                `UPDATE sermons SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // إعادة تحميل البيانات
            const updatedSermon = await Sermon.findById(this.id);
            Object.assign(this, updatedSermon);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // حذف الخطبة
    async delete() {
        try {
            await pool.execute(
                'DELETE FROM sermons WHERE id = ?',
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
                'UPDATE sermons SET views_count = views_count + 1 WHERE id = ?',
                [this.id]
            );
            this.views_count += 1;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // زيادة عدد التحميلات
    async incrementDownloads() {
        try {
            await pool.execute(
                'UPDATE sermons SET downloads_count = downloads_count + 1 WHERE id = ?',
                [this.id]
            );
            this.downloads_count += 1;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // البحث في الخطب
    static async search(searchTerm, options = {}) {
        try {
            const { page = 1, limit = 10, category_id } = options;
            const offset = (page - 1) * limit;

            let query = `SELECT s.*, c.name as category_name, u.full_name as user_name
                        FROM sermons s
                        LEFT JOIN categories c ON s.category_id = c.id
                        LEFT JOIN users u ON s.user_id = u.id
                        WHERE s.status = 'published' AND (s.title LIKE ? OR s.content LIKE ? OR s.author LIKE ?)`;

            const params = [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`];

            if (category_id) {
                query += ' AND s.category_id = ?';
                params.push(category_id);
            }

            query += ' ORDER BY s.views_count DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);

            return rows.map(row => {
                if (row.tags) {
                    row.tags = JSON.parse(row.tags);
                }
                if (row.attachments) {
                    row.attachments = JSON.parse(row.attachments);
                }
                if (row.content) {
                    try {
                        row.structured_content = JSON.parse(row.content);
                    } catch (e) {
                        row.structured_content = null;
                    }
                }
                return new Sermon(row);
            });
        } catch (error) {
            throw error;
        }
    }

    // استخراج البيانات المنظمة من الخطبة
    getStructuredContent() {
        if (this.structured_content) {
            return this.structured_content;
        }

        try {
            return JSON.parse(this.content);
        } catch (e) {
            return null;
        }
    }

    // تحديث البيانات المنظمة
    async updateStructuredContent(structuredData) {
        try {
            await this.update({
                content: JSON.stringify(structuredData)
            });
            this.structured_content = structuredData;
            return this;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Sermon;
