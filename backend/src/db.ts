import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// إنشاء مسبح الاتصالات (Connection Pool)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pharmacy_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// تصدير دالة query لتنفيذ الاستعلامات
export const query = async (sql: string, params?: any[]) => {
    const [results] = await pool.execute(sql, params);
    return results;
};