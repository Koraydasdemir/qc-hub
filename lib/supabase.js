import { createClient } from "@supabase/supabase-js";

// Publishable (anon) key — client-side için güvenli; erişimi RLS korur.
export const SUPABASE_URL = "https://nslnivsnnjpvwbwfjiof.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zbG5pdnNubmpwdndid2ZqaW9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MDMxNDUsImV4cCI6MjEwMDM3OTE0NX0.JskJG3eID5Rb5jrGYXaOQjGFFvL_mrjYgyStTh3w58E";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Faz 1 alışkanlığı: kullanıcı adı → e-posta eşlemesi (şimdilik tek kullanıcı)
export const KULLANICI_EPOSTA = {
  Korayd: "koraydsdmr444@gmail.com",
  Okaybey: "okaybey@techmp.local",
  Aysenur: "aysenur@techmp.local",
  Burakb: "burakb@techmp.local",
  Hakans: "hakans@techmp.local",
  Kader: "kader@techmp.local",
  Ozgur: "ozgur@techmp.local",
};
