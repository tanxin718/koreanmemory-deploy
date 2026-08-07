/**
 * KoreanMemory - 韩语发音（TTS）
 * 使用浏览器内置 Web Speech API，无需外部依赖
 * 针对移动端和桌面端做了兼容性优化
 */

const TTS = {
  _voices: [],
  _koreanVoice: null,
  _unlocked: false,  // iOS 需要用户交互后才能播放

  init() {
    if (!('speechSynthesis' in window)) {
      console.warn('[TTS] 浏览器不支持 Web Speech API');
      return;
    }
    // 加载语音列表（部分浏览器异步加载）
    const loadVoices = () => {
      this._voices = speechSynthesis.getVoices() || [];
      // 优先找 ko-KR，再找任何 ko 开头的
      this._koreanVoice = this._voices.find(v => v.lang === 'ko-KR')
        || this._voices.find(v => v.lang === 'ko_KR')
        || this._voices.find(v => v.lang && v.lang.toLowerCase().startsWith('ko'));
      console.log('[TTS] 可用语音数：', this._voices.length, '韩语语音：', this._koreanVoice ? this._koreanVoice.name : '未找到');
    };
    loadVoices();
    if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
    // iOS Safari 需要在用户交互时"解锁"语音
    // 用第一次 touchend/click 来触发一个空播放
    const unlock = () => {
      if (this._unlocked) return;
      try {
        const u = new SpeechSynthesisUtterance('');
        u.volume = 0;
        speechSynthesis.speak(u);
        this._unlocked = true;
      } catch (e) {}
    };
    document.addEventListener('touchend', unlock, { once: true, passive: true });
    document.addEventListener('click', unlock, { once: true });
  },

  /**
   * 朗读韩语
   * @param {string} text - 要朗读的韩语文本
   * @param {number} rate - 语速 (0.5-2.0，默认0.9)
   */
  speak(text, rate = 0.9) {
    if (!('speechSynthesis' in window)) {
      Toast.show('当前浏览器不支持语音播放', 'warning');
      return;
    }
    // 停止当前正在播放的语音
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;

    if (this._koreanVoice) {
      utterance.voice = this._koreanVoice;
    }

    let _handled = false;
    const finishOnce = () => {
      if (_handled) return;
      _handled = true;
    };

    utterance.onend = finishOnce;
    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        // 正常的取消，不算错误
        return;
      }
      console.warn('[TTS] 播放失败:', e.error);
      if (e.error === 'not-allowed') {
        Toast.show('请点击页面任意位置后再试（浏览器需要交互授权）', 'warning');
      } else if (e.error === 'synthesis-failed' || e.error === 'audio-busy') {
        Toast.show('语音引擎忙碌，请稍后再试', 'warning');
      }
      finishOnce();
    };

    // 某些浏览器（Chrome 移动版）有时不触发 onend，加超时兜底
    setTimeout(() => {
      if (!_handled) {
        finishOnce();
      }
    }, Math.max(3000, text.length * 300));

    try {
      speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('[TTS] speak 异常:', err);
      Toast.show('语音播放异常', 'warning');
    }
  },

  /**
   * 停止朗读
   */
  stop() {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  },

  /**
   * 切换播放/停止
   */
  toggle(text, btnEl) {
    if (!('speechSynthesis' in window)) {
      Toast.show('当前浏览器不支持语音播放', 'warning');
      return;
    }
    if (speechSynthesis.speaking) {
      this.stop();
      if (btnEl) btnEl.classList.remove('speaking');
    } else {
      this.speak(text);
      if (btnEl) btnEl.classList.add('speaking');
      // 播放结束后移除动画
      const checkEnd = setInterval(() => {
        if (!speechSynthesis.speaking) {
          if (btnEl) btnEl.classList.remove('speaking');
          clearInterval(checkEnd);
        }
      }, 200);
    }
  },

  /**
   * 是否支持韩语语音
   * 注意：即使没有 ko-KR 语音包，浏览器也会用默认语音读，所以只要支持 speechSynthesis 就返回 true
   */
  isSupported() {
    return 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
  },

  /**
   * 是否已安装韩语语音包（影响发音质量）
   */
  hasKoreanVoice() {
    return !!this._koreanVoice;
  }
};

// 页面加载时初始化
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => TTS.init());
}
