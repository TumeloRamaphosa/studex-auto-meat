'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Approval } from '@/domain/types';

export function ApprovalActions({
  approval,
  orchestratorAgentId,
}: {
  approval: Approval;
  orchestratorAgentId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(decision: 'APPROVED' | 'REJECTED') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/approvals/${approval.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, decidedByAgentId: orchestratorAgentId }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? res.statusText);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="actions">
        <button className="primary" disabled={busy} onClick={() => decide('APPROVED')} type="button">
          Approve
        </button>
        <button className="danger" disabled={busy} onClick={() => decide('REJECTED')} type="button">
          Reject
        </button>
      </div>
      {error ? <p style={{ color: 'var(--bad)', fontSize: '0.8rem' }}>{error}</p> : null}
    </div>
  );
}
