import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {

    const { data, error } = await supabase.rpc('get_funnel_counts');

    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    return res.status(200).json({
      success: true,
      data: data[0]
    });

  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
