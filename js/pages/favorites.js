/**
 * KoreanMemory - 收藏页
 */
const FavoritesPage = {
  init() {
    const container = document.getElementById('app-content');
    this.render(container);
    this.loadFavorites();
  },

  render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header__title">收藏</div>
        <div class="page-header__subtitle" id="fav-count"></div>
      </div>
      <div id="favorites-list"></div>
    `;
  },

  loadFavorites() {
    const favorites = getFavorites();
    const listEl = document.getElementById('favorites-list');
    const countEl = document.getElementById('fav-count');

    if (favorites.length === 0) {
      countEl.textContent = '';
      listEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-heart"></i>
          <p>还没有收藏单词</p>
          <p style="font-size: var(--text-sm);">在单词详情页点击爱心收藏</p>
          <button class="btn-primary mt-md" onclick="App.navigate('word-list')">去词库看看</button>
        </div>
      `;
      return;
    }

    countEl.textContent = `共 ${favorites.length} 个单词`;

    listEl.innerHTML = favorites.map(f => {
      const meanings = query('SELECT meaning FROM meanings WHERE word_id = ? ORDER BY order_index LIMIT 2', [f.id]);
      const meaningText = meanings.map(m => m.meaning).join('、');
      return `
        <div class="word-card" onclick="App.navigate('word/${f.id}')" style="margin-bottom: var(--space-sm);">
          <div class="level-badge" style="top: var(--space-sm); right: var(--space-sm);">
            <i class="fa-solid fa-heart" style="color: var(--color-accent); font-size: 10px;"></i>
          </div>
          <div class="word">${f.word}</div>
          <div class="pronunciation">[${f.pronunciation || f.word}]</div>
          <div class="meaning">${meaningText}</div>
          <div class="tags">
            <span class="tag tag--topik">TOPIK ${f.topik_level}</span>
            ${f.is_hanja_word ? '<span class="tag tag--topik">汉字词</span>' : ''}
            ${f.is_native_word ? '<span class="tag tag--accent">固有词</span>' : ''}
            <span class="tag tag--primary">${f.pos || ''}</span>
          </div>
        </div>
      `;
    }).join('');
  }
};