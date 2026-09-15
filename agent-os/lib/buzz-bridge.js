/**
 * Buzz Bridge — WebSocket integration with Buzz agent community
 * Connects to: wss://studex-agents.communities.buzz.xyz
 * Syncs: agents, capabilities, real-time events
 */

import WebSocket from 'ws';

export class BuzzBridge {
  constructor() {
    this.endpoint = 'wss://studex-agents.communities.buzz.xyz';
    this.ws = null;
    this.agents = new Map();
    this.reconnectInterval = 5000;
    this.isConnected = false;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.endpoint);

        this.ws.on('open', () => {
          console.log('✅ Connected to Buzz agent community');
          this.isConnected = true;
          this.authenticate();
          resolve();
        });

        this.ws.on('message', (data) => {
          this.handleMessage(JSON.parse(data));
        });

        this.ws.on('error', (err) => {
          console.error('❌ Buzz WebSocket error:', err.message);
          reject(err);
        });

        this.ws.on('close', () => {
          console.log('⚠️  Buzz connection closed. Reconnecting...');
          this.isConnected = false;
          setTimeout(() => this.reconnect(), this.reconnectInterval);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  async reconnect() {
    try {
      await this.connect();
    } catch (err) {
      console.error('Reconnect failed:', err.message);
      setTimeout(() => this.reconnect(), this.reconnectInterval);
    }
  }

  authenticate() {
    this.send({
      type: 'auth',
      token: process.env.BUZZ_AUTH_TOKEN,
      group_id: process.env.BUZZ_GROUP_ID
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  async handleMessage(msg) {
    const { type, data } = msg;

    switch(type) {
      case 'auth_success':
        console.log('✅ Authenticated with Buzz');
        this.requestAgentList();
        break;

      case 'agent_list':
        await this.registerBuzzAgents(data.agents);
        break;

      case 'agent_online':
        this.handleAgentOnline(data);
        break;

      case 'agent_offline':
        this.handleAgentOffline(data);
        break;

      case 'agent_event':
        this.handleAgentEvent(data);
        break;

      case 'error':
        console.error('Buzz error:', data.message);
        break;
    }
  }

  requestAgentList() {
    this.send({
      type: 'get_agents',
      group_id: process.env.BUZZ_GROUP_ID
    });
  }

  async registerBuzzAgents(agents) {
    console.log(`📋 Registering ${agents.length} Buzz agents into Agent OS...`);

    for (const agent of agents) {
      this.agents.set(agent.id, {
        buzz_id: agent.id,
        name: agent.name,
        role: agent.role,
        status: 'online',
        capabilities: agent.capabilities || [],
        webhook_url: agent.webhook_url,
        source: 'buzz',
        last_seen: new Date()
      });

      console.log(`  ✅ Registered: ${agent.name} (${agent.role})`);
    }
  }

  handleAgentOnline(data) {
    const agent = this.agents.get(data.agent_id);
    if (agent) {
      agent.status = 'online';
      agent.last_seen = new Date();
      console.log(`🟢 ${agent.name} online`);
    }
  }

  handleAgentOffline(data) {
    const agent = this.agents.get(data.agent_id);
    if (agent) {
      agent.status = 'offline';
      console.log(`🔴 ${agent.name} offline`);
    }
  }

  async handleAgentEvent(data) {
    const { agent_id, event_type, payload } = data;
    const agent = this.agents.get(agent_id);

    if (!agent) return;

    console.log(`📨 ${agent.name}: ${event_type}`);

    // Forward to Agent OS tasks
    switch(event_type) {
      case 'lead_qualified':
        // Trigger: route to CashClaw for invoicing
        break;

      case 'content_generated':
        // Trigger: route to Blotato for posting
        break;

      case 'task_completed':
        // Log to Obsidian
        break;
    }
  }

  /**
   * Query Buzz agents by role
   */
  getAgentsByRole(role) {
    return Array.from(this.agents.values()).filter(a => a.role === role);
  }

  /**
   * Get all Buzz agents
   */
  listAgents() {
    return Array.from(this.agents.values());
  }

  /**
   * Get agent status
   */
  getAgent(agent_id) {
    return this.agents.get(agent_id);
  }

  /**
   * Send task to Buzz agent
   */
  sendTask(agent_id, task_type, payload) {
    this.send({
      type: 'task',
      agent_id,
      task_type,
      payload,
      timestamp: new Date()
    });
  }

  /**
   * Broadcast message to all agents
   */
  broadcast(message) {
    this.send({
      type: 'broadcast',
      message,
      group_id: process.env.BUZZ_GROUP_ID
    });
  }
}
