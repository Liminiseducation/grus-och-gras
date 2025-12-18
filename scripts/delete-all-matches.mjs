#!/usr/bin/env node
// ESM-safe script to delete all rows in the `matches` table.
// Usage: node scripts/delete-all-matches.mjs --yes

try {
  await import('dotenv').then(d => d.config()).catch(() => {});
} catch (e) {
  // top-level await may not be supported in older Node — ignore
}

import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
if (!args.includes('--yes')) {
  console.log('\nThis will delete ALL rows in the `matches` table.');
  console.log('To proceed run: node scripts/delete-all-matches.mjs --yes');
  console.log('Aborting.');
  process.exit(1);
}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(url, key);

(async () => {
  try {
    console.log('Fetching matches...');
    const { data, error } = await supabase.from('matches').select('id');
    if (error) {
      console.error('Error fetching matches:', error);
      process.exit(1);
    }

    const ids = (data || []).map(r => r.id).filter(Boolean);
    if (ids.length === 0) {
      console.log('No matches found. Nothing to delete.');
      process.exit(0);
    }

    console.log(`Found ${ids.length} matches — deleting...`);
    const { error: delErr } = await supabase.from('matches').delete().in('id', ids);
    if (delErr) {
      console.error('Error deleting matches:', delErr);
      process.exit(1);
    }

    console.log('All matches deleted successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
})();
