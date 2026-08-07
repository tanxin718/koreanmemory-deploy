/**
 * KoreanMemory - 复习模式
 */
const ReviewPage = {
  state: {
    words: [],
    currentIndex: 0,
    isFlipped: false,
    touchStartX: 0,
    touchCurrentX: 0
  },
  
  init() {
    this.reset();
    this.render();
    this.loadReviews();
  },
  
  reset() {
    this.state = {
      words: [],
      currentIndex: 0,
      isFlipped: false,
      touchStartX: 0,
      touchCurrentX: 0
    };
  },
  
  loadReviews() {
    this.state.words = getPendingReviews();
    this.state.currentIndex = 0;
    this.state.isFlipped = false;
    this.renderCard();
  },
  
  render() {
    const container = document.getElementById('app-content');
    container.innerHTML = `
      <div id="review-progress" class="progress-bar" style="margin-bottom: var(--space-md);">
        <div class="progress-bar__fill" style="width: 0%"></div>
      </div>
      <div id="review-count" style="text-align: center; font-size: var(--text-sm); color: var(--color-text-secondary); margin-bottom: var(--space-md);"></div>
      <div id="review-card-container"></div>
      <div id="review-actions" style="margin-top: var(--space-lg);"></div>
    `;
  },
  
  renderCard() {
    const container = document.getElementById('review-card-container');
    const actions = document.getElementById('review-actions');
    const progress = document.getElementById('review-progress').querySelector('.progress-bar__fill');
    const countEl = document.getElementById('review-count');
    
    if (this.state.words.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top: 40px;">
          <img src="icons/illustration-empty-review.jpg" alt="" class="illustration illustration--empty">
          <p style="font-size: var(--text-lg); font-weight: 600; color: var(--color-text-primary);">暂无待复习单词</p>
          <p style="font-size: var(--text-sm); margin-top: var(--space-xs);">都记住了，真棒！✨</p>
          <button class="btn-primary mt-md" onclick="App.navigate('study')">学习新词</button>
        </div>
      `;
      actions.innerHTML = '';
      progress.style.width = '0%';
      countEl.textContent = '';
      return;
    }
    
    if (this.state.currentIndex >= this.state.words.length) {
      container.innerHTML = `
        <div class="empty-state" style="margin-top: 40px; animation: fadeInUp 0.3s ease;">
          <img src="icons/illustration-celebrate.jpg" alt="" class="illustration illustration--celebrate">
          <p style="font-size: var(--text-xl); font-weight: 700; color: var(--color-primary);">复习完成！🎉</p>
          <p style="font-size: var(--text-sm); margin-top: var(--space-xs);">已复习 ${this.state.words.length} 个单词</p>
          <button class="btn-primary mt-md" onclick="App.navigate('home')">返回首页</button>
        </div>
      `;
      actions.innerHTML = '';
      progress.style.width = '100%';
      countEl.textContent = '';
      return;
    }
    
    const word = this.state.words[this.state.currentIndex];
    const meanings = query('SELECT meaning FROM meanings WHERE word_id = ? ORDER BY order_index', [word.id]);
    const meaningText = meanings.map(m => m.meaning).join('、');
    const conjugations = query('SELECT * FROM conjugations WHERE word_id = ? LIMIT 5', [word.id]);
    
    const current = this.state.currentIndex + 1;
    const total = this.state.words.length;
    progress.style.width = ((current - 1) / total * 100) + '%';
    countEl.textContent = `${current} / ${total}`;
    
    container.innerHTML = `
      <div class="review-card" id="review-card"
           ontouchstart="ReviewPage.onTouchStart(event)"
           ontouchmove="ReviewPage.onTouchMove(event)"
           ontouchend="ReviewPage.onTouchEnd(event)">
        <div class="review-card__inner ${this.state.isFlipped ? 'flipped' : ''}" id="review-card-inner">
          <div class="review-card__front" onclick="ReviewPage.flipCard()">
            ${word.topik_level ? `<span class="tag tag--topik" style="position:absolute;top:var(--space-sm);left:var(--space-sm);">TOPIK ${word.topik_level}</span>` : ''}
            ${TTS.isSupported() ? `<button class="tts-btn" onclick="event.stopPropagation(); TTS.toggle('${word.word.replace(/'/g, "\\'")}', this)" title="朗读" style="position:absolute;top:var(--space-sm);right:var(--space-sm);width:28px;height:28px;font-size:var(--text-xs);"><i class="fa-solid fa-volume-high"></i></button>` : ''}
            <div style="font-size: var(--text-xl); margin-bottom: var(--space-sm);">🌸</div>
            <div class="word">${word.word}</div>
            <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">[${word.pronunciation || word.word}]</div>
            <div class="hint" style="margin-top: var(--space-lg);">
              <i class="fa-solid fa-hand-pointer"></i> 点击翻转查看答案
            </div>
          </div>
          <div class="review-card__back" onclick="ReviewPage.flipCard()">
            ${word.topik_level ? `<span class="tag tag--topik" style="position:absolute;top:var(--space-sm);right:var(--space-sm);">TOPIK ${word.topik_level}</span>` : ''}
            <div class="word">${word.word}</div>
            ${TTS.isSupported() ? `<button class="tts-btn" onclick="event.stopPropagation(); TTS.toggle('${word.word.replace(/'/g, "\\'")}', this)" title="朗读" style="width:28px;height:28px;font-size:var(--text-xs);margin-bottom:var(--space-xs);"><i class="fa-solid fa-volume-high"></i></button>` : ''}
            <div class="meaning">${meaningText}</div>
            ${conjugations.length > 0 ? `
              <div class="detail" style="margin-top: var(--space-sm);">
                <div style="display: flex; flex-wrap: wrap; gap: 4px; justify-content: center;">
                  ${conjugations.slice(0, 4).map(c => `
                    <span class="tag tag--primary">${c.form}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
            <div style="font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: var(--space-lg);">
              点击翻转回到正面
            </div>
          </div>
        </div>
      </div>
    `;
    
    actions.innerHTML = `
      <div class="rating-buttons">
        <button class="rating-btn rating-btn--again" onclick="ReviewPage.rate(0)">
          <span class="emoji">😰</span>
          <span>陌生</span>
          <span class="interval">1天</span>
        </button>
        <button class="rating-btn rating-btn--hard" onclick="ReviewPage.rate(1)">
          <span class="emoji">🤔</span>
          <span>困难</span>
          <span class="interval">3天</span>
        </button>
        <button class="rating-btn rating-btn--good" onclick="ReviewPage.rate(3)">
          <span class="emoji">🙂</span>
          <span>一般</span>
          <span class="interval">6天</span>
        </button>
        <button class="rating-btn rating-btn--easy" onclick="ReviewPage.rate(5)">
          <span class="emoji">😎</span>
          <span>简单</span>
          <span class="interval">15天</span>
        </button>
      </div>
    `;
  },
  
  flipCard() {
    this.state.isFlipped = !this.state.isFlipped;
    const inner = document.getElementById('review-card-inner');
    if (inner) {
      inner.classList.toggle('flipped');
    }
  },
  
  rate(quality) {
    const word = this.state.words[this.state.currentIndex];
    updateReview(word.id, quality);

    // 积分奖励（quality >= 3 才给分）
    if (quality >= 3) {
      addPoints(POINTS_RULES.review_word, `复习单词：${word.word}`);
    }

    // 最后一题完成奖励
    if (this.state.currentIndex + 1 >= this.state.words.length) {
      addPoints(POINTS_RULES.review_batch, '完成一轮复习');
    }

    this.state.currentIndex++;
    this.state.isFlipped = false;
    this.renderCard();
  },
  
  // 滑动评分
  onTouchStart(e) {
    this.state.touchStartX = e.touches[0].clientX;
    this.state.touchCurrentX = 0;
  },
  
  onTouchMove(e) {
    this.state.touchCurrentX = e.touches[0].clientX - this.state.touchStartX;
    const card = document.getElementById('review-card');
    if (card) {
      const clampedX = Math.max(-120, Math.min(120, this.state.touchCurrentX));
      card.style.transform = `translateX(${clampedX}px) rotate(${clampedX * 0.05}deg)`;
      card.style.transition = 'none';
      
      if (this.state.touchCurrentX > 30) {
        card.style.backgroundColor = 'var(--color-easy-bg)';
      } else if (this.state.touchCurrentX < -30) {
        card.style.backgroundColor = 'var(--color-again-bg)';
      }
    }
  },
  
  onTouchEnd() {
    const card = document.getElementById('review-card');
    if (!card) return;
    
    card.style.transition = 'transform 0.3s, opacity 0.3s';
    
    if (this.state.touchCurrentX > 80) {
      card.style.transform = 'translateX(150%)';
      card.style.opacity = '0';
      setTimeout(() => this.rate(5), 300);
    } else if (this.state.touchCurrentX < -80) {
      card.style.transform = 'translateX(-150%)';
      card.style.opacity = '0';
      setTimeout(() => this.rate(0), 300);
    } else {
      card.style.transform = '';
      card.style.backgroundColor = '';
    }
  }
};