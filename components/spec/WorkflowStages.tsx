'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './spec.module.css';

interface WorkflowSubstage {
  id: number;
  substage_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  assigned_to: string | null;
}

interface WorkflowStageData {
  stage_name: string;
  substages: WorkflowSubstage[];
  overallStatus: 'pending' | 'in_progress' | 'completed';
}

interface WorkflowStagesProps {
  specId: string;
}

const STAGES = ['Technical Queries', 'FAT', 'Packing', 'External Trade', 'Completed'];

export default function WorkflowStages({ specId }: WorkflowStagesProps) {
  const [stages, setStages] = useState<Record<string, WorkflowStageData>>({});
  const [loading, setLoading] = useState(true);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchWorkflowData();
  }, [specId]);

  const fetchWorkflowData = async () => {
    try {
      const { data: substages, error } = await supabase
        .from('workflow_substages')
        .select('*')
        .eq('spec_id', specId);

      if (error) throw error;

      // Organize by stage
      const stagesMap: Record<string, WorkflowStageData> = {};
      STAGES.forEach((stage) => {
        stagesMap[stage] = {
          stage_name: stage,
          substages: [],
          overallStatus: 'pending',
        };
      });

      substages?.forEach((substage) => {
        if (stagesMap[substage.stage_name]) {
          stagesMap[substage.stage_name].substages.push({
            id: substage.id,
            substage_name: substage.substage_name,
            status: substage.status,
            assigned_to: substage.assigned_to,
          });
        }
      });

      setStages(stagesMap);
    } catch (err) {
      console.error('Error fetching workflow:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStageIcon = (stageName: string) => {
    const icons: Record<string, string> = {
      'Technical Queries': '❓',
      'FAT': '✅',
      'Packing': '📦',
      'External Trade': '🌍',
      'Completed': '🎉',
    };
    return icons[stageName] || '📋';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#22c55e'; // green
      case 'in_progress':
        return '#f59e0b'; // amber
      case 'pending':
      default:
        return '#9ca3af'; // grey
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'in_progress':
        return 'Devam Ediyor';
      case 'pending':
      default:
        return 'Bekleniyor';
    }
  };

  if (loading) return <div className={styles.section}>Yükleniyor...</div>;

  return (
    <section className={styles.section}>
      <h2>⚙️ İş Akışı (İş Adımları)</h2>

      <div className={styles.workflowContainer}>
        {STAGES.map((stageName) => {
          const stageData = stages[stageName];
          const isExpanded = expandedStage === stageName;

          return (
            <div key={stageName} className={styles.workflowStage}>
              {/* Stage Header (Tıklanabilir) */}
              <div
                className={styles.stageHeader}
                onClick={() =>
                  setExpandedStage(isExpanded ? null : stageName)
                }
              >
                <div className={styles.stageTitle}>
                  <span className={styles.stageIcon}>
                    {getStageIcon(stageName)}
                  </span>
                  <h3>{stageName}</h3>
                </div>

                <div className={styles.stageStatus}>
                  <span
                    className={styles.statusDot}
                    style={{
                      backgroundColor: getStatusColor(
                        stageData?.overallStatus || 'pending'
                      ),
                    }}
                  ></span>
                  <span className={styles.statusLabel}>
                    {getStatusLabel(
                      stageData?.overallStatus || 'pending'
                    )}
                  </span>
                  <span className={styles.expandIcon}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {/* Stage Details (Açılır) */}
              {isExpanded && (
                <div className={styles.stageDetails}>
                  {stageData?.substages && stageData.substages.length > 0 ? (
                    <ul className={styles.substageList}>
                      {stageData.substages.map((substage) => (
                        <li
                          key={substage.id}
                          className={styles.substageItem}
                          style={{
                            borderLeftColor: getStatusColor(substage.status),
                          }}
                        >
                          <div className={styles.substageInfo}>
                            <span className={styles.substageStatus}>
                              {substage.status === 'completed' && '✓'}
                              {substage.status === 'in_progress' && '⏳'}
                              {substage.status === 'pending' && '○'}
                            </span>
                            <span>{substage.substage_name}</span>
                          </div>
                          {substage.assigned_to && (
                            <span className={styles.assignedTo}>
                              👤 {substage.assigned_to}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.emptyState}>
                      Bu aşamada adım yok
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
