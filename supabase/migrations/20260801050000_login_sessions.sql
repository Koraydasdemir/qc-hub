-- Giriş/çıkış takibi (admin için oturum kayıtları)
CREATE TABLE IF NOT EXISTS login_sessions (
  id BIGSERIAL PRIMARY KEY,
  kullanici TEXT NOT NULL,
  giris_zamani TIMESTAMPTZ DEFAULT now(),
  cikis_zamani TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE login_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read login_sessions" ON login_sessions FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert login_sessions" ON login_sessions FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth update login_sessions" ON login_sessions FOR UPDATE USING (auth.role()='authenticated');
