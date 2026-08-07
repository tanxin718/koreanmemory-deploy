/**
 * KoreanMemory - 首页
 */
const HomePage = {
  async init() {
    const container = document.getElementById('app-content');
    container.innerHTML = '<div class="loading" style="text-align:center;padding:40px;">加载中...</div>';
    
    const stats = getStudyStats();
    const dailyQuote = getDailyQuote();

    container.innerHTML = `
      <img src="icons/illustration-home.jpg" alt="" class="illustration illustration--banner">

      <div class="greeting-card card" style="background: linear-gradient(135deg, var(--color-primary-50), #FEF3C7); border: none; margin-bottom: var(--space-md);">
        <img src="icons/mascot-character.jpg" alt="" class="greeting-card__mascot">
        <div style="font-size: var(--text-lg); font-weight: 600; color: var(--color-primary);">${this.getGreeting()}</div>
        <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-xs);">今日もファイト！加油学习吧 ✨</div>
      </div>

      <div class="stats-row">
        <div class="stat-card" onclick="App.navigate('study')">
          <div class="stat-card__icon">📚</div>
          <div class="stat-card__value">${stats.learnedWords}</div>
          <div class="stat-card__label">已学单词</div>
        </div>
        <div class="stat-card" onclick="App.navigate('points')">
          <div class="stat-card__icon">🪙</div>
          <div class="stat-card__value">${getPoints()}</div>
          <div class="stat-card__label">我的积分</div>
        </div>
      </div>

      ${!checkTodaySigned() ? `
        <div class="card card-clickable" onclick="App.navigate('points')" style="margin-bottom: var(--space-md); background: linear-gradient(135deg, #D1FAE5, #EDE9FE); border-color: var(--color-success);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; color: var(--color-text-primary);">🎁 每日签到</div>
              <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">点击签到领积分</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--color-text-tertiary);"></i>
          </div>
        </div>
      ` : ''}

      ${stats.pendingReviews > 0 ? `
        <div class="card card-clickable" onclick="App.navigate('review')" style="margin-bottom: var(--space-md); background: linear-gradient(135deg, #FEF3C7, #FEE2E2); border-color: var(--color-warning);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 600; color: var(--color-text-primary);">🎯 今日复习</div>
              <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">${stats.pendingReviews} 个单词待复习</div>
            </div>
            <i class="fa-solid fa-chevron-right" style="color: var(--color-text-tertiary);"></i>
          </div>
        </div>
      ` : ''}

      ${dailyQuote ? `
        <div class="card daily-word-card" id="daily-quote-card" style="margin-bottom: var(--space-md); cursor: default;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-sm);">
            <div style="font-size: var(--text-sm); color: var(--color-text-tertiary);">
              <i class="fa-solid ${dailyQuote.icon}" style="margin-right: 4px;"></i> ${dailyQuote.title}${dailyQuote.custom ? ' ✏️' : ''}
            </div>
            <div style="display: flex; gap: var(--space-xs);">
              <button class="tts-btn" onclick="event.stopPropagation(); TTS.toggle(document.getElementById('quote-ko-text').textContent, this)" title="朗读" style="width:28px;height:28px;font-size:var(--text-xs);">
                <i class="fa-solid fa-volume-high"></i>
              </button>
              <button class="tts-btn" onclick="HomePage.refreshQuote()" title="换一条" style="width:28px;height:28px;font-size:var(--text-xs);">
                <i class="fa-solid fa-shuffle"></i>
              </button>
              <button class="tts-btn" onclick="HomePage.showAddQuoteForm()" title="添加金句" style="width:28px;height:28px;font-size:var(--text-xs);">
                <i class="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>
          <div id="quote-ko-text" style="font-size: var(--text-lg); font-weight: 600; color: var(--color-text-primary); line-height: 1.6; font-family: var(--font-korean);">${dailyQuote.ko}</div>
          <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-sm); line-height: 1.6;">${dailyQuote.zh}</div>
        </div>
      ` : ''}

      <div class="quick-actions">
        <div class="quick-action-card" onclick="App.navigate('study')">
          <div class="quick-action-card__icon" style="background: linear-gradient(135deg, #EDE9FE, #9B87F2);">
            <i class="fa-solid fa-bolt"></i>
          </div>
          <div class="quick-action-card__label">学习</div>
        </div>
        <div class="quick-action-card" onclick="App.navigate('quiz')">
          <div class="quick-action-card__icon" style="background: linear-gradient(135deg, #FEF3C7, #F59E8B);">
            <i class="fa-solid fa-clipboard-question"></i>
          </div>
          <div class="quick-action-card__label">测试</div>
        </div>
        <div class="quick-action-card" onclick="App.navigate('review')">
          <div class="quick-action-card__icon" style="background: linear-gradient(135deg, #FEE2E2, #FCA5A5);">
            <i class="fa-solid fa-rotate"></i>
          </div>
          <div class="quick-action-card__label">复习</div>
        </div>
        <div class="quick-action-card" onclick="App.navigate('points')">
          <div class="quick-action-card__icon" style="background: linear-gradient(135deg, #D1FAE5, #6EE7B7);">
            <i class="fa-solid fa-coins"></i>
          </div>
          <div class="quick-action-card__label">积分</div>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: var(--space-lg); padding-bottom: var(--space-lg);">
        <div style="font-size: var(--text-sm); color: var(--color-text-tertiary);">
          共 ${stats.totalWords} 词 · 已学 ${stats.learnedWords} 词
        </div>
        <div class="progress-bar mt-sm" style="max-width: 200px; margin: 0 auto;">
          <div class="progress-bar__fill" style="width: ${stats.totalWords > 0 ? (stats.learnedWords / stats.totalWords * 100) : 0}%"></div>
        </div>
      </div>
    `;
  },
  
  getGreeting() {
    const hour = new Date().getHours();
    if (hour < 6) return '좋은 새벽이에요! 🌙';
    if (hour < 12) return '좋은 아침이에요! ☀️';
    if (hour < 18) return '좋은 오후예요! 🌤️';
    if (hour < 22) return '좋은 저녁이에요! 🌙';
    return '안녕히 주무세요! 💤';
  },

  _currentQuoteIndex: -1,

  refreshQuote() {
    const q = getRandomQuote(this._currentQuoteIndex);
    if (!q) return;
    this._currentQuoteIndex = q._index;
    const card = document.getElementById('daily-quote-card');
    if (!card) return;
    card.style.animation = 'none';
    card.offsetHeight; // 触发重排
    card.style.animation = 'fadeInUp 0.3s ease';
    card.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-sm);">
        <div style="font-size: var(--text-sm); color: var(--color-text-tertiary);">
          <i class="fa-solid ${q.icon}" style="margin-right: 4px;"></i> ${q.title}${q.custom ? ' ✏️' : ''}
        </div>
        <div style="display: flex; gap: var(--space-xs);">
          <button class="tts-btn" onclick="event.stopPropagation(); TTS.toggle(document.getElementById('quote-ko-text').textContent, this)" title="朗读" style="width:28px;height:28px;font-size:var(--text-xs);">
            <i class="fa-solid fa-volume-high"></i>
          </button>
          <button class="tts-btn" onclick="HomePage.refreshQuote()" title="换一条" style="width:28px;height:28px;font-size:var(--text-xs);">
            <i class="fa-solid fa-shuffle"></i>
          </button>
          <button class="tts-btn" onclick="HomePage.showAddQuoteForm()" title="添加金句" style="width:28px;height:28px;font-size:var(--text-xs);">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>
      <div id="quote-ko-text" style="font-size: var(--text-lg); font-weight: 600; color: var(--color-text-primary); line-height: 1.6; font-family: var(--font-korean);">${q.ko}</div>
      <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-sm); line-height: 1.6;">${q.zh}</div>
    `;
  },

  showAddQuoteForm() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'quote-add-modal';
    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加金句</h3>
          <button class="modal-close" onclick="HomePage.closeAddQuoteForm()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label>类型</label>
            <select id="quote-type" class="form-input" style="width:100%;height:var(--touch-target);padding:0 var(--space-md);border:2px solid var(--color-border);border-radius:var(--radius-md);font-size:var(--text-base);background:var(--color-white);color:var(--color-text-primary);">
              <option value="quote">名言 / 谚语</option>
              <option value="trivia">小知识 / 趣闻</option>
              <option value="joke">笑话</option>
              <option value="riddle">脑筋急转弯</option>
            </select>
          </div>
          <div class="form-field">
            <label>韩语内容</label>
            <textarea id="quote-ko" rows="3" placeholder="输入韩语..." style="width:100%;padding:var(--space-sm) var(--space-md);border:2px solid var(--color-border);border-radius:var(--radius-md);font-size:var(--text-base);font-family:var(--font-korean);background:var(--color-white);color:var(--color-text-primary);resize:vertical;outline:none;"></textarea>
          </div>
          <div class="form-field">
            <label>中文翻译 / 解释</label>
            <textarea id="quote-zh" rows="3" placeholder="输入中文..." style="width:100%;padding:var(--space-sm) var(--space-md);border:2px solid var(--color-border);border-radius:var(--radius-md);font-size:var(--text-base);background:var(--color-white);color:var(--color-text-primary);resize:vertical;outline:none;"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="HomePage.closeAddQuoteForm()">取消</button>
          <button class="btn-primary" onclick="HomePage.saveQuote()">保存</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  closeAddQuoteForm() {
    const modal = document.getElementById('quote-add-modal');
    if (modal) modal.remove();
  },

  saveQuote() {
    const type = document.getElementById('quote-type').value;
    const ko = document.getElementById('quote-ko').value.trim();
    const zh = document.getElementById('quote-zh').value.trim();
    if (!ko) { Toast.show('请输入韩语内容', 'warning'); return; }
    if (!zh) { Toast.show('请输入中文翻译', 'warning'); return; }
    addCustomQuote(type, ko, zh);
    this.closeAddQuoteForm();
    Toast.show('金句已添加', 'success');
    this.refreshQuote();
  }
};