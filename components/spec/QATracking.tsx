'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './spec.module.css';

interface QAAlert {
  id: number;
  type: 'punch_list' | 'completed' | 'packing' | 'external_trade';
  status: 'pending' | 'submitted' | 'approved';
  dueDate: string;
  assignedTo: string | null;
}

interface QATrackingProps {
  specId: string;
}

export default function QATracking({ specId }: QATrackingProps) {
  const [alerts, setAlerts] = useState<QAAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchQAData();
    // Haftalık güncellemeler için interval ayarla
    const interval = setInterval(fetchQAData, 7 * 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [specId]);

  const fetchQAData = async () => {
    try {
      // FAT Tracking
      const { data: fatData } = await supabase
        .from('fat_tracking')
        .select('*')
        .eq('spec_id', specId)
        .single();

      // Packing Tracking
      const { data: packingData } = await supabase
        .from('packing_tracking')
        .select('*')
        .eq('spec_id', specId)
        .single();

      // External Trade Tracking
      const { data: externalData } = await supabase
        .from('external_trade')
        .select('*')
        .eq('spec_id', specId)
        .single();

      const qaAlerts: QAAlert[] = [];

      if (fatData) {
        qaAlerts.push({
          id: 1,
          type: 'punch_list',
          status: fatData.punch_list_status || 'pending',
          dueDate: new Date().toISOString(),
          assignedTo: fatData.assigned_to,
        });
        qaAlerts.push({
          id: 2,
          type: 'completed',
          status: fatData.completed_status || 'pending',
          dueDate: new Date().toISOString(),
          assignedTo: fatData.assigned_to,
        });
      }

      if (packingData) {
        qaAlerts.push({
          id: 3,
          type: 'packing',
          status: packingData.status || 'pending',
          dueDate: new Date().toISOString(),
          assignedTo: packingData.assigned_to,
        });
      }

      if (externalData) {
        qaAlerts.push({
          id: 4,
          type: 'external_trade',
          status: externalData.before_delivery || 'pending',
          dueDate: new Date().toISOString(),
          assignedTo: externalData.assigned_to,
        });
      }

      setAlerts(qaAlerts);
    } catch (err) {
      console.error('Error fetching QA data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertLabel = (type: string) => {
    const labels: Record<string, string> = {
      punch_list: 'Punch List',
      completed: 'Tamamlama Raporu',
      packing: 'Paketleme Onayı',
      external_trade: 'Dış Ticaret Onayı',
    };
    return labels[type] || type;
  };

  const getAlertIcon = (type: string) => {
    const icons: Record<string, string> = {
      punch_list: '📝',
      completed: '✅',
      packing: '📦',
      external_trade: '🌐',
    };
    return icons[type] || '📋';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#22c55e'; // green
      case 'submitted':
        return '#3b82f6'; // blue
      case 'pending':
      default:
        return '#ef4444'; // red (urgent)
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'submitted':
        return 'Gönderildi';
      case 'pending':
      default:
        return 'Bekleniyor';
    }
  };

  if (loading) return <div className={styles.section}>Yükleniyor...</div>;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>📊 QA Takip & Haftalık Uyarılar</h2>
        <span className={styles.alertBadge}>{alerts.length}</span>
      </div>

      <div className={styles.qaGrid}>
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={styles.qaCard}
              style={{
                borderTopColor: getStatusColor(alert.status),
              }}
            >
              <div className={styles.qaHeader}>
                <span className={styles.qaIcon}>
                  {getAlertIcon(alert.type)}
                </span>
                <h4>{getAlertLabel(alert.type)}</h4>
              </div>

              <div className={styles.qaContent}>
                <div className={styles.qaStatus}>
                  <span
                    className={styles.statusPill}
                    style={{
                      backgroundColor: getStatusColor(alert.status),
                    }}
                  >
                    {getStatusLabel(alert.status)}
                  </span>
                </div>

                {alert.assignedTo && (
                  <p className={styles.qaAssigned}>
                    👤 Sorumlu: {alert.assignedTo}
                  </p>
                )}

                <p className={styles.qaDate}>
                  📅 {new Date(alert.dueDate).toLocaleDateString('tr-TR')}
                </p>
              </div>

              <button className={styles.qaAction}>
                {alert.status === 'pending' && 'Gönder'}
                {alert.status === 'submitted' && 'Güncelle'}
                {alert.status === 'approved' && 'Görüntüle'}
              </button>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <p>QA uyarısı bulunmuyor</p>
          </div>
        )}
      </div>

      {/* Haftalık Uyarı Özeti */}
      <div className={styles.weeklySummary}>
        <h3>📅 Hafta Özeti</h3>
        <ul>
          <li>
            ✓ Tamamlanan: {alerts.filter((a) => a.status === 'approved').length}
          </li>
          <li>
            ⏳ Devam Eden: {alerts.filter((a) => a.status === 'submitted').length}
          </li>
          <li>
            ⚠️ Bekleniyor: {alerts.filter((a) => a.status === 'pending').length}
          </li>
        </ul>
      </div>
    </section>
  );
}
