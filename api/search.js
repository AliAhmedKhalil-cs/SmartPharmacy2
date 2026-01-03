export default function handler(req, res) {
  if (req.method === 'POST') {
    const { query } = req.body;
    // هنا منطق البحث
    res.status(200).json({ result: 'نتيجة البحث' });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
