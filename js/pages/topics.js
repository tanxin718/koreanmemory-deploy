/**
 * KoreanMemory - 场景分类页
 */
const TopicsPage = {
  state: {
    topicId: null
  },

  init(params) {
    if (params[0]) {
      this.state.topicId = parseInt(params[0]);
      this.renderTopicWords();
    } else {
      this.renderAllTopics();
    }
  },

  renderAllTopics() {
    const container = document.getElementById('app-content');
    const topics = query('SELECT * FROM topics ORDER BY sort_order');

    if (topics.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top: 60px;">
          <i class="fa-solid fa-tags"></i>
          <p>暂无场景分类</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header__title">场景分类</div>
        <div class="page-header__subtitle">按场景学习相关单词</div>
      </div>
      <div class="topics-grid">
        ${topics.map(t => {
          const wordCount = query(
            "SELECT COUNT(*) as cnt FROM word_topics WHERE topic_id = ?",
            [t.id]
          )[0]?.cnt || 0;

          return `
            <div class="topic-card" onclick="App.navigate('topics/${t.id}')">
              <div class="topic-card__icon"><i class="fa-solid ${t.icon || 'fa-tag'}"></i></div>
              <div class="topic-card__name">${t.name_zh}</div>
              <div class="topic-card__count">${t.name_ko || ''} · ${wordCount}词</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderTopicWords() {
    const container = document.getElementById('app-content');
    const topicId = this.state.topicId;

    const topic = query('SELECT * FROM topics WHERE id = ?', [topicId])[0];
    if (!topic) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top: 60px;">
          <i class="fa-solid fa-circle-exclamation"></i>
          <p>场景不存在</p>
        </div>
      `;
      return;
    }

    const { words, total } = getWords({ topic_id: topicId, page: 1, per_page: 100 });

    container.innerHTML = `
      <div class="page-header" style="display: flex; align-items: center; gap: var(--space-sm);">
        <button class="quiz-back-btn" onclick="App.navigate('word-list')" style="width:32px;height:32px;font-size:12px;">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <div class="page-header__title">
            <i class="fa-solid ${topic.icon || 'fa-tag'}" style="margin-right: var(--space-xs);"></i>
            ${topic.name_zh}
          </div>
          <div class="page-header__subtitle">${topic.name_ko || ''} · ${total} 个单词</div>
        </div>
      </div>

      ${topic.description ? `
        <div class="card" style="margin-bottom: var(--space-md); font-size: var(--text-sm); color: var(--color-text-secondary);">
          ${topic.description}
        </div>
      ` : ''}

      <div id="topic-words-list">
        ${words.length === 0 ? `
          <div class="empty-state">
            <i class="fa-solid fa-book-open"></i>
            <p>该场景暂无单词</p>
          </div>
        ` : words.map(w => {
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
        }).join('')}
      </div>
    `;
  }
};