'use client';

import { useEffect, useState } from 'react';

export default function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch analytics data from Supabase
    setLoading(false);
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
      <h2>📊 Analytics & Raporlar</h2>
      <p style={{ color: '#6b7280' }}>İstatistikler ve sistem raporları</p>

      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {/* TODO: Implement analytics cards and charts */}
        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280' }}>Toplam Spec Sayısı</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>0</p>
        </div>
        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280' }}>Bekleyen Onaylar</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>0</p>
        </div>
        <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280' }}>Aktif Kullanıcılar</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '8px' }}>0</p>
        </div>
      </div>
    </div>
  );
}
