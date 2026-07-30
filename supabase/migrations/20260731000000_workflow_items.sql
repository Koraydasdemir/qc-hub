-- İş akışı (5 kategori) durum takibi + Kritik konular/Uyarılar
CREATE TABLE IF NOT EXISTS workflow_items (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  status TEXT DEFAULT 'grey',
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  UNIQUE(project_id, item_key)
);
ALTER TABLE workflow_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read workflow_items" ON workflow_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert workflow_items" ON workflow_items FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update workflow_items" ON workflow_items FOR UPDATE USING (auth.role() = 'authenticated');

CREATE TABLE IF NOT EXISTS critical_alerts (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  metin TEXT NOT NULL,
  giren TEXT,
  tarih TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE critical_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read critical_alerts" ON critical_alerts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert critical_alerts" ON critical_alerts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update critical_alerts" ON critical_alerts FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can delete critical_alerts" ON critical_alerts FOR DELETE USING (auth.role() = 'authenticated');
