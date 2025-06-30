const { pool } = require('../config/database-adapter');
const bcrypt = require('bcryptjs');

class User {
    constructor(data) {
        this.id = data.id;
        this.username = data.username;
        this.email = data.email;
        this.password = data.password;
        this.full_name = data.full_name;
        this.role = data.role;
        this.is_verified = data.is_verified;
        this.verification_token = data.verification_token;
        this.reset_password_token = data.reset_password_token;
        this.reset_password_expires = data.reset_password_expires;
        this.profile_image = data.profile_image;
        this.bio = data.bio;
        this.phone = data.phone;
        this.location = data.location;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // إنشاء مستخدم جديد
    static async create(userData) {
        try {
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            
            const [result] = await pool.execute(
                `INSERT INTO users (username, email, password, full_name, role, verification_token) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userData.username,
                    userData.email,
                    hashedPassword,
                    userData.full_name,
                    userData.role || 'user',
                    userData.verification_token
                ]
            );

            return await User.findById(result.insertId);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مستخدم بالمعرف
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE id = ?',
                [id]
            );

            if (rows.length === 0) {
                return null;
            }

            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مستخدم بالبريد الإلكتروني
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );

            if (rows.length === 0) {
                return null;
            }

            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مستخدم باسم المستخدم
    static async findByUsername(username) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE username = ?',
                [username]
            );

            if (rows.length === 0) {
                return null;
            }

            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مستخدم بـ reset password token
    static async findByResetToken(token) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
                [token]
            );

            if (rows.length === 0) {
                return null;
            }

            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // البحث عن مستخدم بـ verification token
    static async findByVerificationToken(token) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE verification_token = ?',
                [token]
            );

            if (rows.length === 0) {
                return null;
            }

            return new User(rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // التحقق من كلمة المرور
    async comparePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    // تحديث بيانات المستخدم
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
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            // إعادة تحميل البيانات
            const updatedUser = await User.findById(this.id);
            Object.assign(this, updatedUser);

            return this;
        } catch (error) {
            throw error;
        }
    }

    // حذف المستخدم
    async delete() {
        try {
            await pool.execute(
                'DELETE FROM users WHERE id = ?',
                [this.id]
            );
            return true;
        } catch (error) {
            throw error;
        }
    }

    // الحصول على جميع المستخدمين مع التصفية والترقيم
    static async findAll(options = {}) {
        try {
            const { page = 1, limit = 10, role, search } = options;
            const offset = (page - 1) * limit;

            let query = 'SELECT * FROM users WHERE 1=1';
            let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
            const params = [];

            if (role) {
                query += ' AND role = ?';
                countQuery += ' AND role = ?';
                params.push(role);
            }

            if (search) {
                query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
                countQuery += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
                const searchTerm = `%${search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);

            const [rows] = await pool.execute(query, params);
            const [countResult] = await pool.execute(countQuery, params.slice(0, -2));

            const users = rows.map(row => new User(row));
            const total = countResult[0].total;

            return {
                users,
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

    // تحويل إلى JSON (إخفاء كلمة المرور)
    toJSON() {
        const user = { ...this };
        delete user.password;
        delete user.verification_token;
        delete user.reset_password_token;
        return user;
    }
}

module.exports = User;
