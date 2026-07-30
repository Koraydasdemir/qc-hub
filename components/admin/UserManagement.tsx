'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { grantPermission } from '../../lib/supabase/queries';
import { getPermissionLabel } from '../../lib/supabase/permissions';

interface User {
  id: string;
  email: string;
  name?: string;
  permission_level: 'admin' | 'editor' | 'viewer';
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('user_permissions')
        .select('user_id, permission_level')
        .order('created_at', { ascending: false });

      if (err) throw err;

      // TODO: Fetch user details from auth.users
      const formattedUsers: User[] = (data || []).map((item: any) => ({
        id: item.user_id,
        email: 'user@example.com', // Placeholder
        permission_level: item.permission_level,
      }));

      setUsers(formattedUsers);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kullanıcılar yüklenemedi';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (userId: string, newLevel: 'admin' | 'editor' | 'viewer') => {
    try {
      setUpdating(userId);
      setError(null);
      await grantPermission(userId, 'spec-id', newLevel); // TODO: Pass actual spec_id
      setUsers(users.map(u => u.id === userId ? { ...u, permission_level: newLevel } : u));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Güncelleme başarısız';
      setError(msg);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
      <h2>👥 Kullanıcı Yönetimi</h2>
      <p style={{ color: '#6b7280' }}>Kullanıcıları ve yetkilerini yönet</p>

      {error && (
        <div style={{ background: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '6px', marginTop: '16px' }}>
          ❌ {error}
        </div>
      )}

      <div style={{ marginTop: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600 }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600 }}>Yetki Seviyesi</th>
              <th style={{ textAlign: 'left', padding: '12px', color: '#6b7280', fontWeight: 600 }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                  Kullanıcı bulunamadı
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', fontSize: '14px' }}>{user.email}</td>
                  <td style={{ padding: '12px', fontSize: '14px' }}>
                    <span style={{
                      background: user.permission_level === 'admin' ? '#dcfce7' :
                                 user.permission_level === 'editor' ? '#dbeafe' : '#f3f4f6',
                      color: user.permission_level === 'admin' ? '#166534' :
                            user.permission_level === 'editor' ? '#0c4a6e' : '#374151',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}>
                      {getPermissionLabel(user.permission_level)}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <select
                      value={user.permission_level}
                      onChange={(e) => handlePermissionChange(user.id, e.target.value as 'admin' | 'editor' | 'viewer')}
                      disabled={updating === user.id}
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '14px',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="viewer">Görüntüleyici</option>
                      <option value="editor">Editör</option>
                      <option value="admin">Yönetici</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
