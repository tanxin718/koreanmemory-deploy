/**
 * KoreanMemory - AI 大模型调用模块
 * 统一封装智谱 GLM-4-Flash（免费）调用。
 *
 * 端点设计（解决浏览器 CORS 限制）：
 *  - 电脑本地（localhost）：走本地服务器的 /api/zhipu 代理（零配置）
 *  - 手机 / GitHub Pages：走用户自建的 Cloudflare Worker 公网代理地址
 *  API Key 存 localStorage，通过 Bearer 头交给代理转发到智谱。
 */
const LLM = {
  storeKey: 'km_llm_config',
  defaultModel: 'glm-4-flash',
  zhipuUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',

  get defaultConfig() {
    return {
      enabled: false,
      key: '',
      model: this.defaultModel,
      workerUrl: ''   // 手机端 Cloudflare Worker 地址，如 https://xxx.workers.dev
    };
  },

  getConfig() {
    try {
      const c = JSON.parse(localStorage.getItem(this.storeKey)) || {};
      return { ...this.defaultConfig, ...c };
    } catch {
      return { ...this.defaultConfig };
    }
  },

  saveConfig(cfg) {
    localStorage.setItem(this.storeKey, JSON.stringify(cfg));
  },

  // 当前是否运行在本地（电脑）
  isLocal() {
    const h = location.hostname;
    return location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
  },

  // 计算 AI 端点：本地点 /api/zhipu；手机填 Cloudflare Worker 根地址，自动补 /api/zhipu
  endpoint() {
    if (this.isLocal()) return '/api/zhipu';
    let ep = (this.getConfig().workerUrl || '').replace(/\/+$/, '');
    if (ep && !/\/api\/zhipu$/i.test(ep)) ep += '/api/zhipu';
    return ep;
  },

  // 是否已配置可用
  isConfigured() {
    const cfg = this.getConfig();
    if (!cfg.enabled || !cfg.key) return false;
    const ep = this.endpoint();
    return !!ep;
  },

  /**
   * 通用对话调用
   * @param {string} system  系统提示词
   * @param {string} user    用户内容
   * @param {object} opts    { temperature, json, maxTokens }
   * @returns {Promise<string>} 模型返回文本
   */
  async chat(system, user, opts = {}) {
    const cfg = this.getConfig();
    if (!this.isConfigured()) {
      throw new Error('AI 未配置：请在设置中填写智谱 API Key 并开启');
    }
    const ep = this.endpoint();

    const body = {
      model: cfg.model || this.defaultModel,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: opts.temperature ?? 0.6,
      stream: false
    };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;
    if (opts.json) {
      body.response_format = { type: 'json_object' };
      body.temperature = 0.2;
    }

    const resp = await fetch(ep, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.key
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      let msg = `AI 请求失败 (${resp.status})`;
      try {
        const data = await resp.json();
        msg = (data.error && (data.error.message || data.error.msg)) || msg;
      } catch {}
      throw new Error(msg);
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content || '';
    if (opts.json) {
      // 尝试从代码块中提取 JSON
      const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      const raw = (m ? m[1] : text).trim();
      return JSON.parse(raw);
    }
    return text.trim();
  },

  /**
   * 便捷：把模型输出安全清理成纯文本（去掉可能的多余标点）
   */
  cleanText(s) {
    return String(s || '').trim()
      .replace(/^[："「『【\s]+/, '')
      .replace(/[：」』】\s]+$/, '');
  },

  /**
   * 便捷：安全的 JSON 解析（容错）
   */
  safeJSON(text) {
    try {
      return JSON.parse(text);
    } catch {
      const m = String(text).match(/```(?:json)?\s*([\s\S]*?)```/);
      if (m) { try { return JSON.parse(m[1]); } catch {} }
      return null;
    }
  }
};