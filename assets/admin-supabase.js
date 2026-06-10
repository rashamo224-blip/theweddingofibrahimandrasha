import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://pvskgstowquikczwinwd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KinKV-BvjxZ3rfcJwO4Ysg_c2asJlvr";
export const ADMIN_EMAIL = "rashamo224@gmail.com";

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

export const getAuthorizedUser = async () => {
  const { data, error } = await supabaseClient.auth.getUser();
  if (error || !data.user || data.user.email?.toLowerCase() !== ADMIN_EMAIL) {
    if (data.user) await supabaseClient.auth.signOut();
    return null;
  }
  return data.user;
};

export const signInAdmin = async (password) => {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password
  });
  if (error) throw error;
  if (data.user?.email?.toLowerCase() !== ADMIN_EMAIL) {
    await supabaseClient.auth.signOut();
    throw new Error("This account is not authorized.");
  }
  return data.user;
};
