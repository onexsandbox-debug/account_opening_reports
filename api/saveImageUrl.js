import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  try {

    const {
      profile_image,   // ✅ URL
      mobile_number,
      client_id
    } = req.body || {};

    if (!profile_image) {
      return res.status(400).json({
        success: false,
        error: "profile_image (URL) is required"
      });
    }

    // 🔥 INSERT INTO DB
    const { data, error } = await supabase
      .from('acc_mile_3')
      .insert([
        {
          profile_image,
          mobile_number,
          client_id
        }
      ])
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // ✅ RESPONSE
    return res.status(200).json({
      success: true,
      message: "Image URL saved successfully",
      data: data[0]
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
