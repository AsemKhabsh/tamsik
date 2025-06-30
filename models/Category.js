const { pool } = require('../config/database-adapter');

class Category {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.slug = data.slug;
        this.description = data.description;
        this.type = data.type;
        this.parent_id = data.parent_id;
        this.sort_order = data.sort_order;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // بيانات إضافية
        this.parent_name = data.parent_name;
        this.items_count = data.items_count;
    }

    // إنشاء تصنيف جديد
    static async create(categoryData) {
        try {
            const [result] = await pool.execute(
                `INSERT INTO categories (name, slug, description, type, parent_id, sort_order, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    categoryData.name,
                    categoryData.slug,
                    categoryData.description || null,
                    categoryData.type,
                    categoryData.parent_id || null,
                    categoryData.sort_order || 0,
                    categoryData.is_active !== undefined ? categoryData.is_active : true
                ]
            );

            return await Category.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن تصنيف بالمعرف
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.*, p.name as parent_name 
                 FROM categories c 
                 LEFT JOIN categories p ON c.parent_id = p.id 
                 WHERE c.id = ?`,
                [id]
            );

            if (rows.length === 0) {
                return null;
            }

            return new Category(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن تصنيف بالـ slug
    static async findBySlug(slug) {
        try {
            const [rows] = await pool.execute(
                `SELECT c.*, p.name as parent_name 
                 FROM categories c 
                 LEFT JOIN categories p ON c.parent_id = p.id 
                 WHERE c.slug = ?`,
                [slug]
            );

            if (rows.length === 0) {
                return null;
            }

            return new Category(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع التصنيفات مع التصفية
    static async findAll(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 50, 
                type, 
                parent_id, 
                active, 
                search 
            } = options;
            
            const offset = (page - 1) * limit;

            let query = `SELECT c.*, p.name as parent_name 
                        FROM categories c 
                        LEFT JOIN categories p ON c.parent_id = p.id 
                        WHERE 1=1`;
            
            let countQuery = 'SELECT COUNT(*) as total FROM categories c WHERE 1=1';
            const params = [];

            if (type) {
                query += ' AND c.type = ?';
                countQuery += ' AND c.type = ?';
                params.push(type);
            }

            if (parent_id !== undefined) {
                if (parent_id === null) {
                    query += ' AND c.parent_id IS NULL';
                    countQuery += ' AND c.parent_id IS NULL';
                } else {
                    query += ' AND c.parent_id = ?';
                    countQuery += ' AND c.parent_id = ?';
                    params.push(parent_id);
                }
            }

            if (active !== undefined) {
                query += ' AND c.is_active = ?';
                countQuery += ' AND c.is_active = ?';
                params.push(active);
            }

            if (search) {
                query += ' AND (c.name LIKE ? OR c.description LIKE ?)';
                countQuery += ' AND (c.name LIKE ? OR c.description LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm);
            }

            query += ' ORDER BY c.sort_order ASC, c.name ASC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            const categories = rows.map(row => new Category(row));
            const total = countResult[0].total;

            return {
                categories,
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

    // الحصول على التصنيفات حسب النوع
    static async findByType(type, options = {}) {
        try {
            const { active = true, parent_id } = options;

            let query = `SELECT c.*, p.name as parent_name 
                        FROM categories c 
                        LEFT JOIN categories p ON c.parent_id = p.id 
                        WHERE c.type = ? AND c.is_active = ?`;
            
            const params = [type, active];

            if (parent_id !== undefined) {
                if (parent_id === null) {
                    query += ' AND c.parent_id IS NULL';
                } else {
                    query += ' AND c.parent_id = ?';
                    params.push(parent_id);
                }
            }

            query += ' ORDER BY c.sort_order ASC, c.name ASC';

            const [rows] = await pool.execute(query, params);

            return rows.map(row => new Category(row));
        } catch (error) {
            throw error;
        }
    }

    // الحصول على التصنيفات الرئيسية (بدون parent)
    static async getMainCategories(type = null) {
        try {
            let query = `SELECT c.*, p.name as parent_name 
                        FROM categories c 
                        LEFT JOIN categories p ON c.parent_id = p.id 
                        WHERE c.parent_id IS NULL AND c.is_active = true`;
            
            const params = [];

            if (type) {
                query += ' AND c.type = ?';
                params.push(type);
            }

            query += ' ORDER BY c.sort_order ASC, c.name ASC';

            const [rows] = await pool.execute(query, params);

            return rows.map(row => new Category(row));
        } catch (error) {
            throw error;
        }
    }

    // الحصول على التصنيفات الفرعية
    async getSubCategories() {
        try {
            const [rows] = await pool.execute(
                `SELECT c.*, p.name as parent_name 
                 FROM categories c 
                 LEFT JOIN categories p ON c.parent_id = p.id 
                 WHERE c.parent_id = ? AND c.is_active = true 
                 ORDER BY c.sort_order ASC, c.name ASC`,
                [this.id]
            );

            return rows.map(row => new Category(row));
        } catch (error) {
            throw error;
        }
    }

    // تحديث بيانات التصنيف
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
                `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // إعادة تحميل البيانات
            const updatedCategory = await Category.findById(this.id);
            Object.assign(this, updatedCategory);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // حذف التصنيف
    async delete() {
        try {
            // التحقق من وجود تصنيفات فرعية
            const [subCategories] = await pool.execute(
                'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
                [this.id]
            );

            if (subCategories[0].count > 0) {
                throw new Error('لا يمكن حذف التصنيف لوجود تصنيفات فرعية');
            }

            // التحقق من وجود عناصر مرتبطة
            const tables = {
                'sermon': 'sermons',
                'fatwa': 'fatwas',
                'lecture': 'lectures',
                'article': 'articles'
            };

            if (tables[this.type]) {
                const [items] = await pool.execute(
                    `SELECT COUNT(*) as count FROM ${tables[this.type]} WHERE category_id = ?`,
                    [this.id]
                );

                if (items[0].count > 0) {
                    throw new Error('لا يمكن حذف التصنيف لوجود عناصر مرتبطة به');
                }
            }

            await pool.execute(
                'DELETE FROM categories WHERE id = ?',
                [this.id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    // الحصول على عدد العناصر في التصنيف
    async getItemsCount() {
        try {
            const tables = {
                'sermon': 'sermons',
                'fatwa': 'fatwas',
                'lecture': 'lectures',
                'article': 'articles'
            };

            if (!tables[this.type]) {
                return 0;
            }

            const [result] = await pool.execute(
                `SELECT COUNT(*) as count FROM ${tables[this.type]} WHERE category_id = ?`,
                [this.id]
            );

            return result[0].count;
        } catch (error) {
            throw error;
        }
    }

    // البحث في التصنيفات
    static async search(searchTerm, options = {}) {
        try {
            const { type, active = true } = options;

            let query = `SELECT c.*, p.name as parent_name 
                        FROM categories c 
                        LEFT JOIN categories p ON c.parent_id = p.id 
                        WHERE c.is_active = ? AND (c.name LIKE ? OR c.description LIKE ?)`;
            
            const params = [active, `%${searchTerm}%`, `%${searchTerm}%`];

            if (type) {
                query += ' AND c.type = ?';
                params.push(type);
            }

            query += ' ORDER BY c.sort_order ASC, c.name ASC';

            const [rows] = await pool.execute(query, params);

            return rows.map(row => new Category(row));
        } catch (error) {
            throw error;
        }
    }

    // الحصول على إحصائيات التصنيفات
    static async getStats() {
        try {
            const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM categories');
            const [activeResult] = await pool.execute('SELECT COUNT(*) as active FROM categories WHERE is_active = true');
            const [typeResult] = await pool.execute('SELECT type, COUNT(*) as count FROM categories WHERE is_active = true GROUP BY type');

            return {
                total: totalResult[0].total,
                active: activeResult[0].active,
                by_type: typeResult
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Category;
