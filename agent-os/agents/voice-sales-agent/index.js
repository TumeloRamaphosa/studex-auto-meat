/**
 * STUDEX MEAT VOICE SALES AGENT
 *
 * Public-facing voice agent for customer inquiries
 * - Voice input/output (Web Audio API)
 * - Learns from Obsidian vault (RFQ history, buyer preferences)
 * - Sends email confirmations
 * - Integrated into Agent OS
 */

const express = require('express');
const { Ollama } = require('ollama');
const nodemailer = require('nodemailer');
const obsidian = require('./obsidian-bridge');
const muse = require('./muse-integration');
const router = express.Router();

// Initialize Ollama (local model)
const ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });

// Email transporter
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

/**
 * Agent metadata
 */
const AGENT_CONFIG = {
  id: 'hermes_voice_sales_001',
  name: 'Meat Sales Voice Agent',
  role: 'customer_support',
  capabilities: [
    'voice_intake',
    'product_inquiry',
    'order_qualification',
    'email_confirmation',
    'obsidian_learning',
    'image_generation_muse',
  ],
  model: process.env.LLM_MODEL || 'qwen2.5',
  description: 'Voice-enabled customer support for STUDEX MEAT. Speaks with buyers, learns from history, generates product visuals.',
};

/**
 * POST /voice/transcribe
 * Receive voice input, transcribe, and respond
 */
