'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getProjectRoadmap, updateProjectRoadmap } from '@/lib/supabase/queries';
import { useCanAction } from '@/lib/supabase/permissions';
import styles from './spec.module.css';

interface ProjectRoadmapData {
  spec_no: string;
  contract_no: string;
  equipment_cost: number;
  payment_count: number;
  materials: string;
  shipping: string;
  start_date: string;
  end_date: string;
  location: string;
}

interface ProjectRoadmapProps {
  specId: string;
  userPermission?: 'admin' | 'editor' | 'viewer';
}

export default function ProjectRoadmap({ specId, userPermission }: ProjectRoadmapProps) {
  const [roadmap, setRoadmap] = useState<ProjectRoadmapData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const { canEdit } = useCanAction(userPermission);

  useEffect(() => {
    fetchRoadmap();
  }, [specId]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjectRoadmap(specId);
      setRoadmap(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Veri yüklenemedi';
      setError(errorMsg);
      console.error('Error fetching roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedData: Partial<ProjectRoadmapData>) => {
    if (!canEdit) {
      setError('Bu işlem için yetkiniz yok');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await updateProjectRoadmap(specId, updatedData);
      setRoadmap(updated);
      setEditing(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Güncelleme başarısız';
      setError(errorMsg);
      console.error('Error updating roadmap:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.section}>Yükleniyor...</div>;

  if (error) {
    return (
      <section className={styles.section}>
        <div style={{ color: '#ef4444', padding: '12px', borderRadius: '6px', background: '#fee2e2' }}>
          ❌ {error}
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>📋 Proje Yol Haritası</h2>
        {canEdit && (
          <button
            onClick={() => setEditing(!editing)}
            className={styles.editBtn}
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : editing ? 'İptal' : 'Düzenle'}
          </button>
        )}
        {!canEdit && (
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            📖 Sadece Görüntüleme
          </span>
        )}
      </div>

      <div className={styles.roadmapGrid}>
        {/* Sözleşme Bilgisi */}
        <div className={styles.roadmapCard}>
          <label>Sözleşme No</label>
          <p>{roadmap?.contract_no || '-'}</p>
        </div>

        {/* Ekipman Maliyeti */}
        <div className={styles.roadmapCard}>
          <label>Ekipman Maliyeti (₺)</label>
          <p className={styles.amount}>
            {roadmap?.equipment_cost?.toLocaleString('tr-TR') || '-'}
          </p>
        </div>

        {/* Ödeme Sayısı */}
        <div className={styles.roadmapCard}>
          <label>Ödeme Sayısı</label>
          <p>{roadmap?.payment_count || '-'} Adım</p>
        </div>

        {/* Malzemeler */}
        <div className={styles.roadmapCard + ' ' + styles.wideCard}>
          <label>Malzemeler</label>
          <p>{roadmap?.materials || '-'}</p>
        </div>

        {/* Lojistik */}
        <div className={styles.roadmapCard + ' ' + styles.wideCard}>
          <label>Lojistik & Teslimat</label>
          <p>{roadmap?.shipping || '-'}</p>
        </div>

        {/* Tarihler */}
        <div className={styles.roadmapCard}>
          <label>Başlangıç Tarihi</label>
          <p>
            {roadmap?.start_date
              ? new Date(roadmap.start_date).toLocaleDateString('tr-TR')
              : '-'}
          </p>
        </div>

        <div className={styles.roadmapCard}>
          <label>Bitiş Tarihi</label>
          <p>
            {roadmap?.end_date
              ? new Date(roadmap.end_date).toLocaleDateString('tr-TR')
              : '-'}
          </p>
        </div>

        {/* Konum */}
        <div className={styles.roadmapCard + ' ' + styles.wideCard}>
          <label>📍 Konum</label>
          <p>{roadmap?.location || '-'}</p>
        </div>
      </div>
    </section>
  );
}
