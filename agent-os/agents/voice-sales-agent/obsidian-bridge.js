/**
 * OBSIDIAN BRIDGE
 * Connect to Obsidian vault for learning & memory
 *
 * Reads from:
 * - RFQ history (what buyers asked for)
 * - Buyer preferences (past interactions)
 * - Product data (Wagyu specs, Biltong options)
 * - Pricing/financing options
 */

const fs = require('fs').promises;
const path = require('path');

const OBSIDIAN_VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH ||
  path.expandUser('~/Documents/Obsidian Vault/2nd Brain');

/**
 * Get context for a buyer from Obsidian
 * Looks for existing buyer notes, RFQ history, preferences
 */
async function getContext(buyerEmail) {
  try {
    // Look for buyer folder in Obsidian
    const buyerFolder = path.join(OBSIDIAN_VAULT_PATH, 'Buyers', buyerEmail);

    // Try to read recent interactions
    try {
      const files = await fs.readdir(buyerFolder);
      const mdFiles = files.filter(f => f.endsWith('.md')).sort().reverse();

      if (mdFiles.length > 0) {
        // Read most recent file
        const recentFile = await fs.readFile(
          path.join(buyerFolder, mdFiles[0]),
          'utf-8'
        );

        return `Previous interaction with ${buyerEmail}:\n${recentFile}`;
      }
    } catch (err) {
      // Buyer folder doesn't exist yet (new buyer)
      return '';
    }
  } catch (error) {
    console.error('Obsidian getContext error:', error);
    return '';
  }
}

/**
 * Log an interaction to Obsidian
 * Creates/appends to buyer's interaction log
 */
async function logInteraction(data) {
  try {
    const { buyer_email, session_id, buyer_message, agent_response, timestamp } = data;

    // Create buyer folder if needed
    const buyerFolder = path.join(OBSIDIAN_VAULT_PATH, 'Buyers', buyer_email);
    await fs.mkdir(buyerFolder, { recursive: true });

    // Create dated interaction file
    const dateStr = new Date().toISOString().split('T')[0];
    const interactionFile = path.join(buyerFolder, `${dateStr}.md`);

    // Append to file
    const content = `
## Session ${session_id}
**Time:** ${timestamp}

### Buyer:
${buyer_message}

### Agent:
${agent_response}

---
`;

    try {
      await fs.appendFile(interactionFile, content, 'utf-8');
    } catch (err) {
      // File doesn't exist, create it
      await fs.writeFile(interactionFile, content, 'utf-8');
    }

    console.log(`✓ Logged interaction to ${interactionFile}`);
  } catch (error) {
    console.error('Obsidian logInteraction error:', error);
  }
}

/**
 * End a session and summarize
 */
async function endSession(sessionId, data) {
  try {
    const { buyer_email, order_summary, ended_at } = data;

    const buyerFolder = path.join(OBSIDIAN_VAULT_PATH, 'Buyers', buyer_email);
    await fs.mkdir(buyerFolder, { recursive: true });

    const dateStr = new Date().toISOString().split('T')[0];
    const summaryFile = path.join(buyerFolder, `${dateStr}_summary.md`);

    const summaryContent = `# Session Summary
**Session ID:** ${sessionId}
**Ended:** ${ended_at}

## Order Summary
${JSON.stringify(order_summary, null, 2)}

## Next Steps
- [ ] Prepare invoice
- [ ] Schedule delivery
- [ ] Send payment link
`;

    await fs.appendFile(summaryFile, summaryContent, 'utf-8');
    console.log(`✓ Session summary saved for ${buyer_email}`);
  } catch (error) {
    console.error('Obsidian endSession error:', error);
  }
}

/**
 * Read RFQ data (what buyers have asked for)
 * Used to train agent responses
 */
async function getRFQDatabase() {
  try {
    const rfqFolder = path.join(OBSIDIAN_VAULT_PATH, 'RFQs');
    const files = await fs.readdir(rfqFolder);

    const rfqs = [];
    for (const file of files.filter(f => f.endsWith('.md'))) {
      const content = await fs.readFile(path.join(rfqFolder, file), 'utf-8');
      rfqs.push({ file, content });
    }

    return rfqs;
  } catch (error) {
    console.error('Obsidian getRFQDatabase error:', error);
    return [];
  }
}

/**
 * Get product information from Obsidian
 */
async function getProductInfo() {
  try {
    const productFile = path.join(OBSIDIAN_VAULT_PATH, 'Products.md');
    const content = await fs.readFile(productFile, 'utf-8');
    return content;
  } catch (error) {
    console.error('Obsidian getProductInfo error:', error);
    return '';
  }
}

module.exports = {
  getContext,
  logInteraction,
  endSession,
  getRFQDatabase,
  getProductInfo,
};
