'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './spec.module.css';

interface SpecHeaderProps {
  specId: string;
  specNo: string;
}

export default function SpecHeader({ specId, specNo }: SpecHeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading) return <div className={styles.headerSkeleton}>Loading...</div>;

  return (
    <header className={styles.specHeader}>
      {/* Logo Bölümü */}
      <div className={styles.logoSection}>
        <div className={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#0066cc" />
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
                  fill="white" fontSize="24" fontWeight="bold">QC</text>
          </svg>
        </div>
        <div className={styles.logoText}>
          <h1>QC Hub</h1>
          <p className={styles.subtitle}>Spec #{specNo}</p>
        </div>
      </div>

      {/* Orta Bölüm - Boş (İleride Breadcrumb olabilir) */}
      <div className={styles.middle}></div>

      {/* Kullanıcı Bilgisi */}
      <div className={styles.userSection}>
        {user?.email && (
          <>
            <div className={styles.userInfo}>
              <p className={styles.userName}>
                {user.user_metadata?.name || user.email.split('@')[0]}
              </p>
              <p className={styles.userDept}>
                {user.user_metadata?.department || 'Departman'}
              </p>
            </div>
            <div className={styles.userAvatar}>
              {user.user_metadata?.name?.charAt(0) || 'U'}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
