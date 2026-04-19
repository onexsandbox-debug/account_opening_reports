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

// 🔥 Convert DD-MM-YYYY → YYYY-MM-DD
const convertToISODate = (dateStr) => {
  try {
    const [day, month, year] = dateStr.split('-');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return null;
  }
};

// 🔥 Convert AM/PM → 24-hour format
const normalizeTime = (timeStr) => {
  try {
    if (!timeStr.includes('AM') && !timeStr.includes('PM')) {
      return timeStr; // already 24-hour
    }

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
    return null;
  }
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
    if (!isValid(urn) || !isValid(mobile_number) || !isValid(date) || !isValid(time)) {
      return res.status(400).json({
        error: "urn, mobile_number, date, and time are required"
      });
    }

    // 📱 Clean mobile number (last 10 digits)
    mobile_number = mobile_number.toString().slice(-10);

    // 📅 Fix date
    const finalDate = convertToISODate(date);
    if (!finalDate) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // ⏰ Fix time
    const finalTime = normalizeTime(time);
    if (!finalTime) {
      return res.status(400).json({ error: "Invalid time format" });
    }

    console.log("Final Date:", finalDate);
    console.log("Final Time:", finalTime);

    // =========================
    // INSERT
    // =========================
    const { data, error } = await supabase
      .from('acc_mile_1')
      .insert([
        {
          urn: urn.trim(),
          mobile_number,
          date: finalDate,   // YYYY-MM-DD
          time: finalTime,   // HH:MM:SS (24hr)
          otp_validation: otp_validation || 'PENDING'
        }
      ])
      .select();

    if (error) {
      console.error("❌ Supabase Insert Error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("✅ Insert Success:", data);

    return res.status(200).json({
      success: true,
      message: "Record inserted successfully",
      data
    });

  } catch (err) {
    console.error("❌ Server Error:", err);

    return res.status(500).json({
      error: "Insert Failed",
      details: err.message
    });
  }
}
