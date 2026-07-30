-- Project Roadmap: eksik alanları ekle
ALTER TABLE project_roadmap ADD COLUMN IF NOT EXISTS spec_date DATE;
ALTER TABLE project_roadmap ADD COLUMN IF NOT EXISTS contract_date DATE;
ALTER TABLE project_roadmap ADD COLUMN IF NOT EXISTS payments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE project_roadmap ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '[]'::jsonb;

-- payments örnek yapısı: [{"name":"Advance Payment","amount":10000,"paid":false}, ...]
-- custom_fields örnek yapısı: [{"label":"Ek Başlık","value":"..."}]
