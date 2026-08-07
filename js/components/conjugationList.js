/**
 * KoreanMemory - 词族变形列表组件
 * 展示动词/形容词的各种变形
 */
const ConjugationList = {
  /**
   * 渲染变形表格
   * @param {Array} conjugations - 变形数据数组
   * @param {Object} options - 配置项
   * @returns {string} HTML 字符串
   */
  render(conjugations, options = {}) {
    const { maxItems = 20, showTitle = true } = options;

    if (!conjugations || conjugations.length === 0) return '';

    const displayItems = conjugations.slice(0, maxItems);
    const hasMore = conjugations.length > maxItems;
    const formTypeNames = {
      'basic': '基本形',
      'present': '现在时',
      'past': '过去时',
      'future': '将来时',
      'imperative': '命令式',
      'propositive': '共动式',
      'interrogative': '疑问式',
      'conditional': '条件式',
      'causative': '使动',
      'passive': '被动',
      'nominal': '名词化',
      'adnominal': '冠词形',
      'connective': '连接形',
      'honorific': '敬语'
    };
    const tenseNames = {
      'present': '现在',
      'past': '过去',
      'future': '将来',
      'none': '-'
    };
    const honorificNames = {
      'plain': '普通',
      'polite': '敬语',
      'formal': '正式',
      'intimate': '亲昵'
    };

    return `
      <div class="detail-section">
        ${showTitle ? '<div class="detail-section__title">🔄 词族</div>' : ''}
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
              ${displayItems.map(c => `
                <tr>
                  <td>${c.form}</td>
                  <td>${formTypeNames[c.form_type] || c.label || c.form_type || ''}</td>
                  <td>${honorificNames[c.honorification] || c.honorification || ''}</td>
                  <td>${tenseNames[c.tense] || c.tense || ''}</td>
                </tr>
              `).join('')}
              ${hasMore ? `
                <tr>
                  <td colspan="4" style="text-align:center; color: var(--color-text-tertiary); font-size: var(--text-xs);">
                    ...还有 ${conjugations.length - maxItems} 个变形
                  </td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};