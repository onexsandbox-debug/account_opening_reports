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
      urn,
      mobile_number,
      income,
      marital_status,
      account_type,
      occupation,
      home_ownership,
      consent
    } = req.body || {};

    // ✅ VALIDATION
    if (!urn || !mobile_number) {
      return res.status(400).json({
        success: false,
        error: "URN and mobile_number are required"
      });
    }

    // 🔥 INSERT
    const { error } = await supabase
      .from('acc_mile_4')
      .insert([
        {
          urn: urn.trim(),
          mobile_number: mobile_number.trim(),
          income,
          marital_status,
          account_type,
          occupation,
          home_ownership,
          consent
        }
      ]);

    if (error) {
      return res.status(500).json({
        success: false,
        error: "Database insert failed",
        details: error.message
      });
    }

    // ✅ RESPONSE
    return res.status(200).json({
      success: true,
      message: "Milestone 4 data saved successfully",
      data: {
        urn,
        mobile_number,
        income,
        marital_status,
        account_type,
        occupation,
        home_ownership,
        consent,
        status: "Completed"
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
