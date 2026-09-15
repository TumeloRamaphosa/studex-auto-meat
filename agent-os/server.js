#!/usr/bin/env node
/**
 * STUDEX AGENT OS — Unified Operating System
 * Coordinates: Hermes (WhatsApp), OpenClaw (CMO), CashClaw (Finance), Naledi (Social), Base44 (Cloud)
 *
 * Features:
 * - Agent Registry & Auth
 * - MCP Bridge Layer (Shopify, Notion, ClickUp, Obsidian, n8n, Blotato)
 * - Content Creation Hub (text, image via ComfyUI, video via Higgsfield)
 * - Task Queue & Scheduler (Bull/BullMQ)
 * - Real-time Agent Workspace
 * - Facebook Ad Studio Integration
 * - Email System (AgentMail)
 * - Local + Cloud LLM endpoints (Qwen, Perplexity, Claude)
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AgentRegistry } from './lib/agent-registry.js';
import { MCPBridge } from './lib/mcp-bridge.js';
import { TaskQueue } from './lib/task-queue.js';
import { ContentEngine } from './lib/content-engine.js';
import { AgentWorkspace } from './lib/workspace.js';
import { WebSocketServer } from 'ws';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// === MIDDLEWARE ===
app.use(cors());
app.use(express.json());

// === GLOBALS ===
const agentRegistry = new AgentRegistry();
const mcpBridge = new MCPBridge();
const taskQueue = new TaskQueue();
const contentEngine = new ContentEngine();
const workspace = new AgentWorkspace();

// === INITIALIZATION ===
async function initialize() {
  console.log('🚀 STUDEX AGENT OS — Initializing...\n');

  // Initialize components
  await agentRegistry.init();
  await mcpBridge.init();
  await taskQueue.init();
  await contentEngine.init();

  console.log('✅ Agent Registry initialized');
  console.log('✅ MCP Bridge connected');
  console.log('✅ Task Queue ready');
  console.log('✅ Content Engine loaded');
  console.log('✅ WebSocket workspace online\n');
}

// === ROUTES ===

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    agents: agentRegistry.getCount(),
    queued_tasks: taskQueue.getCount()
  });
});

// === AGENT API ===

// Register agent
app.post('/agents/register', async (req, res) => {
  try {
    const { agent_id, name, role, capabilities, webhook_url } = req.body;

    const agent = await agentRegistry.register({
      agent_id,
      name,
      role,
      capabilities,
      webhook_url,
      status: 'active'
    });

    res.json({ success: true, agent });
    workspace.broadcast({ type: 'agent_connected', agent });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List agents
app.get('/agents', (req, res) => {
  const agents = agentRegistry.list();
  res.json(agents);
});

// Get agent status
app.get('/agents/:agent_id', (req, res) => {
  const agent = agentRegistry.get(req.params.agent_id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  res.json(agent);
});

// === TASK QUEUE ===

// Dispatch task to agent
app.post('/tasks', async (req, res) => {
  try {
    const { agent_id, task_type, payload, priority = 'normal' } = req.body;

    const task = await taskQueue.enqueue({
      agent_id,
      task_type,
      payload,
      priority,
      created_at: new Date()
    });

    res.json({ success: true, task_id: task.id });
    workspace.broadcast({ type: 'task_created', task });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get task status
app.get('/tasks/:task_id', async (req, res) => {
  const task = await taskQueue.get(req.params.task_id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json(task);
});

// === CONTENT CREATION ===

// Generate ad copy (via Ollama Qwen or Claude)
app.post('/content/generate-copy', async (req, res) => {
  try {
    const { product, audience, tone, model = 'qwen2.5' } = req.body;

    const content = await contentEngine.generateCopy({
      product,
      audience,
      tone,
      model
    });

    res.json({ success: true, content });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Generate image (via ComfyUI)
app.post('/content/generate-image', async (req, res) => {
  try {
    const { prompt, style, aspect_ratio = '16:9' } = req.body;

    const task = await contentEngine.generateImage({
      prompt,
      style,
      aspect_ratio
    });

    res.json({ success: true, task_id: task.id, status: 'queued' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Generate video (via Higgsfield AI)
app.post('/content/generate-video', async (req, res) => {
  try {
    const { script, persona, style, duration = 60 } = req.body;

    const task = await contentEngine.generateVideo({
      script,
      persona,
      style,
      duration
    });

    res.json({ success: true, task_id: task.id, status: 'queued' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// === AGENT OS DASHBOARD ===

// Serve Ad Studio UI
app.get('/studio', (req, res) => {
  res.sendFile(import.meta.resolve('../facebook-ad-studio.html').replace('file://', ''));
});

// Serve dashboard
app.get('/dashboard', (req, res) => {
  res.html(`
    <html>
      <head>
        <title>STUDEX Agent OS — Dashboard</title>
        <style>
          body { font-family: monospace; background: #000; color: #fff; margin: 2rem; }
          h1 { color: #ffd700; }
          .status { margin: 2rem 0; }
          .agent { background: #1a1a1a; padding: 1rem; margin: 0.5rem 0; border-left: 3px solid #ff4500; }
        </style>
      </head>
      <body>
        <h1>🎯 STUDEX Agent OS</h1>
        <div class="status">
          <h2>Agents Connected</h2>
          <div id="agents"></div>
        </div>
        <div class="status">
          <h2>Task Queue</h2>
          <div id="tasks"></div>
        </div>
        <script>
          async function refresh() {
            const agents = await fetch('/agents').then(r => r.json());
            document.getElementById('agents').innerHTML = agents
              .map(a => \`<div class="agent"><strong>\${a.name}</strong> — \${a.role} [\${a.status}]</div>\`)
              .join('');
          }
          refresh();
          setInterval(refresh, 5000);
        </script>
      </body>
    </html>
  `);
});

// === WEBSOCKET — REAL-TIME WORKSPACE ===

wss.on('connection', (ws) => {
  console.log('🔗 Agent workspace connected');

  workspace.addClient(ws);

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data);
      await workspace.handleMessage(msg, ws);
    } catch (err) {
      ws.send(JSON.stringify({ error: err.message }));
    }
  });

  ws.on('close', () => {
    workspace.removeClient(ws);
  });
});

// === START SERVER ===

const PORT = process.env.PORT || 3000;

initialize().then(() => {
  server.listen(PORT, () => {
    console.log(`\n✨ Agent OS live on http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`🎯 Ad Studio: http://localhost:${PORT}/studio`);
    console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
    console.log(`\n⏱️  ${new Date().toLocaleTimeString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST\n`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize:', err);
  process.exit(1);
});
