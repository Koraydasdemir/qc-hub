'use client';

import { useEffect, useState } from 'react';

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch pending approvals from Supabase
    setLoading(false);
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
      <h2>✅ Onay Kuyruğu</h2>
      <p style={{ color: '#6b7280' }}>Bekleyen onayları gözden geçir</p>

      <div style={{ marginTop: '24px' }}>
        {/* TODO: Implement approval workflow UI */}
        <p>Bekleyen onaylar burada yer alacak...</p>
      </div>
    </div>
  );
}
