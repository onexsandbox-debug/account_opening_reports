import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {

    const { data, error } = await supabase
      .from('final_account_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // ✅ Format Date & Time (IST safe)
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
        urn: item.urn,
        mobile_number: item.mobile_number,
        full_name: item.full_name,
        pan_number: item.pan_number,
        pan_status: item.pan_status,
        father_name: item.father_name,
        gender: item.gender,
        dob: item.dob,
        masked_aadhaar: item.masked_aadhaar,
        full_address: item.full_address,
        zip: item.zip,
        income: item.income,
        marital_status: item.marital_status,
        occupation: item.occupation,
        home_ownership: item.home_ownership,
        consent: item.consent,
        otp_status: item.otp_status,
        account_type: item.account_type,
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
