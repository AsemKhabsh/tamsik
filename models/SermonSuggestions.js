const { pool } = require('../config/database-adapter');

class SermonSuggestions {
    // الحصول على اقتراحات الآيات القرآنية
    static async getVersesSuggestions(topic = null, contextType = null, limit = 10) {
        try {
            let query = `SELECT * FROM verses_suggestions WHERE 1=1`;
            const params = [];

            if (topic) {
                query += ` AND topic LIKE ?`;
                params.push(`%${topic}%`);
            }

            if (contextType) {
                query += ` AND context_type = ?`;
                params.push(contextType);
            }

            query += ` ORDER BY usage_count DESC, created_at DESC LIMIT ?`;
            params.push(limit);

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // إضافة اقتراح آية قرآنية
    static async addVerseSuggestion(data) {
        try {
            // التحقق من وجود الآية مسبقاً
            const [existing] = await pool.execute(
                `SELECT id, usage_count FROM verses_suggestions 
                 WHERE verse_text = ? AND surah_name = ? AND verse_number = ?`,
                [data.verse_text, data.surah_name, data.verse_number]
            );

            if (existing.length > 0) {
                // زيادة عدد الاستخدام
                await pool.execute(
                    `UPDATE verses_suggestions SET usage_count = usage_count + 1 WHERE id = ?`,
                    [existing[0].id]
                );
                return existing[0].id;
            } else {
                // إضافة آية جديدة
                const [result] = await pool.execute(
                    `INSERT INTO verses_suggestions (user_id, verse_text, surah_name, verse_number, context_type, topic)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [data.user_id, data.verse_text, data.surah_name, data.verse_number, data.context_type, data.topic]
                );
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }

    // الحصول على اقتراحات الأحاديث
    static async getHadithSuggestions(topic = null, contextType = null, limit = 10) {
        try {
            let query = `SELECT * FROM hadith_suggestions WHERE 1=1`;
            const params = [];

            if (topic) {
                query += ` AND topic LIKE ?`;
                params.push(`%${topic}%`);
            }

            if (contextType) {
                query += ` AND context_type = ?`;
                params.push(contextType);
            }

            query += ` ORDER BY usage_count DESC, created_at DESC LIMIT ?`;
            params.push(limit);

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // إضافة اقتراح حديث
    static async addHadithSuggestion(data) {
        try {
            // التحقق من وجود الحديث مسبقاً
            const [existing] = await pool.execute(
                `SELECT id, usage_count FROM hadith_suggestions 
                 WHERE hadith_text = ? AND narrator = ?`,
                [data.hadith_text, data.narrator]
            );

            if (existing.length > 0) {
                await pool.execute(
                    `UPDATE hadith_suggestions SET usage_count = usage_count + 1 WHERE id = ?`,
                    [existing[0].id]
                );
                return existing[0].id;
            } else {
                const [result] = await pool.execute(
                    `INSERT INTO hadith_suggestions (user_id, hadith_text, narrator, source, authentication, context_type, topic)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [data.user_id, data.hadith_text, data.narrator, data.source, data.authentication, data.context_type, data.topic]
                );
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }

    // الحصول على اقتراحات الأثار
    static async getAtharSuggestions(topic = null, contextType = null, limit = 10) {
        try {
            let query = `SELECT * FROM athar_suggestions WHERE 1=1`;
            const params = [];

            if (topic) {
                query += ` AND topic LIKE ?`;
                params.push(`%${topic}%`);
            }

            if (contextType) {
                query += ` AND context_type = ?`;
                params.push(contextType);
            }

            query += ` ORDER BY usage_count DESC, created_at DESC LIMIT ?`;
            params.push(limit);

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // إضافة اقتراح أثر
    static async addAtharSuggestion(data) {
        try {
            const [existing] = await pool.execute(
                `SELECT id, usage_count FROM athar_suggestions 
                 WHERE athar_text = ? AND speaker = ?`,
                [data.athar_text, data.speaker]
            );

            if (existing.length > 0) {
                await pool.execute(
                    `UPDATE athar_suggestions SET usage_count = usage_count + 1 WHERE id = ?`,
                    [existing[0].id]
                );
                return existing[0].id;
            } else {
                const [result] = await pool.execute(
                    `INSERT INTO athar_suggestions (user_id, athar_text, speaker, context_type, topic)
                     VALUES (?, ?, ?, ?, ?)`,
                    [data.user_id, data.athar_text, data.speaker, data.context_type, data.topic]
                );
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }

    // الحصول على اقتراحات السجع
    static async getSajaSuggestions(topic = null, rhyme = null, limit = 10) {
        try {
            let query = `SELECT * FROM saja_suggestions WHERE 1=1`;
            const params = [];

            if (topic) {
                query += ` AND topic LIKE ?`;
                params.push(`%${topic}%`);
            }

            if (rhyme) {
                query += ` AND rhyme LIKE ?`;
                params.push(`%${rhyme}%`);
            }

            query += ` ORDER BY usage_count DESC, created_at DESC LIMIT ?`;
            params.push(limit);

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // إضافة اقتراح سجع
    static async addSajaSuggestion(data) {
        try {
            const [existing] = await pool.execute(
                `SELECT id, usage_count FROM saja_suggestions 
                 WHERE saja_text = ?`,
                [data.saja_text]
            );

            if (existing.length > 0) {
                await pool.execute(
                    `UPDATE saja_suggestions SET usage_count = usage_count + 1 WHERE id = ?`,
                    [existing[0].id]
                );
                return existing[0].id;
            } else {
                const [result] = await pool.execute(
                    `INSERT INTO saja_suggestions (user_id, saja_text, topic, rhyme, attribution, reference)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [data.user_id, data.saja_text, data.topic, data.rhyme, data.attribution, data.reference]
                );
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }

    // الحصول على اقتراحات الشعر
    static async getPoetrySuggestions(topic = null, rhyme = null, poet = null, limit = 10) {
        try {
            let query = `SELECT * FROM poetry_suggestions WHERE 1=1`;
            const params = [];

            if (topic) {
                query += ` AND topic LIKE ?`;
                params.push(`%${topic}%`);
            }

            if (rhyme) {
                query += ` AND rhyme LIKE ?`;
                params.push(`%${rhyme}%`);
            }

            if (poet) {
                query += ` AND poet LIKE ?`;
                params.push(`%${poet}%`);
            }

            query += ` ORDER BY usage_count DESC, created_at DESC LIMIT ?`;
            params.push(limit);

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // إضافة اقتراح شعر
    static async addPoetrySuggestion(data) {
        try {
            const [existing] = await pool.execute(
                `SELECT id, usage_count FROM poetry_suggestions 
                 WHERE poetry_text = ? AND poet = ?`,
                [data.poetry_text, data.poet]
            );

            if (existing.length > 0) {
                await pool.execute(
                    `UPDATE poetry_suggestions SET usage_count = usage_count + 1 WHERE id = ?`,
                    [existing[0].id]
                );
                return existing[0].id;
            } else {
                const [result] = await pool.execute(
                    `INSERT INTO poetry_suggestions (user_id, poetry_text, topic, rhyme, meter, poet, reference)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [data.user_id, data.poetry_text, data.topic, data.rhyme, data.meter, data.poet, data.reference]
                );
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }

    // الحصول على اقتراحات الدعاء
    static async getDuaSuggestions(duaType = null, topic = null, limit = 10) {
        try {
            let query = `SELECT * FROM dua_suggestions WHERE 1=1`;
            const params = [];

            if (duaType) {
                query += ` AND dua_type = ?`;
                params.push(duaType);
            }

            if (topic) {
                query += ` AND topic LIKE ?`;
                params.push(`%${topic}%`);
            }

            query += ` ORDER BY usage_count DESC, created_at DESC LIMIT ?`;
            params.push(limit);

            const [rows] = await pool.execute(query, params);
            return rows;
        } catch (error) {
            throw error;
        }
    }

    // إضافة اقتراح دعاء
    static async addDuaSuggestion(data) {
        try {
            const [existing] = await pool.execute(
                `SELECT id, usage_count FROM dua_suggestions 
                 WHERE dua_text = ? AND dua_type = ?`,
                [data.dua_text, data.dua_type]
            );

            if (existing.length > 0) {
                await pool.execute(
                    `UPDATE dua_suggestions SET usage_count = usage_count + 1 WHERE id = ?`,
                    [existing[0].id]
                );
                return existing[0].id;
            } else {
                const [result] = await pool.execute(
                    `INSERT INTO dua_suggestions (user_id, dua_text, dua_type, topic, source)
                     VALUES (?, ?, ?, ?, ?)`,
                    [data.user_id, data.dua_text, data.dua_type, data.topic, data.source]
                );
                return result.insertId;
            }
        } catch (error) {
            throw error;
        }
    }
}

module.exports = SermonSuggestions;
