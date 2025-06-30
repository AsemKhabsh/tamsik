/**
 * نموذج المستخدم لقاعدة بيانات SQLite
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

class User {
    constructor(userData) {
        this.id = userData.id;
        this.name = userData.name;
        this.email = userData.email;
        this.password = userData.password;
        this.role = userData.role || 'member';
        this.created_at = userData.created_at;
        this.updated_at = userData.updated_at;
    }

    // إنشاء اتصال بقاعدة البيانات
    static getDatabase() {
        return new sqlite3.Database(DB_PATH);
    }

    // البحث عن مستخدم بالبريد الإلكتروني
    static async findByEmail(email) {
        return new Promise((resolve, reject) => {
            const db = User.getDatabase();
            
            db.get(
                'SELECT * FROM users WHERE email = ?',
                [email],
                (err, row) => {
                    db.close();
                    
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        resolve(null);
                        return;
                    }
                    
                    resolve(new User(row));
                }
            );
        });
    }

    // البحث عن مستخدم بالمعرف
    static async findById(id) {
        return new Promise((resolve, reject) => {
            const db = User.getDatabase();
            
            db.get(
                'SELECT * FROM users WHERE id = ?',
                [id],
                (err, row) => {
                    db.close();
                    
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (!row) {
                        resolve(null);
                        return;
                    }
                    
                    resolve(new User(row));
                }
            );
        });
    }

    // إنشاء مستخدم جديد
    static async create(userData) {
        return new Promise(async (resolve, reject) => {
            try {
                // تشفير كلمة المرور
                const hashedPassword = await bcrypt.hash(userData.password, 10);
                
                const db = User.getDatabase();
                
                db.run(
                    `INSERT INTO users (name, email, password, role) 
                     VALUES (?, ?, ?, ?)`,
                    [
                        userData.name,
                        userData.email,
                        hashedPassword,
                        userData.role || 'member'
                    ],
                    function(err) {
                        if (err) {
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        // جلب المستخدم المنشأ
                        db.get(
                            'SELECT * FROM users WHERE id = ?',
                            [this.lastID],
                            (err, row) => {
                                db.close();
                                
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                
                                resolve(new User(row));
                            }
                        );
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    // التحقق من كلمة المرور
    async comparePassword(password) {
        return await bcrypt.compare(password, this.password);
    }

    // تحديث بيانات المستخدم
    async update(updateData) {
        return new Promise(async (resolve, reject) => {
            try {
                const fields = [];
                const values = [];
                
                // إعداد الحقول للتحديث
                Object.keys(updateData).forEach(key => {
                    if (key !== 'id' && updateData[key] !== undefined) {
                        if (key === 'password') {
                            // تشفير كلمة المرور الجديدة
                            fields.push(`${key} = ?`);
                            values.push(bcrypt.hashSync(updateData[key], 10));
                        } else {
                            fields.push(`${key} = ?`);
                            values.push(updateData[key]);
                        }
                    }
                });
                
                if (fields.length === 0) {
                    resolve(this);
                    return;
                }
                
                // إضافة updated_at
                fields.push('updated_at = ?');
                values.push(new Date().toISOString());
                
                // إضافة معرف المستخدم للشرط
                values.push(this.id);
                
                const db = User.getDatabase();
                
                db.run(
                    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                    values,
                    (err) => {
                        if (err) {
                            db.close();
                            reject(err);
                            return;
                        }
                        
                        // جلب البيانات المحدثة
                        db.get(
                            'SELECT * FROM users WHERE id = ?',
                            [this.id],
                            (err, row) => {
                                db.close();
                                
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                
                                // تحديث البيانات الحالية
                                Object.assign(this, row);
                                resolve(this);
                            }
                        );
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    // حذف المستخدم
    async delete() {
        return new Promise((resolve, reject) => {
            const db = User.getDatabase();
            
            db.run(
                'DELETE FROM users WHERE id = ?',
                [this.id],
                (err) => {
                    db.close();
                    
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    resolve(true);
                }
            );
        });
    }

    // الحصول على جميع المستخدمين
    static async findAll(options = {}) {
        return new Promise((resolve, reject) => {
            const { page = 1, limit = 10, role } = options;
            const offset = (page - 1) * limit;
            
            let query = 'SELECT * FROM users';
            let countQuery = 'SELECT COUNT(*) as total FROM users';
            const params = [];
            
            if (role) {
                query += ' WHERE role = ?';
                countQuery += ' WHERE role = ?';
                params.push(role);
            }
            
            query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const db = User.getDatabase();
            
            // جلب العدد الإجمالي
            db.get(countQuery, role ? [role] : [], (err, countRow) => {
                if (err) {
                    db.close();
                    reject(err);
                    return;
                }
                
                // جلب المستخدمين
                db.all(query, params, (err, rows) => {
                    db.close();
                    
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const users = rows.map(row => new User(row));
                    const total = countRow.total;
                    const totalPages = Math.ceil(total / limit);
                    
                    resolve({
                        users,
                        pagination: {
                            page,
                            limit,
                            total,
                            totalPages,
                            hasNext: page < totalPages,
                            hasPrev: page > 1
                        }
                    });
                });
            });
        });
    }

    // تحويل إلى JSON (إخفاء كلمة المرور)
    toJSON() {
        const { password, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}

module.exports = User;
