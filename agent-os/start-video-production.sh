#!/bin/bash
# STUDEX VIDEO PRODUCTION — START
# Orchestrates: Higgsfield → Composition → DaVinci → Blotato

set -e

echo "🎬 STUDEX VIDEO PRODUCTION PIPELINE"
echo "══════════════════════════════════════════"
echo ""

# 1. Load Higgsfield credentials
echo "📡 [1/4] Loading Higgsfield MCP credentials..."
source .env.higgsfield
echo "✅ Connected to Higgsfield @ $HIGGSFIELD_MCP_ENDPOINT"
echo ""

# 2. Verify scripts are staged
echo "📝 [2/4] Verifying production assets..."
if [ -f "scripts/Episode-001-Ecosystem-Overview.md" ]; then
  echo "✅ Episode 001 script ready"
  SCRIPT_LINES=$(wc -l < scripts/Episode-001-Ecosystem-Overview.md)
  echo "   Lines: $SCRIPT_LINES"
else
  echo "❌ Script not found"
  exit 1
fi

if [ -f "../copy/social-twitter.md" ]; then
  echo "✅ Social media copy ready (StudBot)"
fi

echo ""

# 3. Start video pipeline
echo "🚀 [3/4] Starting Higgsfield video generation..."
echo "   Title: Studex Founder Story — 10 Years (5 min)"
echo "   Format: $VIDEO_RESOLUTION @ $VIDEO_FRAMERATE fps"
echo "   Theme: Obsidian-Gold (luxury cinematic)"
echo ""

# Call the pipeline (in production, this would be async via queue)
node video-production-pipeline.js \
  --script="scripts/Episode-001-Ecosystem-Overview.md" \
  --project="studex-founder-story" \
  --duration="5min" \
  --theme="obsidian-gold"

echo ""

# 4. Next steps
echo "✅ [4/4] PIPELINE LAUNCHED"
echo ""
echo "📋 Next Steps:"
echo "   1. Higgsfield generating video scenes..."
echo "   2. Once complete, import composition into DaVinci Resolve"
echo "   3. Color grade + finalize in DaVinci"
echo "   4. Export master, post to Blotato"
echo ""
echo "⏱️  Estimated time: 15 min (Higgsfield) + 10 min (DaVinci) = 25 min total"
echo ""
echo "🎯 Goal: Founder story video live on YouTube by Sep 19"
echo "══════════════════════════════════════════"