router.post('/voice/transcribe', async (req, res) => {
  try {
    const { audio_base64, session_id, buyer_email } = req.body;

    // 1. Transcribe audio (client-side would use Web Speech API)
    // For now, assume client sends transcribed text
    const userMessage = req.body.transcribed_text || 'Hi, I need to order meat.';

    // 2. Get context from Obsidian (past interactions, preferences)
    const obsidianContext = await obsidian.getContext(buyer_email);

    // 3. Build prompt for LLM
    const systemPrompt = `You are a friendly, helpful meat sales agent for STUDEX MEAT (premium South African meat).

Known buyer details:
${obsidianContext}

Your job:
1. Answer product questions about Wagyu, Biltong, premium cuts
2. Take orders and qualify the buyer
3. Be warm and conversational (you're speaking to them)
4. Mention financing options (Stitch BNPL available)
5. At the end, offer to send them an email confirmation

Keep responses short and natural (like speaking to them).`;

    // 4. Call local Ollama model
    const response = await ollama.generate({
      model: AGENT_CONFIG.model,
      prompt: `${systemPrompt}\n\nBuyer: ${userMessage}\n\nAgent:`,
      stream: false,
    });

    const agentResponse = response.response.trim();

    // 5. Generate product images if they asked about products
    let images = [];
    const productKeywords = ['wagyu', 'biltong', 'sirloin', 'ribeye', 'meat', 'cut', 'product'];
    const mentionedProduct = productKeywords.find(k => userMessage.toLowerCase().includes(k));

    if (mentionedProduct) {
      console.log(`🎨 Generating Meta Muse images for: ${mentionedProduct}`);
      images = await muse.generateContextualImages(userMessage, mentionedProduct);
    }

    // 6. Log to Obsidian (learning)
    await obsidian.logInteraction({
      buyer_email,
      session_id,
      buyer_message: userMessage,
      agent_response: agentResponse,
      images_generated: images.length,
      timestamp: new Date().toISOString(),
    });

    // 7. Check if they want email confirmation
    const needsEmail = agentResponse.toLowerCase().includes('email') ||
                       req.body.request_email_confirmation;

    if (needsEmail && buyer_email) {
      await sendConfirmationEmail(buyer_email, userMessage, agentResponse, session_id);
    }

    res.json({
      agent_response: agentResponse,
      session_id,
      needs_email_confirmation: needsEmail,
      obsidian_context_used: !!obsidianContext,
      images: images,
      muse_generated: images.length > 0,
    });
  } catch (error) {
    console.error('Voice transcribe error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /voice/session
 * Create or resume a voice session
 */
router.post('/voice/session', async (req, res) => {
  try {
    const { buyer_email, buyer_name } = req.body;
    const session_id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get Obsidian context for warm greeting
    const context = await obsidian.getContext(buyer_email);
    const isReturning = !!context;

    // Warm greeting
    let greeting = `Hi ${buyer_name || 'there'}! Thanks for reaching out to STUDEX MEAT.`;
    if (isReturning) {
      greeting += ` Great to hear from you again! How can I help with your order today?`;
    } else {
      greeting += ` How can I help you today? Are you interested in our premium Wagyu or Biltong?`;
    }

    res.json({
      session_id,
      greeting,
      is_returning_buyer: isReturning,
      agent_name: AGENT_CONFIG.name,
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /voice/end-session
 * End session, send final email confirmation
 */
router.post('/voice/end-session', async (req, res) => {
  try {
    const { session_id, buyer_email, order_summary } = req.body;

    // Save to Obsidian
    await obsidian.endSession(session_id, {
      buyer_email,
      order_summary,
      ended_at: new Date().toISOString(),
    });

    // Send comprehensive email
    if (buyer_email && order_summary) {
      await sendOrderConfirmationEmail(buyer_email, order_summary, session_id);
    }

    res.json({
      success: true,
      session_id,
      confirmation_sent: !!buyer_email,
    });
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /agents/register-voice-agent
 * Register this agent with Agent OS
 */
router.post('/agents/register', async (req, res) => {
  try {
    // Register with central Agent OS
    const registrationData = {
      ...AGENT_CONFIG,
      webhook_url: `${process.env.PUBLIC_URL}/agents/voice-sales/webhook`,
      status: 'active',
      registered_at: new Date().toISOString(),
    };

    // Would typically POST to central registry
    // For now, store locally
    console.log('✅ Voice Sales Agent Registered:', registrationData);

    res.json({
      ...registrationData,
      message: 'Voice Sales Agent ready for customers',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Send confirmation email
 */
async function sendConfirmationEmail(email, inquiry, response, sessionId) {
  try {
    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: '✓ Your STUDEX MEAT inquiry received',
      html: `
        <h2>Thanks for reaching out!</h2>
        <p>We received your inquiry and our sales team will get back to you within 2 hours.</p>

        <h3>Your Inquiry:</h3>
        <p>${inquiry}</p>

        <h3>Our Response:</h3>
        <p>${response}</p>

        <h3>Next Steps:</h3>
        <ul>
          <li>Check your email for a personalized quote</li>
          <li>Financing available with Stitch BNPL</li>
          <li>Free delivery on orders over R2,000</li>
        </ul>

        <p><strong>Session ID:</strong> ${sessionId}</p>
        <p>Best,<br>The STUDEX MEAT Team</p>
      `,
    });
    console.log(`📧 Confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Email error:', error);
  }
}

/**
 * Helper: Send order confirmation email
 */
async function sendOrderConfirmationEmail(email, orderSummary, sessionId) {
  try {
    await emailTransporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: '✓ Your STUDEX MEAT order confirmed',
      html: `
        <h2>Order Confirmed! 🎉</h2>
        <p>Thanks for your order. Here are the details:</p>

        <h3>Order Summary:</h3>
        <pre>${JSON.stringify(orderSummary, null, 2)}</pre>

        <h3>What's Next:</h3>
        <ul>
          <li>✓ Payment link sent separately</li>
          <li>✓ Delivery scheduled within 48 hours</li>
          <li>✓ You'll receive a tracking number via WhatsApp</li>
        </ul>

        <h3>Financing:</h3>
        <p>If you'd like to split this order with Stitch BNPL, reply to this email.</p>

        <p><strong>Session ID:</strong> ${sessionId}</p>
        <p>Questions? WhatsApp us: +27 XX XXX XXXX</p>
      `,
    });
    console.log(`📧 Order confirmation sent to ${email}`);
  } catch (error) {
    console.error('Email error:', error);
  }
}

module.exports = router;
