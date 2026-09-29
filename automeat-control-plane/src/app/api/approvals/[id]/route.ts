import { NextResponse } from 'next/server';
import { getDb } from '@/db/store';
import { decideApproval } from '@/services/audit-service';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    decision?: 'APPROVED' | 'REJECTED';
    decidedByAgentId?: string;
  };

  if (body.decision !== 'APPROVED' && body.decision !== 'REJECTED') {
    return NextResponse.json({ error: 'decision must be APPROVED or REJECTED' }, { status: 400 });
  }
  if (!body.decidedByAgentId) {
    return NextResponse.json({ error: 'decidedByAgentId is required' }, { status: 400 });
  }

  try {
    const approval = decideApproval(getDb(), {
      approvalId: id,
      decision: body.decision,
      decidedByAgentId: body.decidedByAgentId,
    });
    return NextResponse.json({ approval });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
