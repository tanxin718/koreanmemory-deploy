/**
 * KoreanMemory - 汉字词源树组件
 * 展示汉字来源和相关词汇
 */
const HanjaTree = {
  /**
   * 渲染汉字词源区域
   * @param {Array} hanja - 汉字数据数组
   * @param {Object} options - 配置项
   * @returns {string} HTML 字符串
   */
  render(hanja, options = {}) {
    const { showTitle = true } = options;

    if (!hanja || hanja.length === 0) return '';

    return `
      <div class="detail-section">
        ${showTitle ? '<div class="detail-section__title">📖 词源</div>' : ''}
        <div class="hanja-tree" id="hanja-tree">
          ${hanja.map(h => `
            <div class="hanja-char" onclick="HanjaTree.showRelated('${h.hanja_char}')">
              <div class="char">${h.hanja_char}</div>
              <div class="reading">${h.hanja_reading || ''}</div>
              <div class="meaning">${h.hanja_meaning || ''}</div>
            </div>
          `).join('')}
        </div>
        <div id="hanja-related-words" style="margin-top: var(--space-sm);"></div>
      </div>
    `;
  },

  /**
   * 点击汉字时，显示包含该汉字的所有词汇
   * @param {string} hanjaChar - 汉字字符
   */
  showRelated(hanjaChar) {
    const container = document.getElementById('hanja-related-words');
    if (!container) return;

    const relatedWords = query(
      'SELECT * FROM hanja_words WHERE hanja_char = ? ORDER BY word LIMIT 20',
      [hanjaChar]
    );

    if (relatedWords.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div style="font-size: var(--text-sm); font-weight: 600; color: var(--color-text-secondary); margin-bottom: var(--space-sm);">
        包含「${hanjaChar}」的词汇：
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: var(--space-xs);">
        ${relatedWords.map(r => `
          <span class="tag tag--primary" style="cursor: pointer;" onclick="event.stopPropagation(); HanjaTree.navigateToWord('${r.word}')">
            ${r.word}
          </span>
        `).join('')}
      </div>
    `;
  },

  /**
   * 导航到包含该汉字的词汇详情
   * @param {string} word - 韩文单词
   */
  navigateToWord(word) {
    const result = query('SELECT id FROM words WHERE word = ?', [word]);
    if (result.length > 0) {
      App.navigate('word/' + result[0].id);
    } else {
      showToast('该词暂未收录');
    }
  }
};