/**
 * AGENT OS INTEGRATION
 * Connect Voice Sales Agent to the central STUDEX Agent OS
 *
 * - Registers with agent registry
 * - Uses shared task queue (Bull/Redis)
 * - Integrates with MCP bridge
 * - Coordinates with other agents (Hermes, OpenClaw, CashClaw, Naledi)
 */

const axios = require('axios');

const AGENT_OS_URL = process.env.AGENT_OS_URL || 'http://localhost:3000';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Agent configuration for central registry
 */
const VOICE_AGENT_METADATA = {
  agent_id: 'hermes_voice_sales_001',
  name: 'Voice Sales Agent',
  description: 'Voice-enabled customer support with Meta Muse image generation',
  role: 'customer_support',
  capabilities: [
    'voice_intake',
    'product_inquiry',
    'order_qualification',
    'email_confirmation',
    'obsidian_learning',
    'image_generation',
  ],
  webhook_url: `${process.env.PUBLIC_URL}/agents/voice-sales/webhook`,
  status: 'active',
  priority: 100, // High priority for customer-facing
};

/**
 * Register agent with central Agent OS
 */
async function registerWithAgentOS() {
  try {
    console.log('📋 Registering Voice Sales Agent with Agent OS...');

    const response = await axios.post(
      `${AGENT_OS_URL}/agents/register`,
      VOICE_AGENT_METADATA,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AGENT_OS_AUTH_KEY || ''}`,
        },
      }
    );

    console.log('✅ Agent registered:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    // Don't block startup if registry unavailable
    return VOICE_AGENT_METADATA;
  }
}

/**
 * Enqueue task for other agents
 * E.g., when customer wants to checkout, enqueue invoice generation for CashClaw
 */
async function enqueueTask(taskData) {
  try {
    const response = await axios.post(
      `${AGENT_OS_URL}/tasks`,
      {
        ...taskData,
        created_by: 'hermes_voice_sales_001',
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AGENT_OS_AUTH_KEY || ''}`,
        },
      }
    );

    console.log(`📨 Task enqueued: ${taskData.type}`);
    return response.data;
  } catch (error) {
    console.error('Task enqueue error:', error.message);
    return null;
  }
}

/**
 * Trigger invoice generation (coordinate with CashClaw)
 */
async function requestInvoiceGeneration(orderData) {
  return enqueueTask({
    type: 'generate_invoice',
    agent_target: 'cashclaw_001',
    order_data: orderData,
    priority: 'high',
  });
}

/**
 * Trigger email campaign (coordinate with Naledi/CMO)
 */
async function triggerFollowUpCampaign(buyerData) {
  return enqueueTask({
    type: 'send_followup_email',
    agent_target: 'naledi_cmo_001',
    buyer_data: buyerData,
    campaign_type: 'post_sale',
  });
}

/**
 * Get task status
 */
async function getTaskStatus(taskId) {
  try {
    const response = await axios.get(
      `${AGENT_OS_URL}/tasks/${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.AGENT_OS_AUTH_KEY || ''}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Get task status error:', error.message);
    return null;
  }
}

/**
 * Log event to central Agent OS
 * Used for analytics, auditing, and agent coordination
 */
async function logEvent(eventData) {
  try {
    await axios.post(
      `${AGENT_OS_URL}/events`,
      {
        agent_id: 'hermes_voice_sales_001',
        ...eventData,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AGENT_OS_AUTH_KEY || ''}`,
        },
      }
    );
  } catch (error) {
    console.error('Event logging error:', error.message);
  }
}

/**
 * Update agent status
 */
async function updateAgentStatus(status) {
  try {
    await axios.patch(
      `${AGENT_OS_URL}/agents/hermes_voice_sales_001`,
      { status },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AGENT_OS_AUTH_KEY || ''}`,
        },
      }
    );

    console.log(`⚡ Agent status updated: ${status}`);
  } catch (error) {
    console.error('Status update error:', error.message);
  }
}

/**
 * Webhook handler for Agent OS events
 * Other agents can send messages to this agent
 */
function createWebhookHandler() {
  return async (req, res) => {
    try {
      const { event_type, payload, from_agent } = req.body;

      console.log(`📥 Webhook from ${from_agent}:`, event_type);

      // Handle different event types
      switch (event_type) {
        case 'CUSTOMER_QUALIFIED':
          // CashClaw or OpenClaw saying customer is qualified
          console.log('✅ Customer qualified by:', from_agent);
          await logEvent({
            type: 'customer_qualified',
            from_agent,
            payload,
          });
          break;

        case 'INVOICE_GENERATED':
          // CashClaw generated invoice
          console.log('📄 Invoice generated');
          await logEvent({
            type: 'invoice_generated',
            from_agent,
            payload,
          });
          break;

        case 'FOLLOWUP_SCHEDULED':
          // Naledi scheduled follow-up
          console.log('📧 Follow-up scheduled');
          break;

        default:
          console.log('Unknown event:', event_type);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  };
}

/**
 * Coordination: When customer wants to order, coordinate with CashClaw
 */
async function handleOrderCheckout(orderData) {
  try {
    console.log('🛒 Processing checkout for customer:', orderData.buyer_email);

    // 1. Log to Agent OS
    await logEvent({
      type: 'order_received',
      order_data: orderData,
    });

    // 2. Request invoice from CashClaw
    const invoiceTask = await requestInvoiceGeneration(orderData);

    // 3. Schedule follow-up campaign with Naledi
    const campaignTask = await triggerFollowUpCampaign({
      buyer_email: orderData.buyer_email,
      buyer_name: orderData.buyer_name,
      order_value: orderData.total,
    });

    return {
      order_created: true,
      invoice_task: invoiceTask?.task_id,
      campaign_task: campaignTask?.task_id,
    };
  } catch (error) {
    console.error('Checkout error:', error.message);
    throw error;
  }
}

module.exports = {
  registerWithAgentOS,
  enqueueTask,
  requestInvoiceGeneration,
  triggerFollowUpCampaign,
  getTaskStatus,
  logEvent,
  updateAgentStatus,
  createWebhookHandler,
  handleOrderCheckout,
  VOICE_AGENT_METADATA,
};
