-- specs_katalog (71 spec) ile projects (2 spec) arasındaki kopukluğu gider:
-- her katalog satırına karşılık gelen bir projects satırı garanti altına al.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS katalog_id BIGINT REFERENCES specs_katalog(id);
CREATE UNIQUE INDEX IF NOT EXISTS projects_katalog_id_uq ON projects(katalog_id) WHERE katalog_id IS NOT NULL;

INSERT INTO projects (kod, ad, supplier_id, spec_no, asama, katalog_id)
SELECT
  'S' || sk.id,
  COALESCE(NULLIF(sk.proje_adi, ''), sk.tedarikci || ' — Spec ' || sk.spec_no),
  s.id,
  sk.spec_no,
  CASE WHEN sk.durum = 'Completed' THEN 'tamam'::asama_t ELSE 'sozlesme'::asama_t END,
  sk.id
FROM specs_katalog sk
JOIN suppliers s ON s.kod = sk.tedarikci
WHERE NOT EXISTS (SELECT 1 FROM projects p WHERE p.katalog_id = sk.id);
