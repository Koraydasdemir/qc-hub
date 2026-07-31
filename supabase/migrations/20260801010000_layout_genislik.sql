-- Bölüm genişliği kontrolü (Düzenle modunda admin ayarlayabilir)
ALTER TABLE layout_settings ADD COLUMN IF NOT EXISTS genislik TEXT;
