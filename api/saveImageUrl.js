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
      profile_image,
      mobile_number,
      client_id
    } = req.body || {};

    if (!profile_image || !mobile_number || !client_id) {
      return res.status(400).json({
        success: false,
        error: "profile_image, mobile_number and client_id are required"
      });
    }

    // 🔥 UPDATE EXISTING RECORD
    const { data, error } = await supabase
      .from('acc_mile_3')
      .update({ profile_image })
      .eq('mobile_number', mobile_number)
      .eq('client_id', client_id)
      .select();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // ⚠️ If no rows updated
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No matching record found for given mobile_number and client_id"
      });
    }

    // ✅ SUCCESS
    return res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: data[0]
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
