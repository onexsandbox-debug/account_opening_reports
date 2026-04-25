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
      client_id,
      surepass_token,
      mobile_number,   // ✅ NEW
      urn   // ✅ NEW
    } = req.body || {};

    if (!client_id || !surepass_token || !mobile_number || !urn) {
      return res.status(400).json({
        success: false,
        error: "client_id, surepass_token, mobile_number and URN are required"
      });
    }

    // 🔥 STEP 1: CALL SUREPASS
    const surepassRes = await fetch(
      `https://sandbox.surepass.io/api/v1/digilocker/download-aadhaar/${client_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${surepass_token}`
        }
      }
    );

    const surepassData = await surepassRes.json();

    if (!surepassData.success) {
      return res.status(400).json({
        success: false,
        error: "Surepass API failed",
        details: surepassData
      });
    }

    const aadhaar = surepassData?.data?.aadhaar_xml_data;

    if (!aadhaar) {
      return res.status(400).json({
        success: false,
        error: "Invalid Aadhaar data"
      });
    }

    // 🔧 HELPERS
    const formatDOB = (dob) => {
      if (!dob) return null;
      const [y, m, d] = dob.split("-");
      return `${d}-${m}-${y}`;
    };

    const formatGender = (g) => {
      if (g === "M") return "Male";
      if (g === "F") return "Female";
      return g;
    };

    // 🔥 STEP 2: INSERT INTO DB (NO IMAGE)
    const { error: dbError } = await supabase
      .from('acc_mile_3')
      .insert([
        {
          urn: urn,
          full_name: aadhaar.full_name,
          care_of: aadhaar.care_of,
          father_name: aadhaar.father_name,
          dob: aadhaar.dob, // YYYY-MM-DD
          gender: formatGender(aadhaar.gender),
          masked_aadhaar: aadhaar.masked_aadhaar,
          full_address: aadhaar.full_address,
          zip: aadhaar.zip,
          mobile_number: mobile_number,  // ✅ NEW
          client_id: client_id           // ✅ NEW
        }
      ]);

    if (dbError) {
  return res.status(500).json({
    success: false,
    error: "Database insert failed",
    details: dbError.message
  });
}

    // 🔥 FINAL RESPONSE (WITH BASE64)
    return res.status(200).json({
      success: true,
      data: {
        urn: urn,   // ✅ RETURN BACK
        full_name: aadhaar.full_name,
        care_of: aadhaar.care_of,
        father_name: aadhaar.father_name,
        dob: formatDOB(aadhaar.dob),
        gender: formatGender(aadhaar.gender),
        masked_aadhaar: aadhaar.masked_aadhaar,
        full_address: aadhaar.full_address,
        zip: aadhaar.zip,
        profile_image: aadhaar.profile_image, // ✅ BASE64 RETURN
        uniqueness_id: aadhaar.uniqueness_id,
        mobile_number: mobile_number,
        client_id: client_id,
        status: "Verified"
      }
    });

  } catch (err) {
    console.error("❌ Error:", err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
