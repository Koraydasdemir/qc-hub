import { createClient } from "@supabase/supabase-js";

// DEMO ortamı — ayrı bir Supabase projesine bağlanır, gerçek TECHMP verisine hiç dokunmaz.
export const SUPABASE_URL = "https://tzvfxhmbzzgfqlyfocvb.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dmZ4aG1ienpnZnFseWZvY3ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwMjE1MDEsImV4cCI6MjEwNTU5NzUwMX0.l_-3jgpRSGUZL3Ir-A8pEW7oP_2uF3Qy8RHPS0TqEFg";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// Demo kullanıcı adı → e-posta eşlemesi
export const KULLANICI_EPOSTA = {
  Koraydasdemir: "demo@ornekmuhendislik.com",
};
