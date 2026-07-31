-- Admin'in her sayfadaki bölümleri taşıma/gizleme/renk/emoji ile özelleştirmesi
CREATE TABLE IF NOT EXISTS layout_settings (
  id BIGSERIAL PRIMARY KEY,
  sayfa TEXT NOT NULL,
  bolum_key TEXT NOT NULL,
  sira INT,
  gizli BOOLEAN DEFAULT false,
  emoji TEXT,
  renk TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  UNIQUE(sayfa, bolum_key)
);
ALTER TABLE layout_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read layout_settings" ON layout_settings FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert layout_settings" ON layout_settings FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth update layout_settings" ON layout_settings FOR UPDATE USING (auth.role()='authenticated');
CREATE POLICY "auth delete layout_settings" ON layout_settings FOR DELETE USING (auth.role()='authenticated');

-- Kurtarma amaçlı yedekler (Koray'ın manuel "yedek al" / "geri yükle" işlemleri için)
CREATE TABLE IF NOT EXISTS layout_settings_yedek (
  id BIGSERIAL PRIMARY KEY,
  etiket TEXT,
  veri JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);
ALTER TABLE layout_settings_yedek ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read layout_settings_yedek" ON layout_settings_yedek FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert layout_settings_yedek" ON layout_settings_yedek FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth delete layout_settings_yedek" ON layout_settings_yedek FOR DELETE USING (auth.role()='authenticated');
