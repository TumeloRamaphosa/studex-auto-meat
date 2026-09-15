/**
 * Agent Registry — Central agent coordination hub
 * Manages: Hermes, OpenClaw, CashClaw, Naledi, Base44 agents
 * Tracks: status, capabilities, webhooks, audit trail
 */

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../data/agents.db');

export class AgentRegistry {
  constructor() {
    this.db = null;
    this.agents = new Map();
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) return reject(err);
        this.createTables().then(resolve).catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS agents (
          agent_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          role TEXT NOT NULL,
          capabilities JSON,
          webhook_url TEXT,
          status TEXT DEFAULT 'active',
          last_seen DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS agent_audit (
          id INTEGER PRIMARY KEY,
          agent_id TEXT,
          action TEXT,
          details JSON,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
        );

        CREATE TABLE IF NOT EXISTS agent_tasks (
          task_id TEXT PRIMARY KEY,
          agent_id TEXT,
          task_type TEXT,
          status TEXT,
          payload JSON,
          result JSON,
          created_at DATETIME,
          completed_at DATETIME,
          FOREIGN KEY (agent_id) REFERENCES agents(agent_id)
        );
      `, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async register(agent) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO agents
        (agent_id, name, role, capabilities, webhook_url, status, last_seen)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `;
      this.db.run(
        sql,
        [
          agent.agent_id,
          agent.name,
          agent.role,
          JSON.stringify(agent.capabilities || []),
          agent.webhook_url,
          agent.status
        ],
        function(err) {
          if (err) return reject(err);
          this.agents.set(agent.agent_id, agent);
          resolve(agent);
        }
      );
    });
  }

  async audit(agent_id, action, details) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO agent_audit (agent_id, action, details)
        VALUES (?, ?, ?)
      `;
      this.db.run(sql, [agent_id, action, JSON.stringify(details)], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  list() {
    return Array.from(this.agents.values());
  }

  get(agent_id) {
    return this.agents.get(agent_id);
  }

  getCount() {
    return this.agents.size;
  }

  async updateStatus(agent_id, status) {
    return new Promise((resolve, reject) => {
      const sql = `UPDATE agents SET status = ?, last_seen = datetime('now') WHERE agent_id = ?`;
      this.db.run(sql, [status, agent_id], (err) => {
        if (err) return reject(err);
        const agent = this.agents.get(agent_id);
        if (agent) agent.status = status;
        resolve();
      });
    });
  }

  getByRole(role) {
    return Array.from(this.agents.values()).filter(a => a.role === role);
  }
}
