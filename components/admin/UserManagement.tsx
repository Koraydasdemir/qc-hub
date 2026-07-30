'use client';

import { useEffect, useState } from 'react';

export default function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch users from Supabase
    setLoading(false);
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
      <h2>👥 Kullanıcı Yönetimi</h2>
      <p style={{ color: '#6b7280' }}>Kullanıcıları ve yetkilerini yönet</p>

      <div style={{ marginTop: '24px' }}>
        {/* TODO: Implement user list with permission controls */}
        <p>Kullanıcı listesi burada yer alacak...</p>
      </div>
    </div>
  );
}
