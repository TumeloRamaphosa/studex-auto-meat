/**
 * Agent Workspace — Real-time WebSocket console
 * Shows: agent status, tasks flowing, decisions made, metrics
 * Powers: live dashboard, audit trail, agent coordination
 */

export class AgentWorkspace {
  constructor() {
    this.clients = new Set();
    this.agents = new Map();
    this.events = [];
  }

  addClient(ws) {
    this.clients.add(ws);
    // Send current state to new client
    ws.send(JSON.stringify({
      type: 'init',
      agents: Array.from(this.agents.values()),
      events: this.events.slice(-50) // last 50 events
    }));
  }

  removeClient(ws) {
    this.clients.delete(ws);
  }

  async handleMessage(msg, ws) {
    const { type, data } = msg;

    switch(type) {
      case 'agent_status':
        this.agents.set(data.agent_id, { ...data, last_update: new Date() });
        this.broadcast({ type: 'agent_updated', agent: data });
        break;

      case 'task_status':
        this.broadcast({ type: 'task_updated', task: data });
        break;

      case 'event':
        this.events.push({ ...data, timestamp: new Date() });
        if (this.events.length > 1000) this.events.shift();
        this.broadcast({ type: 'event', event: data });
        break;

      case 'query':
        this.handleQuery(data, ws);
        break;
    }
  }

  broadcast(msg) {
    const data = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === 1) { // OPEN
        client.send(data);
      }
    }
  }

  handleQuery(query, ws) {
    const { query_type, filters } = query;

    if (query_type === 'agents') {
      ws.send(JSON.stringify({
        type: 'query_result',
        agents: Array.from(this.agents.values()).filter(a =>
          !filters || (!filters.role || a.role === filters.role)
        )
      }));
    }

    if (query_type === 'events') {
      ws.send(JSON.stringify({
        type: 'query_result',
        events: this.events.filter(e =>
          !filters || (!filters.agent_id || e.agent_id === filters.agent_id)
        ).slice(-100)
      }));
    }
  }
}
