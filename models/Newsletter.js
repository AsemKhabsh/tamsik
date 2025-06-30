const { pool } = require('../config/database-adapter');
const crypto = require('crypto');

class Newsletter {
    constructor(data) {
        this.id = data.id;
        this.email = data.email;
        this.name = data.name;
        this.status = data.status;
        this.preferences = data.preferences;
        this.subscribed_at = data.subscribed_at;
        this.unsubscribed_at = data.unsubscribed_at;
        this.verification_token = data.verification_token;
        this.is_verified = data.is_verified;
    }

    // إضافة مشترك جديد
    static async subscribe(subscriberData) {
        try {
            // التحقق من وجود البريد الإلكتروني مسبقاً
            const existingSubscriber = await Newsletter.findByEmail(subscriberData.email);
            
            if (existingSubscriber) {
                if (existingSubscriber.status === 'active') {
                    throw new Error('البريد الإلكتروني مشترك بالفعل');
                } else {
                    // إعادة تفعيل الاشتراك
                    return await existingSubscriber.reactivate();
                }
            }

            // إنشاء token للتحقق
            const verificationToken = crypto.randomBytes(32).toString('hex');

            const [result] = await pool.execute(
                `INSERT INTO newsletters (email, name, verification_token, status, is_verified) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    subscriberData.email,
                    subscriberData.name || null,
                    verificationToken,
                    'active',
                    0 // يحتاج تحقق
                ]
            );

            return await Newsletter.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مشترك بالمعرف
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM newsletters WHERE id = ?',
                [id]
            );

            if (rows.length === 0) {
                return null;
            }

            return new Newsletter(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مشترك بالبريد الإلكتروني
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM newsletters WHERE email = ?',
                [email]
            );

            if (rows.length === 0) {
                return null;
            }

            return new Newsletter(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مشترك بـ token التحقق
    static async findByVerificationToken(token) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM newsletters WHERE verification_token = ?',
                [token]
            );

            if (rows.length === 0) {
                return null;
            }

            return new Newsletter(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع المشتركين مع التصفية والترقيم
    static async findAll(options = {}) {
        try {
            const { 
                page = 1, 
                limit = 50, 
                status, 
                verified, 
                search 
            } = options;
            
            const offset = (page - 1) * limit;

            let query = 'SELECT * FROM newsletters WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as total FROM newsletters WHERE 1=1';
            const params = [];

            if (status !== undefined) {
                query += ' AND status = ?';
                countQuery += ' AND status = ?';
                params.push(status);
            }

            if (verified !== undefined) {
                query += ' AND is_verified = ?';
                countQuery += ' AND is_verified = ?';
                params.push(verified);
            }

            if (search) {
                query += ' AND (email LIKE ? OR name LIKE ?)';
                countQuery += ' AND (email LIKE ? OR name LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm);
            }

            query += ' ORDER BY subscribed_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            const subscribers = rows.map(row => new Newsletter(row));
            const total = countResult[0].total;

            return {
                subscribers,
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

    // الحصول على المشتركين النشطين والمحققين
    static async getActiveSubscribers() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM newsletters WHERE status = ? AND is_verified = ? ORDER BY subscribed_at DESC',
                ['active', 1]
            );

            return rows.map(row => new Newsletter(row));
        } catch (error) {
            throw error;
        }
    }

    // تحقق البريد الإلكتروني
    async verify() {
        try {
            await pool.execute(
                'UPDATE newsletters SET is_verified = ?, verification_token = NULL WHERE id = ?',
                [1, this.id]
            );

            this.is_verified = 1;
            this.verification_token = null;

            return this;
        } catch (error) {
            throw error;
        }
    }

    // إلغاء الاشتراك
    async unsubscribe() {
        try {
            await pool.execute(
                'UPDATE newsletters SET status = ?, unsubscribed_at = datetime("now") WHERE id = ?',
                ['inactive', this.id]
            );

            this.status = 'inactive';
            this.unsubscribed_at = new Date();

            return this;
        } catch (error) {
            throw error;
        }
    }

    // إعادة تفعيل الاشتراك
    async reactivate() {
        try {
            // إنشاء token جديد للتحقق
            const verificationToken = crypto.randomBytes(32).toString('hex');

            await pool.execute(
                'UPDATE newsletters SET status = ?, is_verified = ?, verification_token = ?, unsubscribed_at = NULL, subscribed_at = datetime("now") WHERE id = ?',
                ['active', 0, verificationToken, this.id]
            );

            this.status = 'active';
            this.is_verified = 0;
            this.verification_token = verificationToken;
            this.unsubscribed_at = null;
            this.subscribed_at = new Date();

            return this;
        } catch (error) {
            throw error;
        }
    }

    // تحديث بيانات المشترك
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
                `UPDATE newsletters SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // إعادة تحميل البيانات
            const updatedSubscriber = await Newsletter.findById(this.id);
            Object.assign(this, updatedSubscriber);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // حذف المشترك نهائياً
    async delete() {
        try {
            await pool.execute(
                'DELETE FROM newsletters WHERE id = ?',
                [this.id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    // الحصول على إحصائيات النشرة البريدية
    static async getStats() {
        try {
            const [totalResult] = await pool.execute('SELECT COUNT(*) as total FROM newsletters');
            const [activeResult] = await pool.execute('SELECT COUNT(*) as active FROM newsletters WHERE status = ?', ['active']);
            const [verifiedResult] = await pool.execute('SELECT COUNT(*) as verified FROM newsletters WHERE is_verified = ?', [1]);
            const [unsubscribedResult] = await pool.execute('SELECT COUNT(*) as unsubscribed FROM newsletters WHERE status = ?', ['inactive']);

            return {
                total: totalResult[0].total,
                active: activeResult[0].active,
                verified: verifiedResult[0].verified,
                unsubscribed: unsubscribedResult[0].unsubscribed
            };
        } catch (error) {
            throw error;
        }
    }

    // تصدير قائمة المشتركين النشطين
    static async exportActiveSubscribers() {
        try {
            const [rows] = await pool.execute(
                'SELECT email, name, subscribed_at FROM newsletters WHERE status = ? AND is_verified = ? ORDER BY subscribed_at DESC',
                ['active', 1]
            );

            return rows;
        } catch (error) {
            throw error;
        }
    }

    // إنشاء token جديد للتحقق
    async generateNewVerificationToken() {
        try {
            const verificationToken = crypto.randomBytes(32).toString('hex');

            await pool.execute(
                'UPDATE newsletters SET verification_token = ? WHERE id = ?',
                [verificationToken, this.id]
            );

            this.verification_token = verificationToken;

            return this;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Newsletter;
