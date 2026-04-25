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
      .select(`
        full_name,
        gender,
        dob,
        masked_aadhaar,
        full_address,
        zip,
        status,
        date,
        time,
        created_at,
        mobile_number,
        profile_image,
        urn
      `)
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
        urn: item.urn || null,
        full_name: item.full_name,
        gender: item.gender,
        dob: item.dob,
        masked_aadhaar: item.masked_aadhaar,
        full_address: item.full_address,
        zip: item.zip,
        status: item.status || "Verified",
        mobile_number: item.mobile_number || null,     // ✅ ensured
        profile_image: item.profile_image || null,     // ✅ ensured (URL)
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
