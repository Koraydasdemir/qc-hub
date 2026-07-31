-- Onay talebini kimlerin görebileceğini talep eden kişi belirler
ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS gorunur_kisiler TEXT[] DEFAULT '{}';
ALTER TABLE approval_requests ADD COLUMN IF NOT EXISTS herkese_acik BOOLEAN DEFAULT false;
