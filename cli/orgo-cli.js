#!/usr/bin/env node

/**
 * ORGO.AI CLI - Chief of Staff Command Interface
 *
 * Usage: orgo [command] [options]
 */

const axios = require('axios');
const chalk = require('chalk');
require('dotenv').config();

const ORGO_URL = process.env.ORGO_AI_URL || 'http://localhost:3001';

const commands = {
  /**
   * orgo dashboard
   * Show Chief of Staff dashboard
   */
  dashboard: async () => {
    try {
      const response = await axios.get(`${ORGO_URL}/dashboard`);
      console.log(chalk.bold.blue('\n📊 STUDEX CHIEF OF STAFF DASHBOARD\n'));
      console.log(chalk.yellow('Agent Status:'));
      response.data.agents.forEach(agent => {
        console.log(`  ${agent.name} (${agent.role}): ${agent.status}`);
      });
      console.log(chalk.yellow('\nMetrics:'));
      console.log(`  YouTube Views: ${response.data.state.metrics.youtube_views}`);
      console.log(`  Sales Today: $${response.data.state.metrics.sales_today}`);
      console.log(`  Active Agents: ${response.data.state.metrics.active_agents}`);
    } catch (error) {
      console.error(chalk.red('Error fetching dashboard:'), error.message);
    }
  },

  /**
   * orgo task <type> <priority>
   * Route a task to appropriate agent
   */
  task: async (args) => {
    const [type, priority = 'normal'] = args;
    if (!type) return console.error(chalk.red('Usage: orgo task <type> [priority]'));

    try {
      const response = await axios.post(`${ORGO_URL}/route-task`, {
        task_type: type,
        priority,
        data: {},
      });
      console.log(chalk.green(`✅ Task routed to ${response.data.assigned_to}`));
      console.log(`Task ID: ${response.data.task_id}`);
    } catch (error) {
      console.error(chalk.red('Error routing task:'), error.message);
    }
  },

  /**
   * orgo agent <agent_id>
   * Check specific agent status
   */
  agent: async (args) => {
    const [agent_id] = args;
    if (!agent_id) return console.error(chalk.red('Usage: orgo agent <agent_id>'));

    try {
      const response = await axios.get(`${ORGO_URL}/agents/${agent_id}`);
      console.log(chalk.bold.blue(`\n${response.data.agent.name} Status\n`));
      console.log(`Status: ${response.data.agent.status}`);
      console.log(`Active Tasks: ${response.data.active_tasks.length}`);
      response.data.active_tasks.forEach(task => {
        console.log(`  - ${task.type} (${task.status})`);
      });
    } catch (error) {
      console.error(chalk.red('Error fetching agent:'), error.message);
    }
  },

  /**
   * orgo workflow <workflow_id>
   * Start a multi-step workflow
   */
  workflow: async (args) => {
    const [workflow_id] = args;
    if (!workflow_id) return console.error(chalk.red('Usage: orgo workflow <workflow_id>'));

    console.log(chalk.yellow(`Starting workflow: ${workflow_id}`));
    // Would execute workflow here
  },

  /**
   * orgo help
   * Show help
   */
  help: () => {
    console.log(chalk.bold.blue('\n🚀 ORGO.AI CLI - STUDEX Chief of Staff\n'));
    console.log(chalk.yellow('Commands:'));
    console.log('  orgo dashboard           - Show dashboard');
    console.log('  orgo agent <id>          - Check agent status');
    console.log('  orgo task <type>         - Route a task');
    console.log('  orgo workflow <id>       - Start workflow');
    console.log('  orgo help                - Show help\n');
  },
};

// Parse arguments
const args = process.argv.slice(2);
const command = args[0] || 'help';
const cmdArgs = args.slice(1);

if (commands[command]) {
  commands[command](cmdArgs);
} else {
  console.error(chalk.red(`Unknown command: ${command}`));
  commands.help();
}

module.exports = commands;
