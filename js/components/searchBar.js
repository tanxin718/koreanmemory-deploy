/**
 * KoreanMemory - 搜索框组件
 * 可复用的搜索输入框
 */
const SearchBar = {
  /**
   * 渲染搜索框
   * @param {Object} options - 配置项
   * @param {string} options.placeholder - 占位文字
   * @param {function} options.onSearch - 搜索回调
   * @param {function} options.onClear - 清除回调
   * @param {string} options.initialValue - 初始值
   * @returns {string} HTML 字符串
   */
  render(options = {}) {
    const {
      placeholder = '搜索单词...',
      initialValue = '',
      showClear = true
    } = options;

    return `
      <div class="search-bar" id="search-bar-component" style="margin-bottom: var(--space-md);">
        <i class="fa-solid fa-magnifying-glass" style="color: var(--color-text-tertiary);"></i>
        <input
          type="text"
          id="search-bar-input"
          placeholder="${placeholder}"
          value="${initialValue}"
          autocomplete="off"
        >
        ${showClear ? `
          <button class="btn-clear ${initialValue ? '' : 'hidden'}" id="search-bar-clear">
            <i class="fa-solid fa-xmark"></i>
          </button>
        ` : ''}
        <button class="btn-icon" id="search-bar-submit" style="color: var(--color-primary);">
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    `;
  },

  /**
   * 绑定搜索框事件
   * @param {Object} options - 同 render 的配置项
   */
  bindEvents(options = {}) {
    const { onSearch, onClear, onInput, debounceMs = 300 } = options;
    const input = document.getElementById('search-bar-input');
    const clearBtn = document.getElementById('search-bar-clear');
    const submitBtn = document.getElementById('search-bar-submit');

    let timer = null;

    input?.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (clearBtn) {
        clearBtn.classList.toggle('hidden', val.length === 0);
      }

      if (onInput) {
        clearTimeout(timer);
        timer = setTimeout(() => onInput(val), debounceMs);
      }
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch(input.value.trim());
      }
    });

    clearBtn?.addEventListener('click', () => {
      if (input) input.value = '';
      clearBtn.classList.add('hidden');
      if (input) input.focus();
      if (onClear) onClear();
    });

    submitBtn?.addEventListener('click', () => {
      if (onSearch && input) {
        onSearch(input.value.trim());
      }
    });
  },

  /**
   * 获取当前输入值
   * @returns {string}
   */
  getValue() {
    return document.getElementById('search-bar-input')?.value?.trim() || '';
  },

  /**
   * 设置输入值
   * @param {string} value
   */
  setValue(value) {
    const input = document.getElementById('search-bar-input');
    if (input) input.value = value;
    const clearBtn = document.getElementById('search-bar-clear');
    if (clearBtn) clearBtn.classList.toggle('hidden', !value);
  }
};