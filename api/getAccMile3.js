import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {

    const { data, error } = await supabase
      .from('acc_mile_3')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // ✅ Format response (IST safe)
    const formatted = (data || []).map(item => {

      let date = item.date;
      let time = item.time;

      // fallback if not present
      if (!date || !time) {
        const dt = new Date(item.created_at);

        date = dt.toLocaleDateString('en-GB', {
          timeZone: 'Asia/Kolkata'
        });

        time = dt.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }

      return {
        ...item,
        date,
        time
      };
    });

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
