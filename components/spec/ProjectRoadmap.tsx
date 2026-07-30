'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
}

export default function ProjectRoadmap({ specId }: ProjectRoadmapProps) {
  const [roadmap, setRoadmap] = useState<ProjectRoadmapData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchRoadmap();
  }, [specId]);

  const fetchRoadmap = async () => {
    try {
      const { data, error } = await supabase
        .from('project_roadmap')
        .select('*')
        .eq('spec_id', specId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setRoadmap(data);
    } catch (err) {
      console.error('Error fetching roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.section}>Yükleniyor...</div>;

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>📋 Proje Yol Haritası</h2>
        <button
          onClick={() => setEditing(!editing)}
          className={styles.editBtn}
        >
          {editing ? 'İptal' : 'Düzenle'}
        </button>
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
