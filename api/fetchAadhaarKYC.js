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
      onexaura_apikey,
      phone_number
    } = req.body || {};

    if (!client_id || !surepass_token || !onexaura_apikey || !phone_number) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters"
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

    const base64ToBuffer = (base64) => Buffer.from(base64, 'base64');

    // 🔥 STEP 2: IMAGE UPLOAD
    let image_url = null;

    try {
      if (aadhaar.profile_image) {

        const buffer = base64ToBuffer(aadhaar.profile_image);

        const formData = new FormData();
        formData.append("phone_number", phone_number);

        const blob = new Blob([buffer], { type: "image/jpeg" });
        formData.append("file", blob, "aadhaar.jpg");

        const uploadRes = await fetch(
          'https://api.onexaura.com/wa/mediaupload',
          {
            method: 'POST',
            headers: {
              apikey: onexaura_apikey
            },
            body: formData
          }
        );

        const uploadData = await uploadRes.json();

        image_url = uploadData?.url || uploadData?.data?.url || null;
      }
    } catch (imgErr) {
      console.error("⚠️ Image upload failed:", imgErr);
    }

    // 🔥 STEP 3: INSERT INTO DB
    const { error: dbError } = await supabase
      .from('acc_mile_3')
      .insert([
        {
          full_name: aadhaar.full_name,
          care_of: aadhaar.care_of,
          father_name: aadhaar.father_name,
          dob: aadhaar.dob, // DB format
          gender: formatGender(aadhaar.gender),
          masked_aadhaar: aadhaar.masked_aadhaar,
          full_address: aadhaar.full_address,
          zip: aadhaar.zip,
          profile_image: image_url
        }
      ]);

    if (dbError) {
      console.error("❌ DB Error:", dbError);
    }

    // 🔥 FINAL RESPONSE
    return res.status(200).json({
      success: true,
      data: {
        full_name: aadhaar.full_name,
        care_of: aadhaar.care_of,
        father_name: aadhaar.father_name,
        dob: formatDOB(aadhaar.dob),
        gender: formatGender(aadhaar.gender),
        masked_aadhaar: aadhaar.masked_aadhaar,
        full_address: aadhaar.full_address,
        zip: aadhaar.zip,
        profile_image: image_url,
        uniqueness_id: aadhaar.uniqueness_id,
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
