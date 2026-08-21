/**
 * KoreanMemory - 测试模块
 * 四种模式：韩译汉 / 汉译韩 / 听写 / 手写
 * 题目基于已学单词
 */
const QuizPage = {
  state: {
    mode: null,          // 'ko-zh' | 'zh-ko' | 'dictation' | 'handwrite'
    questions: [],
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    answered: false,
    wrongWords: []       // 记录错题词，供 AI 讲解
  },

  init() {
    this.reset();
    this.renderModeSelect();
  },

  reset() {
    this.state = { mode: null, questions: [], currentIndex: 0, correct: 0, wrong: 0, answered: false, wrongWords: [] };
  },

  // ===== 模式选择 =====
  renderModeSelect() {
    const container = document.getElementById('app-content');
    const learnedCount = this.getLearnedWordCount();

    container.innerHTML = `
      <div style="text-align:center; margin-bottom: var(--space-lg); padding: var(--space-md) 0;">
        <img src="icons/mascot-character.jpg" alt="" style="width:80px; height:80px; border-radius:50%; object-fit:cover; border:3px solid white; box-shadow:var(--shadow-md); margin-bottom:var(--space-sm);">
        <div style="font-size: var(--text-lg); font-weight:600; color:var(--color-text-primary);">选择测试模式</div>
        <div style="font-size: var(--text-sm); color:var(--color-text-tertiary); margin-top: var(--space-xs);">已学单词 ${learnedCount} 个 · 每题 ${POINTS_RULES.quiz_correct} 积分</div>
      </div>

      <div class="quiz-mode-grid">
        <div class="quiz-mode-card" onclick="QuizPage.startQuiz('ko-zh')">
          <div class="quiz-mode-card__icon" style="background: linear-gradient(135deg, #EDE9FE, #FCD34D);">
            <span style="font-size:28px;">🇰🇷</span>
          </div>
          <div class="quiz-mode-card__name">韩译汉</div>
          <div class="quiz-mode-card__desc">看韩语选中文</div>
        </div>

        <div class="quiz-mode-card" onclick="QuizPage.startQuiz('zh-ko')">
          <div class="quiz-mode-card__icon" style="background: linear-gradient(135deg, #FEE2E2, #FCD34D);">
            <span style="font-size:28px;">🇨🇳</span>
          </div>
          <div class="quiz-mode-card__name">汉译韩</div>
          <div class="quiz-mode-card__desc">看中文选韩语</div>
        </div>

        <div class="quiz-mode-card" onclick="QuizPage.startQuiz('dictation')">
          <div class="quiz-mode-card__icon" style="background: linear-gradient(135deg, #D1FAE5, #EDE9FE);">
            <span style="font-size:28px;">🎧</span>
          </div>
          <div class="quiz-mode-card__name">听写</div>
          <div class="quiz-mode-card__desc">听音写韩语</div>
        </div>

        <div class="quiz-mode-card" onclick="QuizPage.startQuiz('handwrite')">
          <div class="quiz-mode-card__icon" style="background: linear-gradient(135deg, #FEF3C7, #FCD34D);">
            <span style="font-size:28px;">✍️</span>
          </div>
          <div class="quiz-mode-card__name">手写</div>
          <div class="quiz-mode-card__desc">看中文写韩语</div>
        </div>
      </div>

      <div class="quiz-tips card mt-lg" style="text-align:center;">
        <div style="font-size: var(--text-sm); color: var(--color-text-secondary);">
          💡 测试基于已学单词，答对得积分，全对有额外奖励！
        </div>
      </div>
    `;
  },

  // ===== 获取已学单词 =====
  getLearnedWordCount() {
    return query("SELECT COUNT(*) as cnt FROM reviews WHERE user_id = 1 AND repetitions > 0")[0]?.cnt || 0;
  },

  getLearnedWords(limit = 10) {
    // 优先取已学单词，不足时用全部单词补充
    let words = query(`
      SELECT w.*, m.meaning FROM words w
      INNER JOIN reviews r ON w.id = r.word_id AND r.user_id = 1 AND r.repetitions > 0
      LEFT JOIN (SELECT word_id, meaning, order_index FROM meanings WHERE order_index = 1) m ON w.id = m.word_id
      ORDER BY RANDOM() LIMIT ?
    `, [limit]);

    if (words.length < 4) {
      const extra = query(`
        SELECT w.*, m.meaning FROM words w
        LEFT JOIN (SELECT word_id, meaning, order_index FROM meanings WHERE order_index = 1) m ON w.id = m.word_id
        WHERE w.id NOT IN (SELECT word_id FROM reviews WHERE user_id = 1 AND repetitions > 0)
        ORDER BY RANDOM() LIMIT ?
      `, [limit - words.length]);
      words = words.concat(extra);
    }
    return words.filter(w => w.meaning);
  },

  // 生成干扰选项
  generateDistractors(correctWord, field, count = 3) {
    const all = query(`SELECT ${field} FROM words w
      INNER JOIN meanings m ON w.id = m.word_id AND m.order_index = 1
      WHERE w.id != ? AND ${field} IS NOT NULL
      ORDER BY RANDOM() LIMIT ?`, [correctWord.id, count * 3]);
    const pool = all.map(w => w[field]).filter(v => v && v !== correctWord[field]);
    // 打乱并取 count 个
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, count);
  },

  // ===== 开始测试 =====
  startQuiz(mode) {
    this.state.mode = mode;
    this.state.currentIndex = 0;
    this.state.correct = 0;
    this.state.wrong = 0;
    this.state.answered = false;

    const learned = this.getLearnedWords(10);
    if (learned.length < 4) {
      Toast.show('已学单词不足，请先学习一些单词', 'warning');
      return;
    }

    // 生成题目
    this.state.questions = learned.map(word => {
      const q = { word, mode };
      if (mode === 'ko-zh') {
        const distractors = this.generateDistractors(word, 'meaning', 3);
        q.options = this.shuffle([word.meaning, ...distractors]);
        q.answer = word.meaning;
      } else if (mode === 'zh-ko') {
        const distractors = this.generateDistractors(word, 'word', 3);
        q.options = this.shuffle([word.word, ...distractors]);
        q.answer = word.word;
      }
      return q;
    });

    this.renderQuestion();
  },

  shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // ===== 渲染题目 =====
  renderQuestion() {
    const container = document.getElementById('app-content');
    const q = this.state.questions[this.state.currentIndex];
    this.state.answered = false;

    if (!q) { this.renderResults(); return; }

    const progress = ((this.state.currentIndex) / this.state.questions.length * 100).toFixed(0);
    const modeLabels = { 'ko-zh': '韩译汉', 'zh-ko': '汉译韩', 'dictation': '听写', 'handwrite': '手写' };

    let questionHtml = '';

    if (this.state.mode === 'ko-zh') {
      questionHtml = `
        <div class="quiz-question-word">${q.word.word}</div>
        <div class="quiz-question-hint">[${q.word.pronunciation || q.word.word}]</div>
        ${TTS.isSupported() ? `
          <button class="tts-btn tts-btn--lg" onclick="TTS.speak('${q.word.word.replace(/'/g, "\\'")}')" style="margin: var(--space-sm) auto;">
            <i class="fa-solid fa-volume-high"></i> 听发音
          </button>
        ` : ''}
        <div class="quiz-question-label">请选择正确的中文释义</div>
      `;
    } else if (this.state.mode === 'zh-ko') {
      questionHtml = `
        <div class="quiz-question-word" style="font-size: var(--text-2xl);">${q.word.meaning}</div>
        <div class="quiz-question-label">请选择正确的韩语单词</div>
      `;
    } else if (this.state.mode === 'dictation') {
      questionHtml = `
        <div class="quiz-question-label" style="margin-bottom: var(--space-md);">听音频写出韩语单词</div>
        <button class="quiz-play-btn" onclick="QuizPage.playAudio('${q.word.word}')">
          <i class="fa-solid fa-volume-high"></i> 点击播放
        </button>
        <input type="text" id="quiz-input" class="quiz-input" placeholder="输入韩语..." autocomplete="off" 
               style="font-family: var(--font-korean);"
               oninput="QuizPage.onDictationInput()"
               onkeydown="if(event.key==='Enter') QuizPage.submitDictation()">
        <div id="quiz-feedback"></div>
      `;
    } else if (this.state.mode === 'handwrite') {
      questionHtml = `
        <div class="quiz-question-word" style="font-size: var(--text-2xl);">${q.word.meaning}</div>
        <div class="quiz-question-label">请在画板上手写韩语单词</div>
        ${TTS.isSupported() ? `
          <button class="quiz-play-btn" onclick="TTS.speak('${q.word.word.replace(/'/g, "\\'")}')" style="margin-bottom: var(--space-sm);">
            <i class="fa-solid fa-volume-high"></i> 听发音
          </button>
        ` : ''}
        <canvas id="quiz-canvas" width="320" height="160" class="quiz-canvas"></canvas>
        <div class="quiz-canvas-actions">
          <button class="btn-secondary" onclick="QuizPage.clearCanvas()"><i class="fa-solid fa-eraser"></i> 清除</button>
          <button class="btn-primary" onclick="QuizPage.submitHandwrite()"><i class="fa-solid fa-check"></i> 提交</button>
        </div>
        <div id="quiz-feedback"></div>
      `;
    }

    let optionsHtml = '';
    if (this.state.mode === 'ko-zh' || this.state.mode === 'zh-ko') {
      const isKorean = this.state.mode === 'zh-ko';
      optionsHtml = `
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" onclick="QuizPage.selectOption(${i})" data-index="${i}" data-value="${this.escapeAttr(opt)}" ${isKorean ? 'style="font-family: var(--font-korean);"' : ''}>
              <span class="quiz-option__letter">${String.fromCharCode(65 + i)}</span>
              <span class="quiz-option__text">${opt}</span>
            </button>
          `).join('')}
        </div>
      `;
    }

    const submitHtml = (this.state.mode === 'dictation' || this.state.mode === 'handwrite') ? `
      <button class="btn-primary" id="quiz-next-btn" onclick="QuizPage.nextQuestion()" style="width:100%; display:none;">
        下一题 <i class="fa-solid fa-arrow-right"></i>
      </button>
    ` : '';

    container.innerHTML = `
      <div class="quiz-top-bar">
        <button class="quiz-back-btn" onclick="QuizPage.exitToModeSelect()" title="返回">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="quiz-progress-bar progress-bar" style="flex:1;">
          <div class="progress-bar__fill" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="quiz-progress-text">${this.state.currentIndex + 1} / ${this.state.questions.length} · ${modeLabels[this.state.mode]} · ✅${this.state.correct} ❌${this.state.wrong}</div>

      <div class="quiz-question-card">
        ${questionHtml}
        ${optionsHtml}
      </div>

      ${submitHtml}
    `;

    if (this.state.mode === 'dictation') {
      // 自动播放一次
      setTimeout(() => this.playAudio(q.word.word), 300);
    } else if (this.state.mode === 'handwrite') {
      setTimeout(() => this.initCanvas(), 100);
    }
  },

  escapeAttr(s) {
    return String(s).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  },

  // ===== 选项选择（选择题）=====
  selectOption(index) {
    if (this.state.answered) return;
    this.state.answered = true;

    const q = this.state.questions[this.state.currentIndex];
    const buttons = document.querySelectorAll('.quiz-option');
    const selected = buttons[index];
    const isCorrect = selected.dataset.value === q.answer || selected.querySelector('.quiz-option__text').textContent === q.answer;

    buttons.forEach(btn => {
      btn.disabled = true;
      const text = btn.querySelector('.quiz-option__text').textContent;
      if (text === q.answer) {
        btn.classList.add('correct');
      } else if (btn === selected) {
        btn.classList.add('wrong');
      }
    });

    if (isCorrect) {
      this.state.correct++;
      addPoints(POINTS_RULES.quiz_correct, `测试答对：${q.word.word}`);
      Toast.show(`+${POINTS_RULES.quiz_correct} 积分 ✨`, 'success');
    } else {
      this.state.wrong++;
      this.state.wrongWords.push(q.word);
      Toast.show(`正确答案：${q.answer}`, 'warning');
    }

    setTimeout(() => this.nextQuestion(), 1200);
  },

  // ===== 听写 =====
  onDictationInput() {
    const btn = document.getElementById('quiz-next-btn');
    const input = document.getElementById('quiz-input');
    if (btn && input.value.trim()) btn.style.display = 'inline-flex';
  },

  submitDictation() {
    if (this.state.answered) return;
    this.state.answered = true;

    const q = this.state.questions[this.state.currentIndex];
    const input = document.getElementById('quiz-input');
    const userAnswer = input.value.trim();
    const feedback = document.getElementById('quiz-feedback');
    const isCorrect = userAnswer === q.word.word;

    if (isCorrect) {
      this.state.correct++;
      addPoints(POINTS_RULES.quiz_correct, `听写正确：${q.word.word}`);
      feedback.innerHTML = `<div class="quiz-feedback correct">✅ 正确！+${POINTS_RULES.quiz_correct} 积分</div>`;
      Toast.show(`+${POINTS_RULES.quiz_correct} 积分 ✨`, 'success');
    } else {
      this.state.wrong++;
      this.state.wrongWords.push(q.word);
      feedback.innerHTML = `<div class="quiz-feedback wrong">❌ 正确答案：<span style="font-family: var(--font-korean); font-weight: 700;">${q.word.word}</span></div>`;
    }

    input.disabled = true;
    const btn = document.getElementById('quiz-next-btn');
    if (btn) btn.style.display = 'inline-flex';
  },

  // ===== TTS 播放（统一走 TTS 模块，享受在线兜底）=====
  playAudio(text) {
    TTS.speak(text, 0.8);
  },

  // ===== 手写画板 =====
  initCanvas() {
    const canvas = document.getElementById('quiz-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let lastX = 0, lastY = 0;

    ctx.strokeStyle = '#7C65EF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scale = canvas.width / rect.width;
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x: x * scale, y: y * scale };
    };

    const start = (e) => {
      e.preventDefault();
      drawing = true;
      const p = getPos(e);
      lastX = p.x; lastY = p.y;
    };
    const move = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x; lastY = p.y;
    };
    const end = () => { drawing = false; };

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);

    // 白色背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this._canvasCtx = ctx;
  },

  clearCanvas() {
    const canvas = document.getElementById('quiz-canvas');
    if (!canvas || !this._canvasCtx) return;
    this._canvasCtx.fillStyle = '#FFFFFF';
    this._canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
  },

  submitHandwrite() {
    if (this.state.answered) return;
    this.state.answered = true;

    const q = this.state.questions[this.state.currentIndex];
    const feedback = document.getElementById('quiz-feedback');
    // 手写无法自动判分，提示答案让用户自评
    feedback.innerHTML = `
      <div class="quiz-feedback" style="color: var(--color-text-secondary);">
        正确答案：<span style="font-family: var(--font-korean); font-size: var(--text-xl); font-weight:700; color: var(--color-primary);">${q.word.word}</span>
      </div>
      <div class="quiz-self-grade">
        <button class="quiz-grade-btn correct" onclick="QuizPage.selfGrade(true)">写对了 ✅</button>
        <button class="quiz-grade-btn wrong" onclick="QuizPage.selfGrade(false)">写错了 ❌</button>
      </div>
    `;
  },

  selfGrade(isCorrect) {
    const q = this.state.questions[this.state.currentIndex];
    if (isCorrect) {
      this.state.correct++;
      addPoints(POINTS_RULES.quiz_correct, `手写正确：${q.word.word}`);
      Toast.show(`+${POINTS_RULES.quiz_correct} 积分 ✨`, 'success');
    } else {
      this.state.wrong++;
      this.state.wrongWords.push(q.word);
    }
    const btn = document.getElementById('quiz-next-btn');
    if (btn) btn.style.display = 'inline-flex';
  },

  // ===== 返回模式选择 =====
  exitToModeSelect() {
    // 停止 TTS
    TTS.stop();
    this.reset();
    this.renderModeSelect();
  },

  // ===== 下一题 / 结果 =====
  nextQuestion() {
    this.state.currentIndex++;
    if (this.state.currentIndex >= this.state.questions.length) {
      this.renderResults();
    } else {
      this.renderQuestion();
    }
  },

  renderResults() {
    const container = document.getElementById('app-content');
    const total = this.state.questions.length;
    const correct = this.state.correct;
    const wrong = this.state.wrong;
    const accuracy = total > 0 ? Math.round(correct / total * 100) : 0;
    const isPerfect = correct === total && total > 0;

    // 完成奖励
    addPoints(POINTS_RULES.quiz_batch, `完成测试（${correct}/${total}）`);
    if (isPerfect) addPoints(POINTS_RULES.quiz_perfect, '测试全对奖励');

    const totalPoints = correct * POINTS_RULES.quiz_correct + POINTS_RULES.quiz_batch + (isPerfect ? POINTS_RULES.quiz_perfect : 0);

    let emoji = '🎉', msg = '太棒了！';
    if (accuracy >= 80) { emoji = '🌟'; msg = '太厉害啦！'; }
    else if (accuracy >= 60) { emoji = '😊'; msg = '继续加油！'; }
    else { emoji = '💪'; msg = '多练习就会更好！'; }

    container.innerHTML = `
      <div class="quiz-result">
        <img src="icons/illustration-celebrate.jpg" alt="" class="illustration illustration--celebrate">
        <div style="font-size: 48px; margin-bottom: var(--space-sm);">${emoji}</div>
        <div style="font-size: var(--text-2xl); font-weight:700; color:var(--color-primary); margin-bottom: var(--space-xs);">${msg}</div>
        <div style="font-size: var(--text-sm); color: var(--color-text-tertiary); margin-bottom: var(--space-lg);">测试完成</div>

        <div class="quiz-result-stats">
          <div class="quiz-result-stat">
            <div class="quiz-result-stat__value" style="color: var(--color-success);">${correct}</div>
            <div class="quiz-result-stat__label">答对</div>
          </div>
          <div class="quiz-result-stat">
            <div class="quiz-result-stat__value" style="color: var(--color-danger);">${wrong}</div>
            <div class="quiz-result-stat__label">答错</div>
          </div>
          <div class="quiz-result-stat">
            <div class="quiz-result-stat__value" style="color: var(--color-primary);">${accuracy}%</div>
            <div class="quiz-result-stat__label">正确率</div>
          </div>
          <div class="quiz-result-stat">
            <div class="quiz-result-stat__value" style="color: var(--color-warning);">+${totalPoints}</div>
            <div class="quiz-result-stat__label">获得积分</div>
          </div>
        </div>

        <div class="quiz-result-actions">
          <button class="btn-primary" onclick="QuizPage.startQuiz('${this.state.mode}')">再来一轮</button>
          <button class="btn-secondary" onclick="QuizPage.init()">换模式</button>
        </div>

        ${this.state.wrongWords.length > 0 ? `
          <div style="margin-top: var(--space-lg);">
            <button class="btn-primary" onclick="QuizPage.aiExplainWrong()" style="width:100%; background: linear-gradient(135deg, #7C65EF, #4F46E5); border:none;">
              <i class="fa-solid fa-wand-magic-sparkles"></i> 🤖 让 AI 讲解 ${this.state.wrongWords.length} 个错词
            </button>
            <div id="quiz-ai-explain" style="margin-top: var(--space-md); text-align:left; font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.7;"></div>
          </div>
        ` : ''}
      </div>
    `;
  },

  async aiExplainWrong() {
    const el = document.getElementById('quiz-ai-explain');
    if (!el) return;
    if (!LLM.isConfigured()) {
      showToast('请先在设置中配置 AI 助手', 'warning');
      App.navigate('settings');
      return;
    }
    if (this.state.wrongWords.length === 0) return;
    const words = this.state.wrongWords;
    el.innerHTML = '<div style="text-align:center;color:var(--color-text-tertiary);">⏳ AI 正在讲解错词...</div>';
    const listText = words.map(w => {
      const d = getWordDetail(w.id);
      const m = d ? d.meanings.map(x => x.meaning).join('、') : '';
      return `${w.word}（${m}）`;
    }).join('\n');
    try {
      const text = await LLM.chat(
        '你是韩语教学专家，善于用中文讲解韩语单词。回答简明、口语化。',
        `以下是我在这次韩语测验中答错的单词，请逐个用简短中文讲解，帮我把它们记牢：\n${listText}\n\n对每个词讲：含义、常见搭配/例句、与容易混淆之处的注意点。用列表形式，简洁。`
      );
      el.innerHTML = text.replace(/\n/g, '<br>');
    } catch (e) {
      el.innerHTML = '<div style="color:var(--color-danger);">AI 讲解失败：' + e.message + '</div>';
    }
  }
};
