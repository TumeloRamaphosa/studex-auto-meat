import { NextResponse } from 'next/server';
import { getDb } from '@/db/store';
import { loadDashboardSnapshot } from '@/services/mission-service';
import { runSeed } from '@/seed/seed';
import { listAgents } from '@/db/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  if (listAgents(db).length === 0) {
    await runSeed(db);
  }
  const snapshot = loadDashboardSnapshot(db);
  return NextResponse.json(snapshot);
}
