ALTER TABLE spec_editors ADD COLUMN IF NOT EXISTS kat_key TEXT;
ALTER TABLE spec_editors DROP CONSTRAINT IF EXISTS spec_editors_project_id_ad_soyad_key;
ALTER TABLE spec_editors ADD CONSTRAINT spec_editors_project_ad_kat_uq UNIQUE(project_id, ad_soyad, kat_key);
