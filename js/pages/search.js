/**
 * KoreanMemory - 搜索页
 */
const SearchPage = {
  state: {
    query: '',
    results: [],
    timer: null
  },

  init() {
    const container = document.getElementById('app-content');
    container.innerHTML = `
      <div class="search-bar" style="margin-bottom: var(--space-md);">
        <i class="fa-solid fa-magnifying-glass" style="color: var(--color-text-tertiary);"></i>
        <input type="text" id="search-input" placeholder="搜索韩语单词、中文释义..." autofocus>
        <button class="btn-clear hidden" id="search-clear">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div id="search-results" class="empty-state">
        <i class="fa-solid fa-search"></i>
        <p>输入关键词开始搜索</p>
      </div>
    `;

    this.bindEvents();
  },

  bindEvents() {
    const input = document.getElementById('search-input');
    const clearBtn = document.getElementById('search-clear');

    input.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      clearBtn.classList.toggle('hidden', val.length === 0);
      this.state.query = val;

      clearTimeout(this.state.timer);
      if (val.length > 0) {
        this.state.timer = setTimeout(() => this.doSearch(val), 300);
      } else {
        this.showEmpty();
      }
    });

    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.classList.add('hidden');
      this.state.query = '';
      this.showEmpty();
      input.focus();
    });
  },

  doSearch(queryStr) {
    const results = searchWords(queryStr);
    const container = document.getElementById('search-results');

    if (results.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-face-frown"></i>
          <p>未找到 "${queryStr}" 相关单词</p>
        </div>
      `;
      return;
    }

    container.innerHTML = results.map(w => {
      const meanings = query('SELECT meaning FROM meanings WHERE word_id = ? ORDER BY order_index LIMIT 2', [w.id]);
      const meaningText = meanings.map(m => m.meaning).join('、');
      return `
        <div class="word-card" onclick="App.navigate('word/${w.id}')" style="margin-bottom: var(--space-sm);">
          <div class="level-badge">TOPIK ${w.topik_level}</div>
          <div class="word">${w.word}</div>
          <div class="pronunciation">[${w.pronunciation || w.word}]</div>
          <div class="meaning">${meaningText}</div>
          <div class="tags">
            ${w.is_hanja_word ? '<span class="tag tag--topik">汉字词</span>' : ''}
            ${w.is_native_word ? '<span class="tag tag--accent">固有词</span>' : ''}
            <span class="tag tag--primary">${w.pos || ''}</span>
          </div>
        </div>
      `;
    }).join('');

    if (results.length === 50) {
      container.innerHTML += `<div style="text-align:center;padding:var(--space-md);color:var(--color-text-tertiary);font-size:var(--text-sm);">仅显示前 50 条结果，请尝试更精确的搜索</div>`;
    }
  },

  showEmpty() {
    document.getElementById('search-results').innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-search"></i>
        <p>输入关键词开始搜索</p>
      </div>
    `;
  }
};