-- Onay talebi silme yetkisi (admin ve talebi gönderen kişi için, kontrol client-side yapılır)
DROP POLICY IF EXISTS "auth delete approval_requests" ON approval_requests;
CREATE POLICY "auth delete approval_requests" ON approval_requests FOR DELETE USING (auth.role()='authenticated');
