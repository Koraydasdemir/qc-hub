'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../../lib/supabase/client';
import UserManagement from '../../../components/admin/UserManagement';
import ApprovalQueue from '../../../components/admin/ApprovalQueue';
import Analytics from '../../../components/admin/Analytics';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'analytics'>('users');
  const supabase = createClient();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if user is admin (you'd implement actual check against user_permissions table)
      setIsAdmin(true); // Placeholder - implement proper check
    } catch (err) {
      console.error('Admin access denied:', err);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Yükleniyor...</div>;
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        ❌ Admin erişimi gereklidir
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <h1>🔧 Admin Dashboard</h1>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 16px',
            background: activeTab === 'users' ? '#3b82f6' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          👥 Kullanıcılar
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          style={{
            padding: '12px 16px',
            background: activeTab === 'approvals' ? '#3b82f6' : 'transparent',
            color: activeTab === 'approvals' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          ✅ Onaylar
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            padding: '12px 16px',
            background: activeTab === 'analytics' ? '#3b82f6' : 'transparent',
            color: activeTab === 'analytics' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          📊 Analytics
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'users' && <UserManagement />}
      {activeTab === 'approvals' && <ApprovalQueue />}
      {activeTab === 'analytics' && <Analytics />}
    </div>
  );
}
