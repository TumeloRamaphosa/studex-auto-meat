import { ApprovalActions } from '@/app/components/ApprovalActions';
import { getDb } from '@/db/store';
import { loadDashboardSnapshot } from '@/services/mission-service';
import { runSeed } from '@/seed/seed';
import { listAgents } from '@/db/store';

export const dynamic = 'force-dynamic';

async function ensureSeeded(): Promise<void> {
  const db = getDb();
  if (listAgents(db).length === 0) {
    await runSeed(db);
  }
}

export default async function DashboardPage() {
  await ensureSeeded();
  const snapshot = loadDashboardSnapshot(getDb());

  return (
    <main>
      <div className="example-banner" role="status">
        <strong>Example data only.</strong> Demo missions, prices, customers, payment references, and
        mock Shopify catalog figures are synthetic — not live studexmeat.com production data.
      </div>
      <header className="page-header">
        <h1>AutoMeat Control Plane</h1>
        <p>
          StudEx Meat Phase 1 dashboard — persisted demo state for Katia&apos;s CashClaw mission
          (example customers, prices, and Shopify data only).
        </p>
      </header>

      <div className="grid two">
        <section className="panel">
          <h2>Missions</h2>
          {snapshot.missions.length === 0 ? (
            <p className="empty">No missions. Run <code>npm run seed</code>.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>State</th>
                  <th>Payment</th>
                  <th>Lead</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.missions.map((m) => {
                  const lead = snapshot.agents.find((a) => a.id === m.leadAgentId);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div>{m.title}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{m.id}</div>
                      </td>
                      <td>
                        <span className="badge state">{m.state}</span>
                      </td>
                      <td>{m.paymentMethod}</td>
                      <td>{lead?.name ?? m.leadAgentId}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>Connector status</h2>
          <table>
            <thead>
              <tr>
                <th>Connector</th>
                <th>Health</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.connectorStatus.map((c) => (
                <tr key={c.id}>
                  <td>{c.displayName}</td>
                  <td>{c.health}</td>
                  <td style={{ fontSize: '0.85rem' }}>{c.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid two" style={{ marginTop: '1rem' }}>
        <section className="panel">
          <h2>Agents & mission roles</h2>
          <table>
            <thead>
              <tr>
                <th>Agent</th>
                <th>Role</th>
                <th>On demo mission</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.agents.map((agent) => {
                const assignment = snapshot.assignments.find((a) => a.agentId === agent.id);
                return (
                  <tr key={agent.id}>
                    <td>
                      {agent.name}
                      {agent.isOrchestrator ? ' ★' : ''}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{agent.roleTitle}</td>
                    <td style={{ fontSize: '0.85rem' }}>{assignment?.roleOnMission ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Tasks</h2>
          <table>
            <thead>
              <tr>
                <th>Task</th>
                <th>Owner</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.tasks.map((t) => {
                const owner = snapshot.agents.find((a) => a.id === t.assigneeAgentId);
                return (
                  <tr key={t.id}>
                    <td style={{ fontSize: '0.85rem' }}>{t.title}</td>
                    <td>{owner?.name ?? t.assigneeAgentId}</td>
                    <td>{t.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>

      <div className="grid two" style={{ marginTop: '1rem' }}>
        <section className="panel">
          <h2>Pending approvals</h2>
          {snapshot.pendingApprovals.length === 0 ? (
            <p className="empty">No pending approvals.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Subject (bound)</th>
                  <th>Summary</th>
                  <th>Owner decision</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.pendingApprovals.map((a) => (
                  <tr key={a.id}>
                    <td>{a.actionType}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      <code>{JSON.stringify(a.subject)}</code>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{a.summary}</td>
                    <td>
                      <ApprovalActions approval={a} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel">
          <h2>Recent audit</h2>
          <ul className="audit-list">
            {snapshot.recentAudit.map((ev) => (
              <li key={ev.id}>
                <time>{new Date(ev.createdAt).toLocaleString()}</time>
                <strong>{ev.kind}</strong> — {ev.message}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <p className="disclaimer">
        Example data only — not connected to production Shopify, banking, or real customers.
      </p>
    </main>
  );
}
