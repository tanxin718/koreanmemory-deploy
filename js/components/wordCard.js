/**
 * KoreanMemory - 单词卡片组件
 * 可复用的单词卡片，用于列表展示
 */
const WordCard = {
  /**
   * 渲染单词卡片 HTML
   * @param {Object} word - 单词对象
   * @param {Object} options - 配置项
   * @returns {string} HTML 字符串
   */
  render(word, options = {}) {
    const { showLevel = true, showFavorite = false, isFavorite = false } = options;
    const meanings = query('SELECT meaning FROM meanings WHERE word_id = ? ORDER BY order_index LIMIT 2', [word.id]);
    const meaningText = meanings.map(m => m.meaning).join('、');

    return `
      <div class="word-card" onclick="App.navigate('word/${word.id}')" style="margin-bottom: var(--space-sm);">
        <div class="word-card__top">
          ${showLevel ? `<span class="tag tag--topik">TOPIK ${word.topik_level}</span>` : ''}
          ${showFavorite ? `
            <span class="word-card__fav ${isFavorite ? 'is-active' : ''}">
              <i class="fa-solid fa-heart"></i>
            </span>
          ` : ''}
        </div>
        <div class="word">${word.word}</div>
        <div class="pronunciation">[${word.pronunciation || word.word}]</div>
        <div class="meaning">${meaningText}</div>
        <div class="tags">
          ${word.is_hanja_word ? '<span class="tag tag--topik">汉字词</span>' : ''}
          ${word.is_native_word ? '<span class="tag tag--accent">固有词</span>' : ''}
          ${word.is_loanword ? '<span class="tag tag--success">外来语</span>' : ''}
          <span class="tag tag--primary">${word.pos || ''}</span>
        </div>
      </div>
    `;
  }
};