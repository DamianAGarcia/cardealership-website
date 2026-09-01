// Creates one shared Supabase connection, used by both the public
// site (js/public.js) and the admin panel (js/admin.js).

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
