import { createClient } from '@supabase/supabase-js';

// 🔐 Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🔧 Utility validation
const isValid = (val) => {
  return (
    val !== undefined &&
    val !== null &&
    val !== "null" &&
    val !== "" &&
    !(typeof val === "string" && val.trim() === "")
  );
};

export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {

    const {
      urn,
      account_type,
      full_name,
      pan_number,
      pan_status,   // ✅ NEW FIELD
      father_name,
      mobile_number
    } = req.body || {};

    // 🚨 Required validation
    if (!isValid(urn) || !isValid(mobile_number)) {
      return res.status(400).json({
        success: false,
        error: "URN and mobile_number are required"
      });
    }

    // 🔥 Insert into Supabase (NO date/time passed)
    const { data, error } = await supabase
      .from('acc_mile_2')
      .insert([
        {
          urn,
          account_type,
          full_name,
          pan_number,
          pan_status,   // ✅ inserted
          father_name,
          mobile_number
          // ❌ date & time NOT passed → DB auto fills
        }
      ])
      .select();

    if (error) {
      console.error("❌ Supabase Error:", error);
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "Data inserted successfully",
      data
    });

  } catch (err) {
    console.error("❌ Server Error:", err);

    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: err.message
    });
  }
}
