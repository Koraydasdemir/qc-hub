-- Personel atama (spec bazlı yetkili kişiler)
CREATE TABLE IF NOT EXISTS spec_editors (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ad_soyad TEXT NOT NULL,
  atayan TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, ad_soyad)
);
ALTER TABLE spec_editors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read spec_editors" ON spec_editors FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert spec_editors" ON spec_editors FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth delete spec_editors" ON spec_editors FOR DELETE USING (auth.role()='authenticated');

-- workflow_items: metin/dosya/tarih alanları için ek kolonlar
ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS text_value TEXT;
ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE workflow_items ADD COLUMN IF NOT EXISTS file_tarih DATE;

-- NCR / DÖF / TQ takip tablosu
CREATE TABLE IF NOT EXISTS ncr_tq_items (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tur TEXT NOT NULL CHECK (tur IN ('ncr','dof','tq')),
  baslik TEXT NOT NULL,
  dosya_url TEXT,
  durum TEXT NOT NULL DEFAULT 'acik',
  giren TEXT,
  tarih TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ncr_tq_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read ncr_tq_items" ON ncr_tq_items FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert ncr_tq_items" ON ncr_tq_items FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth update ncr_tq_items" ON ncr_tq_items FOR UPDATE USING (auth.role()='authenticated');

-- İş akışı alt başlık ekleme/çıkarma önerileri (Koray onayına düşer)
CREATE TABLE IF NOT EXISTS workflow_proposals (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kat_key TEXT NOT NULL,
  tip TEXT NOT NULL CHECK (tip IN ('add','remove')),
  item_key TEXT,
  item_ad TEXT,
  proposed_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workflow_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read workflow_proposals" ON workflow_proposals FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert workflow_proposals" ON workflow_proposals FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth update workflow_proposals" ON workflow_proposals FOR UPDATE USING (auth.role()='authenticated');

-- Koray onayladığında eklenen özel alt başlıklar
CREATE TABLE IF NOT EXISTS workflow_custom_items (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  kat_key TEXT NOT NULL,
  item_key TEXT NOT NULL,
  item_ad TEXT NOT NULL,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE workflow_custom_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read workflow_custom_items" ON workflow_custom_items FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert workflow_custom_items" ON workflow_custom_items FOR INSERT WITH CHECK (auth.role()='authenticated');
CREATE POLICY "auth update workflow_custom_items" ON workflow_custom_items FOR UPDATE USING (auth.role()='authenticated');

-- Koray onayladığında kaldırılan sabit alt başlıklar
CREATE TABLE IF NOT EXISTS workflow_hidden_items (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  UNIQUE(project_id, item_key)
);
ALTER TABLE workflow_hidden_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read workflow_hidden_items" ON workflow_hidden_items FOR SELECT USING (auth.role()='authenticated');
CREATE POLICY "auth insert workflow_hidden_items" ON workflow_hidden_items FOR INSERT WITH CHECK (auth.role()='authenticated');

-- Dosya yükleme için storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('is-akisi', 'is-akisi', true)
ON CONFLICT (id) DO NOTHING;
CREATE POLICY "auth read is-akisi" ON storage.objects FOR SELECT USING (bucket_id='is-akisi' AND auth.role()='authenticated');
CREATE POLICY "auth insert is-akisi" ON storage.objects FOR INSERT WITH CHECK (bucket_id='is-akisi' AND auth.role()='authenticated');
CREATE POLICY "auth update is-akisi" ON storage.objects FOR UPDATE USING (bucket_id='is-akisi' AND auth.role()='authenticated');
