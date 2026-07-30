'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export default function ApprovalQueue() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const { data } = await supabase
        .from('approval_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      setApprovals(data || []);
    } catch (err) {
      console.error('Error fetching approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await supabase
        .from('approval_queue')
        .update({ status: 'approved' })
        .eq('id', id);
      setApprovals(approvals.filter(a => a.id !== id));
    } catch (err) {
      console.error('Error approving:', err);
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Yükleniyor...</div>;

  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '8px' }}>
      <h2>✅ Onay Kuyruğu</h2>
      {approvals.length === 0 ? (
        <p style={{ color: '#6b7280', marginTop: '16px' }}>Bekleyen onay bulunmuyor</p>
      ) : (
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {approvals.map(approval => (
            <div key={approval.id} style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 500 }}>{approval.type}</p>
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{approval.spec_id}</p>
              </div>
              <button
                onClick={() => handleApprove(approval.id)}
                style={{ padding: '8px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >
                Onayla
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
