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
    const meanings = query('SELECT meaning FROM meanings WHERE word_id = ? ORDER BY order_index', [word.id]);
    const meaningText = meanings.map(m => m.meaning).join('、');
    const examples = query('SELECT * FROM examples WHERE word_id = ? ORDER BY order_index LIMIT 2', [word.id]);
    const conjugations = query('SELECT * FROM conjugations WHERE word_id = ? LIMIT 5', [word.id]);
    
    const progressPercent = ((this.state.currentIndex) / this.state.words.length * 100);
    progress.style.width = progressPercent + '%';
    
    if (this.state.showedDetails) {
      container.innerHTML = `
        <div class="study-card" style="animation: fadeInUp 0.3s ease;">
          <div class="word" style="font-size: var(--text-3xl); font-weight: 700; margin-bottom: var(--space-sm);">${word.word}</div>
          <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">[${word.pronunciation || word.word}]</div>
          ${TTS.isSupported() ? `
            <button class="tts-btn tts-btn--lg" onclick="TTS.toggle('${word.word.replace(/'/g, "\\'")}', this)" style="margin-top: var(--space-sm);">
              <i class="fa-solid fa-volume-high"></i> 朗读
            </button>
          ` : ''}
          <div style="font-size: var(--text-xl); color: var(--color-primary); font-weight: 600; margin: var(--space-md) 0;">${meaningText}</div>
          
          ${conjugations.length > 0 ? `
            <div style="margin-top: var(--space-md);">
              <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-sm);">✨ 词族</div>
              <div style="display: flex; flex-wrap: wrap; gap: var(--space-xs); justify-content: center;">
                ${conjugations.slice(0, 6).map(c => `
                  <span class="tag tag--primary">${c.form}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${examples.length > 0 ? `
            <div style="margin-top: var(--space-md);">
              <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-sm);">💬 例句</div>
              ${examples.map(e => `
                <div class="example-block">
                  <div class="example-block__ko">
                    <span class="example-block__text">${e.korean}</span>
                    ${TTS.isSupported() ? `<button class="tts-btn" onclick="TTS.toggle('${e.korean.replace(/'/g, "\\'")}', this)"><i class="fa-solid fa-volume-high"></i></button>` : ''}
                  </div>
                  <div class="example-block__zh">${e.translation}</div>
                </div>
              `).join('')}
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
          <div style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin-top: var(--space-lg);">
            <i class="fa-solid fa-hand-pointer"></i> 点击查看详情
          </div>
        </div>
      `;
      
      actions.innerHTML = '';
    }
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