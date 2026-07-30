'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function Analytics() {
  const [stats, setStats] = useState({
    totalSpecs: 0,
    pendingApprovals: 0,
    activeUsers: 0,
    completedWorkflows: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [specs, approvals, users, workflows] = await Promise.all([
        supabase.from('projects').select('count', { count: 'exact', head: true }),
        supabase.from('approval_queue').select('count', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('user_permissions').select('count', { count: 'exact', head: true }),
        supabase.from('workflow_substages').select('count', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);

      setStats({
        totalSpecs: specs.count || 0,
        pendingApprovals: approvals.count || 0,
        activeUsers: users.count || 0,
        completedWorkflows: workflows.count || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;

  const cards = [
    { label: 'Toplam Spec', value: stats.totalSpecs, icon: '📋' },
    { label: 'Bekleyen Onaylar', value: stats.pendingApprovals, icon: '⏳', color: '#fca5a5' },
    { label: 'Aktif Kullanıcılar', value: stats.activeUsers, icon: '👥' },
    { label: 'Tamamlanan İşler', value: stats.completedWorkflows, icon: '✅', color: '#86efac' },
  ];

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
      <h2>📊 Analytics & Raporlar</h2>
      <p style={{ color: '#6b7280', marginTop: '8px' }}>Sistem istatistikleri ve performans metrikleri</p>

      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {cards.map((card, idx) => (
          <div key={idx} style={{
            background: card.color || '#f0f9ff',
            padding: '20px',
            borderRadius: '8px',
            border: `2px solid ${card.color ? '#fecaca' : '#cffafe'}`,
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '32px', margin: '0 0 12px 0' }}>{card.icon}</p>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{card.label}</p>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '12px 0 0 0', color: card.color ? '#dc2626' : '#0369a1' }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px', background: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 16px 0' }}>📈 Son 7 Gün</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', height: '150px' }}>
          {[65, 78, 82, 75, 88, 92, 87].map((val, idx) => (
            <div key={idx} style={{
              flex: 1,
              height: `${val}px`,
              background: '#3b82f6',
              borderRadius: '4px 4px 0 0',
              opacity: 0.7 + idx * 0.05,
              title: `Gün ${idx + 1}: ${val}%`
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
