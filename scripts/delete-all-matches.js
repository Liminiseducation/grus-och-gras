#!/usr/bin/env node
/*
  Safe script to delete all rows in the `matches` table.
  Usage: node scripts/delete-all-matches.js --yes
  It will read VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from environment
  (or from a .env file if `dotenv` is installed).
*/

async function main() {
  try {
    // Try to load .env if dotenv is available (optional)
    try {
      // eslint-disable-next-line global-require, import/no-extraneous-dependencies
      const dotenv = require('dotenv');
      dotenv.config();
    } catch (e) {
      // dotenv not installed — that's OK, require env vars to be set externally
    }

    const args = process.argv.slice(2);
    if (!args.includes('--yes')) {
      console.log('\nThis will delete ALL rows in the `matches` table.');
      console.log('To proceed run: npm run delete:matches -- --yes');
      console.log('Aborting.');
      process.exit(1);
    }

    const { createClient } = require('@supabase/supabase-js');

    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;

    if (!url || !key) {
      console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
      process.exit(1);
    }

    const supabase = createClient(url, key);

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
}

main();
