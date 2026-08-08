/**
 * KoreanMemory - 学习模式
 */
const StudyPage = {
  state: {
    words: [],
    currentIndex: 0,
    showedDetails: false,
    topikLevel: null  // null=全部, 1-6=对应级别
  },

  init() {
    this.reset();
    this.render();
    this.loadNextBatch();
  },

  reset() {
    this.state = {
      words: [],
      currentIndex: 0,
      showedDetails: false,
      topikLevel: this.state?.topikLevel ?? null
    };
  },

  setLevel(level) {
    this.state.topikLevel = level;
    this.state.page = 1;
    this.loadNextBatch();
    this.updateLevelUI();
  },

  updateLevelUI() {
    document.querySelectorAll('#study-level-bar .filter-btn').forEach((btn, i) => {
      const level = i === 0 ? null : i;
      btn.classList.toggle('active', this.state.topikLevel === level);
    });
  },

  loadNextBatch() {
    // 构建查询条件
    let whereClause = `w.id NOT IN (
      SELECT word_id FROM reviews WHERE user_id = 1 AND repetitions > 0
    )`;
    let params = [];

    if (this.state.topikLevel) {
      whereClause += ` AND w.topik_level = ?`;
      params.push(this.state.topikLevel);
    }

    // 获取未学习的单词（随机）
    let words = query(`
      SELECT w.* FROM words w
      WHERE ${whereClause}
      ORDER BY RANDOM()
      LIMIT 20
    `, params);

    if (words.length === 0) {
      // 该级别所有词都学过了，随机取一些复习
      let reviewQuery = 'SELECT * FROM words';
      let reviewParams = [];
      if (this.state.topikLevel) {
        reviewQuery += ' WHERE topik_level = ?';
        reviewParams.push(this.state.topikLevel);
      }
      reviewQuery += ' ORDER BY RANDOM() LIMIT 20';
      words = query(reviewQuery, reviewParams);
    }

    this.state.words = words;
    this.state.currentIndex = 0;
    this.state.showedDetails = false;
    this.renderCard();
  },

  render() {
    const container = document.getElementById('app-content');
    container.innerHTML = `
      <div id="study-level-bar" style="margin-bottom: var(--space-md);">
        <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-xs);">📚 选择学习级别</div>
        <div class="filter-bar">
          <button class="filter-btn ${!this.state.topikLevel ? 'active' : ''}" onclick="StudyPage.setLevel(null)">全部</button>
          ${[1,2,3,4,5,6].map(l => `
            <button class="filter-btn ${this.state.topikLevel === l ? 'active' : ''}" onclick="StudyPage.setLevel(${l})">TOPIK ${l}</button>
          `).join('')}
        </div>
      </div>
      <div id="study-progress" class="progress-bar" style="margin-bottom: var(--space-md);">
        <div class="progress-bar__fill" style="width: 0%"></div>
      </div>
      <div id="study-card-container"></div>
      <div id="study-actions" style="text-align: center; margin-top: var(--space-lg);"></div>
    `;
  },
  
  renderCard() {
    const container = document.getElementById('study-card-container');
    const actions = document.getElementById('study-actions');
    const progress = document.getElementById('study-progress').querySelector('.progress-bar__fill');
    
    if (this.state.words.length === 0 || this.state.currentIndex >= this.state.words.length) {
      this.loadNextBatch();
      return;
    }
    
    const word = this.state.words[this.state.currentIndex];
    const detail = getWordDetail(word.id);
    const { meanings, examples, conjugations, hanja, relations, review, isFavorite, note } = detail;
    
    const meaningText = meanings.map(m => m.meaning).join('、');
    const wordType = word.is_hanja_word ? '汉字词' : word.is_native_word ? '固有词' : word.is_loanword ? '外来语' : '';
    
    const progressPercent = ((this.state.currentIndex) / this.state.words.length * 100);
    progress.style.width = progressPercent + '%';
    
    if (this.state.showedDetails) {
      container.innerHTML = `
        <div class="study-card" style="animation: fadeInUp 0.3s ease; text-align: left; padding: var(--space-md);">
          <!-- 顶部信息区 -->
          <div style="text-align: center; margin-bottom: var(--space-md);">
            <div class="word" style="font-size: var(--text-3xl); font-weight: 700; margin-bottom: var(--space-xs);">${word.word}</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">[${word.pronunciation || word.word}]</div>
            ${TTS.isSupported() ? `
              <button class="tts-btn tts-btn--lg" onclick="TTS.toggle('${word.word.replace(/'/g, "\\'")}', this)" style="margin: var(--space-sm) auto 0;">
                <i class="fa-solid fa-volume-high"></i> 朗读
              </button>
            ` : ''}
            <div style="font-size: var(--text-xl); color: var(--color-primary); font-weight: 600; margin-top: var(--space-md);">${meaningText}</div>
            <div class="meta" style="margin-top: var(--space-sm); display: flex; flex-wrap: wrap; gap: var(--space-xs); justify-content: center;">
              <span class="tag tag--topik">TOPIK ${word.topik_level}</span>
              ${wordType ? `<span class="tag tag--primary">${wordType}</span>` : ''}
              <span class="tag tag--accent">${word.pos || ''}</span>
              ${word.frequency && word.frequency < 100 ? `<span class="tag tag--success">高频</span>` : ''}
              <span class="tag" style="background: var(--color-bg-secondary); cursor: pointer;" onclick="StudyPage.toggleFavoriteCurrent()">
                ${isFavorite ? '<i class="fa-solid fa-heart" style="color: var(--color-accent);"></i> 已收藏' : '<i class="fa-regular fa-heart"></i> 收藏'}
              </span>
            </div>
          </div>
          
          <!-- 词源 -->
          ${hanja.length > 0 ? `
            <div class="detail-section" style="padding: var(--space-sm); margin: var(--space-sm) 0;">
              <div class="detail-section__title">📖 词源</div>
              <div class="hanja-tree" style="grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));">
                ${hanja.map(h => `
                  <div class="hanja-char">
                    <div class="char">${h.hanja_char}</div>
                    <div class="reading">${h.hanja_reading}</div>
                    <div class="meaning">${h.hanja_meaning}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : (word.is_native_word ? `
            <div class="detail-section" style="padding: var(--space-sm); margin: var(--space-sm) 0;">
              <div class="detail-section__title">📖 词源</div>
              <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">
                类型：고유어（固有词，非汉字词）
              </div>
            </div>
          ` : '')}
          
          <!-- 词族 -->
          ${conjugations.length > 0 ? `
            <div class="detail-section" style="padding: var(--space-sm); margin: var(--space-sm) 0;">
              <div class="detail-section__title">🔄 词族</div>
              <div style="overflow-x: auto;">
                <table class="conj-table" style="font-size: var(--text-xs);">
                  <thead>
                    <tr>
                      <th>变形</th>
                      <th>类型</th>
                      <th>敬语</th>
                      <th>时态</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${conjugations.slice(0, 12).map(c => `
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
          ` : ''}
          
          <!-- 例句（全部显示） -->
          ${examples.length > 0 ? `
            <div class="detail-section" style="padding: var(--space-sm); margin: var(--space-sm) 0;">
              <div class="detail-section__title">💬 例句</div>
              ${examples.map((e, i) => `
                <div class="example-block">
                  <div class="example-block__ko">
                    <span class="example-block__text">${i + 1}. ${e.korean}</span>
                    ${TTS.isSupported() ? `
                      <button class="tts-btn" onclick="TTS.toggle('${e.korean.replace(/'/g, "\\'")}', this)">
                        <i class="fa-solid fa-volume-high"></i>
                      </button>
                    ` : ''}
                  </div>
                  <div class="example-block__zh">${e.translation}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <!-- 关联词 -->
          ${relations.length > 0 ? `
            <div class="detail-section" style="padding: var(--space-sm); margin: var(--space-sm) 0;">
              <div class="detail-section__title">🔗 关联词</div>
              ${(() => {
                const typeNames = { 'synonym': '近义', 'antonym': '反义', 'family': '词族', 'similar': '易混' };
                return relations.map(r => `
                  <div class="relation-item">
                    <span class="type-badge ${r.relation_type}">${typeNames[r.relation_type] || r.relation_type}</span>
                    <span class="word-link" onclick="App.navigate('word/${r.related_word_id || r.related_word}')">${r.related_word}</span>
                    ${r.note ? `<span class="note">${r.note}</span>` : ''}
                  </div>
                `).join('');
              })()}
            </div>
          ` : ''}
          
          <!-- 笔记 -->
          <div class="detail-section" style="padding: var(--space-sm); margin: var(--space-sm) 0;">
            <div class="detail-section__title">📝 我的笔记</div>
            <textarea class="note-editor" id="study-note-editor" placeholder="点击添加笔记..." style="min-height: 60px;">${note?.content || ''}</textarea>
            <button class="btn-primary mt-sm" onclick="StudyPage.saveCurrentNote()" style="width: 100%; padding: var(--space-xs) var(--space-md); font-size: var(--text-sm);">保存笔记</button>
          </div>
          
          <!-- 复习状态 -->
          ${review ? `
            <div class="detail-section" style="padding: var(--space-sm); margin: var(--space-sm) 0;">
              <div class="detail-section__title">📊 复习状态</div>
              <div style="font-size: var(--text-xs); color: var(--color-text-secondary);">
                难度: ${review.ease_factor} · 间隔: ${review.interval}天 · 重复: ${review.repetitions}次
                <br>下次复习: ${review.next_review}
              </div>
            </div>
          ` : ''}
        </div>
      `;
      
      actions.innerHTML = `
        <button class="btn-primary" onclick="StudyPage.nextCard()" style="width: 100%;">
          记住了 <i class="fa-solid fa-check"></i>
        </button>
        <button class="btn-secondary mt-sm" onclick="StudyPage.forgotCard()" style="width: 100%;">
          再想想 <i class="fa-solid fa-rotate"></i>
        </button>
      `;
    } else {
      container.innerHTML = `
        <div class="study-card" style="animation: fadeInUp 0.3s ease;" onclick="StudyPage.showDetails()">
          <div class="word" style="font-size: var(--text-3xl); font-weight: 700; margin-bottom: var(--space-sm);">${word.word}</div>
          <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">[${word.pronunciation || word.word}]</div>
          <div class="meta" style="margin-top: var(--space-md); display: flex; flex-wrap: wrap; gap: var(--space-xs); justify-content: center;">
            <span class="tag tag--topik">TOPIK ${word.topik_level}</span>
            ${wordType ? `<span class="tag tag--primary">${wordType}</span>` : ''}
            <span class="tag tag--accent">${word.pos || ''}</span>
          </div>
          <div style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin-top: var(--space-lg);">
            <i class="fa-solid fa-hand-pointer"></i> 点击查看详情
          </div>
        </div>
      `;
      
      actions.innerHTML = '';
    }
  },
  
  toggleFavoriteCurrent() {
    const word = this.state.words[this.state.currentIndex];
    const isFav = toggleFavorite(word.id);
    Toast.show(isFav ? '已收藏' : '已取消收藏', isFav ? 'success' : 'info');
    // 刷新卡片
    this.state.showedDetails = true;
    this.renderCard();
  },
  
  saveCurrentNote() {
    const word = this.state.words[this.state.currentIndex];
    const el = document.getElementById('study-note-editor');
    if (!el) return;
    saveNote(word.id, el.value);
    Toast.show('笔记已保存', 'success');
  },
  
  showDetails() {
    this.state.showedDetails = true;
    this.renderCard();
  },
  
  nextCard() {
    const word = this.state.words[this.state.currentIndex];
    updateReview(word.id, 4); // 评分"简单"
    
    // 记录学习历史
    execute(
      "INSERT INTO study_history (user_id, word_id, action, result) VALUES (1, ?, 'study', 4)",
      [word.id]
    );

    // 积分奖励
    addPoints(POINTS_RULES.study_word, `学习单词：${word.word}`);
    
    this.state.currentIndex++;
    this.state.showedDetails = false;
    
    if (this.state.currentIndex >= this.state.words.length) {
      // 完成一轮奖励
      addPoints(POINTS_RULES.study_batch, '完成一轮学习');
      const earned = POINTS_RULES.study_batch + this.state.words.length * POINTS_RULES.study_word;
      document.getElementById('study-card-container').innerHTML = `
        <div class="empty-state" style="margin-top: 40px; animation: fadeInUp 0.3s ease;">
          <img src="icons/illustration-celebrate.jpg" alt="" class="illustration illustration--celebrate">
          <p style="font-size: var(--text-xl); font-weight: 700; color: var(--color-primary);">本轮学习完成！🎉</p>
          <p style="font-size: var(--text-sm); margin-top: var(--space-xs);">已学习 ${this.state.words.length} 个单词</p>
          <p style="font-size: var(--text-sm); color: var(--color-warning); margin-top: var(--space-xs);">⭐ +${earned} 积分</p>
          <button class="btn-primary mt-md" onclick="StudyPage.loadNextBatch()">再来一轮</button>
        </div>
      `;
      document.getElementById('study-actions').innerHTML = '';
      const progress = document.getElementById('study-progress').querySelector('.progress-bar__fill');
      progress.style.width = '100%';
    } else {
      this.renderCard();
    }
  },
  
  forgotCard() {
    const word = this.state.words[this.state.currentIndex];
    updateReview(word.id, 1); // 评分"困难"
    
    execute(
      "INSERT INTO study_history (user_id, word_id, action, result) VALUES (1, ?, 'study', 1)",
      [word.id]
    );
    
    this.state.currentIndex++;
    this.state.showedDetails = false;
    
    if (this.state.currentIndex >= this.state.words.length) {
      this.renderCard(); // 会触发重新加载
      return;
    }
    this.renderCard();
  }
};