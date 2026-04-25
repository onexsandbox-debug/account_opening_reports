import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  // ✅ CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {

    // 🔥 STEP 1: DELETE OLD DATA
    const { error: delError } = await supabase
      .from('final_account_details')
      .delete()
      .neq('urn', ''); // delete all

    if (delError) {
      return res.status(500).json({
        success: false,
        error: "Delete failed",
        details: delError.message
      });
    }

    // 🔥 STEP 2: RUN RAW SQL JOIN
    const { error: insertError } = await supabase.rpc('build_final_report');

    if (insertError) {
      return res.status(500).json({
        success: false,
        error: "Insert failed",
        details: insertError.message
      });
    }

    return res.status(200).json({
      success: true,
      message: "Final report generated successfully"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
