import { NextResponse } from 'next/server';
import { getDb } from '@/db/store';
import { decideApprovalByHumanOwner } from '@/services/approval-service';
import { ApprovalPolicyViolationError } from '@/domain/errors';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    decision?: 'APPROVED' | 'REJECTED';
    /** Legacy clients may send agent ids — always rejected. */
    decidedByAgentId?: string;
  };

  if (body.decision !== 'APPROVED' && body.decision !== 'REJECTED') {
    return NextResponse.json({ error: 'decision must be APPROVED or REJECTED' }, { status: 400 });
  }

  if (body.decidedByAgentId) {
    return NextResponse.json(
      { error: 'Agents cannot approve gated actions; dashboard acts as human owner (Tumelo)' },
      { status: 403 },
    );
  }

  try {
    const approval = decideApprovalByHumanOwner(getDb(), {
      approvalId: id,
      decision: body.decision,
    });
    return NextResponse.json({ approval });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    const status = e instanceof ApprovalPolicyViolationError ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
