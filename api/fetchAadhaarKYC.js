import { createClient } from '@supabase/supabase-js'; // optional if later needed

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
    } = req.body;

    if (!client_id || !surepass_token || !onexaura_apikey || !phone_number) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameters"
      });
    }

    // 🔥 STEP 1: CALL SUREPASS API
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

    // 🔥 STEP 2: TRANSFORM DATA

    // DOB → DD-MM-YYYY
    const formatDOB = (dob) => {
      if (!dob) return null;
      const [y, m, d] = dob.split("-");
      return `${d}-${m}-${y}`;
    };

    // Gender
    const formatGender = (g) => {
      if (g === "M") return "Male";
      if (g === "F") return "Female";
      return g;
    };

    // 🔥 STEP 3: CONVERT BASE64 → FILE → UPLOAD

    const base64ToBuffer = (base64) => {
      return Buffer.from(base64, 'base64');
    };

    let image_url = null;

    if (aadhaar.profile_image) {

      const buffer = base64ToBuffer(aadhaar.profile_image);

      const formData = new FormData();
      formData.append("phone_number", phone_number);

      // Create file blob
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

    // 🔥 STEP 4: FINAL RESPONSE (FLAT JSON)

    const response = {
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
    };

    return res.status(200).json({
      success: true,
      data: response
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      details: err.message
    });
  }
}
