'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import { getUserPermissions } from '../../../lib/supabase/queries';
import SpecHeader from '../../../components/spec/SpecHeader';
import ProjectRoadmap from '../../../components/spec/ProjectRoadmap';
import WorkflowStages from '../../../components/spec/WorkflowStages';
import QATracking from '../../../components/spec/QATracking';

interface SpecData {
  kod: string;
  aciklama: string;
  durum: string;
}

export default function SpecDetailPage() {
  const params = useParams();
  const specId = params.kod as string;
  const [spec, setSpec] = useState<SpecData | null>(null);
  const [userPermission, setUserPermission] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!specId) return;
    fetchData();
  }, [specId]);

  const fetchData = async () => {
    try {
      // Spec verilerini çek
      const { data: specData, error: specErr } = await supabase
        .from('projects')
        .select('*')
        .eq('kod', specId)
        .single();

      if (specErr) throw specErr;
      setSpec(specData);

      // Kullanıcı izinlerini çek
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        const permission = await getUserPermissions(userData.user.id, specId);
        setUserPermission(permission as 'admin' | 'editor' | 'viewer');
      }
    } catch (err: any) {
      setError(err.message || 'Veriler yüklenemedi');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="page-container">
        <div className="error">
          <h2>❌ Hata</h2>
          <p>{error || 'Spec bulunamadı'}</p>
          <button onClick={() => window.history.back()}>Geri Dön</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header Bileşeni */}
      <SpecHeader specId={specId} specNo={spec.kod} />

      {/* Departman Navigasyon Sekmesi */}
      <div className="dept-tabs">
        <button className="dept-tab active">📋 Genel Bilgiler</button>
        <button className="dept-tab">📄 Belgeler</button>
        <button className="dept-tab">💬 Açık Konular</button>
        <button className="dept-tab">✅ Onaylar</button>
      </div>

      {/* Ana İçerik */}
      <div className="spec-content">
        {/* Project Roadmap Bileşeni */}
        <ProjectRoadmap specId={specId} userPermission={userPermission} />

        {/* Workflow Stages Bileşeni */}
        <WorkflowStages specId={specId} userPermission={userPermission} />

        {/* QA Tracking Bileşeni */}
        <QATracking specId={specId} userPermission={userPermission} />
      </div>

      {/* Dinamik CSS */}
      <style jsx>{`
        .page-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: #f5f5f5;
          min-height: 100vh;
        }

        .loading,
        .error {
          text-align: center;
          padding: 40px;
          background: white;
          border-radius: 8px;
          margin: 24px 0;
        }

        .loading {
          font-size: 18px;
          color: #6b7280;
        }

        .error h2 {
          color: #ef4444;
          margin: 0 0 16px 0;
        }

        .error p {
          color: #6b7280;
          margin: 0 0 20px 0;
        }

        .error button {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .error button:hover {
          background: #2563eb;
        }

        .dept-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid #e5e7eb;
          overflow-x: auto;
        }

        .dept-tab {
          padding: 12px 16px;
          border: none;
          background: none;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .dept-tab:hover {
          color: #3b82f6;
        }

        .dept-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .spec-content {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        @media (max-width: 768px) {
          .page-container {
            padding: 12px;
          }

          .dept-tabs {
            gap: 8px;
          }

          .dept-tab {
            padding: 10px 12px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
}
