-- Sayfa bölümü bazında yetkili (veri girebilecek) kişi ataması
CREATE TABLE IF NOT EXISTS section_editors (
  id BIGSERIAL PRIMARY KEY,
  sayfa TEXT NOT NULL,
  bolum_key TEXT NOT NULL,
  ad_soyad TEXT NOT NULL,
  atayan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sayfa, bolum_key, ad_soyad)
);
ALTER TABLE section_editors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read section_editors" ON section_editors FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert section_editors" ON section_editors FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth delete section_editors" ON section_editors FOR DELETE USING (auth.role()='authenticated');
