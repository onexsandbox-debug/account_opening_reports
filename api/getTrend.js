import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {

    const { data, error } = await supabase.rpc('get_user_trend');

    if (error) {
      console.error("RPC Error:", error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
