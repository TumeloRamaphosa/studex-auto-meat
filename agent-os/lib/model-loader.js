/**
 * Model Loader — Support for local GGUF models via Ollama/LM Studio
 * Models: Gemma-4, Qwen3, Qwen2.5, Mistral, Devstral
 * Routing: smart selection based on task complexity/speed/cost
 */

export class ModelLoader {
  constructor() {
    this.models = {
      // Fast, lightweight (4-9GB)
      'gemma-4': {
        name: 'unsloth/gemma-4-E4B-it-GGUF:Q4_K_M',
        size: '4.6GB',
        speed: 'fast',
        quality: 'good',
        use_case: 'quick replies, scheduling, simple routing'
      },

      'qwen2.5-14b': {
        name: 'Qwen2.5-14B-Instruct-Q4_K_M',
        size: '9.0GB',
        speed: 'fast',
        quality: 'very_good',
        use_case: 'ad copy, captions, general purpose',
        recommended: true
      },

      'qwen3-14b': {
        name: 'Qwen3-14B-Q4_K_M',
        size: '9.0GB',
        speed: 'fast',
        quality: 'excellent',
        use_case: 'advanced analysis, multi-step reasoning'
      },

      // Advanced, larger (14-17GB)
      'mistral-small-3.1': {
        name: 'Mistral-Small-3.1-24B-Instruct-Q4_K_M',
        size: '14.3GB',
        speed: 'medium',
        quality: 'excellent',
        use_case: 'complex decisions, code generation, strategy'
      },

      'devstral-small': {
        name: 'Devstral-Small-2505-Q4_K_M',
        size: '14.3GB',
        speed: 'medium',
        quality: 'excellent',
        use_case: 'technical content, API design, deployment'
      },

      'gemma-4-26b': {
        name: 'unsloth/gemma-4-26B-A4B-it-GGUF:UD-Q4_K_M',
        size: '17GB',
        speed: 'medium',
        quality: 'excellent',
        use_case: 'creative content, brand voice, nuance',
        tight_fit: true
      }
    };

    this.endpoints = {
      ollama: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      lmstudio: process.env.LM_STUDIO_URL || 'http://localhost:1234'
    };

    this.active_model = process.env.ACTIVE_MODEL || 'qwen2.5-14b';
  }

  /**
   * Get model by name
   */
  getModel(model_name) {
    return this.models[model_name];
  }

  /**
   * List all available models
   */
  listModels() {
    return Object.entries(this.models).map(([key, model]) => ({
      id: key,
      ...model
    }));
  }

  /**
   * Recommend model for task
   */
  recommendModel(task_type) {
    const recommendations = {
      'ad_copy': 'qwen2.5-14b',        // Fast, reliable
      'caption': 'qwen2.5-14b',        // Quick turnaround
      'email': 'mistral-small-3.1',    // Quality + nuance
      'script': 'gemma-4-26b',         // Creative, brand voice
      'analysis': 'qwen3-14b',         // Multi-step reasoning
      'routing': 'gemma-4',            // Quick decision
      'deployment': 'devstral-small',  // Technical accuracy
      'strategy': 'mistral-small-3.1'  // Complex thinking
    };

    return recommendations[task_type] || this.active_model;
  }

  /**
   * Smart routing: best model for task + constraints
   */
  smartRoute(task_type, constraints = {}) {
    const { max_latency, min_quality, max_size } = constraints;

    let preferred = this.recommendModel(task_type);
    let model = this.models[preferred];

    // If size constraint, downgrade
    if (max_size && model.size.includes('17GB')) {
      preferred = 'mistral-small-3.1';
      model = this.models[preferred];
    }

    if (max_size && ['14.3GB', '17GB'].some(s => model.size.includes(s))) {
      preferred = 'qwen2.5-14b';
      model = this.models[preferred];
    }

    // If quality constraint, upgrade
    if (min_quality === 'excellent' && model.quality !== 'excellent') {
      preferred = 'mistral-small-3.1';
      model = this.models[preferred];
    }

    return { model_id: preferred, model, endpoint: this.selectEndpoint(preferred) };
  }

  /**
   * Select appropriate endpoint (Ollama vs LM Studio)
   */
  selectEndpoint(model_id) {
    const model = this.models[model_id];

    // Tight-fit models prefer LM Studio (if on Windows GPU box)
    if (model.tight_fit && process.env.LM_STUDIO_URL) {
      return this.endpoints.lmstudio;
    }

    // Default to Ollama
    return this.endpoints.ollama;
  }

  /**
   * Load model via Ollama
   */
  async loadViaOllama(model_id) {
    try {
      const model = this.models[model_id];
      const response = await fetch(`${this.endpoints.ollama}/api/pull`, {
        method: 'POST',
        body: JSON.stringify({ name: model.name })
      });

      if (!response.ok) throw new Error(`Pull failed: ${response.statusText}`);

      console.log(`✅ Loaded ${model_id} via Ollama`);
      return true;
    } catch (err) {
      throw new Error(`Ollama load failed: ${err.message}`);
    }
  }

  /**
   * Call model for inference
   */
  async infer(model_id, prompt, options = {}) {
    const model = this.models[model_id];
    if (!model) throw new Error(`Unknown model: ${model_id}`);

    const endpoint = this.selectEndpoint(model_id);

    try {
      const response = await fetch(`${endpoint}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: model.name,
          prompt,
          stream: false,
          temperature: options.temperature || 0.7,
          top_p: options.top_p || 0.9,
          top_k: options.top_k || 40,
          num_predict: options.max_tokens || 1024
        })
      });

      if (!response.ok) throw new Error(`Inference failed: ${response.statusText}`);

      const result = await response.json();
      return {
        model_id,
        model_name: model.name,
        output: result.response,
        tokens: result.prompt_eval_count + result.eval_count
      };
    } catch (err) {
      throw new Error(`Inference error: ${err.message}`);
    }
  }

  /**
   * Benchmark model (time + quality)
   */
  async benchmark(model_id, test_prompt = 'Write a haiku about Wagyu beef.') {
    const start = Date.now();
    const result = await this.infer(model_id, test_prompt);
    const latency = Date.now() - start;

    return {
      model_id,
      latency_ms: latency,
      tokens_per_sec: Math.round(result.tokens / (latency / 1000)),
      output: result.output.substring(0, 100) + '...'
    };
  }

  /**
   * System info (available models + resources)
   */
  async systemInfo() {
    const ollama_models = await this.queryOllama();
    const lm_models = await this.queryLMStudio();

    return {
      available_models: this.listModels(),
      ollama: { endpoint: this.endpoints.ollama, models: ollama_models },
      lm_studio: { endpoint: this.endpoints.lmstudio, models: lm_models },
      active_model: this.active_model,
      vram_info: 'Check Ollama/LM Studio dashboards for GPU memory'
    };
  }

  async queryOllama() {
    try {
      const response = await fetch(`${this.endpoints.ollama}/api/tags`);
      const data = await response.json();
      return data.models?.map(m => m.name) || [];
    } catch {
      return [];
    }
  }

  async queryLMStudio() {
    try {
      const response = await fetch(`${this.endpoints.lmstudio}/api/models`);
      const data = await response.json();
      return data.models?.map(m => m.id) || [];
    } catch {
      return [];
    }
  }
}
