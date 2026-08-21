/**
 * KoreanMemory - 单词详情页
 */
const WordDetailPage = {
  state: {
    wordId: null,
    detail: null
  },
  
  async init(params) {
    const wordId = parseInt(params[0]);
    if (!wordId) {
      App.navigate('home');
      return;
    }
    
    this.state.wordId = wordId;
    this.state.detail = getWordDetail(wordId);
    
    if (!this.state.detail) {
      document.getElementById('app-content').innerHTML = `
        <div class="empty-state" style="margin-top: 60px;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <p>单词不存在</p>
        </div>
      `;
      return;
    }
    
    this.render();
  },
  
  render() {
    const { word, meanings, examples, conjugations, hanja, relations, review, isFavorite, note } = this.state.detail;
    const container = document.getElementById('app-content');
    
    const meaningText = meanings.map(m => m.meaning).join('、');
    const wordType = word.is_hanja_word ? '汉字词' : word.is_native_word ? '固有词' : word.is_loanword ? '外来语' : '';
    
    // 更新 header 收藏按钮
    const favBtn = document.getElementById('btn-fav-detail');
    if (favBtn) {
      favBtn.innerHTML = isFavorite 
        ? '<i class="fa-solid fa-heart" style="color: var(--color-accent);"></i>'
        : '<i class="fa-regular fa-heart"></i>';
    }
    
    container.innerHTML = `
      <div class="word-detail-header">
        <div class="word">${word.word}</div>
        <div class="pronunciation">[${word.pronunciation || word.word}]</div>
        ${TTS.isSupported() ? `
          <button class="tts-btn tts-btn--lg" onclick="TTS.toggle('${word.word.replace(/'/g, "\\'")}', this)" title="朗读">
            <i class="fa-solid fa-volume-high"></i> 朗读
          </button>
        ` : ''}
        <div class="meaning">${meaningText}</div>
        <div class="meta">
          <span class="tag tag--topik">TOPIK ${word.topik_level}</span>
          ${wordType ? `<span class="tag tag--primary">${wordType}</span>` : ''}
          <span class="tag tag--accent">${word.pos || ''}</span>
          ${word.frequency && word.frequency < 100 ? `<span class="tag tag--success">高频</span>` : ''}
        </div>
      </div>
      
      ${hanja.length > 0 ? this.renderHanjaSection(hanja) : ''}
      
      ${word.is_native_word ? this.renderNativeSection(word) : ''}
      
      ${conjugations.length > 0 ? this.renderConjugationSection(conjugations) : ''}
      
      ${examples.length > 0 ? this.renderExampleSection(examples) : ''}
      
      ${relations.length > 0 ? this.renderRelationSection(relations) : ''}

      <!-- AI 校对 -->
      <div class="detail-section">
        <div class="detail-section__title">🔎 AI 校对</div>
        <div id="ai-proof-container">
          <button class="btn-secondary" onclick="WordDetailPage.aiProof()" style="width:100%; padding: var(--space-sm);">
            <i class="fa-solid fa-magnifying-glass"></i> 让 AI 检查释义 / 发音是否准确
          </button>
        </div>
      </div>
      
      <div class="detail-section">
        <div class="detail-section__title">📝 我的笔记</div>
        <textarea class="note-editor" id="note-editor" placeholder="点击添加笔记...">${note?.content || ''}</textarea>
        <button class="btn-primary mt-sm" onclick="WordDetailPage.saveNote()" style="width: 100%;">保存笔记</button>
      </div>
      
      ${review ? `
        <div class="detail-section">
          <div class="detail-section__title">📊 复习状态</div>
          <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">
            难度系数: ${review.ease_factor} · 间隔: ${review.interval}天 · 重复: ${review.repetitions}次
            <br>下次复习: ${review.next_review}
          </div>
        </div>
      ` : ''}
    `;
  },
  
  renderHanjaSection(hanja) {
    return `
      <div class="detail-section">
        <div class="detail-section__title">📖 词源</div>
        <div class="hanja-tree">
          ${hanja.map(h => `
            <div class="hanja-char" onclick="HanjaTree.showRelated('${h.hanja_char}')">
              <div class="char">${h.hanja_char}</div>
              <div class="reading">${h.hanja_reading}</div>
              <div class="meaning">${h.hanja_meaning}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },
  
  renderNativeSection(word) {
    return `
      <div class="detail-section">
        <div class="detail-section__title">📖 词源</div>
        <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">
          类型：고유어（固有词，非汉字词）
        </div>
      </div>
    `;
  },
  
  renderConjugationSection(conjugations) {
    return `
      <div class="detail-section">
        <div class="detail-section__title">🔄 词族</div>
        <div style="overflow-x: auto;">
          <table class="conj-table">
            <thead>
              <tr>
                <th>变形</th>
                <th>类型</th>
                <th>敬语</th>
                <th>时态</th>
              </tr>
            </thead>
            <tbody>
              ${conjugations.map(c => `
                <tr>
                  <td>${c.form}</td>
                  <td>${c.label || c.form_type || ''}</td>
                  <td>${c.honorification || ''}</td>
                  <td>${c.tense || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
  
  renderExampleSection(examples) {
    return `
      <div class="detail-section">
        <div class="detail-section__title">📝 例句</div>
        ${examples.map((e, i) => `
          <div class="example-block">
            <div class="example-block__ko">
              <span class="example-block__text">${i + 1}. ${e.korean}</span>
              ${TTS.isSupported() ? `
                <button class="tts-btn" onclick="TTS.toggle('${e.korean.replace(/'/g, "\\'")}', this)" title="朗读">
                  <i class="fa-solid fa-volume-high"></i>
                </button>
              ` : ''}
            </div>
            <div class="example-block__zh">${e.translation}</div>
          </div>
        `).join('')}
      </div>
    `;
  },
  
  renderRelationSection(relations) {
    const typeNames = {
      'synonym': '近义',
      'antonym': '反义',
      'family': '词族',
      'similar': '易混'
    };
    
    return `
      <div class="detail-section">
        <div class="detail-section__title">🔗 关联词</div>
        ${relations.map(r => `
          <div class="relation-item">
            <span class="type-badge ${r.relation_type}">${typeNames[r.relation_type] || r.relation_type}</span>
            <span class="word-link" onclick="App.navigate('word/${r.related_word_id || r.related_word}')">${r.related_word}</span>
            ${r.note ? `<span class="note">${r.note}</span>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },
  
  toggleFavorite() {
    const isFav = toggleFavorite(this.state.wordId);
    const favBtn = document.getElementById('btn-fav-detail');
    if (favBtn) {
      favBtn.innerHTML = isFav
        ? '<i class="fa-solid fa-heart" style="color: var(--color-accent);"></i>'
        : '<i class="fa-regular fa-heart"></i>';
    }
    showToast(isFav ? '已收藏' : '已取消收藏');
  },
  
  saveNote() {
    const content = document.getElementById('note-editor').value;
    saveNote(this.state.wordId, content);
    showToast('笔记已保存');
  },

  // ===== AI 校对 =====
  async aiProof() {
    const el = document.getElementById('ai-proof-container');
    if (!el) return;
    if (!LLM.isConfigured()) {
      showToast('请先在设置中配置 AI 助手', 'warning');
      App.navigate('settings');
      return;
    }
    const { word, meanings, examples } = this.state.detail;
    const meaningText = meanings.map(m => m.meaning).join('、');
    const exampleText = examples.map(e => `- ${e.korean} / ${e.translation}`).join('\n');
    el.innerHTML = `<div style="font-size:13px;color:var(--color-text-secondary);text-align:center;padding:8px;">⏳ AI 正在校对...</div>`;
    showToast('AI 校对中，请稍候', 'info');
    try {
      const gen = await LLM.chat(
        '你是精通韩语与中文的校对专家。请核查一个韩语单词条目的真实性。',
        `请核对以下韩语单词条目，判断释义、发音、例句是否有错误或可改进之处。\n\n词条：${word.word}\n发音：${word.pronunciation || '无'}\n当前释义：${meaningText}\n当前例句：\n${exampleText || '无'}\n\n请严格输出 JSON（不要 markdown）：\n{"ok":true/false 含义是否准确,"issues":["问题1","问题2"...] 若准确则为空数组,"suggested_meaning":"修正后的标准中文释义，若无需修正则为null","suggested_examples":[{"ko":"韩语例句","zh":"中文翻译"}] 给出更地道的1-3个，若无需则空数组,"note":"给学习者的一句话提醒（若有错误时）"}`,
        { json: true, temperature: 0.2 }
      );
      const hasFix = !gen.ok || (gen.suggested_meaning && gen.suggested_meaning !== meaningText);
      el.innerHTML = `
        <div style="font-size:14px; font-weight:600; margin-bottom:8px;">
          ${gen.ok ? '✅ 该词条基本准确' : '⚠️ 发现可能的问题'}
        </div>
        ${gen.issues && gen.issues.length ? `
          <div style="font-size:13px; color:var(--color-danger); margin-bottom:8px; line-height:1.6;">${gen.issues.map(i => '• ' + i).join('<br>')}</div>
        ` : ''}
        ${gen.note ? `<div style="font-size:13px; color:var(--color-text-secondary); margin-bottom:8px; line-height:1.6;">💡 ${gen.note}</div>` : ''}
        ${gen.suggested_meaning && gen.suggested_meaning !== meaningText ? `
          <div style="font-size:13px; margin-bottom:6px;"><b>建议释义：</b> ${gen.suggested_meaning}</div>
        ` : ''}
        ${hasFix ? `
          <button class="btn-primary" onclick="WordDetailPage.applyFix()" style="width:100%; padding:var(--space-sm); margin-top:6px;">
            <i class="fa-solid fa-check"></i> 采纳修正（保存到本机）
          </button>
        ` : ''}
        <button class="btn-secondary" onclick="WordDetailPage.aiProof()" style="width:100%; padding:var(--space-sm); margin-top:6px;">
          <i class="fa-solid fa-rotate"></i> 重新校对
        </button>
      `;
      this._lastProof = gen;
    } catch (e) {
      el.innerHTML = `<button class="btn-secondary" onclick="WordDetailPage.aiProof()" style="width:100%; padding:var(--space-sm);">AI 校对失败，重试</button>`;
      showToast('AI 校对失败：' + e.message, 'error');
    }
  },

  applyFix() {
    const gen = this._lastProof;
    if (!gen) return;
    const id = this.state.wordId;
    const fix = {
      meaning: gen.suggested_meaning || null,
      examples: (gen.suggested_examples && gen.suggested_examples.length)
        ? gen.suggested_examples.map(e => ({ ko: e.ko, zh: e.zh }))
        : null,
      suggestedBy: 'ai',
      appliedAt: new Date().toISOString()
    };
    saveWordFix(id, fix);
    showToast('已保存修正（本机生效）✓', 'success');
    // 重新加载详情
    this.state.detail = getWordDetail(id);
    this.render();
  },

  resetFix() {
    const fix = getWordFix(this.state.wordId);
    if (!fix) { showToast('该词没有本机修正'); return; }
    if (!confirm('要撤销本机对该词的修正吗？')) return;
    removeWordFix(this.state.wordId);
    this.state.detail = getWordDetail(this.state.wordId);
    this.render();
    showToast('已撤销修正');
  }
};