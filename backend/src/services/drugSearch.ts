import { query } from '../db.js';

export const searchDrugs = async (q: string) => {
    const cleanQuery = q.trim();
    if (!cleanQuery) return [];

    const sql = `
        SELECT * FROM drugs 
        WHERE trade_name LIKE ? OR active_ingredient LIKE ? 
        ORDER BY trade_name ASC 
        LIMIT 20
    `;
    const params = [`%${cleanQuery}%`, `%${cleanQuery}%`];

    const rows = await query(sql, params);
    return Array.isArray(rows) ? rows : [];
};

/*
  ✅ تعديل findAlternatives
  - تستقبل المادة المسببة للحساسية
  - تستبعد أي دواء يحتوي عليها
  - تستبعد الدواء الأصلي
  - ترتب البدائل بالأرخص
*/
export const findAlternatives = async (
    allergicIngredient: string,
    excludeTradeName: string
) => {
    const sql = `
        SELECT * FROM drugs 
        WHERE active_ingredient != ? 
        AND trade_name != ? 
        ORDER BY avg_price ASC
        LIMIT 5
    `;

    const rows = await query(sql, [
        allergicIngredient,
        excludeTradeName
    ]);

    return Array.isArray(rows) ? rows : [];
};
