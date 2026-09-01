export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.authorization !== `Bearer ${cronSecret}`) {
    return response.status(401).json({ ok: false });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Keep-alive: missing Supabase environment variables');
    return response.status(500).json({ ok: false });
  }

  try {
    const queryResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/matches?select=id&limit=1`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      },
    );

    if (!queryResponse.ok) {
      console.error(`Keep-alive: Supabase query failed (${queryResponse.status})`);
      return response.status(502).json({ ok: false });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Keep-alive: Supabase request failed', error);
    return response.status(502).json({ ok: false });
  }
}
