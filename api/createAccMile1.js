import { createClient } from '@supabase/supabase-js';

// INIT
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// VALIDATION
const isValid = (val) => {
  return (
    val !== undefined &&
    val !== null &&
    val !== "null" &&
    val !== "" &&
    !(typeof val === "string" && val.trim() === "")
  );
};

// 🔥 Convert 12hr → 24hr
const convertTo24Hour = (timeStr) => {
  try {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes, seconds] = time.split(':');

    if (modifier === 'PM' && hours !== '12') {
      hours = String(parseInt(hours) + 12);
    }

    if (modifier === 'AM' && hours === '12') {
      hours = '00';
    }

    return `${hours.padStart(2, '0')}:${minutes}:${seconds}`;
  } catch (e) {
    return timeStr; // fallback
  }
};

export default async function handler(req, res) {
  // CORS
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

    console.log("Incoming:", body);

    // VALIDATION
    if (!isValid(urn) || !isValid(mobile_number)) {
      return res.status(400).json({
        error: "URN and mobile_number are required"
      });
    }

    // CLEAN MOBILE
    mobile_number = mobile_number.toString().slice(-10);

    // DATE (DD-MM-YYYY as-is)
    const finalDate = date;

    // 🔥 TIME FIX (AM/PM → 24hr)
    const finalTime = convertTo24Hour(time);

    console.log("Converted Time:", finalTime);

    // INSERT
    const { data, error } = await supabase
      .from('acc_mile_1')
      .insert([
        {
          urn: urn.trim(),
          mobile_number,
          date: finalDate,     // TEXT
          time: finalTime,     // 24hr format
          otp_validation: otp_validation || 'PENDING'
        }
      ])
      .select();

    if (error) {
      console.error("❌ Insert Error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ Insert Success:", data);

    return res.status(200).json({
      success: true,
      message: "Inserted successfully",
      data
    });

  } catch (err) {
    console.error("❌ Error:", err);

    return res.status(500).json({
      error: "Insert Failed",
      details: err.message
    });
  }
}
