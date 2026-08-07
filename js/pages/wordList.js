/**
 * KoreanMemory - 单词列表页
 */
const WordListPage = {
  state: {
    page: 1,
    topikLevel: null,
    topicId: null,
    perPage: 20
  },

  init(params) {
    const container = document.getElementById('app-content');
    this.state.page = 1;
    this.state.topikLevel = null;
    this.state.topicId = null;

    // 解析参数
    if (params[0] === 'topik' && params[1]) {
      this.state.topikLevel = parseInt(params[1]);
    } else if (params[0] === 'topic' && params[1]) {
      this.state.topicId = parseInt(params[1]);
    }

    this.render(container);
    this.loadWords();
  },

  render(container) {
    const topics = query('SELECT * FROM topics ORDER BY sort_order');

    container.innerHTML = `
      <div style="margin-bottom: var(--space-md);">
        <div class="page-header">
          <div class="page-header__title">🏷️ 场景分类</div>
        </div>
        <div class="topics-grid">
          ${topics.map(topic => `
            <div class="topic-card" onclick="App.navigate('topics/${topic.id}')">
              <div class="topic-card__icon"><i class="fa-solid ${topic.icon}"></i></div>
              <div class="topic-card__name">${topic.name_zh}</div>
              <div class="topic-card__count">${topic.name_ko}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom: var(--space-md);">
        <div class="page-header">
          <div class="page-header__title">📚 TOPIK 级别</div>
        </div>
        <div class="filter-bar" id="topik-filter-bar">
          <button class="filter-btn ${!this.state.topikLevel ? 'active' : ''}" onclick="WordListPage.setFilter(null)">全部</button>
          ${[1,2,3,4,5,6].map(l => `
            <button class="filter-btn ${this.state.topikLevel === l ? 'active' : ''}" onclick="WordListPage.setFilter(${l})">TOPIK ${l}</button>
          `).join('')}
        </div>
      </div>

      <div id="word-list-container">
        <div class="loading" style="text-align:center;padding:20px;">加载中...</div>
      </div>
      <div id="word-list-pagination" class="pagination"></div>
    `;
  },

  // 只更新筛选按钮激活状态，不重新渲染整个页面（避免布局跳动）
  updateFilterUI() {
    const buttons = document.querySelectorAll('#topik-filter-bar .filter-btn');
    buttons.forEach((btn, i) => {
      const level = i === 0 ? null : i;
      btn.classList.toggle('active', this.state.topikLevel === level);
    });
  },

  // TOPIK 级别筛选 - 不跳转，仅更新按钮状态和列表
  setFilter(level) {
    this.state.topikLevel = level;
    this.state.topicId = null;
    this.state.page = 1;
    this.updateFilterUI();
    this.loadWords();
  },

  loadWords() {
    const { words, total, page, perPage } = getWords({
      topik_level: this.state.topikLevel,
      topic_id: this.state.topicId,
      page: this.state.page,
      per_page: this.state.perPage
    });

    const container = document.getElementById('word-list-container');
    const totalPages = Math.ceil(total / perPage);

    if (words.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-book-open"></i>
          <p>暂无单词</p>
        </div>
      `;
      document.getElementById('word-list-pagination').innerHTML = '';
      return;
    }

    container.innerHTML = words.map(w => {
      const meanings = query('SELECT meaning FROM meanings WHERE word_id = ? ORDER BY order_index LIMIT 2', [w.id]);
      const meaningText = meanings.map(m => m.meaning).join('、');
      return `
        <div class="word-card" style="margin-bottom: var(--space-sm);">
          <div class="level-badge">TOPIK ${w.topik_level}</div>
          ${TTS.isSupported() ? `
            <button class="tts-btn word-card__tts" onclick="event.stopPropagation(); TTS.toggle('${w.word}', this)" title="朗读">
              <i class="fa-solid fa-volume-high"></i>
            </button>
          ` : ''}
          <div class="word" onclick="App.navigate('word/${w.id}')">${w.word}</div>
          <div class="pronunciation">[${w.pronunciation || w.word}]</div>
          <div class="meaning" onclick="App.navigate('word/${w.id}')">${meaningText}</div>
          <div class="tags" onclick="App.navigate('word/${w.id}')">
            ${w.is_hanja_word ? '<span class="tag tag--topik">汉字词</span>' : ''}
            ${w.is_native_word ? '<span class="tag tag--accent">固有词</span>' : ''}
            <span class="tag tag--primary">${w.pos || ''}</span>
          </div>
        </div>
      `;
    }).join('');

    // 分页
    const pagination = document.getElementById('word-list-pagination');
    if (totalPages > 1) {
      pagination.innerHTML = `
        <button ${page <= 1 ? 'disabled' : ''} onclick="WordListPage.goPage(${page - 1})">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <span class="page-info">${page} / ${totalPages}</span>
        <button ${page >= totalPages ? 'disabled' : ''} onclick="WordListPage.goPage(${page + 1})">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      `;
    } else {
      pagination.innerHTML = '';
    }
  },

  goPage(page) {
    this.state.page = page;
    this.loadWords();
    document.getElementById('app-content').scrollTop = 0;
  }
};
