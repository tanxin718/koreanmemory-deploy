/**
 * KoreanMemory - 每日测验（Daily Quiz）
 * 每天晚上结算今日学习成果：通过 → 待结算积分全额到账 +20 奖励；未通过 → 只发一半待结算
 * 题库优先级：今日学过的单词 → 全部已学 → 全库
 * 通过标准：10题答对 ≥7题
 */
const DailyQuizPage = {
  state: {
    questions: [],
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    answered: false,
    settled: false // 是否已进行结算
  },

  init() {
    const data = getDailyQuizData();

    // 今日已完成，显示结果页
    if (data.status === 'passed' || data.status === 'failed') {
      this.renderResult(data.status, data.correct, data.totalQuestions);
      return;
    }

    // 今日已开始但中途退出，恢复进度
    if (data.status === 'started' && data.questions && Array.isArray(data.questions)) {
      this.state.questions = data.questions;
      this.state.currentIndex = data.currentIndex || 0;
      this.state.correct = data.correct || 0;
      this.state.wrong = data.wrong || 0;
      this.state.answered = false;
      this.renderQuestion();
      return;
    }

    // 新的一轮：生成题目
    this.generateQuestions(data.totalQuestions || 10);
  },

  // ========== 出题 ==========
  generateQuestions(count) {
    const today = getTodayStr();

    // 1. 今日学过的单词（study_history 今日记录）
    let todayWords = query(`
      SELECT DISTINCT w.id, w.word, w.pronunciation, w.topik_level
      FROM study_history sh
      INNER JOIN words w ON w.id = sh.word_id
      WHERE sh.user_id = 1 AND date(sh.timestamp) = ?
      ORDER BY RANDOM()
    `, [today]);
    console.log('[DailyQuiz] 今日学习过的单词：', todayWords.length);

    // 2. 若不够，补已学过的单词（reviews 中 repetitions > 0）
    let words = [...todayWords];
    if (words.length < count) {
      const learned = query(`
        SELECT DISTINCT w.id, w.word, w.pronunciation, w.topik_level
        FROM reviews r
        INNER JOIN words w ON w.id = r.word_id
        WHERE r.user_id = 1 AND r.repetitions > 0
          AND w.id NOT IN (${words.map(w => w.id).join(',') || '0'})
        ORDER BY RANDOM()
        LIMIT ?
      `, [count - words.length]);
      words = words.concat(learned);
    }

    // 3. 再不够，补全库随机词
    if (words.length < count) {
      const all = query(`
        SELECT id, word, pronunciation, topik_level FROM words
        WHERE id NOT IN (${words.map(w => w.id).join(',') || '0'})
        ORDER BY RANDOM()
        LIMIT ?
      `, [count - words.length]);
      words = words.concat(all);
    }

    words = words.slice(0, count);
    if (words.length < 4) {
      Toast.show('词库不足，无法生成测验', 'warning');
      return;
    }

    // 把 meaning 补上
    const wordsWithMeaning = words.map(w => {
      const m = query('SELECT meaning FROM meanings WHERE word_id = ? ORDER BY order_index LIMIT 1', [w.id])[0];
      return Object.assign({}, w, { meaning: m?.meaning || '' });
    }).filter(w => w.meaning);

    // 生成题目（韩译汉 / 汉译韩 随机）
    const questions = wordsWithMeaning.map((w, i) => {
      const mode = i % 2 === 0 ? 'ko-zh' : 'zh-ko';
      const q = { word: w, mode };
      if (mode === 'ko-zh') {
        const distractors = this.generateDistractors(w, 'meaning', 3);
        q.options = this.shuffle([w.meaning, ...distractors]);
        q.answer = w.meaning;
      } else {
        const distractors = this.generateDistractors(w, 'word', 3);
        q.options = this.shuffle([w.word, ...distractors]);
        q.answer = w.word;
      }
      return q;
    });

    this.state.questions = questions;
    this.state.currentIndex = 0;
    this.state.correct = 0;
    this.state.wrong = 0;
    this.state.answered = false;
    this.state.settled = false;

    // 保存开始状态
    const data = getDailyQuizData();
    data.status = 'started';
    data.startedAt = new Date().toISOString();
    data.questions = questions;
    data.currentIndex = 0;
    data.correct = 0;
    data.wrong = 0;
    saveDailyQuizData(data);

    this.renderQuestion();
  },

  generateDistractors(correctWord, field, count) {
    const all = query(`SELECT ${field} FROM words w
      INNER JOIN meanings m ON w.id = m.word_id AND m.order_index = 1
      WHERE w.id != ? AND ${field} IS NOT NULL
      ORDER BY RANDOM() LIMIT ?`, [correctWord.id, count * 3]);
    const pool = all.map(w => w[field]).filter(v => v && v !== correctWord[field]);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  },

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // ========== 渲染 ==========
  renderQuestion() {
    const container = document.getElementById('app-content');
    const data = getDailyQuizData();
    const q = this.state.questions[this.state.currentIndex];
    this.state.answered = false;

    if (!q) {
      this.finishQuiz();
      return;
    }

    const progress = ((this.state.currentIndex) / this.state.questions.length * 100).toFixed(0);
    const pending = getPendingData().pending || 0;

    container.innerHTML = `
      <div style="text-align:center; margin-bottom: var(--space-md); padding: var(--space-md) 0;">
        <img src="icons/mascot-character.jpg" alt="" style="width:70px; height:70px; border-radius:50%; object-fit:cover; border:3px solid white; box-shadow:var(--shadow-md); margin-bottom:var(--space-xs);">
        <div style="font-size: var(--text-lg); font-weight:700; color:var(--color-text-primary);">🌙 每日测验</div>
        <div style="font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-xs);">
          ${data.passThreshold}题及格 · 今日待结算 <span style="color: var(--color-warning); font-weight:600;">🪙 ${pending}</span>
        </div>
      </div>

      <div class="quiz-top-bar">
        <button class="quiz-back-btn" onclick="DailyQuizPage.exit()" title="退出">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="quiz-progress-bar progress-bar" style="flex:1;">
          <div class="progress-bar__fill" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="quiz-progress-text">
        ${this.state.currentIndex + 1} / ${this.state.questions.length} · ✅${this.state.correct} ❌${this.state.wrong}
      </div>

      <div class="quiz-question-card" id="dq-card">
        ${this.renderQuestionHtml(q)}
      </div>
    `;
  },

  renderQuestionHtml(q) {
    const isKoreanOption = q.mode === 'zh-ko';
    let questionHtml = '';
    if (q.mode === 'ko-zh') {
      questionHtml = `
        <div class="quiz-question-word" style="font-family: var(--font-korean);">${q.word.word}</div>
        <div class="quiz-question-hint">[${q.word.pronunciation || q.word.word}]</div>
        ${TTS.isSupported() ? `
          <button class="tts-btn tts-btn--lg" onclick="TTS.speak('${q.word.word.replace(/'/g, "\\'")}')" style="margin: var(--space-sm) auto;">
            <i class="fa-solid fa-volume-high"></i> 听发音
          </button>
        ` : ''}
        <div class="quiz-question-label">请选择正确的中文释义</div>
      `;
    } else {
      questionHtml = `
        <div class="quiz-question-word" style="font-size: var(--text-2xl);">${q.word.meaning}</div>
        <div class="quiz-question-label">请选择正确的韩语单词</div>
      `;
    }

    return `
      ${questionHtml}
      <div class="quiz-options">
        ${q.options.map((opt, i) => `
          <button class="quiz-option" onclick="DailyQuizPage.selectOption(${i})" data-index="${i}" data-value="${this.escapeAttr(opt)}" ${isKoreanOption ? 'style="font-family: var(--font-korean);"' : ''}>
            <span class="quiz-option__letter">${String.fromCharCode(65 + i)}</span>
            <span class="quiz-option__text">${opt}</span>
          </button>
        `).join('')}
      </div>
    `;
  },

  escapeAttr(s) {
    return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  },

  selectOption(index) {
    if (this.state.answered) return;
    this.state.answered = true;

    const q = this.state.questions[this.state.currentIndex];
    const buttons = document.querySelectorAll('.quiz-option');
    const selected = buttons[index];
    const isCorrect = selected.dataset.value === q.answer
      || selected.querySelector('.quiz-option__text').textContent === q.answer;

    buttons.forEach(btn => {
      btn.disabled = true;
      const text = btn.querySelector('.quiz-option__text').textContent;
      if (text === q.answer) btn.classList.add('correct');
      else if (btn === selected) btn.classList.add('wrong');
    });

    if (isCorrect) {
      this.state.correct++;
      Toast.show('回答正确 ✨', 'success');
    } else {
      this.state.wrong++;
      Toast.show(`正确答案：${q.answer}`, 'warning');
    }

    // 保存进度
    const data = getDailyQuizData();
    data.correct = this.state.correct;
    data.wrong = this.state.wrong;
    data.currentIndex = this.state.currentIndex + 1;
    saveDailyQuizData(data);

    setTimeout(() => {
      this.state.currentIndex++;
      if (this.state.currentIndex >= this.state.questions.length) {
        this.finishQuiz();
      } else {
        this.renderQuestion();
      }
    }, 1200);
  },

  finishQuiz() {
    const data = getDailyQuizData();
    const threshold = data.passThreshold || 7;
    const total = this.state.questions.length;
    const correct = this.state.correct;
    const pass = correct >= threshold;

    if (this.state.settled) {
      this.renderResult(pass ? 'passed' : 'failed', correct, total);
      return;
    }
    this.state.settled = true;

    // 结算积分
    const { confirmed, bonus, totalPending } = settleDailyQuiz(pass, correct, total);

    // 更新日测验状态
    const upd = getDailyQuizData();
    upd.status = pass ? 'passed' : 'failed';
    upd.finishedAt = new Date().toISOString();
    upd.correct = correct;
    upd.wrong = total - correct;
    upd.currentIndex = total;
    saveDailyQuizData(upd);

    this.renderResult(pass ? 'passed' : 'failed', correct, total, { confirmed, bonus, totalPending });
  },

  renderResult(status, correct, total, settleInfo) {
    const pass = status === 'passed';
    const pending = getPendingData();
    const info = settleInfo || { confirmed: 0, bonus: 0, totalPending: pending.pending || 0 };

    const container = document.getElementById('app-content');
    container.innerHTML = `
      <div style="text-align:center; padding: var(--space-lg) 0;">
        <img src="icons/${pass ? 'illustration-celebrate.jpg' : 'mascot-character.jpg'}" alt=""
             style="width:90px; height:90px; border-radius:50%; object-fit:cover; border:3px solid white; box-shadow:var(--shadow-md); margin-bottom:var(--space-md);">
        <div style="font-size: var(--text-xl); font-weight:700; color: ${pass ? 'var(--color-success)' : 'var(--color-warning)'};">
          ${pass ? '🎉 恭喜通过！' : '😢 差一点就通过了'}
        </div>
        <div style="font-size: var(--text-md); color: var(--color-text-secondary); margin-top: var(--space-xs);">
          正确 ${correct} / ${total} · 及格 ${getDailyQuizData().passThreshold || 7}
        </div>

        <!-- 积分结算卡片 -->
        <div class="card" style="margin: var(--space-lg) 0; text-align:left;">
          <div style="font-weight:600; color:var(--color-text-primary); margin-bottom: var(--space-sm);">
            ${pass ? '🪙 结算结果' : '💸 结算结果'}
          </div>
          <div style="font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.8;">
            <div style="display:flex; justify-content:space-between;">
              <span>今日待结算积分</span><span>${info.totalPending || 0}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span>${pass ? '结算确认' : '确认一半'}</span>
              <span style="color:var(--color-primary); font-weight:600;">+${info.confirmed || 0}</span>
            </div>
            ${pass ? `
              <div style="display:flex; justify-content:space-between;">
                <span>通过奖励</span>
                <span style="color:var(--color-success); font-weight:600;">+${info.bonus || 0}</span>
              </div>
            ` : `
              <div style="display:flex; justify-content:space-between;">
                <span>扣减部分</span>
                <span style="color:var(--color-warning); font-weight:600;">-${(info.totalPending || 0) - (info.confirmed || 0)}</span>
              </div>
            `}
            <div style="border-top:1px dashed var(--color-border); margin:var(--space-xs) 0;"></div>
            <div style="display:flex; justify-content:space-between; font-size: var(--text-md); font-weight:700;">
              <span>本轮净获</span>
              <span style="color:var(--color-primary);">
                +${pass ? ((info.confirmed || 0) + (info.bonus || 0)) : (info.confirmed || 0)}
              </span>
            </div>
          </div>
        </div>

        <button class="btn-primary" onclick="App.navigate('home')" style="width:100%;">
          <i class="fa-solid fa-house"></i> 回到首页
        </button>
        <button class="btn-secondary mt-sm" onclick="App.navigate('points')" style="width:100%;">
          <i class="fa-solid fa-coins"></i> 查看积分明细
        </button>
      </div>
    `;
  },

  exit() {
    // 退出保存进度
    const data = getDailyQuizData();
    data.correct = this.state.correct;
    data.wrong = this.state.wrong;
    data.currentIndex = this.state.currentIndex;
    data.questions = this.state.questions;
    saveDailyQuizData(data);
    App.navigate('home');
  }
};
