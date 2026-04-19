import { createClient } from '@supabase/supabase-js';

// 🔍 ENV DEBUG
console.log("INIT: SUPABASE_URL =", process.env.SUPABASE_URL);
console.log(
  "INIT: SUPABASE_ANON_KEY =",
  process.env.SUPABASE_ANON_KEY ? "Loaded ✅" : "Missing ❌"
);

// ✅ Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 🔧 Utility: validate input
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
  console.log("---- INSERT API INVOKED ----");

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
    const body = req.body || {};

    let { urn, mobile_number, otp_validation, date, time } = body;

    console.log("Incoming Body:", body);

    // =========================
    // VALIDATION
    // =========================
    if (!isValid(urn) || !isValid(mobile_number)) {
      return res.status(400).json({
        error: "URN and mobile_number are required"
      });
    }

    // 📱 Clean mobile number
    mobile_number = mobile_number.toString().slice(-10);

    // =========================
    // DATE FORMAT (DD-MM-YYYY)
    // =========================
    const now = new Date();

    const formattedDate = date
      ? date
      : now.toLocaleDateString('en-GB').replace(/\//g, '-'); // DD-MM-YYYY

    const formattedTime = time
      ? time
      : now.toTimeString().split(' ')[0]; // HH:MM:SS

    // =========================
    // INSERT
    // =========================
    const { data, error } = await supabase
      .from('acc_mile_1')
      .insert([
        {
          urn: urn.trim(),
          mobile_number,
          date: formattedDate,   // stored as TEXT
          time: formattedTime,
          otp_validation: otp_validation || 'PENDING'
        }
      ])
      .select();

    if (error) {
      console.error("❌ Supabase Insert Error:", error);

      return res.status(400).json({
        error: error.message
      });
    }

    console.log("✅ Insert Successful:", data);

    return res.status(200).json({
      success: true,
      message: "Record inserted successfully",
      data
    });

  } catch (err) {
    console.error("❌ Connection Error:", err);

    return res.status(500).json({
      error: "Insert Failed",
      details: err.message
    });
  }
}
