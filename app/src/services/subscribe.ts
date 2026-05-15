const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: any = null;

async function getClient() {
  if (supabaseClient) return supabaseClient;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
  } catch {
    return null;
  }
}

export async function subscribeEmail(email: string): Promise<{ error?: string }> {
  const client = await getClient();
  if (!client) {
    return { error: 'Subscription service not configured' };
  }

  const { error } = await client
    .from('subscribers')
    .insert([{ email, subscribed_at: new Date().toISOString() }]);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Already subscribed' };
    }
    return { error: error.message };
  }

  return {};
}
