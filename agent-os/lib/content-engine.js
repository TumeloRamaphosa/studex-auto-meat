/**
 * Content Engine — Multi-model content generation
 * Supports: Ollama (Qwen, DeepSeek, Hermes), Claude, Perplexity
 * Outputs: Ad copy, images (ComfyUI), videos (Higgsfield)
 * Powers: AI influencers, content marketing, social posts
 */

import axios from 'axios';

export class ContentEngine {
  constructor() {
    this.models = {
      local: {
        qwen: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        deepseek: process.env.DEEPSEEK_URL || 'http://localhost:11434',
        hermes: process.env.HERMES_URL || 'http://localhost:11434'
      },
      cloud: {
        claude: 'https://api.anthropic.com/v1/messages',
        perplexity: 'https://api.perplexity.ai/chat/completions'
      },
      generation: {
        comfyui: process.env.COMFYUI_URL || 'http://localhost:8188',
        higgsfield: process.env.HIGGSFIELD_API_URL || 'https://api.higgsfield.ai'
      }
    };
  }

  async init() {
    console.log('🎨 Content Engine: Local models (Qwen, DeepSeek, Hermes)');
    console.log('🎨 Content Engine: Cloud models (Claude, Perplexity)');
    console.log('🎨 Content Engine: Image generation (ComfyUI)');
    console.log('🎨 Content Engine: Video generation (Higgsfield AI)');
  }

  /**
   * Generate ad copy via LLM
   * Models: Qwen (fast), DeepSeek (reasoning), Claude (quality), Perplexity (research)
   */
  async generateCopy({ product, audience, tone, model = 'qwen2.5' }) {
    try {
      let endpoint, payload;

      if (model.includes('qwen') || model.includes('deepseek')) {
        // Local Ollama
        endpoint = `${this.models.local.qwen}/api/generate`;
        payload = {
          model: model,
          prompt: this.buildCopyPrompt(product, audience, tone),
          stream: false
        };
        const res = await axios.post(endpoint, payload, { timeout: 30000 });
        return { model, content: res.data.response, source: 'local' };
      }

      if (model === 'claude') {
        // Cloud Claude
        endpoint = this.models.cloud.claude;
        payload = {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: this.buildCopyPrompt(product, audience, tone)
            }
          ]
        };
        const res = await axios.post(endpoint, payload, {
          headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY },
          timeout: 30000
        });
        return { model, content: res.data.content[0].text, source: 'cloud' };
      }

      if (model === 'perplexity') {
        // Perplexity research + generation
        endpoint = this.models.cloud.perplexity;
        payload = {
          model: 'pplx-7b-online',
          messages: [{ role: 'user', content: this.buildCopyPrompt(product, audience, tone) }]
        };
        const res = await axios.post(endpoint, payload, {
          headers: { 'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}` },
          timeout: 30000
        });
        return { model, content: res.data.choices[0].message.content, source: 'cloud' };
      }

      throw new Error(`Unknown model: ${model}`);
    } catch (err) {
      throw new Error(`Content generation failed: ${err.message}`);
    }
  }

  /**
   * Generate image via ComfyUI
   * For: ad visuals, product shots, influencer assets
   */
  async generateImage({ prompt, style, aspect_ratio = '16:9' }) {
    try {
      const payload = {
        prompt: `${prompt} | Style: ${style} | Aspect: ${aspect_ratio}`,
        cfg_scale: 7.5,
        steps: 20,
        aspect_ratio: aspect_ratio
      };

      const res = await axios.post(`${this.models.generation.comfyui}/api/generate`, payload, {
        timeout: 120000
      });

      return {
        task_id: res.data.task_id,
        status: 'queued',
        type: 'image_generation',
        prompt,
        style,
        aspect_ratio
      };
    } catch (err) {
      throw new Error(`Image generation failed: ${err.message}`);
    }
  }

  /**
   * Generate video via Higgsfield AI
   * Powers: AI influencer personas (Naledi, Emily, etc.)
   */
  async generateVideo({ script, persona, style, duration = 60 }) {
    try {
      const payload = {
        script,
        persona: {
          name: persona.name,
          voice: persona.voice || 'natural',
          style: style
        },
        duration,
        format: 'vertical',
        quality: 'hd'
      };

      const res = await axios.post(`${this.models.generation.higgsfield}/videos/generate`, payload, {
        headers: { 'Authorization': `Bearer ${process.env.HIGGSFIELD_API_KEY}` },
        timeout: 120000
      });

      return {
        task_id: res.data.task_id,
        status: 'queued',
        type: 'video_generation',
        persona: persona.name,
        duration,
        style
      };
    } catch (err) {
      throw new Error(`Video generation failed: ${err.message}`);
    }
  }

  /**
   * Create AI influencer persona
   * Combines: script generation, video synthesis, social media optimization
   */
  async createInfluencer({ name, voice, personality, niche, style }) {
    try {
      // Generate persona profile
      const profile = {
        name,
        voice,
        personality,
        niche,
        style,
        content_templates: await this.generateContentTemplates(niche, personality),
        posting_schedule: this.generateSchedule(),
        created_at: new Date()
      };

      return {
        success: true,
        influencer: profile,
        message: `AI Influencer "${name}" ready to create content for ${niche}`
      };
    } catch (err) {
      throw new Error(`Influencer creation failed: ${err.message}`);
    }
  }

  /**
   * Helper: build ad copy prompt
   */
  buildCopyPrompt(product, audience, tone) {
    return `
Generate ad copy for a Facebook/Instagram campaign.

Product: ${product}
Target Audience: ${audience}
Tone: ${tone}

Requirements:
- Attention-grabbing headline
- 2-3 body sentences
- Strong call-to-action
- Keep under 300 chars total
- Match the tone (luxury, urgent, educational, social proof)

Format:
[HEADLINE]
[BODY]
[CTA]
    `.trim();
  }

  /**
   * Helper: generate content templates
   */
  async generateContentTemplates(niche, personality) {
    return [
      { type: 'educational', example: `Learn about ${niche}...` },
      { type: 'lifestyle', example: `My ${niche} daily routine...` },
      { type: 'social_proof', example: `How I built success in ${niche}...` },
      { type: 'promotional', example: `Limited offer: ${niche} exclusive...` }
    ];
  }

  /**
   * Helper: generate posting schedule
   */
  generateSchedule() {
    return {
      timezone: 'Africa/Johannesburg',
      posts_per_day: 3,
      optimal_times: ['07:30', '12:00', '19:00'],
      platforms: ['Facebook', 'Instagram', 'TikTok', 'LinkedIn']
    };
  }
}
