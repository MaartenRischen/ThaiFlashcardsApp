import { createClient } from '@supabase/supabase-js';

// Load from environment or hardcode for one-off script
const SUPABASE_URL = process.env.SUPABASE_URL || '<YOUR_SUPABASE_URL>';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '<YOUR_SERVICE_ROLE_KEY>';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function backfillSeriousnessLevel() {
  console.log('Starting backfill of seriousnessLevel for FlashcardSet...');
  // Update all sets where seriousnessLevel is null
  const { data, error } = await supabase
    .from('FlashcardSet')
    .update({ seriousnessLevel: 50 })
    .is('seriousnessLevel', null);

  if (error) {
    console.error('Error updating sets:', error);
    process.exit(1);
  }

  const updated = data as any;
  if (Array.isArray(updated)) {
    console.log(`Backfill complete. Updated ${updated.length} sets.`);
  } else {
    console.log('Backfill complete. Data returned:', updated);
  }
}

backfillSeriousnessLevel(); 