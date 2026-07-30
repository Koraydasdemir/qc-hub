-- Genel onay talebi sistemi
CREATE TABLE IF NOT EXISTS approval_requests (
  id BIGSERIAL PRIMARY KEY,
  metin TEXT NOT NULL,
  hedef_kisi TEXT NOT NULL,
  talep_eden TEXT,
  talep_tarihi TEXT,
  onay_tarihi TEXT,
  durum TEXT NOT NULL DEFAULT 'bekliyor',
  dosya_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read approval_requests" ON approval_requests FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert approval_requests" ON approval_requests FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth update approval_requests" ON approval_requests FOR UPDATE USING (auth.role()='authenticated');

INSERT INTO storage.buckets (id, name, public) VALUES ('onay-belge', 'onay-belge', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "auth read onay-belge" ON storage.objects FOR SELECT USING (bucket_id='onay-belge' AND auth.role()='authenticated');
CREATE POLICY "auth insert onay-belge" ON storage.objects FOR INSERT WITH CHECK (bucket_id='onay-belge' AND auth.role()='authenticated');

-- Açık konular: döküman
ALTER TABLE open_issues ADD COLUMN IF NOT EXISTS dosya_url TEXT;
INSERT INTO storage.buckets (id, name, public) VALUES ('acik-konu-belge', 'acik-konu-belge', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "auth read acik-konu-belge" ON storage.objects FOR SELECT USING (bucket_id='acik-konu-belge' AND auth.role()='authenticated');
CREATE POLICY "auth insert acik-konu-belge" ON storage.objects FOR INSERT WITH CHECK (bucket_id='acik-konu-belge' AND auth.role()='authenticated');

-- NCR arşivi: döküman
ALTER TABLE ncr_records ADD COLUMN IF NOT EXISTS dosya_url TEXT;
INSERT INTO storage.buckets (id, name, public) VALUES ('ncr-arsiv-belge', 'ncr-arsiv-belge', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "auth read ncr-arsiv-belge" ON storage.objects FOR SELECT USING (bucket_id='ncr-arsiv-belge' AND auth.role()='authenticated');
CREATE POLICY "auth insert ncr-arsiv-belge" ON storage.objects FOR INSERT WITH CHECK (bucket_id='ncr-arsiv-belge' AND auth.role()='authenticated');

-- Spesifikasyon kataloğu: bedel
ALTER TABLE specs_katalog ADD COLUMN IF NOT EXISTS bedel TEXT;
